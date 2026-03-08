import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync } from 'node:fs';
import readline from 'node:readline';
import type { BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../shared/constants';
import { APP_DEFAULTS } from '../shared/app-defaults';
import {
  hotkeyTokenFromGlobalKeyName,
  hotkeyTokensFromAccelerator,
  isHotkeyPressed,
  normalizeHotkeyTokens,
} from '../shared/hotkeys';
import { getNativeBinaryPath } from './native-binary-path';

const TOGGLE_DEBOUNCE_MS = 250;
const HEARTBEAT_CHECK_INTERVAL_MS = 5000;
const HEARTBEAT_TIMEOUT_MS = 15000;
const STUCK_KEY_TIMEOUT_MS = 5000;
const STUCK_KEY_CHECK_INTERVAL_MS = 1000;
const KEY_LISTENER_BINARY = 'global-key-listener';

type RecordingSource = 'toggle' | 'hold' | null;

interface HotkeyUpdatePayload {
  toggleHotkey?: string;
  holdToTranscribeHotkey?: string;
}

interface KeyListenerCommand {
  command: 'register_hotkeys';
  hotkeys: Array<{ keys: string[] }>;
}

interface KeyEvent {
  type: 'keydown' | 'keyup';
  key: string;
  raw_code: number;
  timestamp: string;
}

interface HeartbeatEvent {
  type: 'heartbeat_ping';
  id: string;
  timestamp: string;
}

type KeyListenerEvent = KeyEvent | HeartbeatEvent;

const RAW_KEY_VARIANTS: Record<string, string[][]> = {
  Command: [['MetaLeft'], ['MetaRight']],
  Control: [['ControlLeft'], ['ControlRight']],
  Alt: [['Alt'], ['AltGr']],
  Shift: [['ShiftLeft'], ['ShiftRight']],
  Fn: [['Function']],
  Space: [['Space']],
  Tab: [['Tab']],
  Enter: [['Return']],
  Escape: [['Escape']],
  Backspace: [['Backspace']],
  Delete: [['Delete']],
  '`': [['BackQuote']],
  '-': [['Minus']],
  '=': [['Equal']],
  '[': [['LeftBracket']],
  ']': [['RightBracket']],
  '\\': [['BackSlash']],
  ';': [['SemiColon']],
  '\'': [['Quote']],
  ',': [['Comma']],
  '.': [['Dot']],
  '/': [['Slash']],
  Up: [['UpArrow']],
  Down: [['DownArrow']],
  Left: [['LeftArrow']],
  Right: [['RightArrow']],
};

function getRawKeyVariants(token: string): string[][] {
  if (token in RAW_KEY_VARIANTS) {
    return RAW_KEY_VARIANTS[token];
  }

  if (/^[A-Z]$/.test(token)) {
    return [[`Key${token}`]];
  }

  if (/^[0-9]$/.test(token)) {
    return [[`Num${token}`]];
  }

  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(token)) {
    return [[token]];
  }

  return [[token]];
}

function expandRawHotkeyVariants(hotkey: string): string[][] {
  const tokens = hotkeyTokensFromAccelerator(hotkey);
  const variants = tokens.reduce<string[][]>(
    (current, token) => {
      const rawVariants = getRawKeyVariants(token);
      return current.flatMap((combo) => rawVariants.map((variant) => [...combo, ...variant]));
    },
    [[]],
  );

  const uniqueCombos = new Map<string, string[]>();
  for (const combo of variants) {
    const unique = Array.from(new Set(combo));
    const key = [...unique].sort().join('|');
    uniqueCombos.set(key, unique);
  }

  return Array.from(uniqueCombos.values());
}

export class ShortcutManager {
  private keyListenerProcess: ChildProcessWithoutNullStreams | null = null;
  private stdoutReader: readline.Interface | null = null;
  private stderrReader: readline.Interface | null = null;
  private rawPressedKeys = new Set<string>();
  private keyPressTimestamps = new Map<string, number>();
  private isRecording = false;
  private recordingSource: RecordingSource = null;
  private overlayWindow: BrowserWindow | null = null;
  private toggleHotkey: string;
  private holdToTranscribeHotkey: string;
  private onToggle: (recording: boolean) => void;
  private lastToggleTime = 0;
  private isEnabled = true;
  private toggleShortcutActive = false;
  private holdShortcutActive = false;
  private pressedTokens: string[] = [];
  private keepProcessAlive = false;
  private lastHeartbeatReceived = 0;
  private heartbeatCheckTimer: NodeJS.Timeout | null = null;
  private stuckKeyCheckTimer: NodeJS.Timeout | null = null;
  private restartTimer: NodeJS.Timeout | null = null;

  constructor(
    toggleHotkey: string = APP_DEFAULTS.hotkey,
    holdToTranscribeHotkey: string = APP_DEFAULTS.holdToTranscribeHotkey,
    onToggle: (recording: boolean) => void,
  ) {
    this.toggleHotkey = toggleHotkey;
    this.holdToTranscribeHotkey = holdToTranscribeHotkey;
    this.onToggle = onToggle;
  }

  setOverlayWindow(window: BrowserWindow): void {
    this.overlayWindow = window;
  }

  private startRecording(source: RecordingSource): void {
    if (this.isRecording) {
      return;
    }

    this.isRecording = true;
    this.recordingSource = source;
    this.overlayWindow?.webContents.send(IPC_CHANNELS.RECORDING_START);
    this.onToggle(true);
  }

  private stopRecording(): void {
    if (!this.isRecording) {
      return;
    }

    this.isRecording = false;
    this.recordingSource = null;
    this.overlayWindow?.webContents.send(IPC_CHANNELS.RECORDING_STOP);
    this.onToggle(false);
  }

  private handleToggleShortcut(): void {
    const now = Date.now();
    if (now - this.lastToggleTime < TOGGLE_DEBOUNCE_MS) {
      return;
    }

    this.lastToggleTime = now;

    if (this.isRecording) {
      this.stopRecording();
      return;
    }

    this.startRecording('toggle');
  }

  private getEffectivePressedKeyCount(): number {
    let count = 0;

    for (const key of this.rawPressedKeys) {
      if (key === 'Unknown(179)' && this.rawPressedKeys.has('Function')) {
        continue;
      }
      count += 1;
    }

    return count;
  }

  private matchesHotkeyExactly(shortcutHotkey: string, pressedTokens: string[]): boolean {
    if (!isHotkeyPressed(shortcutHotkey, pressedTokens)) {
      return false;
    }

    return hotkeyTokensFromAccelerator(shortcutHotkey).length === this.getEffectivePressedKeyCount();
  }

  private evaluateToggleShortcut(inputType: 'keyDown' | 'keyUp', pressedTokens: string[]): void {
    const togglePressed = this.matchesHotkeyExactly(this.toggleHotkey, pressedTokens);

    if (togglePressed && !this.toggleShortcutActive && inputType === 'keyDown') {
      this.toggleShortcutActive = true;
      this.handleToggleShortcut();
    } else if (!togglePressed && this.toggleShortcutActive) {
      this.toggleShortcutActive = false;
    }
  }

  private evaluateHoldShortcut(pressedTokens: string[]): void {
    const holdPressed = this.matchesHotkeyExactly(this.holdToTranscribeHotkey, pressedTokens);

    if (holdPressed && !this.holdShortcutActive) {
      this.holdShortcutActive = true;
      if (!this.isRecording) {
        this.startRecording('hold');
      }
    } else if (!holdPressed && this.holdShortcutActive) {
      this.holdShortcutActive = false;
      if (this.isRecording && this.recordingSource === 'hold') {
        this.stopRecording();
      }
    }
  }

  private syncPressedTokens(): void {
    this.pressedTokens = normalizeHotkeyTokens(
      Array.from(this.rawPressedKeys)
        .map((key) => hotkeyTokenFromGlobalKeyName(key))
        .filter((token): token is string => Boolean(token)),
    );
  }

  private recomputeShortcutState(inputType: 'keyDown' | 'keyUp'): void {
    this.syncPressedTokens();
    this.evaluateToggleShortcut(inputType, this.pressedTokens);
    this.evaluateHoldShortcut(this.pressedTokens);
  }

  private clearPressedTokens(): void {
    const wasHoldRecording = this.isRecording && this.recordingSource === 'hold';
    this.rawPressedKeys.clear();
    this.keyPressTimestamps.clear();
    this.pressedTokens = [];
    this.toggleShortcutActive = false;
    this.holdShortcutActive = false;

    if (wasHoldRecording) {
      this.stopRecording();
    }
  }

  private handleKeyEvent(event: KeyEvent): void {
    if (!this.isEnabled) {
      return;
    }

    if (event.type === 'keydown') {
      this.rawPressedKeys.add(event.key);
      if (!this.keyPressTimestamps.has(event.key)) {
        this.keyPressTimestamps.set(event.key, Date.now());
      }
      this.recomputeShortcutState('keyDown');
      return;
    }

    this.rawPressedKeys.delete(event.key);
    this.keyPressTimestamps.delete(event.key);
    this.recomputeShortcutState('keyUp');
  }

  private registerHotkeysWithListener(): boolean {
    if (!this.keyListenerProcess?.stdin || this.keyListenerProcess.stdin.destroyed) {
      return false;
    }

    const hotkeys = this.isEnabled
      ? [this.toggleHotkey, this.holdToTranscribeHotkey]
        .flatMap((hotkey) => expandRawHotkeyVariants(hotkey))
        .filter((keys) => keys.length > 0)
        .map((keys) => ({ keys }))
      : [];

    const command: KeyListenerCommand = {
      command: 'register_hotkeys',
      hotkeys,
    };

    this.keyListenerProcess.stdin.write(`${JSON.stringify(command)}\n`);
    return true;
  }

  private handleProcessEvent(event: KeyListenerEvent): void {
    if (event.type === 'heartbeat_ping') {
      this.lastHeartbeatReceived = Date.now();
      return;
    }

    this.handleKeyEvent(event);
  }

  private startHeartbeatChecker(): void {
    if (this.heartbeatCheckTimer) {
      return;
    }

    this.lastHeartbeatReceived = Date.now();
    this.heartbeatCheckTimer = setInterval(() => {
      const elapsed = Date.now() - this.lastHeartbeatReceived;
      if (elapsed > HEARTBEAT_TIMEOUT_MS) {
        console.error(`[ShortcutManager] Key listener heartbeat timed out after ${elapsed}ms.`);
        this.restartKeyListener();
      }
    }, HEARTBEAT_CHECK_INTERVAL_MS);
  }

  private stopHeartbeatChecker(): void {
    if (!this.heartbeatCheckTimer) {
      return;
    }

    clearInterval(this.heartbeatCheckTimer);
    this.heartbeatCheckTimer = null;
  }

  private getProtectedHoldTokens(): string[] {
    if (!(this.holdShortcutActive && this.isRecording && this.recordingSource === 'hold')) {
      return [];
    }

    return hotkeyTokensFromAccelerator(this.holdToTranscribeHotkey);
  }

  private startStuckKeyChecker(): void {
    if (this.stuckKeyCheckTimer) {
      return;
    }

    this.stuckKeyCheckTimer = setInterval(() => {
      const now = Date.now();
      const protectedTokens = new Set(this.getProtectedHoldTokens());
      let removedAny = false;

      for (const [key, pressedAt] of this.keyPressTimestamps.entries()) {
        if (now - pressedAt <= STUCK_KEY_TIMEOUT_MS) {
          continue;
        }

        const token = hotkeyTokenFromGlobalKeyName(key);
        if (token && protectedTokens.has(token)) {
          continue;
        }

        this.keyPressTimestamps.delete(key);
        this.rawPressedKeys.delete(key);
        removedAny = true;
      }

      if (removedAny) {
        this.recomputeShortcutState('keyUp');
      }
    }, STUCK_KEY_CHECK_INTERVAL_MS);
  }

  private stopStuckKeyChecker(): void {
    if (!this.stuckKeyCheckTimer) {
      return;
    }

    clearInterval(this.stuckKeyCheckTimer);
    this.stuckKeyCheckTimer = null;
  }

  private cleanupProcessHandles(): void {
    this.stdoutReader?.close();
    this.stderrReader?.close();
    this.stdoutReader = null;
    this.stderrReader = null;
    this.keyListenerProcess = null;
  }

  private stopKeyListener(): void {
    this.stopHeartbeatChecker();
    this.stopStuckKeyChecker();

    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    const processToStop = this.keyListenerProcess;
    this.cleanupProcessHandles();
    processToStop?.kill('SIGTERM');
    this.clearPressedTokens();
  }

  private restartKeyListener(): void {
    if (!this.keepProcessAlive) {
      return;
    }

    this.stopKeyListener();
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      if (!this.keepProcessAlive) {
        return;
      }
      this.startKeyListener();
    }, 1000);
  }

  private startKeyListener(): boolean {
    if (this.keyListenerProcess) {
      return this.registerHotkeysWithListener();
    }

    const binaryPath = getNativeBinaryPath(KEY_LISTENER_BINARY);
    if (!existsSync(binaryPath)) {
      console.error(`[ShortcutManager] Missing key listener binary at ${binaryPath}`);
      return false;
    }

    const child = spawn(binaryPath, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.keyListenerProcess = child;
    this.stdoutReader = readline.createInterface({ input: child.stdout });
    this.stderrReader = readline.createInterface({ input: child.stderr });

    this.stdoutReader.on('line', (line) => {
      try {
        const event = JSON.parse(line) as KeyListenerEvent;
        this.handleProcessEvent(event);
      } catch (error) {
        console.warn('[ShortcutManager] Failed to parse key listener output:', error);
      }
    });

    this.stderrReader.on('line', (line) => {
      console.info(`[ShortcutManager] ${line}`);
    });

    child.on('exit', (code, signal) => {
      console.warn(`[ShortcutManager] Key listener exited (code=${code ?? 'null'}, signal=${signal ?? 'null'}).`);
      this.cleanupProcessHandles();
      this.clearPressedTokens();

      if (this.keepProcessAlive) {
        this.restartTimer = setTimeout(() => {
          this.restartTimer = null;
          this.startKeyListener();
        }, 1000);
      }
    });

    this.startHeartbeatChecker();
    this.startStuckKeyChecker();
    return this.registerHotkeysWithListener();
  }

  register(): boolean {
    this.keepProcessAlive = true;
    return this.startKeyListener();
  }

  unregister(): void {
    this.keepProcessAlive = false;
    this.stopKeyListener();
  }

  updateHotkeys(next: HotkeyUpdatePayload): boolean {
    const hasToggleUpdate = typeof next.toggleHotkey === 'string';
    const hasHoldUpdate = typeof next.holdToTranscribeHotkey === 'string';

    if (!hasToggleUpdate && !hasHoldUpdate) {
      return true;
    }

    if (hasToggleUpdate && next.toggleHotkey) {
      this.toggleHotkey = next.toggleHotkey;
    }

    if (hasHoldUpdate && next.holdToTranscribeHotkey) {
      this.holdToTranscribeHotkey = next.holdToTranscribeHotkey;
    }

    this.clearPressedTokens();

    if (!this.keyListenerProcess) {
      return true;
    }

    return this.registerHotkeysWithListener();
  }

  setEnabled(enabled: boolean): boolean {
    if (this.isEnabled === enabled) {
      return true;
    }

    this.isEnabled = enabled;
    this.clearPressedTokens();

    if (!this.keyListenerProcess) {
      return enabled ? this.register() : true;
    }

    return this.registerHotkeysWithListener();
  }

  resetState(): void {
    this.isRecording = false;
    this.recordingSource = null;
    this.clearPressedTokens();
  }
}

import { globalShortcut, BrowserWindow } from 'electron';
import { GlobalKeyboardListener } from 'node-global-key-listener';
import type { IConfig, IGlobalKeyDownMap, IGlobalKeyEvent, IGlobalKeyListener } from 'node-global-key-listener';
import util from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import { IPC_CHANNELS } from '../shared/constants';
import { APP_DEFAULTS } from '../shared/app-defaults';
import {
  hotkeyTokenFromGlobalKeyName,
  hotkeyTokensFromAccelerator,
  hotkeyTokensFromGlobalDownMap,
  isHotkeyPressed,
} from '../shared/hotkeys';

const TOGGLE_DEBOUNCE_MS = 250;

type RecordingSource = 'toggle' | 'hold' | null;

const legacyUtil = util as unknown as {
  isObject?: (value: unknown) => boolean;
  isFunction?: (value: unknown) => boolean;
  isString?: (value: unknown) => boolean;
  isNumber?: (value: unknown) => boolean;
};

if (typeof legacyUtil.isObject !== 'function') {
  legacyUtil.isObject = (value: unknown): boolean => value !== null && typeof value === 'object';
}
if (typeof legacyUtil.isFunction !== 'function') {
  legacyUtil.isFunction = (value: unknown): boolean => typeof value === 'function';
}
if (typeof legacyUtil.isString !== 'function') {
  legacyUtil.isString = (value: unknown): boolean => typeof value === 'string';
}
if (typeof legacyUtil.isNumber !== 'function') {
  legacyUtil.isNumber = (value: unknown): boolean => typeof value === 'number';
}

interface HotkeyUpdatePayload {
  toggleHotkey?: string;
  holdToTranscribeHotkey?: string;
}

export class ShortcutManager {
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
  private keyListener: GlobalKeyboardListener | null = null;
  private keyListenerHandler: IGlobalKeyListener | null = null;

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
    if (this.isRecording) return;
    this.isRecording = true;
    this.recordingSource = source;
    this.overlayWindow?.webContents.send(IPC_CHANNELS.RECORDING_START);
    this.onToggle(true);
  }

  private stopRecording(): void {
    if (!this.isRecording) return;
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

  private isShortcutEvent(hotkey: string, event: IGlobalKeyEvent): boolean {
    const eventToken = hotkeyTokenFromGlobalKeyName(event.name);
    if (!eventToken) {
      return false;
    }

    return hotkeyTokensFromAccelerator(hotkey).includes(eventToken);
  }

  private evaluateToggleShortcut(event: IGlobalKeyEvent, isDown: IGlobalKeyDownMap): boolean {
    const pressedTokens = hotkeyTokensFromGlobalDownMap(isDown as Record<string, boolean>);
    const togglePressed = isHotkeyPressed(this.toggleHotkey, pressedTokens);
    const wasActive = this.toggleShortcutActive;

    if (togglePressed && !wasActive && event.state === 'DOWN') {
      this.toggleShortcutActive = true;
      this.handleToggleShortcut();
    } else if (!togglePressed && wasActive) {
      this.toggleShortcutActive = false;
    }

    return togglePressed || (wasActive && this.isShortcutEvent(this.toggleHotkey, event));
  }

  private evaluateHoldShortcut(event: IGlobalKeyEvent, isDown: IGlobalKeyDownMap): boolean {
    const pressedTokens = hotkeyTokensFromGlobalDownMap(isDown as Record<string, boolean>);
    const holdPressed = isHotkeyPressed(this.holdToTranscribeHotkey, pressedTokens);
    const wasActive = this.holdShortcutActive;

    if (holdPressed && !wasActive) {
      this.holdShortcutActive = true;
      if (!this.isRecording) {
        this.startRecording('hold');
      }
    } else if (!holdPressed && wasActive) {
      this.holdShortcutActive = false;
      if (this.isRecording && this.recordingSource === 'hold') {
        this.stopRecording();
      }
    }

    return holdPressed || (wasActive && this.isShortcutEvent(this.holdToTranscribeHotkey, event));
  }

  private resolveMacKeyServerPath(): string | null {
    if (process.platform !== 'darwin') {
      return null;
    }

    try {
      const packageJsonPath = require.resolve('node-global-key-listener/package.json');
      const packageDir = path.dirname(packageJsonPath);
      const asarPathToken = `${path.sep}app.asar${path.sep}`;
      const unpackedPackageDir = packageDir.includes(asarPathToken)
        ? packageDir.replace(asarPathToken, `${path.sep}app.asar.unpacked${path.sep}`)
        : packageDir;

      const unpackedServerPath = path.join(unpackedPackageDir, 'bin', 'MacKeyServer');
      if (fs.existsSync(unpackedServerPath)) {
        return unpackedServerPath;
      }

      return path.join(packageDir, 'bin', 'MacKeyServer');
    } catch {
      return null;
    }
  }

  private ensureMacKeyServerExecutable(serverPath: string): void {
    try {
      fs.chmodSync(serverPath, 0o755);
    } catch (error) {
      console.warn('[Shortcut] Failed to set executable permission for MacKeyServer:', error);
    }
  }

  private attachGlobalKeyListener(): void {
    this.detachGlobalKeyListener();

    const listenerConfig: IConfig = {
      mac: {
        onError: (errorCode) => {
          console.error(`[Shortcut] Global key listener error: ${errorCode}`);
        },
      },
    };

    const macKeyServerPath = this.resolveMacKeyServerPath();
    if (macKeyServerPath) {
      this.ensureMacKeyServerExecutable(macKeyServerPath);
      listenerConfig.mac = {
        ...listenerConfig.mac,
        serverPath: macKeyServerPath,
      };
    }

    this.keyListener = new GlobalKeyboardListener(listenerConfig);

    this.keyListenerHandler = (event: IGlobalKeyEvent, isDown: IGlobalKeyDownMap) => {
      if (event.state !== 'DOWN' && event.state !== 'UP') {
        return false;
      }

      let shouldCapture = false;

      if (process.platform === 'darwin') {
        shouldCapture = this.evaluateToggleShortcut(event, isDown) || shouldCapture;
      }

      shouldCapture = this.evaluateHoldShortcut(event, isDown) || shouldCapture;
      return shouldCapture;
    };

    void this.keyListener.addListener(this.keyListenerHandler).catch((error) => {
      console.error('[Shortcut] Failed to start global key listener:', error);
    });
  }

  private detachGlobalKeyListener(): void {
    if (!this.keyListener) {
      this.toggleShortcutActive = false;
      this.holdShortcutActive = false;
      return;
    }

    if (this.keyListenerHandler) {
      this.keyListener.removeListener(this.keyListenerHandler);
      this.keyListenerHandler = null;
    }

    this.keyListener.kill();
    this.keyListener = null;
    this.toggleShortcutActive = false;
    this.holdShortcutActive = false;
  }

  private registerToggleHotkey(hotkey: string): boolean {
    globalShortcut.unregister(hotkey);
    const ok = globalShortcut.register(hotkey, () => {
      if (process.platform !== 'darwin') {
        this.handleToggleShortcut();
      }
    });
    if (!ok) {
      console.error(`Failed to register global toggle shortcut: ${hotkey}`);
    }
    return ok;
  }

  register(): boolean {
    if (!this.isEnabled) {
      return true;
    }

    const ok = this.registerToggleHotkey(this.toggleHotkey);
    if (!ok) return false;

    this.attachGlobalKeyListener();
    return true;
  }

  unregister(): void {
    globalShortcut.unregister(this.toggleHotkey);
    this.detachGlobalKeyListener();
  }

  updateHotkeys(next: HotkeyUpdatePayload): boolean {
    const previousToggleHotkey = this.toggleHotkey;
    const previousHoldHotkey = this.holdToTranscribeHotkey;

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

    if (!this.isEnabled) {
      const probe = globalShortcut.register(this.toggleHotkey, () => undefined);
      if (probe) {
        globalShortcut.unregister(this.toggleHotkey);
        return true;
      }

      this.toggleHotkey = previousToggleHotkey;
      this.holdToTranscribeHotkey = previousHoldHotkey;
      return false;
    }

    globalShortcut.unregister(previousToggleHotkey);
    this.detachGlobalKeyListener();

    const registered = this.register();
    if (registered) {
      return true;
    }

    this.toggleHotkey = previousToggleHotkey;
    this.holdToTranscribeHotkey = previousHoldHotkey;
    this.register();
    return false;
  }

  setEnabled(enabled: boolean): boolean {
    if (this.isEnabled === enabled) {
      return true;
    }

    this.isEnabled = enabled;
    if (!enabled) {
      this.unregister();
      return true;
    }

    return this.register();
  }

  getHotkeys(): { toggleHotkey: string; holdToTranscribeHotkey: string } {
    return {
      toggleHotkey: this.toggleHotkey,
      holdToTranscribeHotkey: this.holdToTranscribeHotkey,
    };
  }

  resetState(): void {
    this.isRecording = false;
    this.recordingSource = null;
    this.toggleShortcutActive = false;
    this.holdShortcutActive = false;
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }
}

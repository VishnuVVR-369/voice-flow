import { ipcMain, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../shared/constants';
import { TranscriptionService } from './transcription-service';
import { RealtimeTranscriptionService, type RealtimeTranscriptionResult } from './realtime-transcription-service';
import { TextInjector } from './text-injector';
import { getConfig, setConfig } from './config-store';
import { resizeOverlay, showOverlayWindow } from './overlay-window';
import type { AppStatus, CursorContext } from '../shared/types';
import { historyService, dictionaryService } from './service-ipc';
import { captureCursorContext } from './context-capture';
import type { RealtimeSessionManager } from './realtime-session-manager';
import type { ShortcutManager } from './shortcut-manager';
import { normalizeHotkeyForStorage, validateHotkeyTokens, hotkeyTokensFromAccelerator } from '../shared/hotkeys';

export class IPCHandler {
  private transcriptionService: TranscriptionService;
  private realtimeService: RealtimeTranscriptionService | null = null;
  private textInjector: TextInjector;
  private overlayWindow: BrowserWindow | null = null;
  private getMainWindow: (() => BrowserWindow | null) | null = null;
  private onStatusChange: ((status: string) => void) | null = null;
  private onRecordingEnded: (() => void) | null = null;
  private isStartingRealtime = false;
  private recordingStartedAt: number | null = null;
  private pendingContext: Promise<CursorContext | null> = Promise.resolve(null);
  private sessionManager: RealtimeSessionManager | null = null;
  private shortcutManager: ShortcutManager | null = null;

  constructor(
    transcriptionService: TranscriptionService,
    textInjector: TextInjector,
  ) {
    this.transcriptionService = transcriptionService;
    this.textInjector = textInjector;
  }

  setOverlayWindow(window: BrowserWindow): void {
    this.overlayWindow = window;
  }

  setGetMainWindow(getter: () => BrowserWindow | null): void {
    this.getMainWindow = getter;
  }

  setOnStatusChange(callback: (status: string) => void): void {
    this.onStatusChange = callback;
  }

  /** Called when audio data arrives, meaning recording has ended (user-initiated or auto-stopped) */
  setOnRecordingEnded(callback: () => void): void {
    this.onRecordingEnded = callback;
  }

  setSessionManager(manager: RealtimeSessionManager): void {
    this.sessionManager = manager;
  }

  setShortcutManager(manager: ShortcutManager): void {
    this.shortcutManager = manager;
  }

  markRecordingStarted(): void {
    this.recordingStartedAt = Date.now();
    this.pendingContext = captureCursorContext();
  }

  private sendStatus(status: AppStatus): void {
    this.overlayWindow?.webContents.send(IPC_CHANNELS.STATUS_UPDATE, status);
    this.onStatusChange?.(status);

    if (!this.overlayWindow) return;

    if (status === 'recording') {
      showOverlayWindow(this.overlayWindow);
      this.overlayWindow.moveTop();
      this.overlayWindow.setIgnoreMouseEvents(false);
    } else {
      this.overlayWindow.setIgnoreMouseEvents(true);
    }
  }

  private validateHotkey(hotkey: string): { normalized?: string; error?: string } {
    const normalized = normalizeHotkeyForStorage(hotkey);
    const validationError = validateHotkeyTokens(hotkeyTokensFromAccelerator(normalized));
    if (validationError) {
      return { error: validationError };
    }
    return { normalized };
  }

  private validateHotkeyPair(toggleHotkey: string, holdHotkey: string): string | null {
    if (normalizeHotkeyForStorage(toggleHotkey) === normalizeHotkeyForStorage(holdHotkey)) {
      return 'The two shortcuts must be different.';
    }
    return null;
  }

  private broadcastSettings(): void {
    const settings = getConfig();
    this.overlayWindow?.webContents.send(IPC_CHANNELS.SETTINGS_UPDATED, settings);
    const mainWindow = this.getMainWindow?.();
    mainWindow?.webContents.send(IPC_CHANNELS.SETTINGS_UPDATED, settings);
  }

  register(): void {
    // Remove any stale handlers first (prevents duplicates from Vite HMR rebuilds)
    ipcMain.removeAllListeners(IPC_CHANNELS.RECORDING_CANCELLED);
    ipcMain.removeAllListeners(IPC_CHANNELS.SETTINGS_SET);
    ipcMain.removeHandler(IPC_CHANNELS.SETTINGS_GET);
    ipcMain.removeHandler(IPC_CHANNELS.HOTKEY_SET);
    ipcMain.removeHandler(IPC_CHANNELS.SHORTCUT_EDITING);

    // Handle cancel from renderer (X button clicked)
    ipcMain.on(IPC_CHANNELS.RECORDING_CANCELLED, () => {
      console.log('[IPC] Recording cancelled by user');
      this.recordingStartedAt = null;
      // Clean up any active realtime session
      if (this.realtimeService) {
        this.realtimeService.disconnect();
        this.realtimeService = null;
      }
      this.sessionManager?.scheduleReWarm();
      this.sendStatus('idle');
      this.overlayWindow?.hide();
    });

    // Handle settings
    ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
      return getConfig();
    });

    ipcMain.on(IPC_CHANNELS.SETTINGS_SET, (_event, settings) => {
      const config = getConfig();

      const requestedToggle = typeof settings?.hotkey === 'string' ? settings.hotkey : config.hotkey;
      const requestedHold = typeof settings?.holdToTranscribeHotkey === 'string'
        ? settings.holdToTranscribeHotkey
        : config.holdToTranscribeHotkey;

      const toggleValidation = this.validateHotkey(requestedToggle);
      const holdValidation = this.validateHotkey(requestedHold);
      const pairValidation = this.validateHotkeyPair(requestedToggle, requestedHold);

      if (
        !toggleValidation.error
        && !holdValidation.error
        && !pairValidation
        && toggleValidation.normalized
        && holdValidation.normalized
      ) {
        const hotkeyUpdate = {
          toggleHotkey: toggleValidation.normalized,
          holdToTranscribeHotkey: holdValidation.normalized,
        };
        const changed = hotkeyUpdate.toggleHotkey !== config.hotkey
          || hotkeyUpdate.holdToTranscribeHotkey !== config.holdToTranscribeHotkey;

        if (changed) {
          if (this.shortcutManager?.updateHotkeys(hotkeyUpdate)) {
            settings.hotkey = hotkeyUpdate.toggleHotkey;
            settings.holdToTranscribeHotkey = hotkeyUpdate.holdToTranscribeHotkey;
          } else {
            delete settings.hotkey;
            delete settings.holdToTranscribeHotkey;
          }
        }
      } else {
        delete settings.hotkey;
        delete settings.holdToTranscribeHotkey;
      }

      setConfig(settings);
      this.broadcastSettings();
    });

    ipcMain.handle(
      IPC_CHANNELS.HOTKEY_SET,
      async (
        _event,
        payload: { kind: 'toggle' | 'hold'; hotkey: string } | string,
      ) => {
        const request = typeof payload === 'string'
          ? { kind: 'toggle' as const, hotkey: payload }
          : payload;

        if (!request?.hotkey || (request.kind !== 'toggle' && request.kind !== 'hold')) {
          return { success: false, error: 'Invalid shortcut payload.' };
        }

        const config = getConfig();
        const nextToggle = request.kind === 'toggle' ? request.hotkey : config.hotkey;
        const nextHold = request.kind === 'hold' ? request.hotkey : config.holdToTranscribeHotkey;

        const toggleValidation = this.validateHotkey(nextToggle);
        if (toggleValidation.error) {
          return { success: false, error: toggleValidation.error };
        }
        const holdValidation = this.validateHotkey(nextHold);
        if (holdValidation.error) {
          return { success: false, error: holdValidation.error };
        }

        const pairValidation = this.validateHotkeyPair(nextToggle, nextHold);
        if (pairValidation) {
          return { success: false, error: pairValidation };
        }

        if (!this.shortcutManager) {
          return { success: false, error: 'Shortcut manager is not ready yet.' };
        }

        if (!toggleValidation.normalized || !holdValidation.normalized) {
          return { success: false, error: 'Shortcut validation failed.' };
        }

        const updatePayload = {
          toggleHotkey: toggleValidation.normalized,
          holdToTranscribeHotkey: holdValidation.normalized,
        };

        const ok = this.shortcutManager.updateHotkeys(updatePayload);
        if (!ok) {
          return { success: false, error: 'That shortcut is unavailable right now.' };
        }

        setConfig({
          hotkey: updatePayload.toggleHotkey,
          holdToTranscribeHotkey: updatePayload.holdToTranscribeHotkey,
        });
        this.broadcastSettings();
        return { success: true, settings: getConfig() };
      }
    );

    ipcMain.handle(IPC_CHANNELS.SHORTCUT_EDITING, async (_event, isEditing: boolean) => {
      if (!this.shortcutManager) {
        return { success: false, error: 'Shortcut manager is not ready yet.' };
      }

      const ok = this.shortcutManager.setEnabled(!isEditing);
      if (!ok) {
        return { success: false, error: 'Failed to restore the global shortcut.' };
      }

      return { success: true };
    });

    // --- Realtime streaming transcription ---

    ipcMain.removeHandler(IPC_CHANNELS.REALTIME_START);
    ipcMain.removeAllListeners(IPC_CHANNELS.REALTIME_AUDIO_CHUNK);
    ipcMain.removeAllListeners(IPC_CHANNELS.REALTIME_STOP);
    ipcMain.removeAllListeners(IPC_CHANNELS.REALTIME_RESIZE);

    // REALTIME_START: acquire session (warm or cold) -> wire up events -> ack renderer
    ipcMain.handle(IPC_CHANNELS.REALTIME_START, async () => {
      if (this.isStartingRealtime) {
        console.warn('[IPC] REALTIME_START already in progress — rejecting concurrent call');
        return { success: false, error: 'Already starting' };
      }
      this.isStartingRealtime = true;

      try {
        const t0 = Date.now();
        const dictionaryWords = dictionaryService.getAllWords();

        // Clean up any existing realtime connection
        this.realtimeService?.disconnect();

        // Acquire session via session manager (warm pool) or fall back to cold start
        let service: RealtimeTranscriptionService;
        if (this.sessionManager) {
          const result = await this.sessionManager.acquireSession();
          service = result.service;
        } else {
          // Fallback: no session manager (shouldn't happen, but safe)
          const config = getConfig();
          if (!config.groqApiKey) {
            return { success: false, error: 'Please configure your Groq API key in Settings.' };
          }
          service = new RealtimeTranscriptionService({
            apiKey: config.groqApiKey,
            language: config.language || undefined,
            dictionaryWords,
          });
          await service.connect();
        }

        this.realtimeService = service;

        // Wire up event listeners
        this.realtimeService.on('utterance', (text: string) => {
          if (dictionaryWords?.length && this.isDictionaryHallucination(text, dictionaryWords)) {
            console.warn(`[IPC] Utterance is dictionary-heavy, keeping transcript: "${text}"`);
          }
          this.overlayWindow?.webContents.send(IPC_CHANNELS.REALTIME_UTTERANCE, text);
        });

        this.realtimeService.on('error', (msg: string) => {
          console.error('[IPC] Realtime error:', msg);
          this.overlayWindow?.webContents.send(IPC_CHANNELS.REALTIME_ERROR, msg);
          // Auto-recover: disconnect, reset state, return to idle
          this.realtimeService?.disconnect();
          this.realtimeService = null;
          this.sessionManager?.scheduleReWarm();
          this.sendStatus('error');
          setTimeout(() => {
            this.overlayWindow?.hide();
            this.sendStatus('idle');
          }, 2000);
        });

        console.log(`[IPC] Realtime session acquired (${Date.now() - t0}ms total)`);

        // Notify renderer that realtime is ready
        this.overlayWindow?.webContents.send(IPC_CHANNELS.REALTIME_STARTED);
        return { success: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to start realtime';
        console.error('[IPC] Realtime start error:', msg);
        if (msg.includes('No API key configured')) {
          return { success: false, error: 'Please configure your Groq API key in Settings.' };
        }
        return { success: false, error: msg };
      } finally {
        this.isStartingRealtime = false;
      }
    });

    // REALTIME_AUDIO_CHUNK: forward PCM16 to WebSocket
    ipcMain.on(IPC_CHANNELS.REALTIME_AUDIO_CHUNK, (_event, pcm16: ArrayBuffer) => {
      if (this.realtimeService?.isConnected) {
        this.realtimeService.sendAudioChunk(Buffer.from(pcm16));
      }
    });

    // REALTIME_STOP: flush -> concatenate -> polish -> inject -> history -> done
    ipcMain.on(IPC_CHANNELS.REALTIME_STOP, async () => {
      if (!this.realtimeService) {
        console.warn('[IPC] REALTIME_STOP but no active realtime service');
        return;
      }

      const stopInitiatedAt = Date.now();
      this.onRecordingEnded?.();
      this.sendStatus('transcribing');

      try {
        // Wait for final transcript
        const transcriptResult: RealtimeTranscriptionResult = await this.realtimeService.stop();
        const rawText = transcriptResult.text;
        const flushMs = Date.now() - stopInitiatedAt;
        this.realtimeService.disconnect();
        this.realtimeService = null;
        this.sessionManager?.scheduleReWarm();

        if (!rawText?.trim()) {
          this.overlayWindow?.webContents.send(IPC_CHANNELS.TRANSCRIPTION_ERROR, 'No speech detected');
          this.sendStatus('error');
          setTimeout(() => {
            this.overlayWindow?.hide();
            this.sendStatus('idle');
          }, 2000);
          return;
        }

        const config = getConfig();
        const dictionaryWords = dictionaryService.getAllWords();
        const context = await this.pendingContext;

        if (dictionaryWords?.length && this.isDictionaryHallucination(rawText, dictionaryWords)) {
          console.warn(`[IPC] Final transcript is dictionary-heavy, but accepted: "${rawText}"`);
        }

        if (transcriptResult.diagnostics) {
          console.log(`[IPC] STT diagnostics: ${JSON.stringify({
            strategyVersion: transcriptResult.diagnostics.strategyVersion,
            selectedPass: transcriptResult.diagnostics.selectedPass,
            passA: transcriptResult.diagnostics.passA,
            passB: transcriptResult.diagnostics.passB,
            detectedLanguage: transcriptResult.detectedLanguage || null,
            durationSec: transcriptResult.durationSec ?? null,
          })}`);
        }

        // Polish the final text
        let finalText = rawText;
        let polishedText: string | null = null;
        let polishMs = 0;

        if (config.enablePolish && rawText.trim()) {
          try {
            console.log(`[IPC] Polish input: "${rawText}"`);
            const polishStart = Date.now();
            const result = await this.transcriptionService.polishOnly(rawText, context);
            polishMs = Date.now() - polishStart;
            polishedText = result.polishedText;
            finalText = polishedText ?? rawText;
            console.log(`[IPC] Polish output: "${finalText}"${polishedText ? '' : ' (fallback to raw)'}`);
          } catch (err) {
            console.error('[IPC] Polish failed, using raw text:', err);
          }
        }

        // Inject text + save to history
        const injectStart = Date.now();
        await this.textInjector.inject(finalText, context);
        const injectMs = Date.now() - injectStart;

        const durationSeconds = this.recordingStartedAt
          ? parseFloat(((stopInitiatedAt - this.recordingStartedAt) / 1000).toFixed(2))
          : null;
        this.recordingStartedAt = null;

        historyService.save({
          original_text: rawText,
          optimized_text: polishedText,
          app_context: context ? JSON.stringify(context) : null,
          duration_seconds: durationSeconds,
        }).then(() => {
          this.getMainWindow?.()?.webContents.send(IPC_CHANNELS.HISTORY_UPDATED);
        }).catch((err) => console.error('[History] Failed to save:', err));

        this.overlayWindow?.webContents.send(IPC_CHANNELS.TRANSCRIPTION_RESULT, finalText);
        this.sendStatus('done');
        console.log(`[realtime pipeline: ${Date.now() - stopInitiatedAt}ms | flush: ${flushMs}ms | polish: ${polishMs}ms | inject: ${injectMs}ms]`);

        setTimeout(() => {
          this.overlayWindow?.hide();
          this.sendStatus('idle');
        }, 1500);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Transcription failed';
        console.error('[IPC] Realtime stop error:', message);
        this.realtimeService?.disconnect();
        this.realtimeService = null;
        this.sessionManager?.scheduleReWarm();
        this.overlayWindow?.webContents.send(IPC_CHANNELS.TRANSCRIPTION_ERROR, message);
        this.sendStatus('error');

        setTimeout(() => {
          this.overlayWindow?.hide();
          this.sendStatus('idle');
        }, 3000);
      }
    });

    // Renderer diagnostic logging (forward to terminal)
    ipcMain.removeAllListeners(IPC_CHANNELS.RENDERER_LOG);
    ipcMain.on(IPC_CHANNELS.RENDERER_LOG, (_event, msg: string) => {
      console.log(`[Renderer] ${msg}`);
    });

    // REALTIME_RESIZE: dynamically resize overlay window
    ipcMain.on(IPC_CHANNELS.REALTIME_RESIZE, (_event, width: number, height: number) => {
      if (this.overlayWindow) {
        resizeOverlay(this.overlayWindow, width, height);
      }
    });
  }

  /** Reuses dictionary hallucination detection from TranscriptionService */
  private isDictionaryHallucination(text: string, dictionaryWords: string[]): boolean {
    const normalize = (s: string) =>
      s.toLowerCase().replace(/[.,;!?，。；！？\s]+/g, ' ').trim();

    const normalized = normalize(text);
    if (!normalized) return false;

    const tokens = normalized.split(' ').filter(Boolean);
    const dictPhrases = dictionaryWords.map(normalize);

    let remaining = normalized;
    for (const phrase of dictPhrases) {
      remaining = remaining.split(phrase).join(' ');
    }
    remaining = remaining.replace(/\s+/g, ' ').trim();

    if (remaining.length === 0) return true;

    if (tokens.length <= 10) {
      const remainingTokens = remaining.split(' ').filter(Boolean);
      const dictTokenCount = tokens.length - remainingTokens.length;
      if (dictTokenCount / tokens.length >= 0.6) return true;
    }

    return false;
  }
}

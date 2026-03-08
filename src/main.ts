import { app, BrowserWindow, globalShortcut, systemPreferences, dialog } from 'electron';
import { ShortcutManager } from './main/shortcut-manager';
import { TranscriptionService } from './main/transcription-service';
import { TextInjector } from './main/text-injector';
import { TrayManager } from './main/tray-manager';
import { IPCHandler } from './main/ipc-handlers';
import { createOverlayWindow, repositionOverlayTocursor, showOverlayWindow } from './main/overlay-window';
import { toggleMainWindow, getMainWindow } from './main/main-window';
import { getConfig, setConfig } from './main/config-store';
import { IPC_CHANNELS } from './shared/constants';
import { registerServiceIPC } from './main/service-ipc';
import { RealtimeSessionManager } from './main/realtime-session-manager';
import { APP_DEFAULTS } from './shared/app-defaults';
import { normalizeHotkeyForStorage } from './shared/hotkeys';

let overlayWindow: BrowserWindow | null = null;
let shortcutManager: ShortcutManager | null = null;
let trayManager: TrayManager | null = null;
let hasCleanedUp = false;

const transcriptionService = new TranscriptionService();
const textInjector = new TextInjector();
const ipcHandler = new IPCHandler(transcriptionService, textInjector);
const sessionManager = new RealtimeSessionManager();
ipcHandler.setSessionManager(sessionManager);

function cleanupGlobalShortcuts(): void {
  if (hasCleanedUp) {
    return;
  }

  hasCleanedUp = true;

  try {
    shortcutManager?.unregister();
  } catch (error) {
    console.error('[Main] Failed to unregister shortcuts cleanly:', error);
  }

  try {
    globalShortcut.unregisterAll();
  } catch (error) {
    console.error('[Main] Failed to unregister all Electron shortcuts:', error);
  }
}

function initApp(): void {
  const config = getConfig();
  if (normalizeHotkeyForStorage(config.hotkey) === normalizeHotkeyForStorage(config.holdToTranscribeHotkey)) {
    const fallbackHoldHotkey = normalizeHotkeyForStorage(APP_DEFAULTS.holdToTranscribeHotkey);
    const fallbackToggleHotkey = normalizeHotkeyForStorage(config.hotkey);
    const nextHold = fallbackHoldHotkey === fallbackToggleHotkey ? 'Control+Space' : fallbackHoldHotkey;
    setConfig({ holdToTranscribeHotkey: nextHold });
    config.holdToTranscribeHotkey = nextHold;
  }

  console.log('=== VoiceFlow Initializing ===');
  console.log('Toggle Hotkey:', config.hotkey);
  console.log('Hold-to-Transcribe Hotkey:', config.holdToTranscribeHotkey);
  console.log('Language:', config.language);

  overlayWindow = createOverlayWindow();
  ipcHandler.setOverlayWindow(overlayWindow);
  ipcHandler.setGetMainWindow(getMainWindow);
  ipcHandler.setOnStatusChange((status) => {
    trayManager?.updateMenu(status);
    if (status === 'idle') {
      shortcutManager?.resetState();
    }
    if (status !== 'recording') {
      try { globalShortcut.unregister('Escape'); } catch { /* already unregistered */ }
    }
  });
  ipcHandler.setOnRecordingEnded(() => {
    shortcutManager?.resetState();
    trayManager?.updateMenu('transcribing');
  });
  ipcHandler.register();
  registerServiceIPC(getMainWindow);

  sessionManager.warmUp();

  shortcutManager = new ShortcutManager(config.hotkey, config.holdToTranscribeHotkey, (recording) => {
    if (recording) {
      ipcHandler.markRecordingStarted();
      if (overlayWindow) {
        repositionOverlayTocursor(overlayWindow);
        overlayWindow.setIgnoreMouseEvents(false);
        showOverlayWindow(overlayWindow);
        overlayWindow.moveTop();
      }

      globalShortcut.register('Escape', () => {
        console.log('[Main] ESC pressed — cancelling recording');
        overlayWindow?.webContents.send(IPC_CHANNELS.RECORDING_CANCEL);
        try { globalShortcut.unregister('Escape'); } catch { /* noop */ }
      });

      trayManager?.updateMenu('recording');
    } else {
      try { globalShortcut.unregister('Escape'); } catch { /* noop */ }
      trayManager?.updateMenu('transcribing');
    }
  });
  shortcutManager.setOverlayWindow(overlayWindow);
  ipcHandler.setShortcutManager(shortcutManager);
  shortcutManager.register();

  toggleMainWindow();

  trayManager = new TrayManager(
    () => app.quit(),
    () => toggleMainWindow(),
  );
  trayManager.create();

  if (process.platform === 'darwin') {
    const trusted = systemPreferences.isTrustedAccessibilityClient(false);
    if (!trusted) {
      console.log('WARNING: Accessibility permission not granted. Auto-paste will not work.');
      dialog.showMessageBox({
        type: 'warning',
        title: 'Accessibility Permission Required',
        message: 'VoiceFlow needs Accessibility access to auto-paste transcribed text.',
        detail: 'Go to System Settings → Privacy & Security → Accessibility, then add and enable the app running this process (Cursor / Terminal).\n\nWithout this, transcribed text will be copied to clipboard but not auto-pasted.',
        buttons: ['Open System Settings', 'Later'],
        defaultId: 0,
      }).then((result) => {
        if (result.response === 0) {
          systemPreferences.isTrustedAccessibilityClient(true);
        }
      });
    } else {
      console.log('Accessibility permission: granted');
    }
  }

  console.log('VoiceFlow initialized. Use configured shortcuts to control recording.');
}

process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Main] Unhandled rejection:', reason);
});

app.on('ready', () => {
  initApp();
});

app.on('before-quit', () => {
  cleanupGlobalShortcuts();
  sessionManager.dispose();
  const mw = getMainWindow();
  if (mw) {
    (mw as any)._forceClose = true;
    mw.close();
  }
});

app.on('will-quit', () => {
  cleanupGlobalShortcuts();
  trayManager?.destroy();
});

// Keep app running when all windows are closed (it's a tray app)
app.on('window-all-closed', () => {
  // Don't quit - this is a tray app
});

import { app, BrowserWindow, clipboard, dialog, ipcMain, systemPreferences } from 'electron';
import * as path from 'path';
import { IPC_CHANNELS } from '../shared/constants';
import { HistoryService } from './history-service';
import { DictionaryService } from './dictionary-service';
import * as fs from 'fs';
import { TextInjector } from './text-injector';
import { getConfig } from './config-store';
import type { CursorContext, HistoryListRequest, HistoryUpdateRequest, ReadinessSnapshot } from '../shared/types';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

const historyService = new HistoryService();
const dictionaryService = new DictionaryService();

/** Remove any existing handler before registering — safe for hot-reload. */
function safeHandle<TArgs extends unknown[], TResult>(
  channel: string,
  handler: (event: Electron.IpcMainInvokeEvent, ...args: TArgs) => TResult | Promise<TResult>,
): void {
  ipcMain.removeHandler(channel);
  ipcMain.handle(channel, handler);
}

function broadcastHistoryUpdated(): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(IPC_CHANNELS.HISTORY_UPDATED);
  }
}

function parseCursorContext(rawContext: string | null): CursorContext | null {
  if (!rawContext) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawContext) as Partial<CursorContext>;
    return {
      appName: typeof parsed.appName === 'string' ? parsed.appName : '',
      windowTitle: typeof parsed.windowTitle === 'string' ? parsed.windowTitle : '',
      selectedText: typeof parsed.selectedText === 'string' ? parsed.selectedText : '',
      elementRole: typeof parsed.elementRole === 'string' ? parsed.elementRole : '',
    };
  } catch {
    return null;
  }
}

function defaultExportPath(fileName: string): string {
  return path.join(app.getPath('documents'), fileName);
}

function ensureExportExtension(filePath: string): string {
  return path.extname(filePath) ? filePath : `${filePath}.json`;
}

function isAccessibilityTrusted(): boolean {
  if (process.platform !== 'darwin') {
    return true;
  }

  return systemPreferences.isTrustedAccessibilityClient(false);
}

function buildReadinessSnapshot(): ReadinessSnapshot {
  const config = getConfig();
  return {
    apiKeyConfigured: Boolean(config.groqApiKey.trim()),
    accessibilityTrusted: isAccessibilityTrusted(),
    historyDir: historyService.getHistoryDir(),
    hotkey: config.hotkey,
    holdToTranscribeHotkey: config.holdToTranscribeHotkey,
    defaultMode: config.defaultMode,
    askPasteBehavior: config.askPasteBehavior,
  };
}

export function registerServiceIPC(textInjector: TextInjector): void {
  // --- First-run readiness ---
  safeHandle(IPC_CHANNELS.READINESS_GET, async () => {
    return buildReadinessSnapshot();
  });

  safeHandle(IPC_CHANNELS.READINESS_REQUEST_ACCESSIBILITY, async () => {
    if (process.platform === 'darwin') {
      systemPreferences.isTrustedAccessibilityClient(true);
    }
    return buildReadinessSnapshot();
  });

  safeHandle(IPC_CHANNELS.READINESS_VALIDATE_API_KEY, async () => {
    const apiKey = getConfig().groqApiKey.trim();
    if (!apiKey) {
      return { success: false, error: 'Add a Groq API key before validating.' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${GROQ_BASE_URL}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: controller.signal,
      });

      if (!response.ok) {
        return { success: false, error: `Groq rejected the key (${response.status}).` };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error && error.name === 'AbortError'
          ? 'Groq validation timed out.'
          : 'Could not reach Groq to validate the key.',
      };
    } finally {
      clearTimeout(timeout);
    }
  });

  safeHandle(IPC_CHANNELS.READINESS_TEST_CLIPBOARD, async () => {
    const previous = clipboard.readText();
    const probe = `voiceflow-readiness-${Date.now()}`;

    try {
      clipboard.writeText(probe);
      const ok = clipboard.readText() === probe;
      clipboard.writeText(previous);
      return ok
        ? { success: true }
        : { success: false, error: 'Clipboard write verification failed.' };
    } catch {
      clipboard.writeText(previous);
      return { success: false, error: 'Clipboard access failed.' };
    }
  });

  // --- History ---
  safeHandle(IPC_CHANNELS.HISTORY_LIST, async (_event, req: HistoryListRequest) => {
    return historyService.list(req.page, req.pageSize, {
      searchQuery: req.searchQuery,
      mode: req.mode,
      favoriteOnly: req.favoriteOnly,
      appName: req.appName,
      dateRange: req.dateRange,
    });
  });

  safeHandle(IPC_CHANNELS.HISTORY_GET, async (_event, req: { id: string }) => {
    return historyService.getById(req.id);
  });

  safeHandle(IPC_CHANNELS.HISTORY_UPDATE, async (_event, req: HistoryUpdateRequest) => {
    const result = await historyService.update(req);
    if (result.success) {
      broadcastHistoryUpdated();
    }
    return result;
  });

  safeHandle(IPC_CHANNELS.HISTORY_DELETE, async (_event, req: { id: string }) => {
    const result = await historyService.delete(req.id);
    if (result.success) {
      broadcastHistoryUpdated();
    }
    return result;
  });

  safeHandle(IPC_CHANNELS.HISTORY_REINJECT, async (_event, req: { id: string }) => {
    const record = await historyService.getById(req.id);
    if (!record) {
      return { success: false, error: 'History record not found.' };
    }

    const injectResult = await textInjector.inject(
      record.final_text,
      parseCursorContext(record.app_context),
      record.mode === 'ask' ? { pasteBehavior: getConfig().askPasteBehavior } : {},
    );

    if (injectResult.status !== 'success') {
      return {
        success: false,
        error: injectResult.reason || 'Failed to paste the saved result back into the target app.',
      };
    }

    return { success: true };
  });

  safeHandle(IPC_CHANNELS.HISTORY_EXPORT_ONE, async (_event, req: { id: string }) => {
    const record = await historyService.getById(req.id);
    if (!record) {
      return { success: false, error: 'History record not found.' };
    }

    const saveResult = await dialog.showSaveDialog({
      title: 'Export history record',
      buttonLabel: 'Export',
      defaultPath: defaultExportPath(`voiceflow-history-${record.id.slice(0, 8)}.json`),
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'Markdown', extensions: ['md'] },
      ],
      message: 'Use a .md extension for Markdown export.',
    });

    if (saveResult.canceled || !saveResult.filePath) {
      return { success: false, canceled: true };
    }

    const filePath = ensureExportExtension(saveResult.filePath);
    await historyService.exportOne(req.id, filePath);
    return { success: true, filePath };
  });

  safeHandle(IPC_CHANNELS.HISTORY_EXPORT_ALL, async () => {
    const saveResult = await dialog.showSaveDialog({
      title: 'Export all history',
      buttonLabel: 'Export',
      defaultPath: defaultExportPath(`voiceflow-history-${new Date().toISOString().slice(0, 10)}.json`),
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'Markdown', extensions: ['md'] },
      ],
      message: 'Use a .md extension for Markdown export.',
    });

    if (saveResult.canceled || !saveResult.filePath) {
      return { success: false, canceled: true };
    }

    const filePath = ensureExportExtension(saveResult.filePath);
    await historyService.exportAll(filePath);
    return { success: true, filePath };
  });

  safeHandle(IPC_CHANNELS.HISTORY_GET_DIR, async () => {
    return historyService.getHistoryDir();
  });

  safeHandle(IPC_CHANNELS.HISTORY_SET_DIR, async (_event, req: { dir: string }) => {
    try {
      if (!fs.existsSync(req.dir)) {
        fs.mkdirSync(req.dir, { recursive: true });
      }
      historyService.setHistoryDir(req.dir);
      broadcastHistoryUpdated();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to set directory' };
    }
  });

  // --- Stats ---
  safeHandle(IPC_CHANNELS.STATS_GET, async () => {
    return historyService.getStats();
  });

  // --- Dictionary ---
  safeHandle(IPC_CHANNELS.DICTIONARY_LIST, async () => {
    return dictionaryService.list();
  });

  safeHandle(IPC_CHANNELS.DICTIONARY_ADD, async (_event, req: { word: string }) => {
    try {
      const result = dictionaryService.add(req.word);
      return { success: true, ...result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add dictionary term.',
      };
    }
  });

  safeHandle(IPC_CHANNELS.DICTIONARY_DELETE, async (_event, req: { id: string }) => {
    return { success: dictionaryService.delete(req.id) };
  });
}

export { historyService, dictionaryService };

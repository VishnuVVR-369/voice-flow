import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import { IPC_CHANNELS } from '../shared/constants';
import { HistoryService } from './history-service';
import { DictionaryService } from './dictionary-service';
import * as fs from 'fs';
import { TextInjector } from './text-injector';
import { getConfig } from './config-store';
import type { CursorContext, HistoryListRequest } from '../shared/types';

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

export function registerServiceIPC(textInjector: TextInjector): void {
  // --- History ---
  safeHandle(IPC_CHANNELS.HISTORY_LIST, async (_event, req: HistoryListRequest) => {
    return historyService.list(req.page, req.pageSize, {
      searchQuery: req.searchQuery,
      mode: req.mode,
    });
  });

  safeHandle(IPC_CHANNELS.HISTORY_GET, async (_event, req: { id: string }) => {
    return historyService.getById(req.id);
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

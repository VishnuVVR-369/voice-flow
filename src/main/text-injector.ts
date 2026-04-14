import { clipboard } from 'electron';
import { execFile } from 'node:child_process';
import type { AskPasteBehavior, CursorContext } from '../shared/types';

const MIN_INJECT_INTERVAL_MS = 500;
const DEDUP_WINDOW_MS = 5000;
const APP_RESTORE_SETTLE_MS = 120;
const PASTE_DELAY_MS = 50;
const CURSOR_COLLAPSE_SETTLE_MS = 40;

export type InjectResultStatus = 'success' | 'skipped' | 'failed';

export interface InjectResult {
  status: InjectResultStatus;
  reason?: string;
}

export class TextInjector {
  private lastInjectTime = 0;
  private isInjecting = false;
  private lastInjectedText = '';
  private lastInjectedAt = 0;

  async inject(
    text: string,
    context: CursorContext | null = null,
    options: { pasteBehavior?: AskPasteBehavior } = {},
  ): Promise<InjectResult> {
    const now = Date.now();

    // Guard 1: concurrent / rapid-fire
    if (this.isInjecting || now - this.lastInjectTime < MIN_INJECT_INTERVAL_MS) {
      console.log(`[TextInjector] Skipping — guard:interval (isInjecting=${this.isInjecting}, interval=${now - this.lastInjectTime}ms)`);
      return {
        status: 'skipped',
        reason: 'Paste skipped because another inject was already running or triggered too quickly.',
      };
    }

    // Guard 2: same content within dedup window
    if (text === this.lastInjectedText && now - this.lastInjectedAt < DEDUP_WINDOW_MS) {
      console.log(`[TextInjector] Skipping — guard:dedup (same text ${now - this.lastInjectedAt}ms ago)`);
      return {
        status: 'skipped',
        reason: 'Paste skipped because the same text was already injected a moment ago.',
      };
    }

    this.isInjecting = true;
    this.lastInjectTime = now;
    console.log(`[TextInjector] Injecting: "${text.slice(0, 40)}…"`);

    // Save previous clipboard content to restore after paste
    const previousClipboard = clipboard.readText();

    clipboard.writeText(text);

    try {
      await this.restoreTargetApp(context);
      if (options.pasteBehavior === 'paste-at-cursor' && context?.selectedText) {
        await this.collapseSelectionToCursor();
      }
      await this.simulatePaste();
      this.lastInjectedText = text;
      this.lastInjectedAt = Date.now();
      // Restore previous clipboard content after paste completes
      setTimeout(() => {
        clipboard.writeText(previousClipboard);
      }, 500);
      return { status: 'success' };
    } catch (error) {
      console.error('[TextInjector] Paste failed:', error);
      // Still restore clipboard on failure
      clipboard.writeText(previousClipboard);
      return {
        status: 'failed',
        reason: error instanceof Error ? error.message : 'Paste failed.',
      };
    } finally {
      this.isInjecting = false;
    }
  }

  private restoreTargetApp(context: CursorContext | null): Promise<void> {
    if (process.platform !== 'darwin' || !context?.appName) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const script = `Application(${JSON.stringify(context.appName)}).activate();`;
      execFile('osascript', ['-l', 'JavaScript', '-e', script], (error) => {
        if (error) {
          console.warn(`[TextInjector] Failed to reactivate ${context.appName}:`, error.message);
          resolve();
          return;
        }

        setTimeout(resolve, APP_RESTORE_SETTLE_MS);
      });
    });
  }

  private simulatePaste(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (process.platform === 'darwin') {
        setTimeout(() => {
          execFile(
            'osascript',
            ['-e', 'tell application "System Events" to keystroke "v" using command down'],
            (error) => {
              if (error) {
                console.error('[TextInjector] osascript error:', error.message);
                reject(error);
              } else {
                resolve();
              }
            }
          );
        }, PASTE_DELAY_MS);
      } else {
        resolve();
      }
    });
  }

  private collapseSelectionToCursor(): Promise<void> {
    return new Promise((resolve) => {
      if (process.platform !== 'darwin') {
        resolve();
        return;
      }

      execFile(
        'osascript',
        ['-e', 'tell application "System Events" to key code 124'],
        (error) => {
          if (error) {
            console.warn('[TextInjector] Failed to collapse selection before paste:', error.message);
            resolve();
            return;
          }

          setTimeout(resolve, CURSOR_COLLAPSE_SETTLE_MS);
        }
      );
    });
  }
}

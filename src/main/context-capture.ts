import { spawn } from 'node:child_process';
import type { CursorContext } from '../shared/types';

const TIMEOUT_MS = 500;
const MAX_SELECTED_TEXT = 1000;

const JXA_SCRIPT = `
const se = Application("System Events");
const frontApp = se.processes.whose({frontmost: true})[0];
const context = {
  appName: "",
  windowTitle: "",
  selectedText: "",
  elementRole: "",
};
try { context.appName = String(frontApp.name() || ""); } catch(e) {}
try { context.windowTitle = String(frontApp.windows[0].name() || ""); } catch(e) {}
try {
  const focused = frontApp.attributes["AXFocusedUIElement"].value();
  try { context.selectedText = String(focused.attributes["AXSelectedText"].value() || ""); } catch(e) {}
  try { context.elementRole = String(focused.attributes["AXRole"].value() || ""); } catch(e) {}
} catch(e) {}
JSON.stringify(context);
`;

export function captureCursorContext(): Promise<CursorContext | null> {
  if (process.platform !== 'darwin') {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let settled = false;

    const done = (result: CursorContext | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      console.warn('[ContextCapture] Timed out');
      child.kill();
      done(null);
    }, TIMEOUT_MS);

    const child = spawn('osascript', ['-l', 'JavaScript', '-']);

    child.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
    child.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

    child.on('error', (err) => {
      console.warn('[ContextCapture] spawn error:', err.message);
      done(null);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.warn('[ContextCapture] JXA error (exit', code + '):', stderr.trim());
        done(null);
        return;
      }

      const rawOutput = stdout.trim();
      if (!rawOutput) {
        done(null);
        return;
      }

      try {
        const parsed = JSON.parse(rawOutput) as Partial<CursorContext>;
        const context: CursorContext = {
          appName: typeof parsed.appName === 'string' ? parsed.appName : '',
          windowTitle: typeof parsed.windowTitle === 'string' ? parsed.windowTitle : '',
          selectedText: typeof parsed.selectedText === 'string' ? parsed.selectedText.slice(0, MAX_SELECTED_TEXT) : '',
          elementRole: typeof parsed.elementRole === 'string' ? parsed.elementRole : '',
        };
        console.log(`[ContextCapture] app=${context.appName}, window="${context.windowTitle.slice(0, 80)}", selectedText=${context.selectedText.length} chars, role=${context.elementRole}`);
        done(context);
      } catch (error) {
        console.warn('[ContextCapture] Failed to parse JXA output:', error instanceof Error ? error.message : error);
        done(null);
      }
    });

    child.stdin.write(JXA_SCRIPT);
    child.stdin.end();
  });
}

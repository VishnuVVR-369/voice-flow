import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import type { CursorContext, HistoryDiagnostics, SessionMode, TranscriptionStatsResult } from '../shared/types';

export interface LocalHistoryRecord {
  id: string;
  mode: SessionMode;
  original_text: string;
  optimized_text: string | null;
  command_text: string | null;
  source_text: string | null;
  final_text: string;
  app_context: string | null;
  detected_language: string | null;
  app_name: string | null;
  window_title: string | null;
  diagnostics: HistoryDiagnostics | null;
  duration_seconds: number | null;
  word_count: number;
  created_at: string;
}

type ParsedHistoryRecord = Partial<LocalHistoryRecord> & Pick<LocalHistoryRecord, 'id' | 'original_text' | 'created_at'> & {
  language?: string | null;
};

export class LocalHistoryService {
  private historyDir: string;

  constructor(customDir?: string) {
    this.historyDir = customDir || path.join(app.getPath('userData'), 'history');
    this.ensureDir();
  }

  private ensureDir(): void {
    if (!fs.existsSync(this.historyDir)) {
      fs.mkdirSync(this.historyDir, { recursive: true });
    }
  }

  setHistoryDir(dir: string): void {
    this.historyDir = dir;
    this.ensureDir();
  }

  getHistoryDir(): string {
    return this.historyDir;
  }

  /** Count words in text (handles CJK and Latin) */
  static countWords(text: string): number {
    if (!text) return 0;
    // CJK characters count as 1 word each
    const cjk = text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g);
    const cjkCount = cjk ? cjk.length : 0;
    // Remove CJK chars, then count remaining words by whitespace
    const remaining = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, ' ').trim();
    const latinCount = remaining ? remaining.split(/\s+/).filter(Boolean).length : 0;
    return cjkCount + latinCount;
  }

  save(record: Omit<LocalHistoryRecord, 'word_count'>): LocalHistoryRecord {
    this.ensureDir();
    const fullRecord = this.normalizeRecord(record);
    const filePath = path.join(this.historyDir, `${record.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(fullRecord, null, 2), 'utf-8');
    return fullRecord;
  }

  private parseAppContext(rawContext: string | null | undefined): CursorContext | null {
    if (!rawContext) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawContext) as Partial<CursorContext>;
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }

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

  private normalizeDiagnostics(diagnostics: unknown): HistoryDiagnostics | null {
    if (!diagnostics || typeof diagnostics !== 'object' || Array.isArray(diagnostics)) {
      return null;
    }

    return diagnostics as HistoryDiagnostics;
  }

  private normalizeRecord(record: ParsedHistoryRecord): LocalHistoryRecord {
    const finalText = record.final_text ?? record.optimized_text ?? record.original_text;
    const parsedContext = this.parseAppContext(record.app_context);
    const wordCount = typeof record.word_count === 'number'
      ? record.word_count
      : LocalHistoryService.countWords(finalText);

    return {
      id: record.id,
      mode: record.mode ?? 'dictation',
      original_text: record.original_text,
      optimized_text: record.optimized_text ?? null,
      command_text: record.command_text ?? null,
      source_text: record.source_text ?? parsedContext?.selectedText ?? null,
      final_text: finalText,
      app_context: record.app_context ?? null,
      detected_language: record.detected_language ?? record.language ?? null,
      app_name: record.app_name ?? parsedContext?.appName ?? null,
      window_title: record.window_title ?? parsedContext?.windowTitle ?? null,
      diagnostics: this.normalizeDiagnostics(record.diagnostics),
      duration_seconds: typeof record.duration_seconds === 'number' ? record.duration_seconds : null,
      word_count: wordCount,
      created_at: record.created_at,
    };
  }

  list(page: number, pageSize: number): { data: LocalHistoryRecord[]; total: number } {
    this.ensureDir();
    const files = fs.readdirSync(this.historyDir)
      .filter(f => f.endsWith('.json'))
      .sort().reverse();

    const allRecords: LocalHistoryRecord[] = [];
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(this.historyDir, file), 'utf-8');
        const record = this.normalizeRecord(JSON.parse(content) as ParsedHistoryRecord);
        allRecords.push(record);
      } catch {
        // skip unreadable files
      }
    }

    allRecords.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const from = page * pageSize;
    const sliced = allRecords.slice(from, from + pageSize);
    return { data: sliced, total: allRecords.length };
  }

  listAll(): LocalHistoryRecord[] {
    return this.list(0, Number.MAX_SAFE_INTEGER).data;
  }

  delete(id: string): boolean {
    const filePath = path.join(this.historyDir, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  getById(id: string): LocalHistoryRecord | null {
    const filePath = path.join(this.historyDir, `${id}.json`);
    if (!fs.existsSync(filePath)) return null;
    try {
      return this.normalizeRecord(JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ParsedHistoryRecord);
    } catch {
      return null;
    }
  }

  /** Compute aggregate stats from all local history files */
  computeStats(): TranscriptionStatsResult {
    this.ensureDir();
    const files = fs.readdirSync(this.historyDir).filter(f => f.endsWith('.json'));

    let totalWords = 0;
    let totalCount = 0;
    let totalDurationSeconds = 0;

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(this.historyDir, file), 'utf-8');
        const record = this.normalizeRecord(JSON.parse(content) as ParsedHistoryRecord);
        totalWords += record.word_count || 0;
        totalCount += 1;
        totalDurationSeconds += record.duration_seconds || 0;
      } catch {
        // skip unreadable files
      }
    }

    return { totalWords, totalCount, totalDurationSeconds };
  }
}

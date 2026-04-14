import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { LocalHistoryService, type LocalHistoryRecord } from './local-history-service';
import type {
  HistoryFilterMode,
  HistoryDeleteResult,
  HistoryDiagnostics,
  HistoryListResult,
  TranscriptionRecord,
  TranscriptionStatsResult,
} from '../shared/types';

const localHistory = new LocalHistoryService();

type HistorySaveInput = {
  mode: 'dictation' | 'ask';
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
};

export class HistoryService {
  getHistoryDir(): string {
    return localHistory.getHistoryDir();
  }

  setHistoryDir(dir: string): void {
    localHistory.setHistoryDir(dir);
  }

  private toTranscriptionRecord(record: LocalHistoryRecord): TranscriptionRecord {
    return {
      id: record.id,
      mode: record.mode,
      original_text: record.original_text,
      optimized_text: record.optimized_text,
      command_text: record.command_text,
      source_text: record.source_text,
      final_text: record.final_text,
      app_context: record.app_context,
      detected_language: record.detected_language,
      app_name: record.app_name,
      window_title: record.window_title,
      diagnostics: record.diagnostics,
      language: record.detected_language,
      duration_seconds: record.duration_seconds,
      created_at: record.created_at,
    };
  }

  private listAllRecords(): TranscriptionRecord[] {
    return localHistory.listAll().map((record) => this.toTranscriptionRecord(record));
  }

  async save(record: HistorySaveInput): Promise<void> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    localHistory.save({
      id,
      mode: record.mode,
      original_text: record.original_text,
      optimized_text: record.optimized_text,
      command_text: record.command_text,
      source_text: record.source_text,
      final_text: record.final_text,
      app_context: record.app_context,
      detected_language: record.detected_language,
      app_name: record.app_name,
      window_title: record.window_title,
      diagnostics: record.diagnostics,
      duration_seconds: record.duration_seconds,
      created_at: createdAt,
    });
  }

  async list(
    page: number,
    pageSize: number,
    options: { searchQuery?: string; mode?: HistoryFilterMode } = {},
  ): Promise<HistoryListResult> {
    const result = localHistory.list(page, pageSize, options);
    return {
      data: result.data.map((record) => this.toTranscriptionRecord(record)),
      total: result.total,
    };
  }

  async getById(id: string): Promise<TranscriptionRecord | null> {
    const record = localHistory.getById(id);
    return record ? this.toTranscriptionRecord(record) : null;
  }

  async delete(id: string): Promise<HistoryDeleteResult> {
    const success = localHistory.delete(id);
    return success
      ? { success: true }
      : { success: false, error: 'History record not found.' };
  }

  async getStats(): Promise<TranscriptionStatsResult> {
    return localHistory.computeStats();
  }

  private buildExportPayload(record: TranscriptionRecord): Record<string, unknown> {
    let parsedAppContext: unknown = record.app_context;

    if (record.app_context) {
      try {
        parsedAppContext = JSON.parse(record.app_context);
      } catch {
        parsedAppContext = record.app_context;
      }
    }

    return {
      id: record.id,
      mode: record.mode,
      created_at: record.created_at,
      duration_seconds: record.duration_seconds,
      detected_language: record.detected_language,
      app_name: record.app_name,
      window_title: record.window_title,
      final_text: record.final_text,
      original_text: record.original_text,
      optimized_text: record.optimized_text,
      command_text: record.command_text,
      source_text: record.source_text,
      app_context: parsedAppContext,
      diagnostics: record.diagnostics,
    };
  }

  private renderMarkdownRecord(record: TranscriptionRecord): string {
    let prettyAppContext = 'null';
    if (record.app_context) {
      try {
        prettyAppContext = JSON.stringify(JSON.parse(record.app_context), null, 2);
      } catch {
        prettyAppContext = JSON.stringify(record.app_context, null, 2);
      }
    }

    const sections: string[] = [
      `## ${record.mode === 'ask' ? 'Ask' : 'Dictation'} record`,
      '',
      `- ID: ${record.id}`,
      `- Created: ${record.created_at}`,
      `- Mode: ${record.mode}`,
      `- App: ${record.app_name ?? 'Unknown'}`,
      `- Window: ${record.window_title ?? 'Unknown'}`,
      `- Detected language: ${record.detected_language ?? 'Unknown'}`,
      `- Duration (seconds): ${record.duration_seconds ?? 'Unknown'}`,
      '',
      '### Final text',
      '',
      record.final_text || '_Empty_',
      '',
      '### Raw transcript',
      '',
      record.original_text || '_Empty_',
    ];

    if (record.command_text) {
      sections.push('', '### Command text', '', record.command_text);
    }

    if (record.source_text) {
      sections.push('', '### Source text', '', record.source_text);
    }

    sections.push(
      '',
      '### App context',
      '',
      '```json',
      prettyAppContext,
      '```',
      '',
      '### Diagnostics',
      '',
      '```json',
      JSON.stringify(record.diagnostics, null, 2) ?? 'null',
      '```',
    );

    return sections.join('\n');
  }

  private serializeExport(records: TranscriptionRecord[], filePath: string): string {
    const extension = path.extname(filePath).toLowerCase();
    if (extension === '.md' || extension === '.markdown') {
      return [
        '# VoiceFlow History Export',
        '',
        `Exported at: ${new Date().toISOString()}`,
        `Record count: ${records.length}`,
        '',
        ...records.map((record) => this.renderMarkdownRecord(record)),
      ].join('\n');
    }

    const payload = records.length === 1
      ? this.buildExportPayload(records[0])
      : {
        exported_at: new Date().toISOString(),
        total_records: records.length,
        records: records.map((record) => this.buildExportPayload(record)),
      };

    return JSON.stringify(payload, null, 2);
  }

  async exportOne(id: string, filePath: string): Promise<void> {
    const record = await this.getById(id);
    if (!record) {
      throw new Error('History record not found.');
    }

    await fs.writeFile(filePath, this.serializeExport([record], filePath), 'utf-8');
  }

  async exportAll(filePath: string): Promise<void> {
    const records = this.listAllRecords();
    await fs.writeFile(filePath, this.serializeExport(records, filePath), 'utf-8');
  }
}

export type AppStatus = 'idle' | 'recording' | 'transcribing' | 'done' | 'error';

export type PolishProvider = 'groq';
export type SessionMode = 'dictation' | 'ask';
export type AskPasteBehavior = 'replace-selection' | 'paste-at-cursor';

export interface CursorContext {
  appName: string;
  windowTitle: string;
  selectedText: string;
  elementRole: string;
}

export interface AppSettings {
  hotkey: string;
  holdToTranscribeHotkey: string;
  language: string;
  enablePolish: boolean; // Enable AI polish after transcription
  polishProvider: PolishProvider; // Which provider to use for polish
  audioInputDeviceId: string; // Selected mic device ID; empty string = system default
  groqApiKey: string; // User's Groq API key (legacy field name kept for compatibility)
  defaultMode: SessionMode;
  askPasteBehavior: AskPasteBehavior;
}

// Dictionary types
export interface DictionaryWord {
  id: string;
  word: string;
  created_at: string;
}

// History types
export interface TranscriptionRecord {
  id: string;
  mode: SessionMode;
  original_text: string;
  optimized_text: string | null;
  command_text: string | null;
  source_text: string | null;
  final_text: string | null;
  app_context: string | null;
  language: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface HistoryListResult {
  data: TranscriptionRecord[];
  total: number;
}

export interface HistoryDeleteResult {
  success: boolean;
  error?: string;
}

export interface TranscriptionStatsResult {
  totalWords: number;
  totalCount: number;
  totalDurationSeconds: number;
}

type Disposer = () => void;

export interface ElectronAPI {
  onRecordingStart: (callback: () => void) => Disposer;
  onRecordingStop: (callback: () => void) => Disposer;
  onRecordingCancel: (callback: () => void) => Disposer;
  onStatusUpdate: (callback: (status: AppStatus) => void) => Disposer;
  onSettingsUpdated: (callback: (settings: AppSettings) => void) => Disposer;
  onTranscriptionResult: (callback: (text: string) => void) => Disposer;
  onTranscriptionError: (callback: (error: string) => void) => Disposer;
  cancelRecording: () => void;
  getSettings: () => Promise<AppSettings>;
  setSettings: (settings: Partial<AppSettings>) => void;
  updateHotkey: (
    kind: 'toggle' | 'hold',
    hotkey: string,
  ) => Promise<{ success: boolean; error?: string; settings?: AppSettings }>;
  setShortcutEditing: (isEditing: boolean) => Promise<{ success: boolean; error?: string }>;

  // Realtime streaming transcription
  realtimeStart: () => Promise<{ success: boolean; error?: string }>;
  realtimeSendAudio: (pcm16: ArrayBuffer) => void;
  realtimeStop: () => void;
  onRealtimeStarted: (callback: () => void) => Disposer;
  onRealtimeUtterance: (callback: (text: string) => void) => Disposer;
  onRealtimeError: (callback: (error: string) => void) => Disposer;
  realtimeResize: (width: number, height: number) => void;

  // Dictionary
  dictionaryList: () => Promise<DictionaryWord[]>;
  dictionaryAdd: (word: string) => Promise<DictionaryWord>;
  dictionaryDelete: (id: string) => Promise<{ success: boolean }>;

  // History
  historyList: (page: number, pageSize: number) => Promise<HistoryListResult>;
  historyDelete: (id: string) => Promise<HistoryDeleteResult>;
  historyGetDir: () => Promise<string>;
  historySetDir: (dir: string) => Promise<{ success: boolean; error?: string }>;

  // Stats
  statsGet: () => Promise<TranscriptionStatsResult>;
  onHistoryUpdated: (callback: () => void) => Disposer;

  // Diagnostic logging (renderer -> main, visible in terminal)
  rendererLog: (msg: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

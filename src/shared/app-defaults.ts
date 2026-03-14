import type { AskPasteBehavior, PolishProvider, SessionMode } from './types';

export const APP_DEFAULTS = {
  hotkey: '`',
  holdToTranscribeHotkey: 'Shift+Space',
  language: 'en',
  enablePolish: true,
  polishProvider: 'groq' as PolishProvider,
  audioInputDeviceId: '',
  groqApiKey: '',
  defaultMode: 'dictation' as SessionMode,
  askPasteBehavior: 'replace-selection' as AskPasteBehavior,
} as const;

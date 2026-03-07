import type { PolishProvider } from './types';

export const APP_DEFAULTS = {
  hotkey: '`',
  holdToTranscribeHotkey: 'Shift+Space',
  language: 'en',
  enablePolish: true,
  polishProvider: 'groq' as PolishProvider,
  audioInputDeviceId: '',
  groqApiKey: '',
} as const;

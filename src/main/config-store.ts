import electronStore from 'electron-store';
import { APP_DEFAULTS } from '../shared/app-defaults';
import type { AskPasteBehavior, PolishProvider, SessionMode } from '../shared/types';

interface StoreSchema {
  hotkey: string;
  holdToTranscribeHotkey: string;
  language: string;
  languageDefaultMigrated: boolean;
  enablePolish: boolean;
  polishProvider: PolishProvider;
  audioInputDeviceId: string;
  groqApiKey: string;
  defaultMode: SessionMode;
  askPasteBehavior: AskPasteBehavior;
}

type AppConfig = Omit<StoreSchema, 'languageDefaultMigrated'>;

const StoreConstructor = ('default' in electronStore ? electronStore.default : electronStore) as {
  new <T>(options: { defaults: StoreSchema }): StoreSchemaStore<T>;
};

interface StoreSchemaStore<T> {
  set<K extends keyof T>(key: K, value: T[K]): void;
  get<K extends keyof T>(key: K): T[K];
  clear(): void;
}

const store = new StoreConstructor<StoreSchema>({
  defaults: {
    hotkey: APP_DEFAULTS.hotkey,
    holdToTranscribeHotkey: APP_DEFAULTS.holdToTranscribeHotkey,
    language: APP_DEFAULTS.language,
    languageDefaultMigrated: false,
    enablePolish: APP_DEFAULTS.enablePolish,
    polishProvider: APP_DEFAULTS.polishProvider,
    audioInputDeviceId: APP_DEFAULTS.audioInputDeviceId,
    groqApiKey: APP_DEFAULTS.groqApiKey,
    defaultMode: APP_DEFAULTS.defaultMode,
    askPasteBehavior: APP_DEFAULTS.askPasteBehavior,
  },
});

store.set('polishProvider', APP_DEFAULTS.polishProvider);
if (!store.get('languageDefaultMigrated')) {
  if (!store.get('language')) {
    store.set('language', 'en');
  }
  store.set('languageDefaultMigrated', true);
}

export function getConfig(): AppConfig {
  return {
    hotkey: store.get('hotkey'),
    holdToTranscribeHotkey: store.get('holdToTranscribeHotkey'),
    language: store.get('language'),
    enablePolish: store.get('enablePolish'),
    polishProvider: store.get('polishProvider'),
    audioInputDeviceId: store.get('audioInputDeviceId'),
    groqApiKey: store.get('groqApiKey'),
    defaultMode: store.get('defaultMode'),
    askPasteBehavior: store.get('askPasteBehavior'),
  };
}

export function setConfig(partial: Partial<AppConfig>): void {
  for (const key of Object.keys(partial) as Array<keyof AppConfig>) {
    const value = partial[key];
    if (value !== undefined) {
      store.set(key, value);
    }
  }
}

export default store;

import electronStore from 'electron-store';
import { APP_DEFAULTS } from '../shared/app-defaults';
import type { PolishProvider } from '../shared/types';

interface StoreSchema {
  hotkey: string;
  language: string;
  enablePolish: boolean;
  polishProvider: PolishProvider;
  audioInputDeviceId: string;
  groqApiKey: string;
}

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
    language: APP_DEFAULTS.language,
    enablePolish: APP_DEFAULTS.enablePolish,
    polishProvider: APP_DEFAULTS.polishProvider,
    audioInputDeviceId: APP_DEFAULTS.audioInputDeviceId,
    groqApiKey: APP_DEFAULTS.groqApiKey,
  },
});

store.set('hotkey', APP_DEFAULTS.hotkey);
store.set('polishProvider', APP_DEFAULTS.polishProvider);

export function getConfig(): StoreSchema {
  return {
    hotkey: store.get('hotkey'),
    language: store.get('language'),
    enablePolish: store.get('enablePolish'),
    polishProvider: store.get('polishProvider'),
    audioInputDeviceId: store.get('audioInputDeviceId'),
    groqApiKey: store.get('groqApiKey'),
  };
}

export function setConfig(partial: Partial<StoreSchema>): void {
  for (const [key, value] of Object.entries(partial)) {
    store.set(key as keyof StoreSchema, value as any);
  }
}

export default store;

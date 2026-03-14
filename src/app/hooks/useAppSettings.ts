import { useEffect, useState } from 'react';
import { APP_DEFAULTS } from '../../shared/app-defaults';
import type { AppSettings } from '../../shared/types';

const DEFAULT_SETTINGS: AppSettings = {
  hotkey: APP_DEFAULTS.hotkey,
  holdToTranscribeHotkey: APP_DEFAULTS.holdToTranscribeHotkey,
  language: APP_DEFAULTS.language,
  enablePolish: APP_DEFAULTS.enablePolish,
  polishProvider: APP_DEFAULTS.polishProvider,
  audioInputDeviceId: APP_DEFAULTS.audioInputDeviceId,
  groqApiKey: APP_DEFAULTS.groqApiKey,
  defaultMode: APP_DEFAULTS.defaultMode,
  askPasteBehavior: APP_DEFAULTS.askPasteBehavior,
};

export function useAppSettings(): AppSettings {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let isMounted = true;

    window.electronAPI.getSettings()
      .then((nextSettings) => {
        if (isMounted) {
          setSettings(nextSettings);
        }
      })
      .catch((error) => {
        console.error('[Settings] Failed to load app settings:', error);
      });

    const dispose = window.electronAPI.onSettingsUpdated((nextSettings) => {
      if (isMounted) {
        setSettings(nextSettings);
      }
    });

    return () => {
      isMounted = false;
      dispose();
    };
  }, []);

  return settings;
}

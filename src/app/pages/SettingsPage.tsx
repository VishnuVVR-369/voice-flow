import React, { useEffect, useRef, useState } from 'react';
import HotkeyEditor from '../components/HotkeyEditor';
import { useAppSettings } from '../hooks/useAppSettings';
import type { AskPasteBehavior, SessionMode } from '../../shared/types';

interface AudioDevice {
  deviceId: string;
  label: string;
}

const SettingsPage: React.FC = () => {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [enablePolish, setEnablePolish] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [toggleHotkey, setToggleHotkey] = useState('`');
  const [holdHotkey, setHoldHotkey] = useState('Shift+Space');
  const [transcriptionLanguage, setTranscriptionLanguage] = useState('en');
  const [defaultMode, setDefaultMode] = useState<SessionMode>('dictation');
  const [askPasteBehavior, setAskPasteBehavior] = useState<AskPasteBehavior>('replace-selection');
  const settings = useAppSettings();
  const apiKeyRef = useRef('');
  const committedApiKeyRef = useRef('');

  const refreshDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices
        .filter((d) => d.kind === 'audioinput')
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone (${d.deviceId.slice(0, 8)}...)`,
        }));
      setDevices(audioInputs);
    } catch (err) {
      console.error('[Settings] Failed to enumerate devices:', err);
    }
  };

  useEffect(() => {
    setToggleHotkey(settings.hotkey);
    setHoldHotkey(settings.holdToTranscribeHotkey);
    setSelectedDeviceId(settings.audioInputDeviceId);
    setEnablePolish(settings.enablePolish);
    setTranscriptionLanguage(settings.language === '' ? '' : (settings.language || 'en'));
    setDefaultMode(settings.defaultMode);
    setAskPasteBehavior(settings.askPasteBehavior);
  }, [
    settings.askPasteBehavior,
    settings.audioInputDeviceId,
    settings.defaultMode,
    settings.enablePolish,
    settings.holdToTranscribeHotkey,
    settings.hotkey,
    settings.language,
  ]);

  useEffect(() => {
    const nextApiKey = settings.groqApiKey || '';
    const isDirty = apiKeyRef.current !== committedApiKeyRef.current;
    committedApiKeyRef.current = nextApiKey;

    if (!isDirty || apiKeyRef.current === nextApiKey) {
      apiKeyRef.current = nextApiKey;
      setApiKey(nextApiKey);
    }
  }, [settings.groqApiKey]);

  useEffect(() => {
    apiKeyRef.current = apiKey;
  }, [apiKey]);

  useEffect(() => {
    refreshDevices();
  }, []);

  useEffect(() => {
    navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
    };
  }, []);

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedDeviceId(value);
    window.electronAPI.setSettings({ audioInputDeviceId: value });
  };

  const handlePolishToggle = () => {
    const next = !enablePolish;
    setEnablePolish(next);
    window.electronAPI.setSettings({ enablePolish: next });
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setTranscriptionLanguage(value);
    window.electronAPI.setSettings({ language: value });
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setApiKey(value);
  };

  const commitApiKey = () => {
    const nextApiKey = apiKeyRef.current;
    if (nextApiKey === committedApiKeyRef.current) {
      return;
    }

    committedApiKeyRef.current = nextApiKey;
    window.electronAPI.setSettings({ groqApiKey: nextApiKey });
  };

  useEffect(() => {
    return () => {
      commitApiKey();
    };
  }, []);

  const handleDefaultModeChange = (mode: SessionMode) => {
    setDefaultMode(mode);
    window.electronAPI.setSettings({ defaultMode: mode });
  };

  const handleAskPasteBehaviorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as AskPasteBehavior;
    setAskPasteBehavior(value);
    window.electronAPI.setSettings({ askPasteBehavior: value });
  };

  const handleToggleHotkeyChange = async (value: string) => {
    const result = await window.electronAPI.updateHotkey('toggle', value);
    if (result.success && result.settings) {
      setToggleHotkey(result.settings.hotkey);
      setHoldHotkey(result.settings.holdToTranscribeHotkey);
    }
    return result;
  };

  const handleHoldHotkeyChange = async (value: string) => {
    const result = await window.electronAPI.updateHotkey('hold', value);
    if (result.success && result.settings) {
      setToggleHotkey(result.settings.hotkey);
      setHoldHotkey(result.settings.holdToTranscribeHotkey);
    }
    return result;
  };

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Settings</p>
          <h1 className="page-title">Control room</h1>
        </div>
      </header>

      <section className="settings-block">
        <div className="settings-row">
          <div>
            <h2 className="settings-title">Groq API Key</h2>
            <p className="settings-copy">
              Required for realtime transcription and polish. Stored locally on this machine.
            </p>
          </div>
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            className="eye-btn"
            title={showApiKey ? 'Hide key' : 'Show key'}
          >
            {showApiKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <input
          type={showApiKey ? 'text' : 'password'}
          value={apiKey}
          onChange={handleApiKeyChange}
          onBlur={commitApiKey}
          placeholder="gsk_..."
          className="settings-input"
        />
      </section>

      <section className="settings-block">
        <HotkeyEditor
          value={toggleHotkey}
          onChange={handleToggleHotkeyChange}
          title="Shortcut 1: Toggle Record / Transcribe"
          description="Press and release once to start recording. Press the same shortcut again to stop and transcribe."
        />
      </section>

      <section className="settings-block">
        <HotkeyEditor
          value={holdHotkey}
          onChange={handleHoldHotkeyChange}
          title="Shortcut 2: Hold to Record"
          description="Press and hold to record immediately. Releasing the shortcut stops recording and starts transcription."
        />
      </section>

      <section className="settings-block">
        <div className="settings-head">
          <h2 className="settings-title">Microphone Source</h2>
          <p className="settings-copy">Select which input device should be used by default.</p>
        </div>
        <select value={selectedDeviceId} onChange={handleDeviceChange} className="settings-select">
          <option value="">System Default</option>
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label}
            </option>
          ))}
        </select>
      </section>

      <section className="settings-block">
        <div className="settings-head">
          <h2 className="settings-title">Transcription Language</h2>
          <p className="settings-copy">English is more accurate for technical dictation. Use Auto Detect for mixed languages.</p>
        </div>
        <select value={transcriptionLanguage} onChange={handleLanguageChange} className="settings-select">
          <option value="en">English (Recommended)</option>
          <option value="">Auto Detect</option>
        </select>
      </section>

      <section className="settings-block">
        <div className="settings-head">
          <h2 className="settings-title">Session Mode</h2>
          <p className="settings-copy">
            Dictation pastes your spoken words. Ask mode rewrites selected text using your spoken instruction.
          </p>
        </div>
        <div className="segmented">
          <button
            onClick={() => handleDefaultModeChange('dictation')}
            className={`segmented-btn ${defaultMode === 'dictation' ? 'segmented-btn-active' : ''}`}
          >
            Dictation
          </button>
          <button
            onClick={() => handleDefaultModeChange('ask')}
            className={`segmented-btn ${defaultMode === 'ask' ? 'segmented-btn-active' : ''}`}
          >
            Ask
          </button>
        </div>
      </section>

      <section className="settings-block">
        <div className="settings-head">
          <h2 className="settings-title">Ask Paste Behavior</h2>
          <p className="settings-copy">
            Choose whether Ask mode replaces the current selection or collapses the selection and pastes at the cursor.
          </p>
        </div>
        <select value={askPasteBehavior} onChange={handleAskPasteBehaviorChange} className="settings-select">
          <option value="replace-selection">Replace selection</option>
          <option value="paste-at-cursor">Paste at cursor</option>
        </select>
      </section>

      <section className="settings-block">
        <div className="settings-head">
          <h2 className="settings-title">Output Mode</h2>
          <p className="settings-copy">
            {enablePolish
              ? 'Polish mode fixes punctuation and grammar before paste.'
              : 'Fast mode pastes raw transcript immediately with lower latency.'}
          </p>
        </div>
        <button onClick={handlePolishToggle} className={`toggle-btn ${enablePolish ? 'toggle-btn-on' : ''}`}>
          <span className={`toggle-knob ${enablePolish ? 'toggle-knob-on' : ''}`} />
        </button>
      </section>
    </div>
  );
};

export default SettingsPage;

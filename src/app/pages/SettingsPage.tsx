import React, { useEffect, useRef, useState } from 'react';
import HotkeyEditor from '../components/HotkeyEditor';
import { useAppSettings } from '../hooks/useAppSettings';
import type { AskPasteBehavior, ReadinessSnapshot, SessionMode } from '../../shared/types';

interface AudioDevice {
  deviceId: string;
  label: string;
}

type CheckState = 'idle' | 'checking' | 'ready' | 'failed';

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
  const [readiness, setReadiness] = useState<ReadinessSnapshot | null>(null);
  const [apiKeyCheck, setApiKeyCheck] = useState<CheckState>('idle');
  const [micCheck, setMicCheck] = useState<CheckState>('idle');
  const [pasteCheck, setPasteCheck] = useState<CheckState>('idle');
  const [readinessMessage, setReadinessMessage] = useState<string | null>(null);
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

  const refreshReadiness = async () => {
    try {
      const snapshot = await window.electronAPI.readinessGet();
      setReadiness(snapshot);
    } catch (err) {
      console.error('[Settings] Failed to load readiness:', err);
      setReadinessMessage('Could not load readiness checks.');
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
    refreshReadiness();
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

  const handleValidateApiKey = async () => {
    commitApiKey();
    setApiKeyCheck('checking');
    setReadinessMessage(null);
    const result = await window.electronAPI.readinessValidateApiKey();
    setApiKeyCheck(result.success ? 'ready' : 'failed');
    setReadinessMessage(result.success ? 'Groq API key validated.' : result.error || 'API key validation failed.');
    await refreshReadiness();
  };

  const handleRequestAccessibility = async () => {
    const snapshot = await window.electronAPI.readinessRequestAccessibility();
    setReadiness(snapshot);
    setReadinessMessage(snapshot.accessibilityTrusted
      ? 'Accessibility access is enabled.'
      : 'Enable VoiceFlow in macOS Accessibility, then run the check again.');
  };

  const handleTestMicrophone = async () => {
    setMicCheck('checking');
    setReadinessMessage(null);
    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach((track) => track.stop());
      setMicCheck('ready');
      setReadinessMessage('Microphone capture is ready.');
      await refreshDevices();
    } catch (err) {
      console.error('[Settings] Microphone test failed:', err);
      setMicCheck('failed');
      setReadinessMessage('Microphone test failed. Check macOS microphone permission and device selection.');
    }
  };

  const handleTestPaste = async () => {
    setPasteCheck('checking');
    setReadinessMessage(null);
    try {
      const result = await window.electronAPI.readinessTestClipboard();
      if (result.success) {
        setPasteCheck('ready');
        setReadinessMessage('Clipboard access is available. Run a real dictation to test app paste automation.');
      } else {
        setPasteCheck('failed');
        setReadinessMessage(result.error || 'Clipboard check failed.');
      }
    } catch {
      setPasteCheck('failed');
      setReadinessMessage('Clipboard check failed.');
    }
  };

  const handleShortcutInfo = () => {
    setReadinessMessage('Edit shortcuts below if either one conflicts with another macOS shortcut.');
  };

  const readinessItems = [
    {
      label: 'Groq API',
      state: apiKeyCheck === 'ready' || readiness?.apiKeyConfigured ? 'ready' : apiKeyCheck,
      detail: readiness?.apiKeyConfigured ? 'Key saved locally' : 'Add a key to unlock transcription',
      action: 'Validate',
      onClick: handleValidateApiKey,
    },
    {
      label: 'Microphone',
      state: micCheck,
      detail: devices.length > 0 ? `${devices.length} input${devices.length === 1 ? '' : 's'} detected` : 'Run a capture test',
      action: 'Test mic',
      onClick: handleTestMicrophone,
    },
    {
      label: 'Shortcuts',
      state: readiness?.hotkey && readiness?.holdToTranscribeHotkey && readiness.hotkey !== readiness.holdToTranscribeHotkey ? 'ready' : 'failed',
      detail: readiness ? `${readiness.hotkey} / ${readiness.holdToTranscribeHotkey}` : 'Loading shortcut state',
      action: 'Review',
      onClick: handleShortcutInfo,
    },
    {
      label: 'Accessibility',
      state: readiness?.accessibilityTrusted ? 'ready' : 'failed',
      detail: readiness?.accessibilityTrusted ? 'Shortcuts and paste can control macOS' : 'Required for global shortcuts and paste',
      action: readiness?.accessibilityTrusted ? 'Recheck' : 'Open',
      onClick: handleRequestAccessibility,
    },
    {
      label: 'Paste recovery',
      state: pasteCheck,
      detail: readiness?.accessibilityTrusted ? 'Recovery actions are available' : 'Clipboard recovery works even before paste access',
      action: 'Check',
      onClick: handleTestPaste,
    },
  ] as const;

  const readyCount = readinessItems.filter((item) => item.state === 'ready').length;

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Settings</p>
          <h1 className="page-title">Control room</h1>
        </div>
      </header>

      <section className="settings-block readiness-panel">
        <div className="settings-row">
          <div>
            <h2 className="settings-title">First Run Readiness</h2>
            <p className="settings-copy">
              Verify the pieces VoiceFlow needs before relying on background dictation.
            </p>
          </div>
          <div className="readiness-score">{readyCount}/{readinessItems.length} ready</div>
        </div>

        <div className="readiness-grid">
          {readinessItems.map((item) => (
            <div key={item.label} className={`readiness-card readiness-card--${item.state}`}>
              <div className="readiness-card-head">
                <span className="readiness-dot" />
                <span className="readiness-label">{item.label}</span>
              </div>
              <p className="readiness-detail">{item.detail}</p>
              <button
                type="button"
                className="action-btn action-btn-soft readiness-action"
                onClick={() => void item.onClick()}
                disabled={item.state === 'checking'}
              >
                {item.state === 'checking' ? 'Checking...' : item.action}
              </button>
            </div>
          ))}
        </div>

        {readinessMessage && <div className="history-status-banner">{readinessMessage}</div>}
      </section>

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

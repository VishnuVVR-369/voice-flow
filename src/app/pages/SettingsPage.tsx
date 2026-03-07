import React, { useEffect, useState } from 'react';

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
    window.electronAPI.getSettings().then((settings) => {
      setSelectedDeviceId(settings.audioInputDeviceId);
      setEnablePolish(settings.enablePolish);
      setApiKey(settings.groqApiKey || '');
    });
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

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setApiKey(value);
    window.electronAPI.setSettings({ groqApiKey: value });
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
          placeholder="gsk_..."
          className="settings-input"
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

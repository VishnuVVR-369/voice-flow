import React, { useEffect, useState } from 'react';
import NavItem from './NavItem';
import { formatHotkeyForDisplay } from '../../shared/hotkeys';

const platform = navigator.userAgent.includes('Mac') ? 'darwin' : 'default';

const Sidebar: React.FC = () => {
  const [toggleHotkey, setToggleHotkey] = useState('`');
  const [holdHotkey, setHoldHotkey] = useState('Shift+Space');

  useEffect(() => {
    const api = window.electronAPI;

    api.getSettings().then((settings) => {
      setToggleHotkey(settings.hotkey);
      setHoldHotkey(settings.holdToTranscribeHotkey);
    });

    if (typeof api.onSettingsUpdated !== 'function') {
      return undefined;
    }

    return api.onSettingsUpdated((settings) => {
      setToggleHotkey(settings.hotkey);
      setHoldHotkey(settings.holdToTranscribeHotkey);
    });
  }, []);

  return (
    <aside className="sidebar-shell">
      <div className="brand-chip">
        <div className="brand-mark" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className="brand-copy">
          <span className="brand-title">VoiceFlow</span>
          <span className="brand-subtitle">Narrative Console</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavItem
          to="/dashboard"
          label="Dashboard"
          hint="Overview and shortcuts"
          icon={<span aria-hidden>◈</span>}
        />
        <NavItem
          to="/history"
          label="History"
          hint="All transcripts"
          icon={<span aria-hidden>◌</span>}
        />
        <NavItem
          to="/dictionary"
          label="Dictionary"
          hint="Custom vocabulary"
          icon={<span aria-hidden>◎</span>}
        />
        <NavItem
          to="/settings"
          label="Settings"
          hint="Device and output"
          icon={<span aria-hidden>◍</span>}
        />
      </nav>

      <div className="sidebar-fill" />

      <div className="shortcut-card">
        <p className="shortcut-label">App Shortcut</p>
        <p className="shortcut-copy">Two modes: toggle recording or hold-to-record.</p>

        <div className="shortcut-stack">
          <p className="shortcut-mode-label">Toggle</p>
          <div className="shortcut-keyset">
            {formatHotkeyForDisplay(toggleHotkey, platform).map((token, index) => (
              <span key={`toggle-${token}-${index}`} className="shortcut-key">{token}</span>
            ))}
          </div>
        </div>

        <div className="shortcut-stack">
          <p className="shortcut-mode-label">Hold</p>
          <div className="shortcut-keyset">
            {formatHotkeyForDisplay(holdHotkey, platform).map((token, index) => (
              <span key={`hold-${token}-${index}`} className="shortcut-key">{token}</span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

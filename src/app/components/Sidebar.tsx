import React from 'react';
import NavItem from './NavItem';

const Sidebar: React.FC = () => {
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
        <p className="shortcut-label">Global Shortcut</p>
        <p className="shortcut-copy">Start and stop recording instantly from any app.</p>
        <div className="shortcut-key">`</div>
      </div>
    </aside>
  );
};

export default Sidebar;

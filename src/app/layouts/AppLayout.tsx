import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const AppLayout: React.FC = () => {
  return (
    <div className="app-shell">
      <div className="ambient-layers" aria-hidden>
        <span className="ambient-wave ambient-wave-a" />
        <span className="ambient-wave ambient-wave-b" />
        <span className="ambient-grid" />
      </div>

      <header
        className="window-chrome"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="window-chrome-inner">
          <div className="window-branding">
            <span className="chrome-pill">VoiceFlow Studio</span>
            <span className="chrome-subtitle">Voice capture for deliberate writing</span>
          </div>
          <div className="window-status">Realtime Engine Active</div>
        </div>
      </header>

      <div className="workspace-shell">
        <Sidebar />
        <main className="main-stage">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

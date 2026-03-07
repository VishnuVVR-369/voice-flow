import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';

function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${Math.round(totalSeconds)} sec`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours} hr ${minutes} min`;
  return `${minutes} min`;
}

function formatWordCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({ totalWords: 0, totalCount: 0, totalDurationSeconds: 0 });
  const [toggleHotkey, setToggleHotkey] = useState('`');
  const [holdHotkey, setHoldHotkey] = useState('Shift+Space');

  useEffect(() => {
    const fetchStats = () => {
      window.electronAPI.statsGet().then((s) => {
        setStats(s);
      }).catch(console.error);
    };
    fetchStats();
    const dispose = window.electronAPI.onHistoryUpdated(fetchStats);
    return dispose;
  }, []);

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
    <div className="page-stack">
      <section className="hero-card rise-in">
        <div className="hero-layout">
          <div>
            <p className="hero-eyebrow">Workspace Overview</p>
            <h1 className="hero-title">Speak naturally, publish cleaner words.</h1>
            <p className="hero-copy">
              VoiceFlow captures live speech, polishes phrasing, and returns ready-to-paste text.
              Keep custom vocabulary close, review prior entries, and move from idea to output faster.
            </p>
            <div className="hero-badges">
              <div className="badge-row">
                <span className="badge-soft">Toggle</span>
                <span className="badge-key">{toggleHotkey}</span>
                <span className="badge-note">press once to start, again to transcribe</span>
              </div>
              <div className="badge-row">
                <span className="badge-soft">Hold</span>
                <span className="badge-key">{holdHotkey}</span>
                <span className="badge-note">press and hold, release to transcribe</span>
              </div>
            </div>
          </div>

          <div className="hero-side-card">
            <p className="hero-side-label">Live snapshot</p>
            <div className="hero-side-value">{stats.totalCount}</div>
            <p className="hero-side-copy">total sessions captured</p>
          </div>
        </div>
      </section>

      <section className="kpi-grid rise-in">
        <StatCard icon="◈" value={String(stats.totalCount)} label="Dictation sessions" accentColor="var(--accent-cyan)" />
        <StatCard icon="◐" value={formatDuration(stats.totalDurationSeconds)} label="Total dictation time" accentColor="var(--accent-amber)" />
        <StatCard icon="◍" value={formatWordCount(stats.totalWords)} label="Words captured" accentColor="var(--accent-rose)" />
      </section>

      <section className="quick-grid rise-in">
        <Link to="/history" className="quick-card">
          <span className="quick-eyebrow">History</span>
          <span className="quick-title">Revisit every session</span>
          <span className="quick-copy">Search your transcript timeline and inspect wording over time.</span>
        </Link>
        <Link to="/dictionary" className="quick-card">
          <span className="quick-eyebrow">Dictionary</span>
          <span className="quick-title">Train terminology</span>
          <span className="quick-copy">Add product names, acronyms, and team language for higher accuracy.</span>
        </Link>
        <Link to="/settings" className="quick-card">
          <span className="quick-eyebrow">Settings</span>
          <span className="quick-title">Tune capture flow</span>
          <span className="quick-copy">Pick microphones, set your API key, and switch polish behavior.</span>
        </Link>
      </section>
    </div>
  );
};

export default DashboardPage;

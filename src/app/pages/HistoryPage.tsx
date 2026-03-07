import React, { useState, useEffect, useCallback } from 'react';

interface HistoryEntry {
  id: string;
  time: string;
  text: string;
  type: 'dictation' | 'ask';
}

interface HistoryGroup {
  label: string;
  entries: HistoryEntry[];
}

const HistoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'dictations' | 'ask'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [groups, setGroups] = useState<HistoryGroup[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const result = await window.electronAPI.historyList(0, 100);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const todayEntries: HistoryEntry[] = [];
      const yesterdayEntries: HistoryEntry[] = [];
      const earlierEntries: HistoryEntry[] = [];

      for (const record of result.data) {
        const date = new Date(record.created_at);
        const entry: HistoryEntry = {
          id: record.id,
          time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: record.optimized_text || record.original_text,
          type: 'dictation',
        };

        if (date.toDateString() === today.toDateString()) {
          todayEntries.push(entry);
        } else if (date.toDateString() === yesterday.toDateString()) {
          yesterdayEntries.push(entry);
        } else {
          earlierEntries.push(entry);
        }
      }

      const grouped: HistoryGroup[] = [];
      if (todayEntries.length > 0) grouped.push({ label: 'Today', entries: todayEntries });
      if (yesterdayEntries.length > 0) grouped.push({ label: 'Yesterday', entries: yesterdayEntries });
      if (earlierEntries.length > 0) grouped.push({ label: 'Earlier', entries: earlierEntries });

      setGroups(grouped);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    const dispose = window.electronAPI.onHistoryUpdated(loadHistory);
    return dispose;
  }, [loadHistory]);

  const filteredGroups = groups
    .map((group) => ({
      ...group,
      entries: group.entries.filter((entry) => {
        if (activeTab === 'all') return true;
        if (activeTab === 'dictations') return entry.type === 'dictation';
        return entry.type === 'ask';
      }),
    }))
    .filter((group) => group.entries.length > 0);

  const totalEntries = groups.reduce((sum, group) => sum + group.entries.length, 0);

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">History</p>
          <h1 className="page-title">Transcript archive</h1>
        </div>
        <div className="page-meta">{totalEntries} entries</div>
      </header>

      <section className="filter-shell">
        <div className="segmented">
          <button
            onClick={() => setActiveTab('all')}
            className={`segmented-btn ${activeTab === 'all' ? 'segmented-btn-active' : ''}`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('dictations')}
            className={`segmented-btn ${activeTab === 'dictations' ? 'segmented-btn-active' : ''}`}
          >
            Dictations
          </button>
          <button
            onClick={() => setActiveTab('ask')}
            className={`segmented-btn ${activeTab === 'ask' ? 'segmented-btn-active' : ''}`}
          >
            Ask Anything
          </button>
        </div>
      </section>

      <section className="history-list">
        {isLoading ? (
          <span className="empty-state">Loading your transcript archive...</span>
        ) : filteredGroups.length === 0 ? (
          <span className="empty-state">No entries yet. Start recording to create your first transcript.</span>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.label} className="history-group">
              <span className="history-group-label">{group.label}</span>
              <div className="history-group-items">
                {group.entries.map((entry) => (
                  <article key={entry.id} className="history-entry">
                    <div className="history-entry-time">{entry.time}</div>
                    <p className="history-entry-text">{entry.text}</p>
                  </article>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default HistoryPage;

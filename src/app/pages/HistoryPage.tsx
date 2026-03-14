import React, { useState, useEffect, useCallback } from 'react';
import type { SessionMode, TranscriptionRecord } from '../../shared/types';

interface HistoryEntry {
  id: string;
  time: string;
  mode: SessionMode;
  outputText: string;
  rawText: string;
  commandText: string | null;
  sourceText: string | null;
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
        const entry = mapRecordToEntry(record, date);

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
        if (activeTab === 'dictations') return entry.mode === 'dictation';
        return entry.mode === 'ask';
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
                    <div className="history-entry-head">
                      <div className="history-entry-time">{entry.time}</div>
                      <span className={`history-mode-pill history-mode-pill--${entry.mode}`}>
                        {entry.mode === 'ask' ? 'Ask' : 'Dictation'}
                      </span>
                    </div>
                    <p className="history-entry-text">{entry.outputText}</p>
                    {entry.mode === 'ask' ? (
                      <div className="history-detail-grid">
                        <div className="history-detail-card">
                          <div className="history-detail-label">Instruction</div>
                          <p className="history-detail-value">{entry.commandText || 'Unavailable'}</p>
                        </div>
                        <div className="history-detail-card">
                          <div className="history-detail-label">Selected text</div>
                          <p className="history-detail-value">{entry.sourceText || 'Unavailable'}</p>
                        </div>
                      </div>
                    ) : entry.rawText !== entry.outputText ? (
                      <div className="history-detail-card history-detail-card-compact">
                        <div className="history-detail-label">Original transcript</div>
                        <p className="history-detail-value">{entry.rawText}</p>
                      </div>
                    ) : null}
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

function mapRecordToEntry(record: TranscriptionRecord, date: Date): HistoryEntry {
  return {
    id: record.id,
    time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    mode: record.mode,
    outputText: record.final_text || record.optimized_text || record.original_text,
    rawText: record.original_text,
    commandText: record.command_text,
    sourceText: record.source_text,
  };
}

export default HistoryPage;

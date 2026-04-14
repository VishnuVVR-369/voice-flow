import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { HistoryListRequest, TranscriptionRecord } from '../../shared/types';

type HistoryTab = 'all' | 'dictation' | 'ask';

interface HistoryGroup {
  label: string;
  entries: TranscriptionRecord[];
}

const PAGE_SIZE = 50;

const HistoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HistoryTab>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [records, setRecords] = useState<TranscriptionRecord[]>([]);
  const [matchingTotal, setMatchingTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailRecord, setDetailRecord] = useState<TranscriptionRecord | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const loadHistory = useCallback(async (page = 0, append = false) => {
    const request: HistoryListRequest = {
      page,
      pageSize: PAGE_SIZE,
      searchQuery: deferredSearchQuery.trim() || undefined,
      mode: activeTab,
    };

    try {
      const result = await window.electronAPI.historyList(request);
      setMatchingTotal(result.total);
      setRecords((prev) => append ? [...prev, ...result.data] : result.data);
    } catch (err) {
      console.error('Failed to load history:', err);
      setStatusMessage('Failed to load history.');
    } finally {
      if (append) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [activeTab, deferredSearchQuery]);

  useEffect(() => {
    setIsLoading(true);
    void loadHistory(0, false);
    const dispose = window.electronAPI.onHistoryUpdated(() => {
      setIsLoading(true);
      void loadHistory(0, false);
    });
    return dispose;
  }, [loadHistory]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-history-menu-root="true"]')) {
        setActiveMenuId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveMenuId(null);
        setDetailRecord(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setStatusMessage(null);
    }, 2600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [statusMessage]);

  const groupedRecords = useMemo(() => groupRecords(records), [records]);
  const hasMoreRecords = records.length < matchingTotal;

  const runRecordAction = async (actionKey: string, callback: () => Promise<void>) => {
    setBusyAction(actionKey);
    try {
      await callback();
    } catch (err) {
      console.error('[History] Action failed:', err);
      setStatusMessage(err instanceof Error ? err.message : 'History action failed.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleCopy = async (record: TranscriptionRecord) => {
    setActiveMenuId(null);
    await runRecordAction(`copy:${record.id}`, async () => {
      await copyText(record.final_text);
      setStatusMessage('Copied final text to the clipboard.');
    });
  };

  const handlePasteAgain = async (record: TranscriptionRecord) => {
    setActiveMenuId(null);
    await runRecordAction(`reinject:${record.id}`, async () => {
      const result = await window.electronAPI.historyReinject(record.id);
      if (!result.success) {
        throw new Error(result.error || 'Paste again failed.');
      }
      setStatusMessage('Pasted the saved result back into the active app.');
    });
  };

  const handleDelete = async (record: TranscriptionRecord) => {
    setActiveMenuId(null);

    if (!window.confirm('Delete this history record? This cannot be undone.')) {
      return;
    }

    await runRecordAction(`delete:${record.id}`, async () => {
      const result = await window.electronAPI.historyDelete(record.id);
      if (!result.success) {
        throw new Error(result.error || 'Delete failed.');
      }

      if (detailRecord?.id === record.id) {
        setDetailRecord(null);
      }

      setIsLoading(true);
      await loadHistory(0, false);
      setStatusMessage('History record deleted.');
    });
  };

  const handleExportOne = async (record: TranscriptionRecord) => {
    setActiveMenuId(null);
    await runRecordAction(`export:${record.id}`, async () => {
      const result = await window.electronAPI.historyExportOne(record.id);
      if (result.canceled) {
        return;
      }
      if (!result.success) {
        throw new Error(result.error || 'Export failed.');
      }
      setStatusMessage(`Exported record to ${result.filePath}.`);
    });
  };

  const handleExportAll = async () => {
    await runRecordAction('export-all', async () => {
      const result = await window.electronAPI.historyExportAll();
      if (result.canceled) {
        return;
      }
      if (!result.success) {
        throw new Error(result.error || 'Export failed.');
      }
      setStatusMessage(`Exported all history to ${result.filePath}.`);
    });
  };

  const handleViewDetails = async (record: TranscriptionRecord) => {
    setActiveMenuId(null);
    setDetailRecord(record);
    setIsDetailLoading(true);

    try {
      const freshRecord = await window.electronAPI.historyGet(record.id);
      if (!freshRecord) {
        setDetailRecord(null);
        setStatusMessage('That history record no longer exists.');
        return;
      }
      setDetailRecord(freshRecord);
    } catch (err) {
      console.error('[History] Failed to load details:', err);
      setStatusMessage('Failed to load history details.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMoreRecords) {
      return;
    }

    setIsLoadingMore(true);
    await loadHistory(Math.floor(records.length / PAGE_SIZE), true);
  };

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">History</p>
          <h1 className="page-title">Working archive</h1>
        </div>
        <div className="history-header-actions">
          <div className="page-meta">
            {records.length} of {matchingTotal} loaded
          </div>
          <button
            type="button"
            onClick={handleExportAll}
            className="action-btn"
            disabled={busyAction === 'export-all'}
          >
            Export all
          </button>
        </div>
      </header>

      <section className="filter-shell history-filter-shell">
        <div className="history-filter-layout">
          <div className="segmented">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`segmented-btn ${activeTab === 'all' ? 'segmented-btn-active' : ''}`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dictation')}
              className={`segmented-btn ${activeTab === 'dictation' ? 'segmented-btn-active' : ''}`}
            >
              Dictation
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ask')}
              className={`segmented-btn ${activeTab === 'ask' ? 'segmented-btn-active' : ''}`}
            >
              Ask
            </button>
          </div>

          <label className="history-search-shell">
            <span className="history-search-label">Search archive</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Transcript text, app name, or window title"
              className="history-search-input"
            />
          </label>
        </div>

        {statusMessage && <div className="history-status-banner">{statusMessage}</div>}
      </section>

      <section className="history-list">
        {isLoading ? (
          <span className="empty-state">Loading your transcript archive...</span>
        ) : groupedRecords.length === 0 ? (
          <span className="empty-state">
            {matchingTotal === 0
              ? 'No entries yet. Start recording to create your first transcript.'
              : 'No records match the current filters.'}
          </span>
        ) : (
          groupedRecords.map((group) => (
            <div key={group.label} className="history-group">
              <span className="history-group-label">{group.label}</span>
              <div className="history-group-items">
                {group.entries.map((record) => {
                  const createdAt = new Date(record.created_at);
                  const previewMeta = [record.app_name, record.window_title].filter(Boolean).join('  /  ');

                  return (
                    <article key={record.id} className="history-entry history-entry-card">
                      <div className="history-entry-head">
                        <div className="history-entry-meta">
                          <div className="history-entry-time">
                            {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <span className={`history-mode-pill history-mode-pill--${record.mode}`}>
                            {record.mode === 'ask' ? 'Ask' : 'Dictation'}
                          </span>
                          {record.detected_language && (
                            <span className="history-context-pill">{record.detected_language}</span>
                          )}
                        </div>

                        <div className="history-entry-actions" data-history-menu-root="true">
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(activeMenuId === record.id ? null : record.id)}
                            className="history-menu-trigger"
                          >
                            Actions
                          </button>

                          {activeMenuId === record.id && (
                            <div className="history-action-menu">
                              <button type="button" onClick={() => void handleCopy(record)} className="history-action-item">
                                Copy
                              </button>
                              <button type="button" onClick={() => void handlePasteAgain(record)} className="history-action-item">
                                Paste Again
                              </button>
                              <button type="button" onClick={() => void handleViewDetails(record)} className="history-action-item">
                                View Details
                              </button>
                              <button type="button" onClick={() => void handleDelete(record)} className="history-action-item history-action-item-danger">
                                Delete
                              </button>
                              <button type="button" onClick={() => void handleExportOne(record)} className="history-action-item">
                                Export
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="history-entry-text history-entry-text-preview">{record.final_text}</p>

                      <div className="history-entry-foot">
                        <div className="history-context-strip">
                          <span className="history-context-item">{previewMeta || 'No app context captured'}</span>
                          {record.duration_seconds !== null && (
                            <span className="history-context-item">{formatDuration(record.duration_seconds)}</span>
                          )}
                        </div>
                        {record.original_text !== record.final_text && (
                          <span className="history-transform-note">Polished output available</span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {!isLoading && hasMoreRecords && (
          <button
            type="button"
            onClick={() => void handleLoadMore()}
            className="action-btn"
            disabled={isLoadingMore}
          >
            {isLoadingMore ? 'Loading...' : 'Load more'}
          </button>
        )}
      </section>

      {(detailRecord || isDetailLoading) && (
        <div
          className="history-drawer-backdrop"
          onClick={() => setDetailRecord(null)}
          role="presentation"
        >
          <aside
            className="history-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="history-drawer-head">
              <div>
                <p className="page-eyebrow">Record details</p>
                <h2 className="history-drawer-title">
                  {detailRecord?.app_name || 'Transcript detail'}
                </h2>
                <p className="history-drawer-subtitle">
                  {detailRecord ? formatTimestamp(detailRecord.created_at) : 'Loading...'}
                </p>
              </div>

              <div className="history-drawer-actions">
                {detailRecord && (
                  <>
                    <button type="button" onClick={() => void handleCopy(detailRecord)} className="action-btn">
                      Copy
                    </button>
                    <button type="button" onClick={() => void handlePasteAgain(detailRecord)} className="action-btn">
                      Paste Again
                    </button>
                    <button type="button" onClick={() => void handleExportOne(detailRecord)} className="action-btn">
                      Export
                    </button>
                  </>
                )}
                <button type="button" onClick={() => setDetailRecord(null)} className="action-btn action-btn-soft">
                  Close
                </button>
              </div>
            </div>

            {detailRecord && (
              <>
                <div className="history-detail-grid history-detail-grid-wide">
                  <div className="history-detail-card">
                    <div className="history-detail-label">Mode</div>
                    <p className="history-detail-value">{detailRecord.mode}</p>
                  </div>
                  <div className="history-detail-card">
                    <div className="history-detail-label">Detected language</div>
                    <p className="history-detail-value">{detailRecord.detected_language || 'Unknown'}</p>
                  </div>
                  <div className="history-detail-card">
                    <div className="history-detail-label">App</div>
                    <p className="history-detail-value">{detailRecord.app_name || 'Unavailable'}</p>
                  </div>
                  <div className="history-detail-card">
                    <div className="history-detail-label">Window</div>
                    <p className="history-detail-value">{detailRecord.window_title || 'Unavailable'}</p>
                  </div>
                  <div className="history-detail-card">
                    <div className="history-detail-label">Created</div>
                    <p className="history-detail-value">{formatTimestamp(detailRecord.created_at)}</p>
                  </div>
                  <div className="history-detail-card">
                    <div className="history-detail-label">Duration</div>
                    <p className="history-detail-value">{formatDuration(detailRecord.duration_seconds)}</p>
                  </div>
                </div>

                {isDetailLoading && (
                  <div className="history-status-banner history-status-banner-inline">
                    Refreshing saved metadata...
                  </div>
                )}

                <section className="history-panel">
                  <div className="history-panel-label">Final text</div>
                  <pre className="history-code-block">{detailRecord.final_text}</pre>
                </section>

                <section className="history-panel">
                  <div className="history-panel-label">Raw transcript</div>
                  <pre className="history-code-block">{detailRecord.original_text}</pre>
                </section>

                {detailRecord.command_text && (
                  <section className="history-panel">
                    <div className="history-panel-label">Command text</div>
                    <pre className="history-code-block">{detailRecord.command_text}</pre>
                  </section>
                )}

                {detailRecord.source_text && (
                  <section className="history-panel">
                    <div className="history-panel-label">Source text</div>
                    <pre className="history-code-block">{detailRecord.source_text}</pre>
                  </section>
                )}

                <section className="history-panel">
                  <div className="history-panel-label">App context JSON</div>
                  <pre className="history-code-block">{formatJsonBlock(detailRecord.app_context)}</pre>
                </section>

                <section className="history-panel">
                  <div className="history-panel-label">Diagnostics</div>
                  <pre className="history-code-block">{formatJsonBlock(detailRecord.diagnostics)}</pre>
                </section>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};

function groupRecords(records: TranscriptionRecord[]): HistoryGroup[] {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups = new Map<string, TranscriptionRecord[]>();

  for (const record of records) {
    const date = new Date(record.created_at);
    const label = getGroupLabel(date, today, yesterday);
    const bucket = groups.get(label);

    if (bucket) {
      bucket.push(record);
    } else {
      groups.set(label, [record]);
    }
  }

  return Array.from(groups.entries()).map(([label, entries]) => ({ label, entries }));
}

function getGroupLabel(date: Date, today: Date, yesterday: Date): string {
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatDuration(value: number | null): string {
  if (value === null) {
    return 'Unavailable';
  }

  if (value < 60) {
    return `${value.toFixed(1)} sec`;
  }

  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60);
  return `${minutes} min ${seconds} sec`;
}

function formatJsonBlock(value: unknown): string {
  if (!value) {
    return 'No data captured.';
  }

  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  return JSON.stringify(value, null, 2);
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export default HistoryPage;

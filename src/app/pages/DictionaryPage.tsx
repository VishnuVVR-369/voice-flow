import React, { useState, useEffect, useRef } from 'react';
import type { DictionaryWord } from '../../shared/types';

const DictionaryPage: React.FC = () => {
  const [words, setWords] = useState<DictionaryWord[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadWords = async () => {
    try {
      const list = await window.electronAPI.dictionaryList();
      setWords(list);
    } catch (err) {
      console.error('[Dictionary] Failed to load words:', err);
    }
  };

  useEffect(() => {
    loadWords();
  }, []);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

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

  const handleAdd = async () => {
    const trimmed = newWord.trim();
    if (!trimmed) return;
    try {
      const result = await window.electronAPI.dictionaryAdd(trimmed);
      if (!result.success || !result.entry) {
        throw new Error(result.error || 'Failed to add dictionary term.');
      }

      const entry = result.entry;

      if (!result.duplicate) {
        setWords((prev) => [entry, ...prev]);
        setStatusMessage(`Added "${entry.word}" to the dictionary.`);
      } else {
        setStatusMessage(`"${entry.word}" is already in the dictionary.`);
      }

      setNewWord('');
      setIsAdding(false);
    } catch (err) {
      console.error('[Dictionary] Failed to add word:', err);
      setStatusMessage(err instanceof Error ? err.message : 'Failed to add dictionary term.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await window.electronAPI.dictionaryDelete(id);
      setWords((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      console.error('[Dictionary] Failed to delete word:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'Escape') {
      setNewWord('');
      setIsAdding(false);
    }
  };

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Dictionary</p>
          <h1 className="page-title">Vocabulary atelier</h1>
        </div>
        <button onClick={() => setIsAdding(true)} className="action-btn">
          Add term
        </button>
      </header>

      <section className="settings-block">
        <p className="settings-copy">
          Preserve preferred spelling for names, product terms, and acronyms. Entries are applied automatically while transcribing.
        </p>
        {statusMessage ? (
          <p className="settings-copy">{statusMessage}</p>
        ) : null}
      </section>

      {isAdding && (
        <div className="editor-shell">
          <input
            ref={inputRef}
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a preferred term..."
            className="editor-input"
          />
          <button onClick={handleAdd} className="action-btn action-btn-strong">
            Save
          </button>
          <button
            onClick={() => {
              setNewWord('');
              setIsAdding(false);
            }}
            className="action-btn action-btn-soft"
          >
            Cancel
          </button>
        </div>
      )}

      {words.length === 0 && !isAdding && (
        <div className="empty-state">
          Start your dictionary with at least one custom word to improve transcription fidelity.
        </div>
      )}

      {words.length > 0 && (
        <div className="dictionary-grid">
          {words.map((word) => (
            <div key={word.id} className="dictionary-row">
              <span className="dictionary-dot" />
              <span className="dictionary-word">{word.word}</span>
              <button
                onClick={() => handleDelete(word.id)}
                className="dictionary-remove"
                title="Delete"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DictionaryPage;

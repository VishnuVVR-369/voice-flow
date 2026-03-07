import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  formatHotkeyForDisplay,
  hotkeyTokenFromEvent,
  hotkeyToAccelerator,
  hotkeyTokensFromAccelerator,
  normalizeHotkeyTokens,
  validateHotkeyTokens,
} from '../../shared/hotkeys';

interface HotkeyEditorProps {
  value: string;
  onChange: (hotkey: string) => Promise<{ success: boolean; error?: string }>;
  title?: string;
  description?: string;
  changeButtonLabel?: string;
  saveButtonLabel?: string;
}

const platform = navigator.userAgent.includes('Mac') ? 'darwin' : 'default';

const HotkeyEditor: React.FC<HotkeyEditorProps> = ({
  value,
  onChange,
  title = 'Global Shortcut',
  description = 'Press the keys you want to use. Press a key again to remove it from the shortcut.',
  changeButtonLabel = 'Change shortcut',
  saveButtonLabel = 'Save shortcut',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftTokens, setDraftTokens] = useState<string[]>(() => hotkeyTokensFromAccelerator(value));
  const [pressedTokens, setPressedTokens] = useState<string[]>([]);
  const [error, setError] = useState('');
  const isEditingRef = useRef(false);

  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setDraftTokens(hotkeyTokensFromAccelerator(value));
      setPressedTokens([]);
      setError('');
    }
  }, [isEditing, value]);

  useEffect(() => {
    return () => {
      if (isEditingRef.current) {
        void window.electronAPI.setShortcutEditing(false);
      }
    };
  }, []);

  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const token = hotkeyTokenFromEvent(event);
      if (!token) return;

      event.preventDefault();
      event.stopPropagation();

      setPressedTokens((current) => (
        current.includes(token) ? current : [...current, token]
      ));

      if (event.repeat) return;

      setDraftTokens((current) => {
        const next = current.includes(token)
          ? current.filter((entry) => entry !== token)
          : normalizeHotkeyTokens([...current, token]);
        setError(validateHotkeyTokens(next) ?? '');
        return next;
      });
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const token = hotkeyTokenFromEvent(event);
      if (!token) return;

      event.preventDefault();
      event.stopPropagation();

      setPressedTokens((current) => current.filter((entry) => entry !== token));
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [isEditing]);

  const displayTokens = useMemo(
    () => formatHotkeyForDisplay(hotkeyToAccelerator(draftTokens), platform),
    [draftTokens],
  );

  const savedDisplayTokens = useMemo(
    () => formatHotkeyForDisplay(value, platform),
    [value],
  );

  const beginEditing = async () => {
    const result = await window.electronAPI.setShortcutEditing(true);
    if (!result.success) {
      setError(result.error || 'Failed to pause the current shortcut.');
      return;
    }

    setDraftTokens([]);
    setPressedTokens([]);
    setError('');
    setIsEditing(true);
  };

  const cancelEditing = async () => {
    const result = await window.electronAPI.setShortcutEditing(false);
    if (!result.success) {
      setError(result.error || 'Failed to restore the current shortcut.');
      return;
    }

    setIsEditing(false);
  };

  const saveShortcut = async () => {
    const validationError = validateHotkeyTokens(draftTokens);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError('');

    const nextHotkey = hotkeyToAccelerator(draftTokens);
    const updateResult = await onChange(nextHotkey);

    if (!updateResult.success) {
      setError(updateResult.error || 'That shortcut could not be saved.');
      setIsSaving(false);
      return;
    }

    const resumeResult = await window.electronAPI.setShortcutEditing(false);
    if (!resumeResult.success) {
      setError(resumeResult.error || 'Shortcut was saved but could not be re-enabled.');
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setIsEditing(false);
  };

  return (
    <div className="hotkey-editor">
      <div className="hotkey-editor-head">
        <div>
          <h2 className="settings-title">{title}</h2>
          <p className="settings-copy">{description}</p>
        </div>
        {!isEditing && (
          <button type="button" className="shortcut-action-btn" onClick={beginEditing}>
            {changeButtonLabel}
          </button>
        )}
      </div>

      <div className={`shortcut-keyset ${isEditing ? 'shortcut-keyset-editing' : ''}`}>
        {(isEditing ? displayTokens : savedDisplayTokens).map((token, index) => (
          <span
            key={`${token}-${index}`}
            className={`shortcut-key ${pressedTokens.includes(draftTokens[index]) ? 'shortcut-key-active' : ''}`}
          >
            {token}
          </span>
        ))}
        {(!isEditing ? savedDisplayTokens.length === 0 : displayTokens.length === 0) && (
          <span className="shortcut-placeholder">Press keys to build your shortcut</span>
        )}
      </div>

      {error && <p className="shortcut-error">{error}</p>}

      {isEditing && (
        <div className="shortcut-actions">
          <button type="button" className="eye-btn" onClick={cancelEditing} disabled={isSaving}>
            Cancel
          </button>
          <button
            type="button"
            className="shortcut-action-btn"
            onClick={saveShortcut}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : saveButtonLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default HotkeyEditor;

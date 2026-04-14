import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '../stores/app-store';
import { PcmAudioRecorder } from '../services/pcm-audio-recorder';
import { soundEffects } from '../services/sound-effects';
import { WaveformAnimation } from './WaveformAnimation';
import { OVERLAY_IDLE_HEIGHT, OVERLAY_IDLE_WIDTH } from '../../shared/constants';
import type { AppSettings, AppStatus, SessionMode } from '../../shared/types';

const pcmRecorder = new PcmAudioRecorder();

function rlog(msg: string) {
  console.log(msg);
  try { window.electronAPI.rendererLog(msg); } catch { /* preload not ready */ }
}

const MAX_RECORDING_MS = 10 * 60 * 1000;
const HARD_KILL_MS = 15 * 60 * 1000;

const ACTIVE_WIDTH = 380;
const ACTIVE_MAX_HEIGHT = 260;
const HEADER_HEIGHT = 44;
const BODY_MAX_HEIGHT_RECORDING = 160;
const BODY_MAX_HEIGHT_POST_RECORDING = 104;
const IDLE_WINDOW_HEIGHT = OVERLAY_IDLE_HEIGHT + 24;
const WINDOW_HEIGHT_PADDING = 24;
const WAVEFORM_ACTIVE_COLOR = '#f4efe6';
const WAVEFORM_IDLE_COLOR = 'rgba(244, 239, 230, 0.34)';

export const Overlay: React.FC = () => {
  const { status, setStatus, error, setError } = useAppStore();
  const [volumeWarning, setVolumeWarning] = useState<'none' | 'silence'>('none');
  const [liveTranscriptLines, setLiveTranscriptLines] = useState<string[]>([]);
  const [finalTranscript, setFinalTranscript] = useState<string | null>(null);
  const [sessionMode, setSessionMode] = useState<SessionMode>('dictation');
  const analyserRef = useRef<AnalyserNode | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hardKillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCancellingRef = useRef<boolean>(false);
  const isStoppingRef = useRef<boolean>(false);
  const isStartingRef = useRef<boolean>(false);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const overlayCardRef = useRef<HTMLDivElement | null>(null);
  const statusRef = useRef(status);

  const handleStartRecordingRef = useRef<typeof handleStartRecording | undefined>(undefined);
  const handleStopRecordingRef = useRef<typeof handleStopRecording | undefined>(undefined);
  const handleCancelRecordingRef = useRef<typeof handleCancelRecording | undefined>(undefined);
  const setStatusRef = useRef<typeof setStatus | undefined>(undefined);
  const setErrorRef = useRef<typeof setError | undefined>(undefined);

  const clearRecordingTimers = useCallback(() => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    if (hardKillTimerRef.current) {
      clearTimeout(hardKillTimerRef.current);
      hardKillTimerRef.current = null;
    }
  }, []);

  const clearOverlayContent = useCallback(() => {
    setLiveTranscriptLines([]);
    setFinalTranscript(null);
  }, []);

  const requestOverlayResize = useCallback((nextStatus: AppStatus) => {
    if (nextStatus === 'idle') {
      window.electronAPI.realtimeResize(OVERLAY_IDLE_WIDTH, IDLE_WINDOW_HEIGHT);
      return;
    }

    requestAnimationFrame(() => {
      const cardEl = overlayCardRef.current;
      const measuredHeight = cardEl
        ? Math.min(Math.ceil(cardEl.getBoundingClientRect().height), ACTIVE_MAX_HEIGHT)
        : HEADER_HEIGHT;

      window.electronAPI.realtimeResize(
        ACTIVE_WIDTH,
        Math.min(measuredHeight + WINDOW_HEIGHT_PADDING, ACTIVE_MAX_HEIGHT + WINDOW_HEIGHT_PADDING)
      );
    });
  }, []);

  const handleCancelRecording = useCallback(async () => {
    rlog('[Cancel] Cancelling recording...');
    isCancellingRef.current = true;
    clearRecordingTimers();

    try {
      pcmRecorder.stop();
      analyserRef.current = null;
      clearOverlayContent();
      soundEffects.error();
      setStatus('idle');

      window.electronAPI.cancelRecording();
    } catch (err) {
      console.error('[Cancel] Failed to cancel recording:', err);
      setStatus('idle');
      window.electronAPI.cancelRecording();
    } finally {
      setTimeout(() => {
        isCancellingRef.current = false;
      }, 100);
    }
  }, [clearOverlayContent, setStatus, clearRecordingTimers]);

  const handleStopRecording = useCallback(async () => {
    if (isCancellingRef.current || isStoppingRef.current) return;
    isStoppingRef.current = true;

    rlog('[Stop] Stopping realtime recording');
    clearRecordingTimers();

    try {
      pcmRecorder.stop();
      analyserRef.current = null;
      soundEffects.recordingStop();
      setStatus('transcribing');
      window.electronAPI.realtimeStop();
    } catch (err) {
      console.error('Failed to stop realtime recording:', err);
      setError('Recording failed');
    } finally {
      setTimeout(() => { isStoppingRef.current = false; }, 300);
    }
  }, [setStatus, setError, clearRecordingTimers]);

  const handleStartRecording = useCallback(async () => {
    if (isStartingRef.current || isStoppingRef.current) return;
    isStartingRef.current = true;
    isCancellingRef.current = false;
    clearOverlayContent();
    setStatus('recording');

    try {
      const settings = await window.electronAPI.getSettings();
      const deviceId = settings.audioInputDeviceId || undefined;
      setSessionMode(settings.defaultMode);

      rlog(`[Start] deviceId="${settings.audioInputDeviceId || '(default)'}"`);

      const realtimePromise = window.electronAPI.realtimeStart();

      let micReady = false;
      try {
        await pcmRecorder.start(deviceId);
        micReady = true;
      } catch (err) {
        if (deviceId && err instanceof DOMException &&
            (err.name === 'OverconstrainedError' || err.name === 'NotFoundError')) {
          try {
            await pcmRecorder.start();
            micReady = true;
          } catch (fallbackErr) {
            rlog(`[Start] Default mic failed: ${fallbackErr}`);
          }
        }
      }

      const result = await realtimePromise;

      if (isStoppingRef.current || isCancellingRef.current) {
        if (micReady) pcmRecorder.stop();
        if (result.success) {
          window.electronAPI.realtimeStop();
        } else {
          window.electronAPI.realtimeAbort();
        }
        return;
      }

      if (!result.success || !micReady) {
        if (micReady) pcmRecorder.stop();
        if (result.success) {
          window.electronAPI.realtimeAbort();
        }
        setError(result.error || 'Failed to connect');
        setStatus('error');
        return;
      }

      pcmRecorder.onChunk((pcm16) => {
        window.electronAPI.realtimeSendAudio(pcm16);
      });

      analyserRef.current = pcmRecorder.getAnalyser();
      soundEffects.recordingStart();
      setStatus('recording');

      autoStopTimerRef.current = setTimeout(() => {
        handleStopRecording();
      }, MAX_RECORDING_MS);

      hardKillTimerRef.current = setTimeout(() => {
        pcmRecorder.stop();
        analyserRef.current = null;
        soundEffects.error();
        window.electronAPI.realtimeAbort();
        setError('Recording killed: exceeded 15 min limit');
      }, HARD_KILL_MS);
    } catch (err) {
      console.error('Failed to start recording:', err);
      window.electronAPI.realtimeAbort();
      setError('Failed to access microphone');
    } finally {
      isStartingRef.current = false;
    }
  }, [clearOverlayContent, setStatus, setError, handleStopRecording]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    handleStartRecordingRef.current = handleStartRecording;
    handleStopRecordingRef.current = handleStopRecording;
    handleCancelRecordingRef.current = handleCancelRecording;
    setStatusRef.current = setStatus;
    setErrorRef.current = setError;
  }, [handleStartRecording, handleStopRecording, handleCancelRecording, setStatus, setError]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && status === 'recording') {
        e.preventDefault();
        e.stopPropagation();
        handleCancelRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, handleCancelRecording]);

  useEffect(() => {
    if (status !== 'recording') {
      setVolumeWarning('none');
      return;
    }

    let silenceSince: number | null = null;
    const RMS_THRESHOLD = 0.02;
    const SILENCE_DELAY_MS = 3000;

    const interval = setInterval(() => {
      const rms = pcmRecorder.getRmsLevel();
      if (rms < RMS_THRESHOLD) {
        if (silenceSince === null) silenceSince = Date.now();
        if (Date.now() - silenceSince >= SILENCE_DELAY_MS) {
          setVolumeWarning('silence');
        }
      } else {
        silenceSince = null;
        setVolumeWarning('none');
      }
    }, 150);

    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    const syncMode = (settings: AppSettings) => {
      if (statusRef.current === 'idle') {
        setSessionMode(settings.defaultMode);
      }
    };

    window.electronAPI.getSettings().then(syncMode).catch((err) => {
      console.error('[Overlay] Failed to load settings:', err);
    });

    const dispose = window.electronAPI.onSettingsUpdated(syncMode);
    return dispose;
  }, []);

  useEffect(() => {
    if (status === 'recording') {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    requestOverlayResize(status);
  }, [error, finalTranscript, liveTranscriptLines, requestOverlayResize, status]);

  useEffect(() => {
    const disposers = [
      window.electronAPI.onRecordingStart(() => {
        handleStartRecordingRef.current?.();
      }),
      window.electronAPI.onRecordingStop(() => {
        handleStopRecordingRef.current?.();
      }),
      window.electronAPI.onRecordingCancel(() => {
        handleCancelRecordingRef.current?.();
      }),
      window.electronAPI.onStatusUpdate((newStatus) => {
        setStatusRef.current?.(newStatus);
        if (newStatus === 'idle') {
          clearOverlayContent();
        }
      }),
      window.electronAPI.onTranscriptionResult((text) => {
        setFinalTranscript(text);
      }),
      window.electronAPI.onTranscriptionError((errorMsg) => {
        soundEffects.error();
        setErrorRef.current?.(errorMsg);
      }),
      window.electronAPI.onRealtimeUtterance((text) => {
        setLiveTranscriptLines((prev) => [...prev, text]);
      }),
      window.electronAPI.onRealtimeError((errorMsg) => {
        soundEffects.error();
        setErrorRef.current?.(errorMsg);
      }),
    ];

    return () => disposers.forEach((dispose) => dispose());
  }, [clearOverlayContent]);

  const liveTranscript = liveTranscriptLines.join(' ').trim();
  const previewText = status === 'done'
    ? finalTranscript?.trim() || liveTranscript
    : liveTranscript;
  const hasPreviewText = previewText.length > 0;
  const hasErrorDetail = status === 'error' && Boolean(error);
  const showPreview = status !== 'idle' && (hasPreviewText || hasErrorDetail);
  const modeLabel = sessionMode === 'ask' ? 'Ask' : 'Dictation';
  const recordingText = volumeWarning === 'silence'
    ? 'No input detected'
    : sessionMode === 'ask'
      ? 'Listening for instruction'
      : 'Listening';
  const transcribingText = sessionMode === 'ask' ? 'Transforming selection...' : 'Polishing transcript...';
  const doneText = sessionMode === 'ask' ? 'Selection replaced' : 'Pasted successfully';
  const previewLabel = status === 'recording'
    ? (sessionMode === 'ask' ? 'Live instruction' : 'Live transcript')
    : status === 'transcribing'
      ? 'Transcript preview'
      : status === 'done'
        ? (sessionMode === 'ask' ? 'Applied text' : 'Pasted text')
        : hasPreviewText
          ? 'Captured speech'
          : 'Error details';
  const statusText = status === 'recording'
    ? recordingText
    : status === 'transcribing'
      ? transcribingText
      : status === 'done'
        ? doneText
        : 'Could not complete';
  const previewBodyMaxHeight = status === 'recording'
    ? BODY_MAX_HEIGHT_RECORDING
    : BODY_MAX_HEIGHT_POST_RECORDING;
  const overlayShellClassName = [
    'overlay-shell',
    status === 'idle' ? 'overlay-shell--idle' : 'overlay-shell--active',
    status !== 'idle' ? `overlay-shell--${status}` : '',
    showPreview ? 'overlay-shell--with-preview' : '',
  ].filter(Boolean).join(' ');
  const previewClassName = [
    'overlay-preview',
    status === 'recording' ? 'overlay-preview--scrollable' : 'overlay-preview--static',
    status === 'error' ? 'overlay-preview--error' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="overlay-container">
      <div className="overlay-wrapper">
        <div className={overlayShellClassName} ref={overlayCardRef}>
          {status === 'idle' ? (
            <>
              <span className="overlay-idle-glow" />
              <span className="overlay-idle-core" />
            </>
          ) : (
            <>
              <div className="overlay-shell-sheen" aria-hidden="true" />
              <div className="overlay-header">
                <div className="overlay-header-main">
                  <span className="overlay-mode-pill">{modeLabel}</span>
                  <div className="overlay-status-wrap">
                    <span className={`overlay-state-badge overlay-state-badge--${status}`} aria-hidden="true" />
                    <span className={`overlay-status-text${volumeWarning === 'silence' ? ' overlay-status-text--warning' : ''}`}>
                      {statusText}
                    </span>
                  </div>
                </div>

                <div className="overlay-header-actions">
                  {status === 'recording' && (
                    <WaveformAnimation
                      analyser={analyserRef.current}
                      isActive
                      activeColor={WAVEFORM_ACTIVE_COLOR}
                      inactiveColor={WAVEFORM_IDLE_COLOR}
                    />
                  )}

                  {status === 'transcribing' && (
                    <span className="processing-dots" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                  )}

                  {status === 'recording' && (
                    <button
                      className="cancel-button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCancelRecording();
                      }}
                      title="Cancel (ESC)"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {showPreview && (
                <div
                  className={previewClassName}
                  style={{ maxHeight: `${previewBodyMaxHeight}px` }}
                >
                  <div className="overlay-preview-label">{previewLabel}</div>
                  {hasPreviewText && (
                    <div className="overlay-preview-copy">
                      {previewText}
                      {status === 'recording' && <span className="typing-cursor" />}
                    </div>
                  )}
                  {hasErrorDetail && (
                    <div className="overlay-preview-note overlay-preview-note--error">
                      {error}
                    </div>
                  )}
                  <div ref={transcriptEndRef} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

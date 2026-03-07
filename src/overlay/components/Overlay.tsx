import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '../stores/app-store';
import { PcmAudioRecorder } from '../services/pcm-audio-recorder';
import { soundEffects } from '../services/sound-effects';
import { WaveformAnimation } from './WaveformAnimation';
import { OVERLAY_WIDTH } from '../../shared/constants';

const pcmRecorder = new PcmAudioRecorder();

function rlog(msg: string) {
  console.log(msg);
  try { window.electronAPI.rendererLog(msg); } catch { /* preload not ready */ }
}

const MAX_RECORDING_MS = 10 * 60 * 1000;
const HARD_KILL_MS = 15 * 60 * 1000;

const PILL_HEIGHT = 34;
const TRANSCRIPT_PADDING = 24;
const TRANSCRIPT_MAX_TEXT_HEIGHT = 200;

export const Overlay: React.FC = () => {
  const { status, setStatus, error, setError } = useAppStore();
  const [volumeWarning, setVolumeWarning] = useState<'none' | 'silence'>('none');
  const [transcriptLines, setTranscriptLines] = useState<string[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hardKillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCancellingRef = useRef<boolean>(false);
  const isStoppingRef = useRef<boolean>(false);
  const isStartingRef = useRef<boolean>(false);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const transcriptCardRef = useRef<HTMLDivElement | null>(null);

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

  const requestOverlayResize = useCallback((lines: string[]) => {
    if (lines.length === 0) {
      window.electronAPI.realtimeResize(OVERLAY_WIDTH, PILL_HEIGHT + 24);
      return;
    }

    requestAnimationFrame(() => {
      const cardEl = transcriptCardRef.current;
      if (cardEl) {
        const cardHeight = cardEl.scrollHeight;
        const totalHeight = Math.min(
          cardHeight + PILL_HEIGHT + 8,
          TRANSCRIPT_MAX_TEXT_HEIGHT + TRANSCRIPT_PADDING + PILL_HEIGHT + 8
        );
        window.electronAPI.realtimeResize(OVERLAY_WIDTH, totalHeight + 24);
      }
    });
  }, []);

  const handleCancelRecording = useCallback(async () => {
    rlog('[Cancel] Cancelling recording...');
    isCancellingRef.current = true;
    clearRecordingTimers();

    try {
      pcmRecorder.stop();
      analyserRef.current = null;
      setTranscriptLines([]);
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
  }, [setStatus, clearRecordingTimers]);

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
    setTranscriptLines([]);
    setStatus('recording');

    try {
      const settings = await window.electronAPI.getSettings();
      const deviceId = settings.audioInputDeviceId || undefined;

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
        if (result.success) window.electronAPI.realtimeStop();
        return;
      }

      if (!result.success || !micReady) {
        if (micReady) pcmRecorder.stop();
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
        setError('Recording killed: exceeded 15 min limit');
      }, HARD_KILL_MS);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to access microphone');
    } finally {
      isStartingRef.current = false;
    }
  }, [setStatus, setError, handleStopRecording]);

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
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    requestOverlayResize(transcriptLines);
  }, [transcriptLines, requestOverlayResize]);

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
          setTranscriptLines([]);
        }
      }),
      window.electronAPI.onTranscriptionResult((text) => {
        void text;
      }),
      window.electronAPI.onTranscriptionError((errorMsg) => {
        soundEffects.error();
        setErrorRef.current?.(errorMsg);
      }),
      window.electronAPI.onRealtimeUtterance((text) => {
        setTranscriptLines((prev) => [...prev, text]);
      }),
      window.electronAPI.onRealtimeError((errorMsg) => {
        soundEffects.error();
        setErrorRef.current?.(errorMsg);
      }),
    ];

    return () => disposers.forEach((dispose) => dispose());
  }, []);

  if (status === 'idle') {
    return <div className="overlay-container" />;
  }

  const fullTranscript = transcriptLines.join(' ');
  const hasTranscript = fullTranscript.length > 0;

  return (
    <div className="overlay-container">
      <div className="overlay-wrapper">
        {hasTranscript && status === 'recording' && (
          <div className="transcript-card" ref={transcriptCardRef}>
            <div className="transcript-text">
              {fullTranscript}
              <span className="typing-cursor" />
            </div>
            <div ref={transcriptEndRef} />
          </div>
        )}

        <div className="overlay-pill">
          <div className={`pill-layer ${status === 'recording' ? 'pill-layer--active' : ''}`}>
            <span className="overlay-status-dot" />
            <WaveformAnimation
              analyser={status === 'recording' ? analyserRef.current : null}
              isActive={status === 'recording'}
            />
            <span className={`overlay-text${volumeWarning === 'silence' ? ' overlay-warning' : ''}`}>
              {volumeWarning === 'silence' ? 'No voice detected' : 'Listening'}
            </span>
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
          </div>

          <div className={`pill-layer ${status === 'transcribing' ? 'pill-layer--active' : ''}`}>
            <span className="overlay-text">Polishing transcript...</span>
          </div>

          <div className={`pill-layer ${status === 'done' ? 'pill-layer--active' : ''}`}>
            <span className="overlay-text overlay-done">Pasted successfully</span>
          </div>

          <div className={`pill-layer ${status === 'error' ? 'pill-layer--active' : ''}`}>
            <span className="overlay-text overlay-error">{error || 'Error'}</span>
          </div>

          {status === 'transcribing' && <div className="transcribe-sweep" />}
        </div>
      </div>
    </div>
  );
};

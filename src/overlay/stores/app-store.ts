import { create } from 'zustand';
import type { AppStatus } from '../../shared/types';

interface AppState {
  status: AppStatus;
  error: string | null;

  setStatus: (status: AppStatus) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  status: 'idle',
  error: null,

  setStatus: (status) => set((state) => ({
    status,
    // When transitioning to 'error', preserve the existing error message
    // (it was already set by setError or TRANSCRIPTION_ERROR handler).
    // When transitioning away from error, clear the error.
    error: status === 'error' ? state.error : null,
  })),
  setError: (error) => set({ error, status: 'error' }),
}));

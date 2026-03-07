import { RealtimeTranscriptionService } from './realtime-transcription-service';
import { getConfig } from './config-store';
import { dictionaryService } from './service-ipc';

export class RealtimeSessionManager {
  async acquireSession(): Promise<{ service: RealtimeTranscriptionService; clientSecret: string }> {
    const config = getConfig();
    if (!config.groqApiKey) {
      throw new Error('No API key configured');
    }

    const dictionaryWords = dictionaryService.getAllWords();
    const service = new RealtimeTranscriptionService({
      apiKey: config.groqApiKey,
      language: config.language || undefined,
      dictionaryWords,
    });

    await service.connect();

    // Kept for compatibility with existing IPC return shape.
    return { service, clientSecret: 'groq-local-session' };
  }

  warmUp(): void {
    // No-op for Groq REST transcription flow.
  }

  scheduleReWarm(): void {
    // No-op for Groq REST transcription flow.
  }

  coolDown(): void {
    // No-op for Groq REST transcription flow.
  }

  dispose(): void {
    // No-op for Groq REST transcription flow.
  }

  enable(): void {
    // No-op for Groq REST transcription flow.
  }
}

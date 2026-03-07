import { EventEmitter } from 'events';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_WHISPER_MODEL = 'whisper-large-v3';
const INPUT_SAMPLE_RATE = 24000;

interface RealtimeTranscriptionOptions {
  apiKey: string;
  language?: string;
  dictionaryWords?: string[];
}

/**
 * API-compatible replacement for the old websocket service.
 * Buffers PCM chunks during recording, then sends a single Groq Whisper transcription request at stop().
 */
export class RealtimeTranscriptionService extends EventEmitter {
  private readonly apiKey: string;
  private readonly language?: string;
  private readonly dictionaryWords: string[];
  private readonly audioChunks: Buffer[] = [];
  private accumulatedTranscripts: string[] = [];
  private connected = false;

  constructor(options: RealtimeTranscriptionOptions) {
    super();
    this.apiKey = options.apiKey;
    this.language = options.language;
    this.dictionaryWords = options.dictionaryWords ?? [];
  }

  get isConnected(): boolean {
    return this.connected;
  }

  removeWarmHandlers(): void {
    this.removeAllListeners();
  }

  getAccumulatedText(): string {
    return this.accumulatedTranscripts.join(' ');
  }

  popLastTranscript(): void {
    this.accumulatedTranscripts.pop();
  }

  async connect(_unusedSecret?: string): Promise<void> {
    this.audioChunks.length = 0;
    this.accumulatedTranscripts = [];
    this.connected = true;
    console.log('[Realtime] Groq transcription session ready');
  }

  sendAudioChunk(pcm16: Buffer): void {
    if (!this.connected) return;
    this.audioChunks.push(pcm16);
  }

  async stop(): Promise<string> {
    if (!this.connected) {
      return this.accumulatedTranscripts.join(' ');
    }

    if (this.audioChunks.length === 0) {
      console.log('[Realtime] No audio chunks buffered, skipping transcription');
      return '';
    }

    try {
      const mergedPcm = Buffer.concat(this.audioChunks);
      console.log(`[Realtime] Sending ${mergedPcm.length} bytes of PCM16 to Groq Whisper`);

      const wav = pcm16MonoToWav(mergedPcm, INPUT_SAMPLE_RATE);
      const prompt = this.buildWhisperPrompt();

      const form = new FormData();
      form.append('file', new Blob([wav], { type: 'audio/wav' }), 'recording.wav');
      form.append('model', GROQ_WHISPER_MODEL);
      if (this.language) {
        form.append('language', this.language);
      }
      if (prompt) {
        form.append('prompt', prompt);
      }
      form.append('response_format', 'json');

      const resp = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: form,
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Groq transcription failed (${resp.status}): ${errText.substring(0, 400)}`);
      }

      const data = await resp.json();
      const text = (data.text as string | undefined)?.trim() || '';
      if (text) {
        this.accumulatedTranscripts.push(text);
        this.emit('utterance', text);
      }

      return this.accumulatedTranscripts.join(' ');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (this.listenerCount('error') > 0) {
        this.emit('error', msg);
      }
      throw err;
    }
  }

  disconnect(): void {
    this.connected = false;
    this.audioChunks.length = 0;
    this.accumulatedTranscripts = [];
    this.removeAllListeners();
  }

  private buildWhisperPrompt(): string {
    const basePrompt = 'Transcribe exactly what was spoken. Do not summarize or translate.';
    if (!this.dictionaryWords.length) return basePrompt;

    const cleaned = this.dictionaryWords
      .map((w) => w.trim())
      .filter(Boolean)
      .slice(0, 100);

    if (!cleaned.length) return basePrompt;

    return `${basePrompt} Prefer these spellings for proper nouns/terms when they match speech: ${cleaned.join(', ')}.`;
  }
}

function pcm16MonoToWav(pcm16: Buffer, sampleRate: number): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcm16.length;

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcm16]);
}

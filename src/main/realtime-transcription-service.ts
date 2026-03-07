import { EventEmitter } from 'events';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_WHISPER_MODEL = 'whisper-large-v3';
const INPUT_SAMPLE_RATE = 16000;
const STRATEGY_VERSION = 'v2_accuracy_first';
const PASS_B_THRESHOLD = 0.7;

interface RealtimeTranscriptionOptions {
  apiKey: string;
  language?: string;
  dictionaryWords?: string[];
}

interface TranscriptionPassOptions {
  promptMode: 'dictionary' | 'neutral';
  temperature: number;
  language?: string;
  responseFormat: 'json' | 'verbose_json';
}

interface TranscriptionPassResult {
  text: string;
  detectedLanguage?: string;
  segments?: unknown[];
}

interface QualityEvaluation {
  score: number;
  reasons: string[];
  metrics: {
    tokenCount: number;
    wordsPerSecond: number | null;
    repeatedTokenRatio: number;
    dictionaryTokenRatio: number;
  };
}

interface PassAttempt {
  id: 'A' | 'B';
  config: TranscriptionPassOptions;
  result: TranscriptionPassResult;
  quality: QualityEvaluation;
}

export interface RealtimeTranscriptionResult {
  text: string;
  detectedLanguage?: string;
  segments?: unknown[];
  durationSec?: number;
  diagnostics?: {
    strategyVersion: string;
    selectedPass: 'A' | 'B';
    passA: {
      score: number;
      reasons: string[];
      textLength: number;
    };
    passB?: {
      score: number;
      reasons: string[];
      textLength: number;
    };
  };
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

  async connect(): Promise<void> {
    this.audioChunks.length = 0;
    this.accumulatedTranscripts = [];
    this.connected = true;
    console.log('[Realtime] Groq transcription session ready');
  }

  sendAudioChunk(pcm16: Buffer): void {
    if (!this.connected) return;
    this.audioChunks.push(pcm16);
  }

  async stop(): Promise<RealtimeTranscriptionResult> {
    if (!this.connected) {
      return { text: this.accumulatedTranscripts.join(' ') };
    }

    if (this.audioChunks.length === 0) {
      console.log('[Realtime] No audio chunks buffered, skipping transcription');
      return { text: '' };
    }

    try {
      const mergedPcm = Buffer.concat(this.audioChunks);
      console.log(`[Realtime] Sending ${mergedPcm.length} bytes of PCM16 to Groq Whisper`);
      const durationSec = mergedPcm.length / 2 / INPUT_SAMPLE_RATE;

      const wav = pcm16MonoToWav(mergedPcm, INPUT_SAMPLE_RATE);
      const passAConfig: TranscriptionPassOptions = {
        promptMode: 'dictionary',
        temperature: 0,
        language: this.language,
        responseFormat: 'verbose_json',
      };

      const passAResult = await this.runTranscriptionPass(wav, passAConfig);
      const passAQuality = this.evaluateQuality(passAResult.text, durationSec);
      const passAttempts: PassAttempt[] = [
        { id: 'A', config: passAConfig, result: passAResult, quality: passAQuality },
      ];

      let selected = passAttempts[0];

      if (passAQuality.score < PASS_B_THRESHOLD) {
        const passBConfig: TranscriptionPassOptions = {
          promptMode: 'neutral',
          temperature: 0.2,
          language: this.language,
          responseFormat: 'verbose_json',
        };
        const passBResult = await this.runTranscriptionPass(wav, passBConfig);
        const passBQuality = this.evaluateQuality(passBResult.text, durationSec);
        const passBAttempt: PassAttempt = {
          id: 'B',
          config: passBConfig,
          result: passBResult,
          quality: passBQuality,
        };
        passAttempts.push(passBAttempt);
        selected = this.chooseBetterPass(selected, passBAttempt);
      }

      const selectedText = selected.result.text.trim();
      if (selectedText) {
        this.accumulatedTranscripts.push(selectedText);
        this.emit('utterance', selectedText);
      }

      const passA = passAttempts.find((p) => p.id === 'A');
      const passB = passAttempts.find((p) => p.id === 'B');
      const diagnostics: RealtimeTranscriptionResult['diagnostics'] = passA ? {
        strategyVersion: STRATEGY_VERSION,
        selectedPass: selected.id,
        passA: {
          score: passA.quality.score,
          reasons: passA.quality.reasons,
          textLength: passA.result.text.length,
        },
        passB: passB ? {
          score: passB.quality.score,
          reasons: passB.quality.reasons,
          textLength: passB.result.text.length,
        } : undefined,
      } : undefined;

      return {
        text: this.accumulatedTranscripts.join(' '),
        detectedLanguage: selected.result.detectedLanguage,
        segments: selected.result.segments,
        durationSec,
        diagnostics,
      };
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

  private async runTranscriptionPass(wav: Buffer, options: TranscriptionPassOptions): Promise<TranscriptionPassResult> {
    const prompt = this.buildWhisperPrompt(options.promptMode);

    const form = new FormData();
    form.append('file', new Blob([wav], { type: 'audio/wav' }), 'recording.wav');
    form.append('model', GROQ_WHISPER_MODEL);
    form.append('temperature', String(options.temperature));
    form.append('response_format', options.responseFormat);

    if (options.language) {
      form.append('language', options.language);
    }
    if (prompt) {
      form.append('prompt', prompt);
    }

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
    return {
      text: (data.text as string | undefined)?.trim() || '',
      detectedLanguage: data.language as string | undefined,
      segments: Array.isArray(data.segments) ? (data.segments as unknown[]) : undefined,
    };
  }

  private buildWhisperPrompt(mode: 'dictionary' | 'neutral'): string {
    const basePrompt = 'Transcribe exactly what was spoken. Do not summarize or translate.';
    if (mode === 'neutral') return basePrompt;
    if (!this.dictionaryWords.length) return basePrompt;

    const cleaned = this.dictionaryWords
      .map((w) => w.trim())
      .filter(Boolean)
      .slice(0, 100);

    if (!cleaned.length) return basePrompt;

    return `${basePrompt} Prefer these spellings for proper nouns/terms when they match speech: ${cleaned.join(', ')}.`;
  }

  private chooseBetterPass(a: PassAttempt, b: PassAttempt): PassAttempt {
    if (b.quality.score > a.quality.score) return b;
    if (b.quality.score < a.quality.score) return a;
    if (b.result.text.length > a.result.text.length) return b;
    return a;
  }

  private evaluateQuality(text: string, durationSec: number): QualityEvaluation {
    const normalized = text.trim().toLowerCase();
    if (!normalized) {
      return {
        score: 0,
        reasons: ['empty transcript'],
        metrics: {
          tokenCount: 0,
          wordsPerSecond: durationSec > 0 ? 0 : null,
          repeatedTokenRatio: 0,
          dictionaryTokenRatio: 0,
        },
      };
    }

    const tokens = normalized
      .replace(/[^\p{L}\p{N}\s'’-]/gu, ' ')
      .split(/\s+/)
      .filter(Boolean);

    const reasons: string[] = [];
    let score = 1;

    if (tokens.length <= 1 && durationSec > 2.5) {
      score -= 0.35;
      reasons.push('too few tokens for recording duration');
    }

    const wps = durationSec > 0 ? tokens.length / durationSec : null;
    if (wps !== null) {
      if (wps < 0.45 && durationSec > 2) {
        score -= 0.25;
        reasons.push('very low words-per-second');
      } else if (wps > 6) {
        score -= 0.2;
        reasons.push('very high words-per-second');
      }
    }

    const uniqueTokenCount = new Set(tokens).size;
    const repeatedTokenRatio = tokens.length > 0 ? 1 - uniqueTokenCount / tokens.length : 0;
    if (tokens.length >= 6 && repeatedTokenRatio > 0.6) {
      score -= 0.25;
      reasons.push('high repetition ratio');
    }

    let maxRun = 1;
    let currentRun = 1;
    for (let i = 1; i < tokens.length; i += 1) {
      if (tokens[i] === tokens[i - 1]) {
        currentRun += 1;
        if (currentRun > maxRun) maxRun = currentRun;
      } else {
        currentRun = 1;
      }
    }
    if (maxRun >= 4) {
      score -= 0.2;
      reasons.push('long repeated-token run');
    }

    const dictionaryTokenRatio = this.computeDictionaryTokenRatio(tokens);
    if (tokens.length >= 3 && dictionaryTokenRatio >= 0.85) {
      score -= 0.25;
      reasons.push('dictionary-heavy output');
    }

    score = Math.max(0, Math.min(1, score));

    if (reasons.length === 0) {
      reasons.push('quality checks passed');
    }

    return {
      score,
      reasons,
      metrics: {
        tokenCount: tokens.length,
        wordsPerSecond: wps,
        repeatedTokenRatio,
        dictionaryTokenRatio,
      },
    };
  }

  private computeDictionaryTokenRatio(tokens: string[]): number {
    if (!this.dictionaryWords.length || !tokens.length) return 0;

    const dictTokens = new Set<string>();
    for (const phrase of this.dictionaryWords) {
      const normalized = phrase
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s'’-]/gu, ' ')
        .split(/\s+/)
        .filter(Boolean);
      for (const token of normalized) {
        dictTokens.add(token);
      }
    }

    if (!dictTokens.size) return 0;
    let hits = 0;
    for (const token of tokens) {
      if (dictTokens.has(token)) hits += 1;
    }
    return hits / tokens.length;
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

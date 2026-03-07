/**
 * PcmAudioRecorder wraps an AudioWorklet to capture PCM16 audio at 16kHz.
 * Used for Groq Whisper transcription.
 */

// Inline worklet code as a string to avoid file-path resolution issues in packaged Electron apps.
// AudioWorklet.addModule(new URL('./file.ts', import.meta.url)) breaks in asar-packaged builds.
const PCM_WORKLET_CODE = `
class PcmWorkletProcessor extends AudioWorkletProcessor {
  static TARGET_SAMPLE_RATE = 16000;
  static CHUNK_SIZE = 1600; // 100ms @ 16kHz
  constructor() {
    super();
    this.buffer = new Int16Array(PcmWorkletProcessor.CHUNK_SIZE);
    this.writeIndex = 0;
    this.ratio = sampleRate / PcmWorkletProcessor.TARGET_SAMPLE_RATE;
    this.pending = new Float32Array(0);
    this.readPosition = 0;
  }
  concatFloat32(a, b) {
    const out = new Float32Array(a.length + b.length);
    out.set(a, 0);
    out.set(b, a.length);
    return out;
  }
  pushSample(sample) {
    const clamped = Math.max(-1, Math.min(1, sample));
    this.buffer[this.writeIndex++] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
    if (this.writeIndex >= PcmWorkletProcessor.CHUNK_SIZE) {
      this.port.postMessage(this.buffer.buffer.slice(0));
      this.writeIndex = 0;
    }
  }
  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;

    const merged = this.concatFloat32(this.pending, input);
    while (this.readPosition + 1 < merged.length) {
      const leftIndex = Math.floor(this.readPosition);
      const rightIndex = leftIndex + 1;
      const frac = this.readPosition - leftIndex;
      const left = merged[leftIndex];
      const right = merged[rightIndex];
      const sample = left + (right - left) * frac;
      this.pushSample(sample);
      this.readPosition += this.ratio;
    }

    const consumed = Math.floor(this.readPosition);
    this.pending = consumed > 0 ? merged.slice(consumed) : merged;
    this.readPosition -= consumed;
    return true;
  }
}
registerProcessor('pcm-worklet-processor', PcmWorkletProcessor);
`;

let workletBlobUrl: string | null = null;
function getWorkletBlobUrl(): string {
  if (!workletBlobUrl) {
    const blob = new Blob([PCM_WORKLET_CODE], { type: 'application/javascript' });
    workletBlobUrl = URL.createObjectURL(blob);
  }
  return workletBlobUrl;
}

export class PcmAudioRecorder {
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private mutedSinkNode: GainNode | null = null;
  private chunkCallback: ((pcm16: ArrayBuffer) => void) | null = null;
  private _isRecording = false;

  onChunk(cb: (pcm16: ArrayBuffer) => void): void {
    this.chunkCallback = cb;
  }

  async start(deviceId?: string): Promise<void> {
    this.releaseResources();

    const audioConstraints: Record<string, unknown> = {
      sampleRate: { ideal: 48000 },
      autoGainControl: true,
      noiseSuppression: true,
      echoCancellation: true,
      channelCount: 1,
      sampleSize: 16,
      latency: 0,
    };
    if (deviceId) {
      audioConstraints.deviceId = { exact: deviceId };
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints as MediaTrackConstraints,
    });

    const track = this.stream.getAudioTracks()[0];
    console.log(`[PcmRecorder] Active mic: "${track.label}"`);

    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(this.stream);

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1;

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    // Load worklet from inline blob URL (avoids asar file-path issues in packaged builds)
    await this.audioContext.audioWorklet.addModule(getWorkletBlobUrl());

    this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-worklet-processor');
    this.workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      this.chunkCallback?.(event.data);
    };

    source.connect(this.gainNode);
    this.gainNode.connect(this.analyser);
    this.gainNode.connect(this.workletNode);

    // Keep the graph alive without audible loopback.
    this.mutedSinkNode = this.audioContext.createGain();
    this.mutedSinkNode.gain.value = 0;
    this.workletNode.connect(this.mutedSinkNode);
    this.mutedSinkNode.connect(this.audioContext.destination);

    this._isRecording = true;
  }

  stop(): void {
    this._isRecording = false;
    this.releaseResources();
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  getRmsLevel(): number {
    if (!this.analyser) return 0;
    const buf = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = (buf[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / buf.length);
  }

  isRecording(): boolean {
    return this._isRecording;
  }

  private releaseResources(): void {
    this.workletNode?.disconnect();
    this.mutedSinkNode?.disconnect();
    this.workletNode = null;
    this.mutedSinkNode = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.analyser = null;
    this.gainNode = null;
    this.audioContext?.close().catch((err) => {
      console.warn('[PcmRecorder] Failed to close AudioContext:', err);
    });
    this.audioContext = null;
  }
}

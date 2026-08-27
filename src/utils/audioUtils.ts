import { CANCEL_GUARD, STALE_RETENTION } from './constants.js';

export type SoundPack = 'electronic' | 'wood' | 'metallic';

export interface ClickConfig {
  /** Sine fundamental, Hz. null = no tonal layer. */
  toneFreq: number | null;
  /** Short 2nd-harmonic transient for attack definition. null = none. */
  tickFreq: number | null;
  /** Bandpass-filtered noise layer. null = none. */
  noise: { freq: number; q: number } | null;
  /** Final peak after normalize + soft-clip. Sets the accent/regular/sub balance. */
  peak: number;
  attack: number;   // seconds
  hold: number;     // seconds — plateau that raises RMS relative to peak
  duration: number; // seconds, total
}

export const SOUND_PACKS: Record<SoundPack, Record<'accent' | 'regular' | 'subdivision', ClickConfig>> = {
  electronic: {
    accent: {
      toneFreq: 1800,
      tickFreq: 3600,
      noise: null,
      peak: 1.0,
      attack: 0.001,
      hold: 0.014,
      duration: 0.045,
    },
    regular: {
      toneFreq: 1200,
      tickFreq: 2400,
      noise: null,
      peak: 0.62,
      attack: 0.001,
      hold: 0.011,
      duration: 0.038,
    },
    subdivision: {
      toneFreq: 900,
      tickFreq: null,
      noise: null,
      peak: 0.30,
      attack: 0.0007,
      hold: 0.005,
      duration: 0.025,
    },
  },
  wood: {
    accent: {
      toneFreq: 1000,
      tickFreq: null,
      noise: { freq: 1000, q: 1.0 },
      peak: 1.0,
      attack: 0.001,
      hold: 0.008,
      duration: 0.05,
    },
    regular: {
      toneFreq: null,
      tickFreq: null,
      noise: { freq: 800, q: 1.0 },
      peak: 0.62,
      attack: 0.001,
      hold: 0.006,
      duration: 0.04,
    },
    subdivision: {
      toneFreq: null,
      tickFreq: null,
      noise: { freq: 500, q: 1.0 },
      peak: 0.30,
      attack: 0.001,
      hold: 0.004,
      duration: 0.03,
    },
  },
  metallic: {
    accent: {
      toneFreq: 2000,
      tickFreq: 3350,
      noise: null,
      peak: 1.0,
      attack: 0.001,
      hold: 0.02,
      duration: 0.09,
    },
    regular: {
      toneFreq: 1450,
      tickFreq: 2430,
      noise: null,
      peak: 0.62,
      attack: 0.001,
      hold: 0.015,
      duration: 0.07,
    },
    subdivision: {
      toneFreq: 1100,
      tickFreq: null,
      noise: null,
      peak: 0.30,
      attack: 0.0007,
      hold: 0.008,
      duration: 0.045,
    },
  },
};

export type ClickType = keyof typeof SOUND_PACKS['electronic'];

const DEFAULT_DRIVE = 1.0;
const OUTPUT_TRIM = 1.0;
const SOFT_CLIP_K = 2.0;

function buildSoftClipCurve(k: number): Float32Array<ArrayBuffer> {
  const samples = 2048;
  const curve = new Float32Array(samples);
  const norm = Math.tanh(k);
  for (let i = 0; i < samples; i++) {
    const x = (i / (samples - 1)) * 2 - 1;
    curve[i] = Math.tanh(k * x) / norm;
  }
  return curve;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private softClip: WaveShaperNode | null = null;
  private outputTrim: GainNode | null = null;
  private renderedBuffers: Map<SoundPack, Map<ClickType, AudioBuffer>> = new Map();
  private activePack: SoundPack = 'electronic';
  private keepAliveOscillator: OscillatorNode | null = null;
  private keepAliveGain: GainNode | null = null;
  // Every click queued but not yet finished, so it can be un-scheduled.
  private scheduled: Array<{ source: AudioBufferSourceNode; time: number }> = [];

  public async init() {
    if (this.audioContext) return;

    this.audioContext = new AudioContext({ latencyHint: 'playback' });

    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = DEFAULT_DRIVE;

    this.softClip = this.audioContext.createWaveShaper();
    this.softClip.curve = buildSoftClipCurve(SOFT_CLIP_K);
    this.softClip.oversample = '4x';

    this.outputTrim = this.audioContext.createGain();
    this.outputTrim.gain.value = OUTPUT_TRIM;

    this.masterGain.connect(this.softClip);
    this.softClip.connect(this.outputTrim);
    this.outputTrim.connect(this.audioContext.destination);

    await this.audioContext.resume();
    await this.preRenderClickBuffers();
  }

  private async preRenderClickBuffers() {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;

    for (const [pack, clickTypes] of Object.entries(SOUND_PACKS) as [SoundPack, Record<ClickType, ClickConfig>][]) {
      const packBuffers = new Map<ClickType, AudioBuffer>();

      for (const [type, config] of Object.entries(clickTypes) as [ClickType, ClickConfig][]) {
        const length = Math.ceil(sampleRate * config.duration);
        const offlineCtx = new OfflineAudioContext(1, length, sampleRate);

        const envelope = offlineCtx.createGain();
        const g = envelope.gain;
        g.setValueAtTime(0, 0);
        g.linearRampToValueAtTime(1, config.attack);
        g.setValueAtTime(1, config.attack + config.hold);
        g.exponentialRampToValueAtTime(0.0001, Math.max(config.attack + config.hold + 0.001, config.duration - 0.002));
        g.linearRampToValueAtTime(0, config.duration);
        envelope.connect(offlineCtx.destination);

        if (config.toneFreq) {
          const oscillator = offlineCtx.createOscillator();
          oscillator.type = 'sine';
          oscillator.frequency.value = config.toneFreq;
          oscillator.connect(envelope);
          oscillator.start(0);
        }

        if (config.tickFreq) {
          const tickEnvelope = offlineCtx.createGain();
          const tg = tickEnvelope.gain;
          const tickDuration = Math.min(config.duration, 0.005);
          tg.setValueAtTime(0.25, 0);
          tg.exponentialRampToValueAtTime(0.0001, tickDuration);
          tickEnvelope.connect(offlineCtx.destination);

          const tickOsc = offlineCtx.createOscillator();
          tickOsc.type = 'sine';
          tickOsc.frequency.value = config.tickFreq;
          tickOsc.connect(tickEnvelope);
          tickOsc.start(0);
        }

        if (config.noise) {
          const noiseBuffer = offlineCtx.createBuffer(1, length, sampleRate);
          const noiseData = noiseBuffer.getChannelData(0);
          for (let i = 0; i < length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
          }

          const noise = offlineCtx.createBufferSource();
          noise.buffer = noiseBuffer;

          const filter = offlineCtx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = config.noise.freq;
          filter.Q.value = config.noise.q;

          noise.connect(filter);
          filter.connect(envelope);
          noise.start(0);
        }

        const renderedBuffer = await offlineCtx.startRendering();
        this.conditionBuffer(renderedBuffer, config.peak);
        packBuffers.set(type, renderedBuffer);
      }

      this.renderedBuffers.set(pack, packBuffers);
    }
  }

  private conditionBuffer(buffer: AudioBuffer, peak: number): void {
    const data = buffer.getChannelData(0);

    let maxAbs = 0;
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > maxAbs) maxAbs = abs;
    }
    if (maxAbs === 0) return;

    const normScale = 1 / maxAbs;
    const k = SOFT_CLIP_K;
    const kNorm = Math.tanh(k);

    let clippedMax = 0;
    for (let i = 0; i < data.length; i++) {
      const normalized = data[i] * normScale;
      const clipped = Math.tanh(k * normalized) / kNorm;
      data[i] = clipped;
      const abs = Math.abs(clipped);
      if (abs > clippedMax) clippedMax = abs;
    }

    if (clippedMax === 0) return;
    const finalScale = peak / clippedMax;
    for (let i = 0; i < data.length; i++) {
      data[i] *= finalScale;
    }
  }

  /**
   * Builds the context and pre-renders the click buffers ahead of first playback.
   * Safe to call from a pointerdown handler — it satisfies the user-gesture
   * requirement, so the nine offline renders are done before play is pressed.
   */
  public async warmup() {
    await this.init();
  }

  public async resume() {
    if (!this.audioContext) {
      await this.init();
      return;
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  public async ensureRunning(): Promise<boolean> {
    if (!this.audioContext) return false;
    const state = this.audioContext.state;
    if (state === 'suspended' || (state as string) === 'interrupted') {
      await this.audioContext.resume();
      return true;
    }
    return false;
  }

  public getState(): string {
    return this.audioContext?.state ?? 'closed';
  }

  public setSoundPack(pack: SoundPack) {
    this.activePack = pack;
  }

  public playClick(type: ClickType, time?: number) {
    if (!this.audioContext || !this.masterGain) return;

    const buffer = this.renderedBuffers.get(this.activePack)?.get(type);
    if (!buffer) return;

    const startTime = time ?? this.audioContext.currentTime;
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.masterGain);
    source.onended = () => {
      this.scheduled = this.scheduled.filter(e => e.source !== source);
      source.disconnect();
    };
    source.start(startTime);
    this.scheduled.push({ source, time: startTime });
  }

  /**
   * Un-schedules every click that has not started yet and returns the cutoff used.
   *
   * Calling stop() on a source whose start() is still in the future means it never
   * produces output — that is the cancellation. Clicks already sounding are left
   * alone so they ring out naturally instead of being chopped (which would pop).
   *
   * Callers must reuse the returned cutoff rather than re-reading the clock:
   * rewinding to an earlier point would re-queue a click that was left playing,
   * and you would hear it twice.
   *
   * Returns 0 when there is no AudioContext.
   */
  public cancelPending(): number {
    if (!this.audioContext) return 0;

    const now = this.audioContext.currentTime;
    // baseLatency covers the render quantum that may already be committed —
    // it is sizeable under latencyHint: 'playback'.
    const cutoff = now + Math.max(CANCEL_GUARD, this.getBaseLatency());

    for (const entry of this.scheduled) {
      if (entry.time < cutoff) continue;
      entry.source.onended = null;
      try {
        entry.source.stop();
      } catch {
        // Already ended; disconnect below is what actually matters.
      }
      entry.source.disconnect();
    }

    // Drop cancelled entries, and sweep strays whose onended never arrived
    // (event delivery can be throttled while the tab is hidden).
    this.scheduled = this.scheduled.filter(
      e => e.time < cutoff && e.time > now - STALE_RETENTION
    );

    return cutoff;
  }

  public startKeepAlive() {
    if (!this.audioContext || this.keepAliveOscillator) return;

    this.keepAliveGain = this.audioContext.createGain();
    this.keepAliveGain.gain.value = 0;
    this.keepAliveGain.connect(this.audioContext.destination);

    this.keepAliveOscillator = this.audioContext.createOscillator();
    this.keepAliveOscillator.frequency.value = 200;
    this.keepAliveOscillator.connect(this.keepAliveGain);
    this.keepAliveOscillator.start();
  }

  public stopKeepAlive() {
    if (this.keepAliveOscillator) {
      this.keepAliveOscillator.stop();
      this.keepAliveOscillator.disconnect();
      this.keepAliveOscillator = null;
    }
    if (this.keepAliveGain) {
      this.keepAliveGain.disconnect();
      this.keepAliveGain = null;
    }
  }

  public setMasterVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(4, volume));
    }
  }

  // Both getters must return a finite number. A NaN here propagates into the
  // scheduler's lookahead window, makes its `while` condition permanently false,
  // and silently stops all playback with no error.
  public getBaseLatency(): number {
    const value = this.audioContext?.baseLatency;
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  public getOutputLatency(): number {
    // Not in the TS lib types, and unimplemented in some browsers.
    const context = this.audioContext as (AudioContext & { outputLatency?: number }) | null;
    const value = context?.outputLatency;
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  public getTotalLatency(): number {
    return this.getBaseLatency() + this.getOutputLatency();
  }

  public onDeviceChange(callback: () => void): () => void {
    if (!this.audioContext) return () => {};

    const ac = this.audioContext as any;

    if ('onsinkchange' in ac) {
      ac.addEventListener('sinkchange', callback);
      return () => ac.removeEventListener('sinkchange', callback);
    }

    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', callback);
      return () => navigator.mediaDevices.removeEventListener('devicechange', callback);
    }

    return () => {};
  }

  public getCurrentTime(): number {
    return this.audioContext?.currentTime ?? 0;
  }

  public close() {
    this.cancelPending();
    this.scheduled = [];
    this.stopKeepAlive();
    this.renderedBuffers.clear();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
      this.softClip = null;
      this.outputTrim = null;
    }
  }
}

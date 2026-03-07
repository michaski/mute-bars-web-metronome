export interface ClickConfig {
  noiseFreqRange: [number, number];
  sineFreq: number | null;
  volume: number;
  duration: number;
}

export const CLICK_TYPES: Record<'accent' | 'regular' | 'subdivision', ClickConfig> = {
  accent: {
    noiseFreqRange: [800, 1200],
    sineFreq: 1000,
    volume: 0.8,
    duration: 0.05,
  },
  regular: {
    noiseFreqRange: [600, 1000],
    sineFreq: null,
    volume: 0.5,
    duration: 0.04,
  },
  subdivision: {
    noiseFreqRange: [400, 600],
    sineFreq: null,
    volume: 0.25,
    duration: 0.03,
  },
};

export type ClickType = keyof typeof CLICK_TYPES;

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private renderedBuffers: Map<ClickType, AudioBuffer> = new Map();
  private keepAliveOscillator: OscillatorNode | null = null;
  private keepAliveGain: GainNode | null = null;

  public async init() {
    if (this.audioContext) return;

    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.masterGain.gain.value = 1.0;

    await this.audioContext.resume();
    await this.preRenderClickBuffers();
  }

  private async preRenderClickBuffers() {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;

    for (const [type, config] of Object.entries(CLICK_TYPES)) {
      const length = Math.ceil(sampleRate * config.duration);
      const offlineCtx = new OfflineAudioContext(1, length, sampleRate);

      // Create noise buffer
      const noiseBuffer = offlineCtx.createBuffer(1, length, sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        noiseData[i] = Math.random() * 2 - 1;
      }

      // Noise source -> bandpass filter -> envelope -> destination
      const noise = offlineCtx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = (config.noiseFreqRange[0] + config.noiseFreqRange[1]) / 2;
      filter.Q.value = 1.0;

      const envelope = offlineCtx.createGain();
      envelope.gain.value = 0;
      envelope.gain.setValueAtTime(0, 0);
      envelope.gain.linearRampToValueAtTime(config.volume, 0.001);
      envelope.gain.exponentialRampToValueAtTime(0.01, config.duration);

      noise.connect(filter);
      filter.connect(envelope);
      envelope.connect(offlineCtx.destination);
      noise.start(0);

      // Add sine wave for accent
      if (config.sineFreq) {
        const oscillator = offlineCtx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = config.sineFreq;

        const sineEnvelope = offlineCtx.createGain();
        sineEnvelope.gain.value = 0;
        sineEnvelope.gain.setValueAtTime(0, 0);
        sineEnvelope.gain.linearRampToValueAtTime(config.volume * 0.3, 0.001);
        sineEnvelope.gain.exponentialRampToValueAtTime(0.01, config.duration);

        oscillator.connect(sineEnvelope);
        sineEnvelope.connect(offlineCtx.destination);
        oscillator.start(0);
      }

      const renderedBuffer = await offlineCtx.startRendering();
      this.renderedBuffers.set(type as ClickType, renderedBuffer);
    }
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

  public playClick(type: ClickType, time?: number) {
    if (!this.audioContext || !this.masterGain) return;

    const buffer = this.renderedBuffers.get(type);
    if (!buffer) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.masterGain);
    source.start(time ?? this.audioContext.currentTime);
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
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  public getCurrentTime(): number {
    return this.audioContext?.currentTime ?? 0;
  }

  public close() {
    this.stopKeepAlive();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
    }
  }
}

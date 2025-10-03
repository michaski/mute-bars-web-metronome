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

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 1.0;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  public async resume() {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  public playClick(type: ClickType, time?: number) {
    if (!this.audioContext || !this.masterGain) {
      console.error('Audio context not initialized');
      return;
    }

    const config = CLICK_TYPES[type];
    const now = time ?? this.audioContext.currentTime;

    // Create noise-based click
    this.createNoiseClick(config, now);

    // Add sine wave for accent
    if (config.sineFreq) {
      this.createSineClick(config, now);
    }
  }

  private createNoiseClick(config: ClickConfig, startTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const bufferSize = this.audioContext.sampleRate * config.duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Create source
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    // Bandpass filter to shape the noise
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = (config.noiseFreqRange[0] + config.noiseFreqRange[1]) / 2;
    filter.Q.value = 1.0;

    // Envelope for natural decay
    const envelope = this.audioContext.createGain();
    envelope.gain.value = 0;
    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.linearRampToValueAtTime(config.volume, startTime + 0.001); // Fast attack
    envelope.gain.exponentialRampToValueAtTime(0.01, startTime + config.duration);

    // Connect: noise -> filter -> envelope -> master
    noise.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.masterGain);

    // Play
    noise.start(startTime);
    noise.stop(startTime + config.duration);
  }

  private createSineClick(config: ClickConfig, startTime: number) {
    if (!this.audioContext || !this.masterGain || !config.sineFreq) return;

    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = config.sineFreq;

    // Envelope
    const envelope = this.audioContext.createGain();
    envelope.gain.value = 0;
    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.linearRampToValueAtTime(config.volume * 0.3, startTime + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.01, startTime + config.duration);

    // Connect
    oscillator.connect(envelope);
    envelope.connect(this.masterGain);

    // Play
    oscillator.start(startTime);
    oscillator.stop(startTime + config.duration);
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
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
    }
  }
}

import type { NoteValue, TimingMetrics } from '../types';
import { NOTE_VALUE_MULTIPLIERS, PULSES_PER_BEAT } from './constants.js';

export function calculateTimings(
  bpm: number,
  noteValue: NoteValue,
  mainBeatCount: number
): TimingMetrics {
  const multiplier = NOTE_VALUE_MULTIPLIERS[noteValue];
  const quarterNoteMs = (60 / bpm) * 1000;
  const pulseIntervalMs = quarterNoteMs * multiplier;
  const totalPulses = mainBeatCount * PULSES_PER_BEAT[noteValue];

  return {
    clicksPerBar: totalPulses,
    clicksPerSecond: (1000 / pulseIntervalMs).toFixed(2),
    intervalMs: pulseIntervalMs.toFixed(2),
    barDurationMs: (pulseIntervalMs * totalPulses).toFixed(2),
  };
}

export function clampBpm(bpm: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, bpm));
}

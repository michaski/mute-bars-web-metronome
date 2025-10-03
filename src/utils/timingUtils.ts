import type { NoteValue, TimingMetrics } from '../types';
import { NOTE_VALUE_MULTIPLIERS } from './constants.js';

export function calculateTimings(
  bpm: number, 
  noteValue: NoteValue, 
  beatsCount: number
): TimingMetrics {
  const multiplier = NOTE_VALUE_MULTIPLIERS[noteValue];
  const quarterNoteMs = (60 / bpm) * 1000;
  const intervalMs = quarterNoteMs * multiplier;
  
  return {
    clicksPerBar: beatsCount,
    clicksPerSecond: (1000 / intervalMs).toFixed(2),
    intervalMs: intervalMs.toFixed(2),
    barDurationMs: (intervalMs * beatsCount).toFixed(2),
  };
}

export function clampBpm(bpm: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, bpm));
}

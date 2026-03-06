import type { NoteValue, NoteValueOption } from '../types';

export const NOTE_VALUE_MULTIPLIERS: Record<NoteValue, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
  'triplet-eighth': 1/3,
};

export const PULSES_PER_BEAT: Record<NoteValue, number> = {
  whole: 1,
  half: 1,
  quarter: 1,
  eighth: 2,
  sixteenth: 4,
  'triplet-eighth': 3,
};

export const NOTE_VALUES: NoteValueOption[] = [
  { value: 'whole', label: '𝅝 Whole Note' },
  { value: 'half', label: '𝅗𝅥 Half Note' },
  { value: 'quarter', label: '♩ Quarter Note' },
  { value: 'eighth', label: '♪ Eighth Note' },
  { value: 'sixteenth', label: '𝅘𝅥𝅯 Sixteenth Note' },
  { value: 'triplet-eighth', label: '♪♪♪ Eighth Triplet' },
];

export const MIN_BPM = 20;
export const MAX_BPM = 300;
export const DEFAULT_BPM = 120;
export const DEFAULT_BEATS_COUNT = 4;

// Tempo Search
export const SEARCH_DEBOUNCE_MS = 300;
export const MAX_SEARCH_RESULTS = 10;
export const DEFAULT_TIME_SIGNATURE = 4;

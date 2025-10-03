import type { NoteValue, NoteValueOption } from '../types';

export const NOTE_VALUE_MULTIPLIERS: Record<NoteValue, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
  'triplet-eighth': 1/3,
  'triplet-sixteenth': 1/6,
};

export const NOTE_VALUES: NoteValueOption[] = [
  { value: 'whole', label: '𝅝 Whole Note' },
  { value: 'half', label: '𝅗𝅥 Half Note' },
  { value: 'quarter', label: '♩ Quarter Note' },
  { value: 'eighth', label: '♪ Eighth Note' },
  { value: 'sixteenth', label: '𝅘𝅥𝅯 Sixteenth Note' },
  { value: 'triplet-eighth', label: '♪♪♪ Eighth Triplet' },
  { value: 'triplet-sixteenth', label: '𝅘𝅥𝅯𝅘𝅥𝅯𝅘𝅥𝅯 Sixteenth Triplet' },
];

export const MIN_BPM = 20;
export const MAX_BPM = 400;
export const DEFAULT_BPM = 120;
export const DEFAULT_BEATS_COUNT = 4;

import type { NoteValue, NoteValueOption, SoundPack, SoundPackOption } from '../types';

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

export const SOUND_PACKS_LIST: SoundPackOption[] = [
  { value: 'electronic', label: 'Electronic' },
  { value: 'wood', label: 'Wood' },
  { value: 'metallic', label: 'Metallic' },
];

export const DEFAULT_SOUND_PACK: SoundPack = 'electronic';

export const MIN_BPM = 20;
export const MAX_BPM = 300;
export const DEFAULT_BPM = 120;
export const DEFAULT_BEATS_COUNT = 4;
export const MAX_BEATS_COUNT = 32;

// Scheduler timing (seconds unless noted)
// The lookahead window is deliberately generous: scheduled clicks are revocable
// (see AudioEngine.cancelPending), so a wider window buys dropout headroom on
// mobile/Bluetooth without costing any perceived responsiveness.
export const SCHEDULER_TICK_MS = 25;
export const MIN_SCHEDULE_AHEAD = 0.3;
export const LATENCY_SAFETY = 0.2;
export const ANCHOR_OFFSET = 0.03;
export const CANCEL_GUARD = 0.01;
export const RESYNC_THRESHOLD_MIN = 0.5;
export const RESYNC_THRESHOLD_MARGIN = 0.3;
export const MAX_PULSES_PER_TICK = 1000;
// How long past events are kept before being swept, in both the engine's node
// registry and the hook's event log. Pruning must not depend on rAF, which does
// not run while the tab is hidden.
export const STALE_RETENTION = 1;

// Tempo Search
export const SEARCH_DEBOUNCE_MS = 300;
export const MAX_SEARCH_RESULTS = 10;
export const DEFAULT_TIME_SIGNATURE = 4;

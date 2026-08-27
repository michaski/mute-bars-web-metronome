export type NoteValue =
  | 'whole'
  | 'half'
  | 'quarter'
  | 'eighth'
  | 'sixteenth'
  | 'triplet-eighth';

import type { SoundPack } from '../utils/audioUtils.js';
export type { SoundPack } from '../utils/audioUtils.js';

export type BeatType = 'accent' | 'regular' | 'inactive';

export interface Beat {
  id: number;
  type: BeatType;
}

export interface TimingMetrics {
  clicksPerBar: number;
  clicksPerSecond: string;
  intervalMs: string;
  barDurationMs: string;
}

export interface NoteValueOption {
  value: NoteValue;
  label: string;
}

export interface SoundPackOption {
  value: SoundPack;
  label: string;
}

// Component Props
export interface TempoControlProps {
  bpm: number;
  onBpmChange: (bpm: number) => void;
  /** Called while the tempo slider is being dragged, to mute for the drag. */
  onScrubChange: (active: boolean) => void;
}

export interface BeatPatternProps {
  beats: Beat[];
  onAddBeat: () => void;
  onRemoveBeat: () => void;
  onToggleAccent: (id: number) => void;
  currentBeat: number;
}

export interface NoteValueSelectorProps {
  noteValue: NoteValue;
  onNoteValueChange: (value: NoteValue) => void;
}

export interface SoundPackSettingProps {
  soundPack: SoundPack;
  onSoundPackChange: (value: SoundPack) => void;
}

export interface GapClickControlsProps {
  enabled: boolean;
  barsOn: number;
  barsOff: number;
  onEnabledChange: (value: boolean) => void;
  onBarsOnChange: (value: number) => void;
  onBarsOffChange: (value: number) => void;
}

export interface PlaybackControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  /** Fired on pointerdown so audio can be prepared before the click lands. */
  onWarmup: () => void;
}

// Song Tempo Search
export interface SongSearchResult {
  id: string;
  name: string;
  artist: string;
  bpm: number | null;
  timeSignature: number | null;
  genre: string | null;
}

export interface TempoSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (bpm: number, timeSignature: number) => void;
}

export interface SongCardProps {
  song: SongSearchResult;
  onApply: (bpm: number, timeSignature: number) => void;
}

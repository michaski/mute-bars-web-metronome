export type NoteValue =
  | 'whole'
  | 'half'
  | 'quarter'
  | 'eighth'
  | 'sixteenth'
  | 'triplet-eighth';

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

// Component Props
export interface TempoControlProps {
  bpm: number;
  onBpmChange: (bpm: number) => void;
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

export interface GapClickControlsProps {
  barsOn: number;
  barsOff: number;
  onBarsOnChange: (value: number) => void;
  onBarsOffChange: (value: number) => void;
}

export interface PlaybackControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
}

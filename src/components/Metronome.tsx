import { useState } from 'react';
import type { Beat, BeatType, NoteValue } from '../types/index.js';
import TempoControl from './TempoControl.js';
import BeatPattern from './BeatPattern.js';
import NoteValueSelector from './NoteValueSelector.js';
import PlaybackControls from './PlaybackControls.js';
import GapClickControls from './GapClickControls.js';
import { useMetronome } from '../hooks/useMetronome.js';
import { DEFAULT_BPM, NOTE_VALUE_MULTIPLIERS } from '../utils/constants.js';

export default function Metronome() {
  const [bpm, setBpm] = useState<number>(DEFAULT_BPM);
  const [noteValue, setNoteValue] = useState<NoteValue>('quarter');
  const [beats, setBeats] = useState<Beat[]>([
    { id: 1, type: 'accent' },
    { id: 2, type: 'regular' },
    { id: 3, type: 'regular' },
    { id: 4, type: 'regular' },
  ]);
  const [barsOn, setBarsOn] = useState<number>(3);
  const [barsOff, setBarsOff] = useState<number>(1);
  const [gapClickEnabled, setGapClickEnabled] = useState<boolean>(false);

  // Use the metronome hook
  const { isPlaying, currentBeat, toggle } = useMetronome({
    bpm,
    noteValue,
    beats,
    barsOn,
    barsOff,
    useGapClick: gapClickEnabled && barsOn > 0 && barsOff > 0,
  });

  // Handlers
  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
  };

  const handleAddBeat = () => {
    populateBeats(beats.length + 1);
  };

  const handleRemoveBeat = () => {
    if (beats.length > 1) {
      populateBeats(beats.length - 1);
    }
  };

  const nextBeatType = (current: BeatType): BeatType => {
    if (current === 'regular') return 'accent';
    if (current === 'accent') return 'inactive';
    return 'regular';
  };

  const handleToggleAccent = (id: number) => {
    setBeats(beats.map(beat =>
      beat.id === id ? { ...beat, type: nextBeatType(beat.type) } : beat
    ));
  };

  const handleBarsOnChange = (value: number) => {
    setBarsOn(Math.max(0, value));
  };

  const handleBarsOffChange = (value: number) => {
    setBarsOff(Math.max(0, value));
  };

  const handleNoteValueChange = (value: NoteValue) => {
    const multiplier = NOTE_VALUE_MULTIPLIERS[value];
    if (multiplier > 1) {
      // Half/whole: set non-aligned beats to inactive
      setBeats(prev => prev.map((beat, i) =>
        i % multiplier !== 0
          ? { ...beat, type: 'inactive' as BeatType }
          : beat.type === 'inactive' ? { ...beat, type: 'regular' as BeatType } : beat
      ));
    } else {
      // Quarter or below: restore inactive beats to regular
      setBeats(prev => prev.map(beat =>
        beat.type === 'inactive' ? { ...beat, type: 'regular' as BeatType } : beat
      ));
    }
    setNoteValue(value);
  };

  const populateBeats = (beatCount: number) => {
    const accentedIndexes = new Set(
      beats.map((beat, i) => beat.type === 'accent' ? i : -1).filter(i => i >= 0)
    );

    const newBeats: Beat[] = [];
    for (let i = 0; i < beatCount; i++) {
      newBeats.push({
        id: i + 1,
        type: accentedIndexes.has(i) ? 'accent' : 'regular',
      });
    }
    setBeats(newBeats);
  };

  return (
    <div className="min-h-screen min-h-dvh flex flex-col sm:justify-center bg-gray-900 text-white py-4 sm:py-8 px-4 landscape-compact">
      <div className="max-w-3xl mx-auto w-full flex-1 sm:flex-initial flex flex-col justify-evenly sm:justify-start gap-2 sm:gap-10">

        <TempoControl
          bpm={bpm}
          onBpmChange={handleBpmChange}
        />

        <BeatPattern
          beats={beats}
          currentBeat={currentBeat}
          onAddBeat={handleAddBeat}
          onRemoveBeat={handleRemoveBeat}
          onToggleAccent={handleToggleAccent}
        />

        <NoteValueSelector
          noteValue={noteValue}
          onNoteValueChange={handleNoteValueChange}
        />

        <PlaybackControls
          isPlaying={isPlaying}
          onTogglePlay={toggle}
        />

        <GapClickControls
          enabled={gapClickEnabled}
          barsOn={barsOn}
          barsOff={barsOff}
          onEnabledChange={setGapClickEnabled}
          onBarsOnChange={handleBarsOnChange}
          onBarsOffChange={handleBarsOffChange}
        />

      </div>
    </div>
  );
}

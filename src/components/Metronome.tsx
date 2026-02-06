import { useState } from 'react';
import type { Beat, BeatType, NoteValue } from '../types/index.js';
import TempoControl from './TempoControl.js';
import BeatPattern from './BeatPattern.js';
import NoteValueSelector from './NoteValueSelector.js';
import PlaybackControls from './PlaybackControls.js';
import GapClickControls from './GapClickControls.js';
import { useMetronome } from '../hooks/useMetronome.js';
import { calculateTimings } from '../utils/timingUtils.js';
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
  const [barsOn, setBarsOn] = useState<number>(2);
  const [barsOff, setBarsOff] = useState<number>(2);

  // Use the metronome hook
  const { isPlaying, currentBeat, currentBar, isInGap, toggle } = useMetronome({
    bpm,
    noteValue,
    beats,
    barsOn,
    barsOff,
    useGapClick: barsOn > 0 && barsOff > 0,
  });

  // Calculate timing metrics
  const timings = calculateTimings(bpm, noteValue, beats.length);

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
    if (current === 'accent') return 'regular';
    if (current === 'regular') return 'inactive';
    return 'accent';
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
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4">
      <div className="max-w-3xl mx-auto">

        <TempoControl
          bpm={bpm}
          onBpmChange={handleBpmChange}
        />

        {/* Debug Info */}
        <div className="text-center mb-8 text-sm text-gray-400 space-y-1">
          <div>Clicks per bar: {timings.clicksPerBar}</div>
          <div>Clicks per second: {timings.clicksPerSecond}</div>
          <div>Interval between clicks: {timings.intervalMs}ms</div>
          <div>Bar duration: {timings.barDurationMs}ms</div>
          <div className="mt-2 font-semibold">
            Current: Bar {currentBar + 1}, Beat {currentBeat + 1}
            {isInGap && <span className="text-red-400 ml-2">(GAP - Silent)</span>}
          </div>
        </div>

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
          barsOn={barsOn}
          barsOff={barsOff}
          onBarsOnChange={handleBarsOnChange}
          onBarsOffChange={handleBarsOffChange}
        />

      </div>
    </div>
  );
}

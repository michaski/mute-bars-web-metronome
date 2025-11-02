import { useState } from 'react';
import type { Beat, NoteValue } from '../types/index.js';
import TempoControl from './TempoControl.js';
import BeatPattern from './BeatPattern.js';
import NoteValueSelector from './NoteValueSelector.js';
import PlaybackControls from './PlaybackControls.js';
import GapClickControls from './GapClickControls.js';
import { useMetronome } from '../hooks/useMetronome.js';
import { calculateTimings } from '../utils/timingUtils.js';
import { DEFAULT_BPM, NOTE_VALUE_SUBDIVISIONS_COUNT } from '../utils/constants.js';

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
    const beatCount = beats.filter(b => b.type !== 'subdivision').length; // Exclude subdivisions
    populateBeats(beatCount + 1, noteValue);
  };

  const handleRemoveBeat = () => {
    if (beats.length > 1) {
      const beatCount = beats.filter(b => b.type !== 'subdivision').length; // Exclude subdivisions
      populateBeats(beatCount - 1, noteValue);
    }
  };

  const handleToggleAccent = (id: number) => {
    setBeats(beats.map(beat => 
      beat.id === id ? { ...beat, isAccent: !(beat.type === 'accent') } : beat
    ));
  };

  const handleBarsOnChange = (value: number) => {
    setBarsOn(Math.max(0, value));
  };

  const handleBarsOffChange = (value: number) => {
    setBarsOff(Math.max(0, value));
  };

  const handleNoteValueChange = (value: NoteValue) => {
    setNoteValue(value);
    const beatCount = beats.filter(b => b.type !== 'subdivision').length; // Exclude subdivisions
    populateBeats(beatCount, value);
  }

  const populateBeats = (beatCount: number, subdivision: NoteValue) => {
    const accentedBeatIndexes: number[] = [];
    beats.forEach((beat, index) => {
      if (beat.type === 'accent') {
        accentedBeatIndexes.push(index);
      }
    });
    const newBeats: Beat[] = [];
    for (let i = 0; i < beatCount; i++) {
      const isAccent = accentedBeatIndexes.includes(i);
      newBeats.push({
        id: newBeats.length + 1,
        type: isAccent ? 'accent' : 'regular',
      });
      for (let j = 0; j < (NOTE_VALUE_SUBDIVISIONS_COUNT[subdivision] - 1); j++) {
        newBeats.push({
          id: newBeats.length + 1,
          type: 'subdivision',
        });
      }
    }
    setBeats(newBeats);
  }

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
          noteValue={noteValue}
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

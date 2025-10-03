import { useState, useEffect } from 'react';
import type { Beat, NoteValue } from '../types/index.js';
import TempoControl from './TempoControl.js';
import BeatPattern from './BeatPattern.js';
import NoteValueSelector from './NoteValueSelector.js';
import PlaybackControls from './PlaybackControls.js';
import GapClickControls from './GapClickControls.js';
import { calculateTimings } from '../utils/timingUtils.js';
import { DEFAULT_BPM } from '../utils/constants.js';

export default function Metronome() {
  const [bpm, setBpm] = useState<number>(DEFAULT_BPM);
  const [noteValue, setNoteValue] = useState<NoteValue>('quarter');
  const [beats, setBeats] = useState<Beat[]>([
    { id: 1, isAccent: true },
    { id: 2, isAccent: false },
    { id: 3, isAccent: false },
    { id: 4, isAccent: false },
  ]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [barsOn, setBarsOn] = useState<number>(2);
  const [barsOff, setBarsOff] = useState<number>(2);

  // Calculate timing metrics
  const timings = calculateTimings(bpm, noteValue, beats.length);

  // Log tempo changes
  useEffect(() => {
    console.log('Tempo updated:', {
      bpm,
      noteValue,
      beatsInPattern: beats.length,
      ...timings
    });
  }, [bpm, noteValue, beats.length, timings]);

  // Handlers
  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
  };

  const handleAddBeat = () => {
    const newId = Math.max(...beats.map(b => b.id)) + 1;
    setBeats([...beats, { id: newId, isAccent: false }]);
  };

  const handleRemoveBeat = () => {
    if (beats.length > 1) {
      setBeats(beats.slice(0, -1));
    }
  };

  const handleToggleAccent = (id: number) => {
    setBeats(beats.map(beat => 
      beat.id === id ? { ...beat, isAccent: !beat.isAccent } : beat
    ));
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleBarsOnChange = (value: number) => {
    setBarsOn(Math.max(0, value));
  };

  const handleBarsOffChange = (value: number) => {
    setBarsOff(Math.max(0, value));
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
        </div>

        <BeatPattern 
          beats={beats}
          onAddBeat={handleAddBeat}
          onRemoveBeat={handleRemoveBeat}
          onToggleAccent={handleToggleAccent}
        />

        <NoteValueSelector 
          noteValue={noteValue}
          onNoteValueChange={setNoteValue}
        />

        <PlaybackControls 
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
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
import React from 'react'
import TempoControl from './TempoControl';
import BeatPattern from './BeatPattern';
import NoteValueSelector from './NoteValueSelector';
import PlaybackControls from './PlaybackControls';
import GapClickControls from './GapClickControls';

export default function Metronome() {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <TempoControl />
        <BeatPattern />
        <NoteValueSelector />
        <PlaybackControls />
        <GapClickControls />
      </div>
    </div>
  );
}

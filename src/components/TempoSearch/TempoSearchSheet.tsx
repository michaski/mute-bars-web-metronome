import { useRef, useEffect } from 'react';
import type { TempoSearchSheetProps, SongSearchResult } from '../../types/index.js';
import { useTempoSearch } from '../../hooks/useTempoSearch.js';
import { useBottomSheet } from '../../hooks/useBottomSheet.js';
import SearchInput from './SearchInput.js';
import SongCard from './SongCard.js';

const MOCK_SONGS: SongSearchResult[] = [
  { id: '1', name: 'Blinding Lights', artist: 'The Weeknd', bpm: 171, timeSignature: 4, genre: 'Synth-pop' },
  { id: '2', name: 'Shape of You', artist: 'Ed Sheeran', bpm: 96, timeSignature: 4, genre: 'Pop' },
  { id: '3', name: 'Bohemian Rhapsody', artist: 'Queen', bpm: null, timeSignature: null, genre: 'Rock' },
  { id: '4', name: 'Take Five', artist: 'Dave Brubeck Quartet', bpm: 172, timeSignature: 5, genre: 'Jazz' },
];

export default function TempoSearchSheet({ isOpen, onClose, onApply }: TempoSearchSheetProps) {
  const { query, setQuery, results, isLoading, error, reset } = useTempoSearch();
  const { sheetRef, isVisible, sheetStyle, backdropStyle, dragHandlers } = useBottomSheet(isOpen, onClose);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input when sheet opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 350);
    } else {
      reset();
    }
  }, [isOpen]);

  const handleApply = (bpm: number, timeSignature: number) => {
    onApply(bpm, timeSignature);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        style={backdropStyle}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-gray-800 rounded-t-2xl max-h-[75vh] flex flex-col"
        style={sheetStyle}
        role="dialog"
        aria-modal="true"
        aria-label="Song tempo search"
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          {...dragHandlers}
        >
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4">
          <h2 className="text-lg font-bold text-white mb-3">Find Song Tempo</h2>
          <SearchInput value={query} onChange={setQuery} inputRef={inputRef} />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-400 text-sm">{error}</p>
              <p className="text-gray-500 text-xs mt-1">Check your API keys in .env</p>
            </div>
          )}

          {!isLoading && !error && results.length === 0 && query.trim() && (
            <p className="text-center text-gray-500 py-8">No results found</p>
          )}

          {!isLoading && !error && results.length === 0 && !query.trim() && (
            <div className="flex flex-col gap-3">
              {MOCK_SONGS.map((song) => (
                <SongCard key={song.id} song={song} onApply={handleApply} />
              ))}
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="flex flex-col gap-3">
              {results.map((song) => (
                <SongCard key={song.id} song={song} onApply={handleApply} />
              ))}
            </div>
          )}
        </div>

        {/* Attribution */}
        <div className="px-5 py-3 border-t border-gray-700 flex-shrink-0 text-xs text-gray-500">
          Powered by 
          <a
            href="https://getsongbpm.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 ml-1 hover:text-gray-400 transition-colors"
          >
            GetSongBPM
          </a>
        </div>
      </div>
    </div>
  );
}

import type { SongCardProps } from '../../types/index.js';
import { DEFAULT_TIME_SIGNATURE } from '../../utils/constants.js';

export default function SongCard({ song, onApply }: SongCardProps) {
  const hasBpm = song.bpm !== null;
  const timeSignature = song.timeSignature ?? DEFAULT_TIME_SIGNATURE;

  return (
    <div className="flex items-center gap-3 p-4 bg-gray-750 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors">
      {/* Song Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold truncate">{song.name}</h3>
        <p className="text-gray-400 text-sm truncate">{song.artist}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {hasBpm ? (
            <span className="text-xs font-bold px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full">
              {song.bpm} BPM
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 bg-gray-600 text-gray-400 rounded-full">
              BPM N/A
            </span>
          )}
          <span className="text-xs px-2 py-0.5 bg-gray-600 text-gray-300 rounded-full">
            {timeSignature}/4
          </span>
          {song.genre && (
            <span className="text-xs px-2 py-0.5 bg-gray-600 text-gray-300 rounded-full truncate max-w-24">
              {song.genre}
            </span>
          )}
        </div>
      </div>

      {/* Apply Button */}
      <button
        onClick={() => hasBpm && onApply(song.bpm!, timeSignature)}
        disabled={!hasBpm}
        className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
          hasBpm
            ? 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
        aria-label={hasBpm ? `Apply ${song.bpm} BPM in ${timeSignature}/4 time` : 'BPM not available'}
      >
        Apply
      </button>
    </div>
  );
}

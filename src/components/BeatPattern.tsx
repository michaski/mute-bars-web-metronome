import type { BeatPatternProps } from '../types';

export default function BeatPattern({
  beats,
  currentBeat,
  onAddBeat,
  onRemoveBeat,
  onToggleAccent
}: BeatPatternProps) {
  return (
    <div className="flex items-center gap-3 sm:mb-12">
      <button
        onClick={onRemoveBeat}
        disabled={beats.length <= 1}
        className="w-12 h-12 rounded-full border-2 border-gray-600 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xl flex-shrink-0 transition-colors"
      >
        −
      </button>

      <div className="flex-1 overflow-x-auto">
        <div className="flex items-center justify-center gap-4 min-w-min px-4">
          {beats.map((beat, index) => {
            const isCurrentBeat = index === currentBeat;
            const isAccent = beat.type === 'accent';
            const isInactive = beat.type === 'inactive';

            return (
              <button
                key={beat.id}
                onClick={() => onToggleAccent(beat.id)}
                className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all cursor-pointer
                  ${isInactive
                    ? 'border-gray-700 opacity-30'
                    : isAccent
                      ? 'border-orange-500'
                      : 'border-gray-500'
                  }
                  ${isCurrentBeat && !isInactive
                    ? 'bg-orange-500'
                    : ''
                  }
                `}
                title={`Beat ${index + 1}: ${isInactive ? 'Inactive' : isAccent ? 'Accent' : 'Regular'} - Click to toggle`}
              />
            );
          })}
        </div>
      </div>

      <button
        onClick={onAddBeat}
        className="w-12 h-12 rounded-full border-2 border-gray-600 hover:border-gray-500 flex items-center justify-center text-xl flex-shrink-0 transition-colors"
      >
        +
      </button>
    </div>
  );
}

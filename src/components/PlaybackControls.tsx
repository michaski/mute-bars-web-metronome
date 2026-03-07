import type { PlaybackControlsProps } from '../types';

export default function PlaybackControls({ isPlaying, onTogglePlay }: PlaybackControlsProps) {
  return (
    <div className="flex justify-center sm:mb-20">
      <button 
        onClick={onTogglePlay}
        className="w-24 h-24 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
      >
        {isPlaying ? (
          // Pause icon (two vertical bars)
          <div className="flex gap-2">
            <div className="w-2 h-9 bg-orange-500 rounded"></div>
            <div className="w-2 h-9 bg-orange-500 rounded"></div>
          </div>
        ) : (
          // Play icon (triangle)
          <div className="w-0 h-0 border-l-[28px] border-l-orange-500 border-t-[18px] border-t-transparent border-b-[18px] border-b-transparent ml-2"></div>
        )}
      </button>
    </div>
  );
}

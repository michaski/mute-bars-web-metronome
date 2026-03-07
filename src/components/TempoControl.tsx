import { useState } from 'react';
import type { TempoControlProps } from '../types';
import { MIN_BPM, MAX_BPM } from '../utils/constants.js';

export default function TempoControl({ bpm, onBpmChange }: TempoControlProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(bpm.toString());

  const handleIncrement = () => onBpmChange(Math.min(bpm + 1, MAX_BPM));
  const handleDecrement = () => onBpmChange(Math.max(bpm - 1, MIN_BPM));

  const handleClick = () => {
    setIsEditing(true);
    setInputValue(bpm.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    const numValue = parseInt(inputValue);
    if (!isNaN(numValue)) {
      onBpmChange(Math.max(MIN_BPM, Math.min(MAX_BPM, numValue)));
    } else {
      setInputValue(bpm.toString());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setInputValue(bpm.toString());
      setIsEditing(false);
    }
  };

  return (
    <>
      {/* Large BPM Display */}
      <div className="text-center sm:mb-16">
        <div className="text-8xl font-bold text-orange-500 mb-2 relative inline-block">
          {isEditing ? (
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              className="bg-transparent border-b-4 border-orange-500 outline-none text-center w-48"
            />
          ) : (
            <span
              onClick={handleClick}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              {bpm}
            </span>
          )}
          <span className="text-3xl absolute -right-18 bottom-3 text-orange-400">BPM</span>
        </div>
      </div>

      {/* Tempo Slider with +/- buttons */}
      <div className="flex items-center gap-6 sm:mb-16">
        <button 
          onClick={handleDecrement}
          className="w-16 h-16 rounded-full border-2 border-gray-600 hover:border-gray-500 flex items-center justify-center text-2xl transition-colors cursor-pointer"
        >
          −
        </button>
        
        <div className="flex-1">
          <input 
            type="range" 
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={(e) => onBpmChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #f97316 0%, #f97316 ${((bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 100}%, #374151 ${((bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 100}%, #374151 100%)`
            }}
          />
        </div>
        
        <button 
          onClick={handleIncrement}
          className="w-16 h-16 rounded-full border-2 border-gray-600 hover:border-gray-500 flex items-center justify-center text-2xl transition-colors cursor-pointer"
        >
          +
        </button>
      </div>
    </>
  );
}

import type { GapClickControlsProps } from '../types';

export default function GapClickControls({ 
  barsOn, 
  barsOff, 
  onBarsOnChange, 
  onBarsOffChange 
}: GapClickControlsProps) {
  const handleBarsOnIncrement = () => onBarsOnChange(barsOn + 1);
  const handleBarsOnDecrement = () => onBarsOnChange(Math.max(0, barsOn - 1));
  const handleBarsOffIncrement = () => onBarsOffChange(barsOff + 1);
  const handleBarsOffDecrement = () => onBarsOffChange(Math.max(0, barsOff - 1));

  return (
    <div className="mb-16">
      <div className="text-center text-gray-400 mb-4 text-sm">
        Gap Click Exercise
        {barsOn === 0 && barsOff === 0 && (
          <span className="ml-2 text-gray-500">(Disabled)</span>
        )}
      </div>
      <div className="flex justify-center items-center gap-8">
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">Bars On:</span>
          <button 
            onClick={handleBarsOnDecrement}
            className="w-10 h-10 rounded-full border-2 border-gray-600 hover:border-gray-500 flex items-center justify-center text-lg transition-colors"
          >
            −
          </button>
          <div className="text-xl font-semibold w-8 text-center">{barsOn}</div>
          <button 
            onClick={handleBarsOnIncrement}
            className="w-10 h-10 rounded-full border-2 border-gray-600 hover:border-gray-500 flex items-center justify-center text-lg transition-colors"
          >
            +
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">Bars Off:</span>
          <button 
            onClick={handleBarsOffDecrement}
            className="w-10 h-10 rounded-full border-2 border-gray-600 hover:border-gray-500 flex items-center justify-center text-lg transition-colors"
          >
            −
          </button>
          <div className="text-xl font-semibold w-8 text-center">{barsOff}</div>
          <button 
            onClick={handleBarsOffIncrement}
            className="w-10 h-10 rounded-full border-2 border-gray-600 hover:border-gray-500 flex items-center justify-center text-lg transition-colors"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

import type { GapClickControlsProps } from '../types';

export default function GapClickControls({
  enabled,
  barsOn,
  barsOff,
  onEnabledChange,
  onBarsOnChange,
  onBarsOffChange
}: GapClickControlsProps) {
  const handleBarsOnIncrement = () => onBarsOnChange(barsOn + 1);
  const handleBarsOnDecrement = () => onBarsOnChange(Math.max(1, barsOn - 1));
  const handleBarsOffIncrement = () => onBarsOffChange(barsOff + 1);
  const handleBarsOffDecrement = () => onBarsOffChange(Math.max(0, barsOff - 1));

  return (
    <div>
      <div className="flex justify-center items-center gap-3 mb-4">
        <span className="text-gray-400 text-md">Mute Bars</span>
        <button
          role="switch"
          aria-checked={enabled}
          onClick={() => onEnabledChange(!enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            enabled ? 'bg-blue-600' : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      <div className={`flex justify-center items-center gap-8 transition-opacity ${enabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
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

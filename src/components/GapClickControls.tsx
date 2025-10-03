import React from 'react'
import type { GapClickControlsProps } from '../types'

export default function GapClickControls({barsOn, barsOff, onBarsOnChange, onBarsOffChange}: GapClickControlsProps) {
  return (
    <div>
        {/* Gap Click Controls */}
        <div className="mb-16">
          <div className="text-center text-gray-400 mb-4 text-sm">Gap Click Exercise</div>
          <div className="flex justify-center items-center gap-8">
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm">Bars On:</span>
              <button className="w-10 h-10 rounded-full border-2 border-gray-600 hover:border-gray-500 flex items-center justify-center text-lg cursor-pointer" onClick={() => onBarsOnChange(barsOn - 1)}>
                −
              </button>
              <div className="text-xl font-semibold w-8 text-center">{barsOn}</div>
              <button className="w-10 h-10 rounded-full border-2 border-gray-600 hover:border-gray-500 flex items-center justify-center text-lg cursor-pointer" onClick={() => onBarsOnChange(barsOn + 1)}>
                +
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm">Bars Off:</span>
              <button className="w-10 h-10 rounded-full border-2 border-gray-600 hover:border-gray-500 flex items-center justify-center text-lg cursor-pointer" onClick={() => onBarsOffChange(barsOff - 1)}>
                −
              </button>
              <div className="text-xl font-semibold w-8 text-center">{barsOff}</div>
              <button className="w-10 h-10 rounded-full border-2 border-gray-600 hover:border-gray-500 flex items-center justify-center text-lg cursor-pointer" onClick={() => onBarsOffChange(barsOff + 1)}>
                +
              </button>
            </div>
          </div>
        </div>
    </div>
  )
}

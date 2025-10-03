import React from 'react'
import type { BeatPatternProps } from '../types'

export default function BeatPattern({beats, onAddBeat, onRemoveBeat, onToggleAccent, currentBeat}: BeatPatternProps) {
  return (
    <div>
        {/* Beat Pattern Visualization */}
        <div className="flex items-center gap-3 mb-12">
          <button className="w-12 h-12 rounded-full border-2 border-gray-600 hover:border-gray-500 flex items-center justify-center text-xl flex-shrink-0 cursor-pointer"
            onClick={onRemoveBeat}>
            −
          </button>
          
          <div className="flex-1 overflow-x-auto">
            <div className="flex items-center justify-center gap-4 min-w-min px-4">
              {
                beats.map((beat, index) => (
                  <div 
                    key={beat.id} 
                    className={ "w-4 h-4 rounded-full border-2 border-gray-500 flex-shrink-0 cursor-pointer" + (currentBeat === beat.id ? " bg-orange-500" : beat.isAccent ? " bg-gray-400" : "") }
                    title='Toggle Accent'
                    onClick={() => onToggleAccent(beat.id)}>
                  </div>
                ))

              }
            </div>
          </div>
          
          <button className="w-12 h-12 rounded-full border-2 border-gray-600 hover:border-gray-500 flex items-center justify-center text-xl flex-shrink-0 cursor-pointer"
            onClick={onAddBeat}>
            +
          </button>
        </div>
    </div>
  )
}

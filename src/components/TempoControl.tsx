import React from 'react'

export default function TempoControl() {
  return (
    <div>
        {/* Large BPM Display */}
        <div className="text-center mb-16">
          <div className="text-8xl font-bold text-orange-500 mb-2">
            120
            <span className="text-4xl ml-4">BPM</span>
          </div>
        </div>

        {/* Tempo Slider with +/- buttons */}
        <div className="flex items-center gap-6 mb-16">
          <button className="w-16 h-16 rounded-full border-2 border-gray-600 hover:border-gray-500 flex items-center justify-center text-2xl">
            −
          </button>
          
          <div className="flex-1">
            <input 
              type="range" 
              min="40" 
              max="300" 
              defaultValue="120"
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <button className="w-16 h-16 rounded-full border-2 border-gray-600 hover:border-gray-500 flex items-center justify-center text-2xl">
            +
          </button>
        </div>
    </div>
  )
}

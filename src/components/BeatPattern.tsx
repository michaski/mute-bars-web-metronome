import React from 'react'

export default function BeatPattern() {
  return (
    <div>
        {/* Beat Pattern Visualization */}
        <div className="flex items-center gap-3 mb-12">
          <button className="w-12 h-12 rounded-full border-2 border-gray-600 hover:border-gray-500 flex items-center justify-center text-xl flex-shrink-0">
            −
          </button>
          
          <div className="flex-1 overflow-x-auto">
            <div className="flex items-center justify-center gap-4 min-w-min px-4">
              <div className="w-4 h-4 rounded-full border-2 border-gray-500 flex-shrink-0"></div>
              <div className="w-4 h-4 rounded-full border-2 border-gray-500 flex-shrink-0"></div>
              <div className="w-4 h-4 rounded-full border-2 border-gray-500 flex-shrink-0"></div>
              <div className="w-4 h-4 rounded-full border-2 border-gray-500 flex-shrink-0"></div>
              <div className="w-4 h-4 rounded-full border-2 border-gray-500 flex-shrink-0"></div>
              <div className="w-4 h-4 rounded-full border-2 border-gray-500 flex-shrink-0"></div>
              <div className="w-4 h-4 rounded-full border-2 border-gray-500 flex-shrink-0"></div>
              <div className="w-4 h-4 rounded-full border-2 border-gray-500 flex-shrink-0"></div>
            </div>
          </div>
          
          <button className="w-12 h-12 rounded-full border-2 border-gray-600 hover:border-gray-500 flex items-center justify-center text-xl flex-shrink-0">
            +
          </button>
        </div>
    </div>
  )
}

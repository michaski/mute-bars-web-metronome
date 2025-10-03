import React from 'react'

export default function GapClickControls() {
  return (
    <div>
        {/* Gap Click Controls */}
        <div className="mb-16">
          <div className="text-center text-gray-400 mb-4 text-sm">Gap Click Exercise</div>
          <div className="flex justify-center items-center gap-8">
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm">Bars On:</span>
              <button className="w-10 h-10 rounded-full border-2 border-gray-600 hover:border-gray-500 flex items-center justify-center text-lg">
                −
              </button>
              <div className="text-xl font-semibold w-8 text-center">2</div>
              <button className="w-10 h-10 rounded-full border-2 border-gray-600 hover:border-gray-500 flex items-center justify-center text-lg">
                +
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm">Bars Off:</span>
              <button className="w-10 h-10 rounded-full border-2 border-gray-600 hover:border-gray-500 flex items-center justify-center text-lg">
                −
              </button>
              <div className="text-xl font-semibold w-8 text-center">2</div>
              <button className="w-10 h-10 rounded-full border-2 border-gray-600 hover:border-gray-500 flex items-center justify-center text-lg">
                +
              </button>
            </div>
          </div>
        </div>
    </div>
  )
}

import React from 'react'

export default function PlaybackControls() {
  return (
    <div>
        {/* Play Button */}
        <div className="flex justify-center mb-20">
          <button className="w-24 h-24 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-lg">
            <div className="w-0 h-0 border-l-[20px] border-l-orange-500 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1"></div>
          </button>
        </div>
    </div>
  )
}

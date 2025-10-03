import React from 'react'

export default function 
() {
  return (
    <div>
        {/* Note Value Selector */}
        <div className="flex justify-center mb-20">
          <select className="px-6 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-lg hover:border-gray-600 focus:border-orange-500 focus:outline-none cursor-pointer">
            <option value="whole">𝅝 Whole Note</option>
            <option value="half">𝅗𝅥 Half Note</option>
            <option value="quarter" selected>♩ Quarter Note</option>
            <option value="eighth">♪ Eighth Note</option>
            <option value="sixteenth">𝅘𝅥𝅯 Sixteenth Note</option>
            <option value="triplet-eighth">♪♪♪ Eighth Triplet</option>
            <option value="triplet-sixteenth">𝅘𝅥𝅯𝅘𝅥𝅯𝅘𝅥𝅯 Sixteenth Triplet</option>
          </select>
        </div>
    </div>
  )
}

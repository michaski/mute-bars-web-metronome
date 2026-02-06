import type { NoteValueSelectorProps, NoteValue } from '../types';
import { NOTE_VALUES } from '../utils/constants.js';

export default function NoteValueSelector({ noteValue, onNoteValueChange }: NoteValueSelectorProps) {
  return (
    <div>
        {/* Note Value Selector */}
        <div className="flex justify-center mb-20">
          <select 
            value={noteValue}
            onChange={(e) => onNoteValueChange(e.target.value as NoteValue)}
            className="px-6 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-lg hover:border-gray-600 focus:border-orange-500 focus:outline-none cursor-pointer"
          >
            {NOTE_VALUES.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
    </div>
  )
}

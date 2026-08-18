import type { SoundPackSettingProps } from '../../types';
import { SOUND_PACKS_LIST } from '../../utils/constants.js';
import SettingsRow from './SettingsRow.js';

export default function SoundPackSetting({ soundPack, onSoundPackChange }: SoundPackSettingProps) {
  return (
    <SettingsRow label="Sound">
      <select
        value={soundPack}
        onChange={event => onSoundPackChange(event.target.value as typeof soundPack)}
        className="bg-gray-700 text-gray-200 text-sm sm:text-base rounded px-2 py-1 border border-gray-600 hover:border-gray-500 focus:outline-none focus:border-orange-500 cursor-pointer"
      >
        {SOUND_PACKS_LIST.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </SettingsRow>
  );
}

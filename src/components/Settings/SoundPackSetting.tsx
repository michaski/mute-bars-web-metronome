import type { SoundPackSettingProps } from '../../types';
import { SOUND_PACKS_LIST } from '../../utils/constants.js';
import SettingsSection from './SettingsSection.js';
import SettingsOption from './SettingsOption.js';

export default function SoundPackSetting({ soundPack, onSoundPackChange }: SoundPackSettingProps) {
  return (
    <SettingsSection title="Click Sound">
      {SOUND_PACKS_LIST.map(option => (
        <SettingsOption
          key={option.value}
          label={option.label}
          selected={option.value === soundPack}
          onClick={() => onSoundPackChange(option.value)}
        />
      ))}
    </SettingsSection>
  );
}

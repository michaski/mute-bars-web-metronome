interface SettingsOptionProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export default function SettingsOption({ label, selected, onClick }: SettingsOptionProps) {
  return (
    <button
      role="menuitemradio"
      aria-checked={selected}
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm sm:text-base hover:bg-gray-700 transition-colors cursor-pointer ${
        selected ? 'text-orange-500' : 'text-gray-200'
      }`}
    >
      {label}
      {selected && <span aria-hidden="true">✓</span>}
    </button>
  );
}

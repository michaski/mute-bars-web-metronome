import type { ReactNode } from 'react';

interface SettingsRowProps {
  label: string;
  children: ReactNode;
}

export default function SettingsRow({ label, children }: SettingsRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="text-sm sm:text-base text-gray-200">{label}</span>
      {children}
    </div>
  );
}

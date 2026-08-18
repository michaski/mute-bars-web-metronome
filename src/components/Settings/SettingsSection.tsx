import type { ReactNode } from 'react';

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

export default function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <div className="py-1">
      <div className="px-3 pt-1.5 pb-1 text-xs uppercase tracking-wide text-gray-500">
        {title}
      </div>
      {children}
    </div>
  );
}

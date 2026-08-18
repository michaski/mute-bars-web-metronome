import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useBottomSheet } from '../../hooks/useBottomSheet.js';

interface SettingsPopoverProps {
  children: ReactNode;
}

export default function SettingsPopover({ children }: SettingsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const close = () => setIsOpen(false);
  const { sheetRef, isVisible, sheetStyle, backdropStyle, dragHandlers } = useBottomSheet(isOpen, close);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideContainer = containerRef.current?.contains(target);
      const insideSheet = sheetRef.current?.contains(target);
      if (!insideContainer && !insideSheet) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, sheetRef]);

  return (
    <>
      <div ref={containerRef} className="fixed top-4 right-4 z-40">
        <button
          onClick={() => setIsOpen(prev => !prev)}
          aria-label="Settings"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gray-800 border-2 border-gray-700 hover:border-gray-600 flex items-center justify-center transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" fill="none" viewBox="0 0 24 24">
            <path
              d="M12 15a3 3 0 100-6 3 3 0 000 6z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Desktop/tablet dropdown */}
        {isOpen && (
          <div
            role="menu"
            aria-label="Settings"
            className="hidden sm:block absolute right-0 top-full mt-3 w-72 bg-gray-800 border-2 border-gray-700 rounded-lg shadow-lg overflow-hidden"
          >
            <div className="px-4 pt-3 pb-2 text-xs uppercase tracking-wide text-gray-500 border-b border-gray-700">
              Settings
            </div>
            <div className="divide-y divide-gray-700">{children}</div>
          </div>
        )}
      </div>

      {/* Mobile bottom sheet */}
      {isVisible && (
        <div className="sm:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60"
            style={backdropStyle}
            onClick={close}
          />
          <div
            ref={sheetRef}
            className="absolute bottom-0 left-0 right-0 bg-gray-800 rounded-t-2xl max-h-[75vh] flex flex-col"
            style={sheetStyle}
            role="menu"
            aria-label="Settings"
          >
            <div
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              {...dragHandlers}
            >
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>
            <div className="px-4 pb-2 text-xs uppercase tracking-wide text-gray-500 border-b border-gray-700">
              Settings
            </div>
            <div className="divide-y divide-gray-700 overflow-y-auto">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}

interface TempoSearchFABProps {
  onClick: () => void;
}

export default function TempoSearchFAB({ onClick }: TempoSearchFABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 rounded-full shadow-lg shadow-orange-500/25 flex items-center justify-center transition-colors cursor-pointer"
      aria-label="Search song tempo"
    >
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24">
        {/* Magnifying glass with music note */}
        <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M14.5 14.5L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 8V12.5C12 13.3 11.3 14 10.5 14C9.7 14 9 13.3 9 12.5C9 11.7 9.7 11 10.5 11C10.7 11 10.9 11.05 11 11.1V7H13V8H12Z" fill="currentColor" />
      </svg>
    </button>
  );
}

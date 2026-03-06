import { useState, useEffect } from 'react';
import type { SongSearchResult } from '../types/index.js';
import { search } from '../services/tempoSearchService.js';
import { SEARCH_DEBOUNCE_MS } from '../utils/constants.js';

export function useTempoSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SongSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const data = await search(trimmed);
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      setIsLoading(false);
    };
  }, [query]);

  const reset = () => {
    setQuery('');
    setResults([]);
    setError(null);
  };

  return { query, setQuery, results, isLoading, error, reset };
}

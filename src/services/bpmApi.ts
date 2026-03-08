import type { SongSearchResult } from '../types/index.js';
import { MAX_SEARCH_RESULTS } from '../utils/constants.js';

export async function searchSongs(query: string): Promise<SongSearchResult[]> {
  const apiKey = import.meta.env.VITE_GETSONGBPM_API_KEY;

  if (!apiKey) {
    return [];
  }

  const lookup = `song:${query}`;
  const response = await fetch(
    `/api/getsongbpm/search/?api_key=${encodeURIComponent(apiKey)}&type=song&lookup=${encodeURIComponent(lookup)}`
  );

  if (!response.ok) {
    throw new Error('GetSongBPM search failed');
  }

  const data = await response.json();
  const songs: unknown[] = data.search ?? [];

  return songs.slice(0, MAX_SEARCH_RESULTS).map((song: any, i: number) => ({
    id: song.song_id ? String(song.song_id) : `${i}-${song.song_title}`,
    name: song.song_title ?? 'Unknown Title',
    artist: song.artist?.name ?? 'Unknown Artist',
    bpm: song.tempo ? Math.round(Number(song.tempo)) : null,
    timeSignature: song.time_sig ? parseInt(song.time_sig, 10) : null,
    genre: song.artist?.genres?.length > 0 ? song.artist.genres[0] : null,
  }));
}

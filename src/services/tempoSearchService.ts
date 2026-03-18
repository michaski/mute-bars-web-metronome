import type { SongSearchResult } from '../types/index.js';
import { searchSongs } from './spotifyApi.js';

export async function search(query: string): Promise<SongSearchResult[]> {
  return searchSongs(query);
}

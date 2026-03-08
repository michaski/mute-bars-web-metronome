import type { SongSearchResult } from '../types/index.js';
import { searchSongs } from './bpmApi.js';

export async function search(query: string): Promise<SongSearchResult[]> {
  return searchSongs(query);
}

import type { SongSearchResult } from '../types/index.js';
import { searchTracks } from './spotifyApi.js';
import { lookupBpm } from './bpmApi.js';

export async function search(query: string): Promise<SongSearchResult[]> {
  const tracks = await searchTracks(query);

  const bpmResults = await Promise.allSettled(
    tracks.map((track) => lookupBpm(track.name, track.artist))
  );

  return tracks.map((track, i) => {
    const bpmResult = bpmResults[i].status === 'fulfilled' ? bpmResults[i].value : null;

    return {
      id: track.id,
      name: track.name,
      artist: track.artist,
      albumArt: track.albumArt,
      bpm: bpmResult?.bpm ?? null,
      timeSignature: bpmResult?.timeSignature ?? null,
      genre: bpmResult?.genre ?? null,
    };
  });
}

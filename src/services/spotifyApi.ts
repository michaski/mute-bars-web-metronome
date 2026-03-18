import type { SongSearchResult } from '../types/index.js';
import { MAX_SEARCH_RESULTS } from '../utils/constants.js';

let accessToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify API credentials not configured');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to authenticate with Spotify');
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return accessToken;
}

export async function searchSongs(query: string): Promise<SongSearchResult[]> {
  const token = await getAccessToken();

  const searchResponse = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${MAX_SEARCH_RESULTS}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!searchResponse.ok) {
    throw new Error('Spotify search failed');
  }

  const searchData = await searchResponse.json();
  const tracks: any[] = searchData.tracks?.items ?? [];

  if (tracks.length === 0) return [];

  // Fetch audio features for BPM and time signature
  const trackIds = tracks.map((t: any) => t.id).join(',');
  const featuresResponse = await fetch(
    `https://api.spotify.com/v1/audio-features?ids=${trackIds}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  let featuresMap: Record<string, { tempo: number; time_signature: number }> = {};
  if (featuresResponse.ok) {
    const featuresData = await featuresResponse.json();
    for (const f of featuresData.audio_features ?? []) {
      if (f) {
        featuresMap[f.id] = { tempo: f.tempo, time_signature: f.time_signature };
      }
    }
  }

  return tracks.map((track: any) => {
    const features = featuresMap[track.id];
    const albumImages: any[] = track.album?.images ?? [];
    // Pick the smallest image that's at least 64px, or fallback to last
    const cover = albumImages.length > 0
      ? (albumImages.find((img: any) => img.width <= 128) ?? albumImages[albumImages.length - 1])?.url
      : null;

    return {
      id: track.id,
      name: track.name ?? 'Unknown Title',
      artist: track.artists?.map((a: any) => a.name).join(', ') ?? 'Unknown Artist',
      bpm: features ? Math.round(features.tempo) : null,
      timeSignature: features?.time_signature ?? null,
      genre: null,
      albumCover: cover ?? null,
    };
  });
}

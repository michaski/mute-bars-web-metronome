import { MAX_SEARCH_RESULTS } from '../utils/constants.js';

interface SpotifyToken {
  accessToken: string;
  expiresAt: number;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    images: { url: string; width: number; height: number }[];
  };
}

let cachedToken: SpotifyToken | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.accessToken;
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
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.accessToken;
}

export interface SpotifySearchResult {
  id: string;
  name: string;
  artist: string;
  albumArt: string | null;
}

export async function searchTracks(query: string): Promise<SpotifySearchResult[]> {
  const token = await getAccessToken();

  const response = await fetch(
    `https://api.spotify.com/v1/search?type=track&limit=${MAX_SEARCH_RESULTS}&q=${encodeURIComponent(query)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error('Spotify search failed');
  }

  const data = await response.json();
  const tracks: SpotifyTrack[] = data.tracks?.items ?? [];

  return tracks.map((track) => {
    const smallImage = track.album.images
      .sort((a, b) => a.width - b.width)
      .find((img) => img.width >= 64);

    return {
      id: track.id,
      name: track.name,
      artist: track.artists.map((a) => a.name).join(', '),
      albumArt: smallImage?.url ?? track.album.images[0]?.url ?? null,
    };
  });
}

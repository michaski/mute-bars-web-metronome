export interface BpmLookupResult {
  bpm: number | null;
  timeSignature: number | null;
  genre: string | null;
}

export async function lookupBpm(title: string, artist: string): Promise<BpmLookupResult> {
  const apiKey = import.meta.env.VITE_GETSONGBPM_API_KEY;

  if (!apiKey) {
    return { bpm: null, timeSignature: null, genre: null };
  }

  const lookup = `song:${title} artist:${artist}`;
  const response = await fetch(
    `/api/getsongbpm/search/?api_key=${encodeURIComponent(apiKey)}&type=both&lookup=${encodeURIComponent(lookup)}`
  );

  if (!response.ok) {
    return { bpm: null, timeSignature: null, genre: null };
  }

  const data = await response.json();
  const song = data.search?.length > 0 ? data.search[0] : null;

  if (!song) {
    return { bpm: null, timeSignature: null, genre: null };
  }

  const bpm = song.tempo ? Math.round(Number(song.tempo)) : null;
  const timeSignature = song.time_sig ? parseInt(song.time_sig) : null;
  const genre = song.artist?.genres?.length > 0 ? song.artist.genres[0] : null;

  return { bpm, timeSignature, genre };
}

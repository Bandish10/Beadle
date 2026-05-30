/**
 * Fetch a 30-second audio preview URL from the iTunes Search API.
 * This is free, requires no API key, and has no ads.
 */

const cache = new Map();

export async function fetchPreviewUrl(songTitle, artist = 'The Beatles') {
  const key = `${artist} ${songTitle}`;
  if (cache.has(key)) return cache.get(key);

  try {
    const query = encodeURIComponent(`${artist} ${songTitle}`);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${query}&media=music&entity=song&limit=5`
    );
    const data = await res.json();

    const match = data.results?.find(
      (r) =>
        r.artistName?.toLowerCase().includes(artist.toLowerCase()) &&
        r.trackName?.toLowerCase().includes(songTitle.toLowerCase().split('(')[0].trim())
    ) || data.results?.[0];

    const result = {
      previewUrl: match?.previewUrl || null,
      artworkUrl: match?.artworkUrl100?.replace('100x100bb', '600x600bb') || null,
    };
    cache.set(key, result);
    return result;
  } catch (err) {
    console.warn('iTunes preview fetch failed:', err);
    return { previewUrl: null, artworkUrl: null };
  }
}

/**
 * Fetch preview URL by iTunes track ID (more precise).
 */
export async function fetchPreviewById(itunesId) {
  if (!itunesId) return { previewUrl: null, artworkUrl: null };
  const key = `id:${itunesId}`;
  if (cache.has(key)) return cache.get(key);

  try {
    const res = await fetch(
      `https://itunes.apple.com/lookup?id=${itunesId}&entity=song`
    );
    const data = await res.json();
    const match = data.results?.[0];
    
    const result = {
      previewUrl: match?.previewUrl || null,
      artworkUrl: match?.artworkUrl100?.replace('100x100bb', '600x600bb') || null,
    };
    cache.set(key, result);
    return result;
  } catch (err) {
    console.warn('iTunes lookup failed:', err);
    // Fallback to search
    return { previewUrl: null, artworkUrl: null };
  }
}

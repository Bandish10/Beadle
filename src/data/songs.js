import rawSongs from './songs.json' with { type: 'json' };

const REMIX_VARIANT_PATTERN =
  /remaster|remastered|remix|\bmix\b|mono|stereo|version|live|take|demo|anniversary/i;

function decodeTitle(title) {
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    const bytes = Uint8Array.from(window.atob(title), (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  }
  return Buffer.from(title, 'base64').toString('utf8');
}

function normalizeTitle(title) {
  return title.toLowerCase().replace(/\s+/g, ' ').trim();
}

const songs = [];
const seenTitles = new Set();

for (const song of rawSongs) {
  const title = decodeTitle(song.title);
  if (REMIX_VARIANT_PATTERN.test(title)) continue;

  const key = normalizeTitle(title);
  if (seenTitles.has(key)) continue;

  seenTitles.add(key);
  songs.push({ ...song, title });
}

export default songs;
export { decodeTitle };

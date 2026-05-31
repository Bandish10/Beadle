import songs from '../data/songs';

// Launch date: May 31, 2026 at 12:00 AM IST (UTC+5:30)
const LAUNCH_DATE = new Date('2026-05-31T00:00:00+05:30').getTime();

export function getDailyPuzzle() {
  const now = new Date().getTime();
  const msPerDay = 1000 * 60 * 60 * 24;

  const daysSinceLaunch = Math.floor((now - LAUNCH_DATE) / msPerDay);
  const puzzleNumber = daysSinceLaunch + 1;
  const index = daysSinceLaunch % songs.length;

  const song = songs[index];

  return { puzzleNumber, song };
}

function normalizeExcludedIds(excludeIds = []) {
  if (Array.isArray(excludeIds)) return new Set(excludeIds.filter(Boolean));
  return new Set(excludeIds ? [excludeIds] : []);
}

export function getRandomSong(excludeIds = []) {
  const excludedIds = normalizeExcludedIds(excludeIds);
  const availableSongs = songs.filter((song) => !excludedIds.has(song.id));
  const pool = availableSongs.length > 0 ? availableSongs : songs;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Progressive reveal durations in seconds for attempts 1 through 5
export const ATTEMPT_DURATIONS = [2, 5, 8, 12, 16];

// Skip bonus durations in seconds for attempts 1 through 4
export const SKIP_BONUSES = [3, 4, 5, 6];

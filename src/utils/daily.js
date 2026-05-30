import songs from '../data/songs.json';

// Launch date: May 31, 2026 at 12:00 AM IST (UTC+5:30)
const LAUNCH_DATE = new Date('2026-05-31T00:00:00+05:30').getTime();

export function getDailyPuzzle() {
  const now = new Date().getTime();
  const msPerDay = 1000 * 60 * 60 * 24;

  const daysSinceLaunch = Math.floor((now - LAUNCH_DATE) / msPerDay);
  const puzzleNumber = daysSinceLaunch + 1;
  const index = daysSinceLaunch % songs.length;

  const rawSong = songs[index];
  
  const song = {
    ...rawSong,
    title: typeof window !== 'undefined' ? window.atob(rawSong.title) : rawSong.title
  };

  return { puzzleNumber, song };
}

export function getRandomSong(excludeId = null) {
  let index;
  do {
    index = Math.floor(Math.random() * songs.length);
  } while (songs[index].id === excludeId && songs.length > 1);

  const rawSong = songs[index];
  return {
    ...rawSong,
    title: typeof window !== 'undefined' ? window.atob(rawSong.title) : rawSong.title
  };
}

// Progressive reveal durations in seconds for attempts 1 through 5
export const ATTEMPT_DURATIONS = [2, 5, 8, 12, 16];

import { apiUrl } from './api';

const UID_KEY = 'beadle-uid';
const NAME_KEY = 'beadle-name';
const DAILY_SUBMITTED_KEY_PREFIX = 'beadle-daily-submitted-';
const DAILY_LAST_PLAYED_KEY = 'beadle-daily-last-played';
const DAILY_STREAK_KEY = 'beadle-daily-streak-days';
const STREAK_SESSION_KEY = 'beadle-streak-session-id';
const STREAK_SUBMITTED_KEY_PREFIX = 'beadle-streak-submitted-';

function getTodayKey() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function getYesterdayKey() {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return now.toISOString().slice(0, 10);
}

export function getOrCreateUid() {
  let uid = localStorage.getItem(UID_KEY);
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem(UID_KEY, uid);
  }
  return uid;
}

export function getSavedName() {
  return localStorage.getItem(NAME_KEY) || '';
}

export function saveName(name) {
  localStorage.setItem(NAME_KEY, name);
}

export function getDailyStreakDays() {
  const stored = parseInt(localStorage.getItem(DAILY_STREAK_KEY) || '0', 10);
  return Number.isNaN(stored) ? 0 : stored;
}

export function updateDailyStreakDays() {
  const lastPlayed = localStorage.getItem(DAILY_LAST_PLAYED_KEY);
  const today = getTodayKey();
  const yesterday = getYesterdayKey();

  let days = getDailyStreakDays();
  if (lastPlayed === today) {
    return days;
  }
  if (lastPlayed === yesterday) {
    days += 1;
  } else {
    days = 1;
  }

  localStorage.setItem(DAILY_LAST_PLAYED_KEY, today);
  localStorage.setItem(DAILY_STREAK_KEY, String(days));
  return days;
}

export function hasSubmittedDaily(puzzleNumber) {
  return (
    localStorage.getItem(`${DAILY_SUBMITTED_KEY_PREFIX}${puzzleNumber}`) ===
    'true'
  );
}

export function markSubmittedDaily(puzzleNumber) {
  localStorage.setItem(`${DAILY_SUBMITTED_KEY_PREFIX}${puzzleNumber}`, 'true');
}

export function getOrCreateStreakSessionId() {
  let sessionId = localStorage.getItem(STREAK_SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(STREAK_SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function resetStreakSessionId() {
  const sessionId = crypto.randomUUID();
  localStorage.setItem(STREAK_SESSION_KEY, sessionId);
  return sessionId;
}

export function hasSubmittedStreak(sessionId) {
  return (
    localStorage.getItem(`${STREAK_SUBMITTED_KEY_PREFIX}${sessionId}`) ===
    'true'
  );
}

export function markSubmittedStreak(sessionId) {
  localStorage.setItem(`${STREAK_SUBMITTED_KEY_PREFIX}${sessionId}`, 'true');
}

function isJsonResponse(res) {
  const type = res.headers.get('content-type') || '';
  return type.includes('application/json');
}

function parseJsonResponse(res, text, errorMessage) {
  if (!isJsonResponse(res)) {
    throw new Error(`${errorMessage}: unexpected non-JSON response`);
  }
  return JSON.parse(text);
}

export async function submitDailyScore({ uid, name, days, score }) {
  const res = await fetch(apiUrl('/api/leaderboard/daily'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, name, days, score }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error('Failed to save daily score');
  return parseJsonResponse(res, text, 'Failed to save daily score');
}

export async function submitStreakScore({ uid, name, streak }) {
  const res = await fetch(apiUrl('/api/leaderboard/streak'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, name, streak }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error('Failed to save streak score');
  return parseJsonResponse(res, text, 'Failed to save streak score');
}

export async function fetchDailyLeaderboard() {
  const uid = getOrCreateUid();
  const res = await fetch(
    apiUrl(`/api/leaderboard/daily?uid=${encodeURIComponent(uid)}`),
  );
  const text = await res.text();
  if (!res.ok) throw new Error('Failed to load daily leaderboard');
  return parseJsonResponse(res, text, 'Failed to load daily leaderboard');
}

export async function fetchStreakLeaderboard() {
  const uid = getOrCreateUid();
  const res = await fetch(
    apiUrl(`/api/leaderboard/streak?uid=${encodeURIComponent(uid)}`),
  );
  const text = await res.text();
  if (!res.ok) throw new Error('Failed to load streak leaderboard');
  return parseJsonResponse(res, text, 'Failed to load streak leaderboard');
}

export async function fetchVisitorCount() {
  const res = await fetch(apiUrl('/api/visitors'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const text = await res.text();
  if (!res.ok) throw new Error('Failed to load visitor count');
  return parseJsonResponse(res, text, 'Failed to load visitor count');
}

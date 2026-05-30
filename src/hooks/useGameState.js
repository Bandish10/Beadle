import { useState, useEffect, useCallback } from 'react';
import { getDailyPuzzle } from '../utils/daily';

const MAX_ATTEMPTS = 5;
const STORAGE_KEY = 'beadle-state';

function loadState(puzzleNumber) {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}-${puzzleNumber}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveState(puzzleNumber, state) {
  try {
    localStorage.setItem(`${STORAGE_KEY}-${puzzleNumber}`, JSON.stringify(state));
  } catch { /* silent */ }
}

export function useGameState() {
  const [puzzle] = useState(() => getDailyPuzzle());
  const [guesses, setGuesses] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing' | 'won' | 'lost'
  
  // Initialize apples from separate global local storage key
  const [apples, setApples] = useState(() => {
    return parseInt(localStorage.getItem('beadle-apples') || '0', 10);
  });

  // Restore on mount
  useEffect(() => {
    const saved = loadState(puzzle.puzzleNumber);
    if (saved) {
      setGuesses(saved.guesses || []);
      setGameStatus(saved.gameStatus || 'playing');
    }
  }, [puzzle.puzzleNumber]);

  // Persist on change
  useEffect(() => {
    saveState(puzzle.puzzleNumber, { guesses, gameStatus });
  }, [guesses, gameStatus, puzzle.puzzleNumber]);

  const submitGuess = useCallback((title) => {
    if (gameStatus !== 'playing') return;

    const isSkip = !title;
    const isCorrect = !isSkip && title.toLowerCase() === puzzle.song.title.toLowerCase();
    const next = [...guesses, isSkip ? '' : title];

    setGuesses(next);

    if (isCorrect) {
      setGameStatus('won');
      // Calculate apples earned: first try (0 previous guesses) means 5
      const earned = MAX_ATTEMPTS - guesses.length;
      setApples(prev => {
        const nextVal = prev + earned;
        localStorage.setItem('beadle-apples', nextVal.toString());
        return nextVal;
      });
    } else if (next.length >= MAX_ATTEMPTS) {
      setGameStatus('lost');
    }
  }, [gameStatus, guesses, puzzle.song.title]);

  const skip = useCallback(() => submitGuess(''), [submitGuess]);

  return { puzzle, guesses, gameStatus, submitGuess, skip, maxAttempts: MAX_ATTEMPTS, apples };
}

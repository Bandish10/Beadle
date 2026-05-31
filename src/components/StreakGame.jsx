import { useState, useCallback, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import Header from './Header';
import AudioPlayer from './AudioPlayer';
import GuessHistory from './GuessHistory';
import SearchInput from './SearchInput';
import NamePromptModal from './NamePromptModal';
import { getRandomSong, ATTEMPT_DURATIONS, SKIP_BONUSES } from '../utils/daily';
import {
  getOrCreateUid,
  getOrCreateStreakSessionId,
  resetStreakSessionId,
  getSavedName,
  saveName,
  submitStreakScore,
  hasSubmittedStreak,
  markSubmittedStreak,
} from '../utils/leaderboard';
import { useNavigate } from 'react-router-dom';
import { isTurnstileEnabled } from '../utils/security';

const MAX_ATTEMPTS = 5;

export default function StreakGame() {
  const navigate = useNavigate();
  // Get global apples state
  const [apples] = useState(() =>
    parseInt(localStorage.getItem('beadle-apples') || '0', 10),
  );

  const loadStreakState = () => {
    try {
      const raw = localStorage.getItem('beadle-streak-state');
      if (raw) {
        const parsed = JSON.parse(raw);
        const startingSongId = parsed?.puzzle?.song?.id;
        return {
          ...parsed,
          playedSongIds:
            Array.isArray(parsed?.playedSongIds) &&
            parsed.playedSongIds.length > 0
              ? parsed.playedSongIds
              : startingSongId
                ? [startingSongId]
                : [],
        };
      }
    } catch {}
    const song = getRandomSong(null);
    return {
      puzzle: { song },
      guesses: [],
      gameStatus: 'playing',
      playedSongIds: [song.id],
    };
  };

  const [streak, setStreak] = useState(() =>
    parseInt(localStorage.getItem('beadle-streak') || '0', 10),
  );

  const initialState = loadStreakState();
  const [puzzle, setPuzzle] = useState(initialState.puzzle);
  const [guesses, setGuesses] = useState(initialState.guesses);
  const [gameStatus, setGameStatus] = useState(initialState.gameStatus);
  const [playedSongIds, setPlayedSongIds] = useState(() => {
    if (
      Array.isArray(initialState.playedSongIds) &&
      initialState.playedSongIds.length > 0
    ) {
      return initialState.playedSongIds;
    }
    return initialState.puzzle?.song?.id ? [initialState.puzzle.song.id] : [];
  });
  const [showWinModal, setShowWinModal] = useState(
    initialState.gameStatus === 'won',
  );
  const [autoPlayKey, setAutoPlayKey] = useState(0);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [streakSessionId, setStreakSessionId] = useState(() =>
    getOrCreateStreakSessionId(),
  );
  const [resultPlaying, setResultPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(
      'beadle-streak-state',
      JSON.stringify({ puzzle, guesses, gameStatus, playedSongIds }),
    );
    localStorage.setItem('beadle-streak', streak.toString());
  }, [puzzle, guesses, gameStatus, streak, playedSongIds]);

  useEffect(() => {
    if (
      (gameStatus === 'lost' || gameStatus === 'won') &&
      audioRef.current &&
      puzzle?.song?.previewUrl
    ) {
      audioRef.current
        .play()
        .then(() => setResultPlaying(true))
        .catch(() => {});
    }
  }, [gameStatus, puzzle]);

  useEffect(() => {
    if (gameStatus === 'lost' && !hasSubmittedStreak(streakSessionId)) {
      const saved = getSavedName();
      if (saved && !isTurnstileEnabled()) {
        handleStreakSubmit(saved);
      } else {
        setShowNamePrompt(true);
      }
    }
  }, [gameStatus, streakSessionId]);

  const submitGuess = useCallback(
    (title) => {
      if (gameStatus !== 'playing') return;

      const isSkip = !title;
      const isCorrect =
        !isSkip && title.toLowerCase() === puzzle.song.title.toLowerCase();
      const next = [...guesses, isSkip ? '' : title];

      setGuesses(next);

      if (isCorrect) {
        setGameStatus('won');
        setShowWinModal(true);
        return;
      }

      if (next.length >= MAX_ATTEMPTS) {
        setGameStatus('lost');
      }
    },
    [gameStatus, guesses, puzzle.song.id, puzzle.song.title],
  );

  const skip = useCallback(() => submitGuess(''), [submitGuess]);

  const nextSong = () => {
    const nextPlayedSongIds = Array.from(
      new Set([...playedSongIds, puzzle.song.id]),
    );
    const nextSong = getRandomSong(nextPlayedSongIds);

    setStreak((s) => s + 1);
    setPuzzle({ song: nextSong });
    setGuesses([]);
    setGameStatus('playing');
    setShowWinModal(false);
    setAutoPlayKey((k) => k + 1);
    setPlayedSongIds([...nextPlayedSongIds, nextSong.id]);
  };

  const retry = () => {
    const nextSong = getRandomSong(null);

    setStreak(0);
    setPuzzle({ song: nextSong });
    setGuesses([]);
    setGameStatus('playing');
    setShowWinModal(false);
    setShowNamePrompt(false);
    setPlayedSongIds([nextSong.id]);
    setStreakSessionId(resetStreakSessionId());
  };

  const handleStreakSubmit = async (name, turnstileToken) => {
    const uid = getOrCreateUid();
    await submitStreakScore({ uid, name, streak, turnstileToken });
    saveName(name);
    markSubmittedStreak(streakSessionId);
    setShowNamePrompt(false);
  };

  const toggleResultPlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (resultPlaying) {
      audio.pause();
      setResultPlaying(false);
    } else {
      audio
        .play()
        .then(() => setResultPlaying(true))
        .catch(() => {});
    }
  };

  const attemptIndex = guesses.length;
  const gameOver = gameStatus !== 'playing';
  const bonusSec =
    SKIP_BONUSES[Math.min(attemptIndex, SKIP_BONUSES.length - 1)];
  const isLastGuess =
    gameStatus === 'playing' && guesses.length >= MAX_ATTEMPTS - 1;

  return (
    <div className="app-container streak-game">
      <Header puzzleNumber={`Streak 🔥 ${streak}`} apples={apples} />

      <div className="game-body">
        {gameOver ? (
          <div className="gameover-screen">
            {(gameStatus === 'lost' || gameStatus === 'won') &&
              puzzle?.song?.previewUrl && (
                <audio
                  ref={audioRef}
                  src={puzzle.song.previewUrl}
                  preload="auto"
                  loop
                  onEnded={() => setResultPlaying(false)}
                />
              )}
            <div className="gameover-header">
              <span
                className={`gameover-badge ${gameStatus === 'won' ? 'win' : 'lose'}`}
              >
                {gameStatus === 'won' ? '🎉 Correct!' : '😔 Streak Broken'}
              </span>
              <h2 className="gameover-song">{puzzle.song.title}</h2>
              <p className="gameover-artist">Current Streak: {streak}</p>
            </div>

            {gameStatus === 'lost' && puzzle?.song?.artworkUrl && (
              <div className="gameover-album" onClick={toggleResultPlayback}>
                <img
                  src={puzzle.song.artworkUrl}
                  alt={`${puzzle.song.title} artwork`}
                  className="gameover-artwork"
                />
                <div
                  className={`gameover-play-overlay ${resultPlaying ? 'playing' : ''}`}
                >
                  {resultPlaying ? (
                    <Pause size={48} fill="currentColor" />
                  ) : (
                    <Play size={48} fill="currentColor" />
                  )}
                </div>
              </div>
            )}

            <div className="btn-container">
              <button className="btn-primary" onClick={retry}>
                Want to play again?
              </button>
              <button className="btn-secondary" onClick={() => navigate('/')}>
                Go back to daily
              </button>
            </div>
          </div>
        ) : (
          <>
            <AudioPlayer
              previewUrl={puzzle.song.previewUrl}
              attemptIndex={attemptIndex}
              gameOver={false}
              loading={false}
              autoPlayKey={autoPlayKey}
            />

            <GuessHistory
              guesses={guesses}
              maxAttempts={MAX_ATTEMPTS}
              answer={puzzle.song.title}
            />

            <div className="controls-area">
              <SearchInput onSubmit={submitGuess} disabled={gameOver} />
              <div
                className="skip-btn-wrap"
                data-tooltip={
                  isLastGuess ? 'This is your last guess' : undefined
                }
              >
                <button
                  className="skip-btn"
                  onClick={skip}
                  disabled={gameOver || isLastGuess}
                >
                  Skip (+{bonusSec}s)
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {gameStatus === 'won' && showWinModal && (
        <div className="modal-backdrop" onClick={() => setShowWinModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title win">Congrats, you got it correct!</h2>
            <div className="answer-reveal">
              <span className="answer-label">The answer was</span>
              <span className="answer-song">{puzzle.song.title}</span>
              <span className="answer-artist">The Beatles</span>
            </div>
            <button className="btn-primary" onClick={nextSong}>
              Next
            </button>
          </div>
        </div>
      )}

      <NamePromptModal
        open={showNamePrompt}
        title="Enter your name for the leaderboard"
        defaultValue={getSavedName()}
        onClose={() => setShowNamePrompt(false)}
        onSubmit={handleStreakSubmit}
      />
    </div>
  );
}

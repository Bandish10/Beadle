import { useState, useEffect, useRef } from 'react';
import Header from './Header';
import AudioPlayer from './AudioPlayer';
import GuessHistory from './GuessHistory';
import SearchInput from './SearchInput';
import ResultsModal from './ResultsModal';
import GameOverScreen from './GameOverScreen';
import NamePromptModal from './NamePromptModal';
import { useGameState } from '../hooks/useGameState';
import { ATTEMPT_DURATIONS, SKIP_BONUSES } from '../utils/daily';
import {
  getOrCreateUid,
  getSavedName,
  saveName,
  updateDailyStreakDays,
  submitDailyScore,
  hasSubmittedDaily,
  markSubmittedDaily,
} from '../utils/leaderboard';
import { useNavigate } from 'react-router-dom';
import { isTurnstileEnabled } from '../utils/security';

export default function DailyGame() {
  const {
    puzzle,
    guesses,
    gameStatus,
    submitGuess,
    skip,
    maxAttempts,
    apples,
  } = useGameState();
  const navigate = useNavigate();

  const isGameOverInitially = useRef(
    gameStatus === 'won' || gameStatus === 'lost',
  ).current;
  const [showModal, setShowModal] = useState(false);
  const [modalDismissed, setModalDismissed] = useState(isGameOverInitially);
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  useEffect(() => {
    if (
      (gameStatus === 'won' || gameStatus === 'lost') &&
      !isGameOverInitially
    ) {
      if (!modalDismissed) {
        setShowModal(true);
      }
    }
  }, [gameStatus, isGameOverInitially, modalDismissed]);

  useEffect(() => {
    if (gameStatus === 'won' && !hasSubmittedDaily(puzzle.puzzleNumber)) {
      const saved = getSavedName();
      if (saved && !isTurnstileEnabled()) {
        handleDailySubmit(saved);
      } else {
        setShowNamePrompt(true);
      }
    }
  }, [gameStatus, puzzle.puzzleNumber]);

  if (!puzzle) return <div className="loading">Loading…</div>;

  const attemptIndex = guesses.length;
  const gameOver = gameStatus !== 'playing';
  const isLastGuess =
    gameStatus === 'playing' && guesses.length >= maxAttempts - 1;
  const bonusSec =
    SKIP_BONUSES[Math.min(attemptIndex, SKIP_BONUSES.length - 1)];

  const handleModalClose = () => {
    setShowModal(false);
    setModalDismissed(true);
  };

  const handleDailySubmit = async (name, turnstileToken) => {
    const uid = getOrCreateUid();
    const days = updateDailyStreakDays();
    await submitDailyScore({ uid, name, days, score: apples, turnstileToken });
    saveName(name);
    markSubmittedDaily(puzzle.puzzleNumber);
    setShowNamePrompt(false);
  };

  return (
    <div className="app-container">
      <Header puzzleNumber={puzzle.puzzleNumber} apples={apples} />

      <div className="game-body">
        {gameOver ? (
          <GameOverScreen
            puzzle={puzzle}
            guesses={guesses}
            maxAttempts={maxAttempts}
            previewUrl={puzzle.song.previewUrl}
            artworkUrl={puzzle.song.artworkUrl}
            onShare={() => setShowModal(true)}
            onPlayMore={() => navigate('/streak')}
          />
        ) : (
          <>
            <AudioPlayer
              previewUrl={puzzle.song.previewUrl}
              attemptIndex={attemptIndex}
              gameOver={gameOver}
              loading={false}
            />

            <GuessHistory
              guesses={guesses}
              maxAttempts={maxAttempts}
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
                  {gameOver ? 'Game over' : `Skip (+${bonusSec}s)`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <ResultsModal
          puzzle={puzzle}
          guesses={guesses}
          gameStatus={gameStatus}
          maxAttempts={maxAttempts}
          onClose={handleModalClose}
        />
      )}

      <NamePromptModal
        open={showNamePrompt}
        title="Enter your name for the leaderboard"
        defaultValue={getSavedName()}
        onClose={() => setShowNamePrompt(false)}
        onSubmit={handleDailySubmit}
      />
    </div>
  );
}

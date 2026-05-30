import { useState, useEffect, useRef } from 'react';
import Header from './Header';
import AudioPlayer from './AudioPlayer';
import GuessHistory from './GuessHistory';
import SearchInput from './SearchInput';
import ResultsModal from './ResultsModal';
import GameOverScreen from './GameOverScreen';
import NamePromptModal from './NamePromptModal';
import { useGameState } from '../hooks/useGameState';
import { ATTEMPT_DURATIONS } from '../utils/daily';
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
      if (saved) {
        handleDailySubmit(saved);
      } else {
        setShowNamePrompt(true);
      }
    }
  }, [gameStatus, puzzle.puzzleNumber]);

  if (!puzzle) return <div className="loading">Loading…</div>;

  const attemptIndex = guesses.length;
  const gameOver = gameStatus !== 'playing';
  const nextDur =
    ATTEMPT_DURATIONS[Math.min(attemptIndex + 1, ATTEMPT_DURATIONS.length - 1)];
  const curDur =
    ATTEMPT_DURATIONS[Math.min(attemptIndex, ATTEMPT_DURATIONS.length - 1)];
  const bonusSec = nextDur - curDur;

  const handleModalClose = () => {
    setShowModal(false);
    setModalDismissed(true);
  };

  const handleDailySubmit = async (name) => {
    const uid = getOrCreateUid();
    const days = updateDailyStreakDays();
    await submitDailyScore({ uid, name, days, score: apples });
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
              <button className="skip-btn" onClick={skip} disabled={gameOver}>
                {gameOver ? 'Game over' : `Skip (+${bonusSec}s)`}
              </button>
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

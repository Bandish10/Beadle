import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, Loader } from 'lucide-react';

const DURATIONS = [2, 5, 8, 12, 16];
const MAX_DUR = 16;

export default function AudioPlayer({
  previewUrl,
  attemptIndex,
  gameOver,
  loading,
  autoPlayKey
}) {
  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const maxDur = DURATIONS[Math.min(attemptIndex, DURATIONS.length - 1)];

  // Stop playback when attempt changes (unless game over)
  useEffect(() => {
    if (!gameOver && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
      setProgress(0);
    }
  }, [attemptIndex, gameOver]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startTracking = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      const audio = audioRef.current;
      if (!audio) return;

      if (gameOver) {
        // Let full preview play
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      } else {
        const pct = Math.min((audio.currentTime / maxDur) * 100, 100);
        setProgress(pct);

        if (audio.currentTime >= maxDur) {
          audio.pause();
          audio.currentTime = 0;
          setPlaying(false);
          setProgress(0);
          clearInterval(intervalRef.current);
        }
      }
    }, 50);
  }, [gameOver, maxDur]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !previewUrl) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      if (!gameOver) {
        audio.currentTime = 0;
      }
      audio
        .play()
        .then(() => {
          setPlaying(true);
          startTracking();
        })
        .catch((err) => {
          console.warn('Audio play failed:', err);
        });
    }
  }, [playing, gameOver, previewUrl, startTracking]);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    setProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (!autoPlayKey) return;
    const audio = audioRef.current;
    if (!audio || !previewUrl || gameOver) return;
    audio.currentTime = 0;
    audio.play()
      .then(() => {
        setPlaying(true);
        startTracking();
      })
      .catch((err) => {
        console.warn('Audio autoplay failed:', err);
      });
  }, [autoPlayKey, previewUrl, gameOver, startTracking]);

  return (
    <div className="player-card">
      {/* Native HTML5 audio element — no iframes, no ads, no restrictions */}
      {previewUrl && (
        <audio
          ref={audioRef}
          src={previewUrl}
          preload="auto"
          onEnded={handleEnded}
        />
      )}

      <div className="player-controls">
        <button
          className="play-btn"
          onClick={toggle}
          disabled={loading || !previewUrl}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {loading ? (
            <Loader size={28} className="spin-icon" />
          ) : playing ? (
            <Pause size={28} fill="currentColor" />
          ) : (
            <Play size={28} fill="currentColor" />
          )}
        </button>

        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
          {!gameOver && (
            <div className="progress-markers">
              {DURATIONS.map((d, i) => (
                <div
                  key={i}
                  className="progress-dot"
                  style={{
                    left: `${(d / MAX_DUR) * 100}%`,
                    opacity: d <= maxDur ? 0.8 : 0.25,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <span className="time-label">
          {gameOver ? '0:30' : `0:${String(maxDur).padStart(2, '0')}`}
        </span>
      </div>

      {!previewUrl && !loading && (
        <div className="player-error">
          ⚠️ Audio preview unavailable for this song
        </div>
      )}

      {playing && (
        <div className="now-playing-indicator">
          <Volume2 size={14} />
          <span>{gameOver ? 'Playing full preview' : 'Listening...'}</span>
        </div>
      )}
    </div>
  );
}

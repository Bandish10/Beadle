import { useState, useRef, useEffect } from 'react';
import { Music, Play, Pause } from 'lucide-react';

export default function GameOverScreen({ puzzle, guesses, maxAttempts, previewUrl, artworkUrl, onShare, onPlayMore }) {
  const isWin = guesses.some(
    g => g && g.toLowerCase() === puzzle.song.title.toLowerCase()
  );
  const score = isWin ? guesses.length : 'X';
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (audioRef.current && previewUrl) {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [previewUrl]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  return (
    <div className="gameover-screen">
      {previewUrl && (
        <audio
          ref={audioRef}
          src={previewUrl}
          loop
          onEnded={() => setPlaying(false)}
        />
      )}
      
      <div className="gameover-header">
        <span className={`gameover-badge ${isWin ? 'win' : 'lose'}`}>
          {isWin ? '🎉 You got it!' : '😔 Not this time'}
        </span>
        <h2 className="gameover-song">{puzzle.song.title}</h2>
        <p className="gameover-artist">
          <Music size={14} />
          The Beatles — Score: {score}/{maxAttempts}
        </p>
      </div>

      <div className="gameover-album" onClick={togglePlayback}>
        {artworkUrl ? (
          <img src={artworkUrl} alt={`${puzzle.song.title} Album Art`} className="gameover-artwork" />
        ) : (
          <div className="gameover-artwork-placeholder">
            <Music size={64} opacity={0.2} />
          </div>
        )}
        <div className={`gameover-play-overlay ${playing ? 'playing' : ''}`}>
          {playing ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" />}
        </div>
      </div>

      <div className="btn-container">
        <button onClick={onShare} className="btn-primary">
          Share
        </button>
        <button onClick={onPlayMore} className="btn-secondary">
          Want to play more?
        </button>
      </div>
    </div>
  );
}

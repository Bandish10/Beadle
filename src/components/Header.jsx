import { useState, useEffect } from 'react';
import { HelpCircle, BarChart2 } from 'lucide-react';
import LeaderboardModal from './LeaderboardModal';

export default function Header({ puzzleNumber, apples = 0 }) {
  const dark = true;
  const [showHelp, setShowHelp] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      dark ? 'dark' : 'light',
    );
    localStorage.setItem('beadle-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <header className="header">
      <div className="header-side">
        <div
          className="help-container"
          onMouseEnter={() => setShowHelp(true)}
          onMouseLeave={() => setShowHelp(false)}
        >
          <button
            className="icon-btn"
            aria-label="How to play"
            onClick={() => setShowHelp(!showHelp)}
          >
            <HelpCircle size={22} />
          </button>

          {showHelp && (
            <div className="help-popover disable-click-outside">
              <h3>How to play Beadle</h3>
              <p>
                Listen to the intro, then find the correct Beatles song in the
                list.
              </p>
              <p>Skipped or incorrect attempts unlock more of the song.</p>
              <p>Answer in as few tries as possible and share your score!</p>
            </div>
          )}
        </div>
        <button
          className="icon-btn"
          aria-label="Leaderboard"
          onClick={() => setShowLeaderboard(true)}
        >
          <BarChart2 size={22} />
        </button>
      </div>

      <div className="header-center">
        <h1>beadle</h1>
        {puzzleNumber && <span className="puzzle-badge">#{puzzleNumber}</span>}
      </div>

      <div className="header-side header-side-right">
        <div className="apple-score" title="Your Lifetime Apple Score!">
          <img
            src="/apple.jpg"
            alt="Apples"
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
          <span>{apples}</span>
        </div>
      </div>

      <LeaderboardModal
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
    </header>
  );
}

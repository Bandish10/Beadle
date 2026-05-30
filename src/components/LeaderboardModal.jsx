import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { fetchDailyLeaderboard, fetchStreakLeaderboard } from '../utils/leaderboard';

export default function LeaderboardModal({ open, onClose }) {
  const [tab, setTab] = useState('daily');
  const [dailyRows, setDailyRows] = useState([]);
  const [streakRows, setStreakRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([fetchDailyLeaderboard(), fetchStreakLeaderboard()])
      .then(([daily, streak]) => {
        setDailyRows(daily || []);
        setStreakRows(streak || []);
      })
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const rows = tab === 'daily' ? dailyRows : streakRows;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card leaderboard-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <X size={22} />
        </button>
        <h2 className="modal-title">Leaderboard</h2>
        <div className="leaderboard-tabs">
          <button
            className={`leaderboard-tab ${tab === 'daily' ? 'active' : ''}`}
            onClick={() => setTab('daily')}
          >
            Daily
          </button>
          <button
            className={`leaderboard-tab ${tab === 'streak' ? 'active' : ''}`}
            onClick={() => setTab('streak')}
          >
            Streak
          </button>
        </div>

        {loading ? (
          <div className="leaderboard-empty">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="leaderboard-empty">No scores yet.</div>
        ) : (
          <div className={`leaderboard-table ${tab}`}>
            <div className="leaderboard-row leaderboard-header">
              <span>#</span>
              <span>Name</span>
              <span>{tab === 'daily' ? 'Days' : 'Streak'}</span>
              {tab === 'daily' && <span>Apples</span>}
            </div>
            {rows.map((row, idx) => (
              <div className="leaderboard-row" key={row.uuid || idx}>
                <span>{idx + 1}</span>
                <span>{row.name}</span>
                <span>{tab === 'daily' ? row.days : row.streak}</span>
                {tab === 'daily' && <span>{row.score}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

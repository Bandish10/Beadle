import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  fetchDailyLeaderboard,
  fetchStreakLeaderboard,
  getOrCreateUid,
} from '../utils/leaderboard';

export default function LeaderboardModal({ open, onClose }) {
  const [tab, setTab] = useState('daily');
  const [dailyRows, setDailyRows] = useState([]);
  const [streakRows, setStreakRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const uid = getOrCreateUid();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const [dailyData, streakData] = await Promise.all([
          fetchDailyLeaderboard(),
          fetchStreakLeaderboard(),
        ]);
        setDailyRows(normalizeLeaderboard(dailyData));
        setStreakRows(normalizeLeaderboard(streakData));
      } catch (err) {
        setError(
          'Leaderboard is unavailable. Make sure the Beadle server is running.',
        );
        setDailyRows([]);
        setStreakRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  if (!open) return null;

  const rows = tab === 'daily' ? dailyRows : streakRows;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card leaderboard-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
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
          <div className="leaderboard-empty">Loading...</div>
        ) : error ? (
          <div className="leaderboard-empty">{error}</div>
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
              <div
                className={`leaderboard-row ${
                  row.uid === uid ? 'current-user' : ''
                } ${row.separator ? 'leaderboard-separator' : ''}`}
                key={row.uuid || idx}
              >
                <span>{row.rank || idx + 1}</span>
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

function normalizeLeaderboard(data) {
  if (Array.isArray(data)) return data.slice(0, 10);

  const top = data?.top || [];
  const currentUser = data?.currentUser;
  if (!currentUser) return top;

  const isInTop = top.some((row) => row.uid === currentUser.uid);
  if (isInTop) return top;

  return [...top, { ...currentUser, separator: true }];
}

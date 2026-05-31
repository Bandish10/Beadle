import { useEffect, useState } from 'react';
import { fetchVisitorCount } from '../utils/leaderboard';

export default function VisitorCount() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    let ignore = false;

    fetchVisitorCount()
      .then((data) => {
        if (!ignore) setCount(data.count || 0);
      })
      .catch(() => {
        if (!ignore) setCount(null);
      });

    return () => {
      ignore = true;
    };
  }, []);

  if (count === null) return null;

  return (
    <div className="visitor-count" aria-label={`${count} visitors`}>
      Visitors: {count.toLocaleString()}
    </div>
  );
}


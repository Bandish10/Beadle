import { getPool, parseJsonBody } from '../_db.js';

export default async function handler(req, res) {
  const pool = getPool();

  if (req.method === 'GET') {
    try {
      const { rows } = await pool.query(
        'SELECT uuid, uid, name, streak FROM streak_leaderboard ORDER BY streak DESC, name ASC LIMIT 100',
      );
      return res.status(200).json(rows);
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: 'Failed to fetch streak leaderboard',
        details: process.env.NODE_ENV === 'production' ? undefined : err.message,
      });
    }
  }

  if (req.method === 'POST') {
    const { uid, name, streak } = parseJsonBody(req);
    if (!uid || !name) {
      return res.status(400).json({ error: 'uid and name are required' });
    }

    try {
      const { rows } = await pool.query(
        `INSERT INTO streak_leaderboard (uid, name, streak)
         VALUES ($1, $2, $3)
         RETURNING uuid, uid, name, streak`,
        [uid, name, Number(streak || 0)],
      );
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: 'Failed to save streak leaderboard',
        details: process.env.NODE_ENV === 'production' ? undefined : err.message,
      });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}

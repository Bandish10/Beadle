import { getPool, parseJsonBody } from '../../db.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const pool = getPool();
      const uid = req.query?.uid;
      res.setHeader('Cache-Control', 'private, max-age=30');
      const { rows: top } = await pool.query(
        `SELECT rank::integer, uuid, uid, name, days, score
         FROM (
           SELECT ROW_NUMBER() OVER (ORDER BY days DESC, score DESC, name ASC) AS rank,
                  uuid, uid, name, days, score
           FROM daily_leaderboard
         ) ranked
         WHERE rank <= 10
         ORDER BY rank ASC`,
      );

      let currentUser = null;
      if (uid) {
        const { rows } = await pool.query(
          `SELECT rank::integer, uuid, uid, name, days, score
           FROM (
             SELECT ROW_NUMBER() OVER (ORDER BY days DESC, score DESC, name ASC) AS rank,
                    uuid, uid, name, days, score
             FROM daily_leaderboard
           ) ranked
           WHERE uid = $1
           LIMIT 1`,
          [uid],
        );
        currentUser = rows[0] || null;
      }

      return res.status(200).json({ top, currentUser });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: 'Failed to fetch daily leaderboard',
        details:
          process.env.NODE_ENV === 'production' ? undefined : err.message,
      });
    }
  }

  if (req.method === 'POST') {
    const { uid, name, days, score } = parseJsonBody(req);
    if (!uid || !name) {
      return res.status(400).json({ error: 'uid and name are required' });
    }

    try {
      const pool = getPool();
      const { rows } = await pool.query(
        `INSERT INTO daily_leaderboard (uid, name, days, score)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (uid)
         DO UPDATE SET name = EXCLUDED.name,
                       days = EXCLUDED.days,
                       score = EXCLUDED.score
         RETURNING uuid, uid, name, days, score`,
        [uid, name, Number(days || 0), Number(score || 0)],
      );
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: 'Failed to save daily leaderboard',
        details:
          process.env.NODE_ENV === 'production' ? undefined : err.message,
      });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}

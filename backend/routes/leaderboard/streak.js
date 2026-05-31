import { getPool, parseJsonBody } from '../../db.js';
import {
  validateInteger,
  validateName,
  validateUid,
  verifyTurnstileToken,
} from '../../security.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const pool = getPool();
      const uid = req.query?.uid;
      res.setHeader('Cache-Control', 'private, max-age=30');
      const { rows: top } = await pool.query(
        `SELECT rank::integer, uuid, uid, name, streak
         FROM (
           SELECT ROW_NUMBER() OVER (ORDER BY streak DESC, name ASC) AS rank,
                  uuid, uid, name, streak
           FROM streak_leaderboard
         ) ranked
         WHERE rank <= 10
         ORDER BY rank ASC`,
      );

      let currentUser = null;
      if (uid) {
        const { rows } = await pool.query(
          `SELECT rank::integer, uuid, uid, name, streak
           FROM (
             SELECT ROW_NUMBER() OVER (ORDER BY streak DESC, name ASC) AS rank,
                    uuid, uid, name, streak
             FROM streak_leaderboard
           ) ranked
           WHERE uid = $1
           ORDER BY rank ASC
           LIMIT 1`,
          [uid],
        );
        currentUser = rows[0] || null;
      }

      return res.status(200).json({ top, currentUser });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: 'Failed to fetch streak leaderboard',
        details:
          process.env.NODE_ENV === 'production' ? undefined : err.message,
      });
    }
  }

  if (req.method === 'POST') {
    const { uid, name, streak, turnstileToken } = parseJsonBody(req);
    const safeName = validateName(name);
    const safeStreak = validateInteger(streak, { min: 0, max: 10000 });

    if (!validateUid(uid) || !safeName || safeStreak === null) {
      return res.status(400).json({ error: 'Invalid leaderboard payload' });
    }

    const turnstileOk = await verifyTurnstileToken(turnstileToken, req.ip);
    if (!turnstileOk) {
      return res.status(403).json({ error: 'Challenge verification failed' });
    }

    try {
      const pool = getPool();
      const { rows } = await pool.query(
        `INSERT INTO streak_leaderboard (uid, name, streak)
         VALUES ($1, $2, $3)
         ON CONFLICT (uid)
         DO UPDATE SET name = EXCLUDED.name,
                       streak = GREATEST(streak_leaderboard.streak, EXCLUDED.streak)
         RETURNING uuid, uid, name, streak`,
        [uid, safeName, safeStreak],
      );
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: 'Failed to save streak leaderboard',
        details:
          process.env.NODE_ENV === 'production' ? undefined : err.message,
      });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}

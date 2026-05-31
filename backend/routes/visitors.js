import { getPool } from '../db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pool = getPool();

    if (req.method === 'POST') {
      const { rows } = await pool.query(
        `WITH existing AS (
           SELECT uuid FROM visitors ORDER BY uuid LIMIT 1
         ),
         inserted AS (
           INSERT INTO visitors (visitors)
           SELECT 0
           WHERE NOT EXISTS (SELECT 1 FROM existing)
           RETURNING uuid
         )
         UPDATE visitors
         SET visitors = visitors + 1
         WHERE uuid = COALESCE(
           (SELECT uuid FROM existing),
           (SELECT uuid FROM inserted)
         )
         RETURNING visitors AS count`,
      );
      return res.status(200).json({ count: rows[0]?.count || 0 });
    }

    const { rows } = await pool.query(
      `SELECT visitors AS count
       FROM visitors
       ORDER BY uuid
       LIMIT 1`,
    );
    return res.status(200).json({ count: rows[0]?.count || 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: 'Failed to load visitor count',
      details: process.env.NODE_ENV === 'production' ? undefined : err.message,
    });
  }
}

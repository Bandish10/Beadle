import { getPool } from '../db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pool = getPool();

    if (req.method === 'POST') {
      await pool.query(
        'INSERT INTO visitors (visitors) VALUES (0) ON CONFLICT DO NOTHING',
      );
      const { rows } = await pool.query(
        `UPDATE visitors
         SET visitors = visitors + 1
         RETURNING visitors AS count`,
      );
      return res.status(200).json({ count: rows[0]?.count || 0 });
    }

    await pool.query(
      'INSERT INTO visitors (visitors) VALUES (0) ON CONFLICT DO NOTHING',
    );
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

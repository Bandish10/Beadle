import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  throw new Error('Missing DATABASE_URL in environment');
}

const pool = new Pool({ connectionString: DATABASE_URL });

const schemaPath = path.resolve('scripts', 'schema.sql');
const sql = await readFile(schemaPath, 'utf8');

try {
  await pool.query(sql);
  console.log('Database initialized.');
} finally {
  await pool.end();
}

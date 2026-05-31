import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dailyLeaderboard from './backend/routes/leaderboard/daily.js';
import { getPool } from './backend/db.js';
import {
  createRateLimit,
  getAllowedOrigins,
  requireTrustedOrigin,
} from './backend/security.js';
import streakLeaderboard from './backend/routes/leaderboard/streak.js';
import visitors from './backend/routes/visitors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;
const isProduction = !process.argv.includes('--dev');
const allowedOrigins = getAllowedOrigins({ includeDev: !isProduction });

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '8kb' }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
  }),
);
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

app.use(
  '/api',
  createRateLimit({
    windowMs: 60 * 1000,
    max: 180,
    keyPrefix: 'api',
  }),
);
app.use(
  '/api/leaderboard',
  requireTrustedOrigin(allowedOrigins, { requireOrigin: isProduction }),
  createRateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    methods: ['POST'],
    keyPrefix: 'leaderboard-write',
    message: 'Too many leaderboard submissions',
  }),
);
app.use(
  '/api/visitors',
  requireTrustedOrigin(allowedOrigins, { requireOrigin: isProduction }),
  createRateLimit({
    windowMs: 60 * 1000,
    max: 20,
    methods: ['POST'],
    keyPrefix: 'visitors-write',
    message: 'Too many visitor updates',
  }),
);

function route(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

app.all('/api/leaderboard/daily', route(dailyLeaderboard));
app.all('/api/leaderboard/streak', route(streakLeaderboard));
app.all('/api/visitors', route(visitors));
app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true });
});
app.get('/api/health/db', async (_req, res) => {
  try {
    await getPool().query('SELECT 1');
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      error: 'Database health check failed',
      details: isProduction ? undefined : err.message,
    });
  }
});

if (isProduction) {
  const clientPath = path.join(__dirname, 'dist');
  app.use(express.static(clientPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    error: 'Server error',
    details: isProduction ? undefined : err.message,
  });
});

app.listen(port, () => {
  console.log(`Beadle running at http://localhost:${port}`);
});

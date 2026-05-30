# Beadle

A Beatles‑only music guessing game with daily puzzles, streak mode, and leaderboards.

## Quick start

### 1) Install dependencies

- `npm install`

### 2) Configure environment

Create a `.env` file (not committed) with your Neon connection string:

- `DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require`

### 3) Initialize the database

- `npm run db:init`

This creates:
- `daily_leaderboard`
- `streak_leaderboard`

---

## How to run

### Frontend only (no API)

Use this if you don’t need leaderboards:

- `npm run dev`

Note: `/api/*` calls won’t work without a serverless runtime.

### API only (serverless functions)

Use Vercel’s local runtime to test `/api/*` routes:

- `npm run dev:vercel`

You can then hit:
- `GET http://localhost:3000/api/leaderboard/daily`
- `GET http://localhost:3000/api/leaderboard/streak`

### Run frontend + API together

Use Vercel dev (recommended) to serve both:

- `npm run dev:vercel`

This hosts the frontend and `/api` in one process.

---

## Testing the API

### Fetch daily leaderboard

- `GET /api/leaderboard/daily`

### Fetch streak leaderboard

- `GET /api/leaderboard/streak`

### Save daily score

- `POST /api/leaderboard/daily`

Payload:
```json
{ "uid": "...", "name": "...", "days": 1, "score": 10 }
```

### Save streak score

- `POST /api/leaderboard/streak`

Payload:
```json
{ "uid": "...", "name": "...", "streak": 4 }
```

---

## Deployment (Vercel)

1) Push to GitHub.
2) In Vercel → Project → Settings → Environment Variables:
   - Add `DATABASE_URL` (Neon connection string).
3) Deploy.

### Notes
- All DB access is **server‑side** via `/api/*` serverless functions.
- No DB secrets are exposed to the client.
- No CORS setup required in production (same‑origin).

---

## Scripts

- `npm run dev` — Vite dev server (frontend only)
- `npm run dev:vercel` — Vercel dev (frontend + API)
- `npm run build` — Production build
- `npm run preview` — Preview build
- `npm run db:init` — Initialize database schema

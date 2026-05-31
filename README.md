# Beadle

A Beatles-only music guessing game with daily puzzles, streak mode, visitor count, and leaderboards.

## Quick Start

### 1) Install dependencies

- `npm install`

### 2) Configure environment

Create a `.env` file with:

- `DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require`
- `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX` (optional, enables Google Analytics)
- `VITE_API_BASE_URL=` (leave empty locally; set to Render backend URL on Vercel)
- `VITE_TURNSTILE_SITE_KEY=` (optional, free Cloudflare Turnstile site key)
- `TURNSTILE_SECRET_KEY=` (optional, free Cloudflare Turnstile secret key)
- `FRONTEND_ORIGIN=http://localhost:3000`

### 3) Initialize the database

- `npm run db:init`

This creates:

- `daily_leaderboard`
- `streak_leaderboard`
- `visitors`

## Local Run

Run the frontend and API together:

- `npm run dev`

Open:

- `http://localhost:3000`

Local API examples:

- `GET http://localhost:3000/api/health`
- `GET http://localhost:3000/api/health/db`
- `GET http://localhost:3000/api/leaderboard/daily`
- `GET http://localhost:3000/api/leaderboard/streak`
- `GET http://localhost:3000/api/visitors`
- `POST http://localhost:3000/api/visitors`

## Deployment

This repo has two deploy targets:

- Vercel: frontend only
- Render: backend/API only

### Render Backend

Create a Render Web Service from this same GitHub repo. Render uses `render.yaml`.

Use these settings if entering them manually:

- Runtime: `Node`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`
- Plan: Free is OK

Set Render environment variables:

- `DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require`
- `FRONTEND_ORIGIN=https://your-vercel-app.vercel.app`
- `TURNSTILE_SECRET_KEY=...` (optional, enables challenge verification)

For multiple allowed frontend origins:

- `ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://your-custom-domain.com`

After deploy, test:

- `https://your-render-service.onrender.com/api/health`
- `https://your-render-service.onrender.com/api/health/db`
- `https://your-render-service.onrender.com/api/visitors`
- `https://your-render-service.onrender.com/api/leaderboard/daily`
- `https://your-render-service.onrender.com/api/leaderboard/streak`

### Vercel Frontend

Create or keep your Vercel project from the same GitHub repo. Vercel uses `vercel.json` and deploys only the Vite static frontend from `dist`.

Set Vercel environment variables:

- `VITE_API_BASE_URL=https://your-render-service.onrender.com`
- `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX` (optional)
- `VITE_TURNSTILE_SITE_KEY=...` (optional, shows free Turnstile challenge)

Do not set `DATABASE_URL` on Vercel. The database connection string belongs only on Render.

### Keep-Alive

The frontend pings `GET /api/health` every 10 minutes when `VITE_API_BASE_URL` is set. This helps keep a Render free backend warm while users have the Vercel site open.

Render free web services can still sleep after 15 minutes with no inbound traffic at all. Preventing that when nobody has the site open requires an external cron/ping service.

### Security Model

The React frontend never imports or receives `DATABASE_URL`. Browser requests go to the Render API, and the API talks to Neon server-side. CORS only allows your configured Vercel/custom frontend origins.

The API also has server-side rate limits, strict leaderboard payload validation, write-origin checks, and optional Cloudflare Turnstile verification for leaderboard writes. To enable Turnstile, create a free Cloudflare Turnstile widget, put the site key on Vercel as `VITE_TURNSTILE_SITE_KEY`, and put the secret key on Render as `TURNSTILE_SECRET_KEY`.

For local development, `npm run dev` starts Express and Vite together on one origin, so the frontend can call `/api/*` without `VITE_API_BASE_URL`.

## Scripts

- `npm run dev` - Express + Vite dev server
- `npm run client:dev` - Vite frontend only
- `npm run build` - Production frontend build
- `npm start` - Run the Express server
- `npm run db:init` - Initialize or migrate database schema

# Beadle

A Beatles-only music guessing game with daily puzzles, streak mode, and leaderboards.

## Quick Start

### 1) Install dependencies

- `npm install`

### 2) Configure environment

Create a `.env` file with:

- `DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require`
- `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX` (optional, enables Google Analytics)
- `VITE_API_BASE_URL=` (leave empty locally; set to Railway backend URL on Vercel)
- `FRONTEND_ORIGIN=http://localhost:3000` (local default; set to Vercel URL on Railway)

### 3) Initialize the database

- `npm run db:init`

This creates:

- `daily_leaderboard`
- `streak_leaderboard`
- `visitors`

## How To Run

Run the frontend and API together:

- `npm run dev`

This starts the Express server, mounts Vite in development, and serves `/api/*` from the same origin.

API examples:

- `GET http://localhost:3000/api/leaderboard/daily`
- `GET http://localhost:3000/api/leaderboard/streak`
- `POST http://localhost:3000/api/visitors`

## Deployment

This repo has two deploy targets:

- Vercel: frontend only
- Railway: backend/API only

### Railway backend

Create a Railway service from this GitHub repo.

Use:

- Start command: `npm start`
- Healthcheck path: `/api/health`

Set Railway environment variables:

- `DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require`
- `FRONTEND_ORIGIN=https://your-vercel-app.vercel.app`

You can also use `ALLOWED_ORIGINS` for multiple comma-separated frontend origins:

- `ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://your-custom-domain.com`

### Vercel frontend

Create a Vercel project from the same GitHub repo. Vercel uses `vercel.json` and deploys only the static Vite frontend from `dist`.

Set Vercel environment variables:

- `VITE_API_BASE_URL=https://your-railway-service.up.railway.app`
- `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX` (optional)

Do not set `DATABASE_URL` on Vercel. The database connection string belongs only on Railway.

### Security model

The React frontend never imports or receives `DATABASE_URL`. Browser requests go to the Railway API, and the API talks to Neon server-side. Railway CORS only allows your configured Vercel/custom frontend origins.

For local development, `npm run dev` starts Express and Vite together on one origin, so the frontend can call `/api/*` without `VITE_API_BASE_URL`.

## Scripts

- `npm run dev` - Express + Vite dev server
- `npm run client:dev` - Vite frontend only
- `npm run build` - Production build
- `npm start` - Run the Express server
- `npm run db:init` - Initialize database schema

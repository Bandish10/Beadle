CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS daily_leaderboard (
  uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text NOT NULL UNIQUE,
  name text NOT NULL,
  days integer NOT NULL DEFAULT 0,
  score integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS streak_leaderboard (
  uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text NOT NULL,
  name text NOT NULL,
  streak integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS streak_leaderboard_uid_idx ON streak_leaderboard (uid);

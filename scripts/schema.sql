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

DO $$
DECLARE
  existing_unique_visitors integer := 0;
BEGIN
  IF to_regclass('public.visitors') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'visitors'
        AND column_name = 'uid'
    ) THEN
      SELECT COUNT(*)::integer INTO existing_unique_visitors FROM visitors;
      DROP TABLE visitors;
    END IF;
  END IF;

  CREATE TABLE IF NOT EXISTS visitors (
    uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    visitors integer NOT NULL DEFAULT 0
  );

  IF NOT EXISTS (SELECT 1 FROM visitors) THEN
    INSERT INTO visitors (visitors) VALUES (existing_unique_visitors);
  END IF;
END $$;

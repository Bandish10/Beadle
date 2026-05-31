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

DELETE FROM streak_leaderboard s
USING (
  SELECT
    uuid,
    ROW_NUMBER() OVER (
      PARTITION BY uid
      ORDER BY streak DESC, name ASC, uuid ASC
    ) AS row_number
  FROM streak_leaderboard
) ranked
WHERE s.uuid = ranked.uuid
  AND ranked.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS streak_leaderboard_uid_unique
  ON streak_leaderboard (uid);

DO $$
DECLARE
  existing_visitors integer := 0;
BEGIN
  IF to_regclass('public.visitors') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'visitors'
        AND column_name = 'uid'
    ) THEN
      SELECT COUNT(*)::integer INTO existing_visitors FROM visitors;
      DROP TABLE visitors;
    ELSIF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'visitors'
        AND column_name = 'visitors'
    ) THEN
      SELECT COALESCE(SUM(visitors), 0)::integer INTO existing_visitors FROM visitors;
      DROP TABLE visitors;
    END IF;
  END IF;

  CREATE TABLE IF NOT EXISTS visitors (
    uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    visitors integer NOT NULL DEFAULT 0
  );

  IF NOT EXISTS (SELECT 1 FROM visitors) THEN
    INSERT INTO visitors (visitors) VALUES (existing_visitors);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS visitors_single_row_idx
  ON visitors ((true));

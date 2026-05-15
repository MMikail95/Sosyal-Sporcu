-- voting-window-migration.sql
-- Adds finished_at column + trigger to matches table for 24-hour voting window enforcement.

-- 1. Add finished_at column
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Backfill: for already-finished matches, use updated_at as best available proxy
UPDATE matches
SET finished_at = updated_at
WHERE status = 'finished' AND finished_at IS NULL;

-- 3. Trigger function: set finished_at exactly once when status flips to 'finished'
CREATE OR REPLACE FUNCTION set_match_finished_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'finished' AND (OLD.status IS DISTINCT FROM 'finished') THEN
    NEW.finished_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Attach trigger (BEFORE UPDATE so the value lands in the same row write)
DROP TRIGGER IF EXISTS trg_set_match_finished_at ON matches;
CREATE TRIGGER trg_set_match_finished_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION set_match_finished_at();

-- 5. Index for fast window checks
CREATE INDEX IF NOT EXISTS idx_matches_finished_at
  ON matches (finished_at)
  WHERE finished_at IS NOT NULL;

-- 6. Ensure community_ratings is in Supabase Realtime publication (for live chart updates)
ALTER PUBLICATION supabase_realtime ADD TABLE community_ratings;

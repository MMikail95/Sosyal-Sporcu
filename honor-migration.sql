-- =====================================================
-- ONUR VE ROZET SİSTEMİ MİGRASYONU
-- =====================================================

-- profiles tablosuna honor sayaçları ekle
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS honor_calm     INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS honor_maestro  INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS honor_punctual INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS honor_joker    INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS honor_dynamo   INT DEFAULT 0;

-- match_honors tablosu
-- Kural: bir rater aynı maçta aynı kişiye sadece 1 onur verebilir
CREATE TABLE IF NOT EXISTS match_honors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    UUID NOT NULL REFERENCES matches(id)  ON DELETE CASCADE,
  rater_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rated_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  honor_type  TEXT NOT NULL CHECK (honor_type IN ('calm','maestro','punctual','joker','dynamo')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT match_honors_unique UNIQUE (match_id, rater_id, rated_id)
);

-- RLS politikaları
ALTER TABLE match_honors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "honor_insert" ON match_honors;
CREATE POLICY "honor_insert" ON match_honors
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = rater_id);

DROP POLICY IF EXISTS "honor_select" ON match_honors;
CREATE POLICY "honor_select" ON match_honors
  FOR SELECT TO authenticated
  USING (true);

-- Trigger: INSERT sonrası profiles.honor_* kolonunu atomik artır
CREATE OR REPLACE FUNCTION increment_honor_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format(
    'UPDATE profiles SET honor_%I = COALESCE(honor_%I, 0) + 1 WHERE id = $1',
    NEW.honor_type, NEW.honor_type
  ) USING NEW.rated_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_honor ON match_honors;
CREATE TRIGGER trg_increment_honor
  AFTER INSERT ON match_honors
  FOR EACH ROW EXECUTE FUNCTION increment_honor_count();

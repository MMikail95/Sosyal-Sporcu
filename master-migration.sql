-- =====================================================
-- MASTER MIGRATION — Sosyal Sporcu
-- Supabase Dashboard > SQL Editor > Run
--
-- Bu dosya idempotent'tir: defalarca calistirilebilir,
-- "already exists" hatalari vermez.
-- =====================================================


-- =====================================================
-- BOLUM 1: SCHEMA PATCH'LERI (ALTER TABLE)
-- faz2-migration.sql + add-ayak-column.sql icerigi
-- =====================================================

-- Ayak tercihi kolonu
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ayak TEXT DEFAULT 'Sag';

-- Team slug (davet kodu)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'fa-shield-cat';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS icon_color TEXT DEFAULT '#00ff88';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#00ff88';

-- Team istatistikleri
ALTER TABLE teams ADD COLUMN IF NOT EXISTS total_wins INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS total_losses INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS total_draws INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS total_goals_scored INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS total_goals_conceded INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Mevcut takimlar icin slug uret (bossa)
UPDATE teams
SET slug = UPPER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^A-Za-z0-9]', '', 'g'), '\s+', '', 'g'))
WHERE slug IS NULL OR slug = '';

-- match_players: oynadigi mevki
ALTER TABLE match_players
  ADD COLUMN IF NOT EXISTS position_played TEXT DEFAULT NULL;

-- profiles: form durumu
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS form_status TEXT DEFAULT 'Orta'
    CHECK (form_status IN ('Yuksek', 'Orta', 'Dusuk', 'Formda Degil'));

-- profiles: sehir ve yas null olarak baslayabilmeli
ALTER TABLE profiles ALTER COLUMN city SET DEFAULT NULL;
ALTER TABLE profiles ALTER COLUMN age  SET DEFAULT NULL;


-- =====================================================
-- BOLUM 2: RATING NULL MIGRATION
-- rating-null-migration.sql icerigi
-- =====================================================

-- DEFAULT 70 degerini kaldir
ALTER TABLE profiles ALTER COLUMN rating_teknik    DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN rating_sut       DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN rating_pas       DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN rating_hiz       DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN rating_fizik     DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN rating_kondisyon DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN gen_score        DROP DEFAULT;

-- CHECK constraint'leri NULL'a izin verecek sekilde guncelle
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_rating_teknik_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_rating_sut_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_rating_pas_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_rating_hiz_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_rating_fizik_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_rating_kondisyon_check;

ALTER TABLE profiles ADD CONSTRAINT profiles_rating_teknik_check
  CHECK (rating_teknik IS NULL OR rating_teknik BETWEEN 1 AND 99);
ALTER TABLE profiles ADD CONSTRAINT profiles_rating_sut_check
  CHECK (rating_sut IS NULL OR rating_sut BETWEEN 1 AND 99);
ALTER TABLE profiles ADD CONSTRAINT profiles_rating_pas_check
  CHECK (rating_pas IS NULL OR rating_pas BETWEEN 1 AND 99);
ALTER TABLE profiles ADD CONSTRAINT profiles_rating_hiz_check
  CHECK (rating_hiz IS NULL OR rating_hiz BETWEEN 1 AND 99);
ALTER TABLE profiles ADD CONSTRAINT profiles_rating_fizik_check
  CHECK (rating_fizik IS NULL OR rating_fizik BETWEEN 1 AND 99);
ALTER TABLE profiles ADD CONSTRAINT profiles_rating_kondisyon_check
  CHECK (rating_kondisyon IS NULL OR rating_kondisyon BETWEEN 1 AND 99);

-- Tum 70-70-70 profilleri NULL'a sifirla (hic puan girilmemis)
UPDATE profiles
SET
  rating_teknik    = NULL,
  rating_sut       = NULL,
  rating_pas       = NULL,
  rating_hiz       = NULL,
  rating_fizik     = NULL,
  rating_kondisyon = NULL,
  gen_score        = NULL
WHERE
  (rating_teknik IS NULL OR rating_teknik = 70)
  AND (rating_sut IS NULL OR rating_sut = 70)
  AND (rating_pas IS NULL OR rating_pas = 70)
  AND (rating_hiz IS NULL OR rating_hiz = 70)
  AND (rating_fizik IS NULL OR rating_fizik = 70)
  AND (rating_kondisyon IS NULL OR rating_kondisyon = 70);


-- =====================================================
-- BOLUM 3: RLS / POLICY GUNCELLEMELERI
-- fix-notifications.sql icerigi
-- DROP IF EXISTS + CREATE ile idempotent
-- =====================================================

-- Notifications: auth kullanici bildirim gonderebilmeli
DROP POLICY IF EXISTS "Sistem bildirim ekleyebilir" ON notifications;
DROP POLICY IF EXISTS "Auth kullanici bildirim gonderebilir" ON notifications;
CREATE POLICY "Auth kullanici bildirim gonderebilir"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Friendships SELECT: her iki taraf da gorebilmeli
DROP POLICY IF EXISTS "Kullanicilar kendi arkadasliklarini gorebilir" ON friendships;
DROP POLICY IF EXISTS "Kullanicilar arkadasliklari gorebilir" ON friendships;
CREATE POLICY "Kullanicilar arkadasliklari gorebilir"
  ON friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);


-- =====================================================
-- BOLUM 4: REALTIME PUBLICATION
-- fix-notifications.sql icerigi
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'friendships'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE posts;
  END IF;
END $$;


-- =====================================================
-- BOLUM 5: GRANT (profiles_with_ratings view)
-- =====================================================

GRANT SELECT ON profiles_with_ratings TO anon, authenticated;


-- =====================================================
-- SONUC KONTROLU
-- =====================================================

SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN (
    'rating_teknik','rating_sut','rating_pas',
    'rating_hiz','rating_fizik','rating_kondisyon','gen_score'
  )
ORDER BY column_name;

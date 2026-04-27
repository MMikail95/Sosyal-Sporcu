-- =====================================================
-- rating-null-migration.sql
-- Rating kolonlarini NULL default yap
-- Supabase Dashboard > SQL Editor > Run
-- =====================================================

-- 1. DEFAULT degerlerini kaldir
ALTER TABLE profiles ALTER COLUMN rating_teknik    DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN rating_sut       DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN rating_pas       DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN rating_hiz       DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN rating_fizik     DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN rating_kondisyon DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN gen_score        DROP DEFAULT;

-- 2. CHECK constraint'leri NULL'a izin verecek sekilde guncelle
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

-- 3. Mevcut DEFAULT 70 kayitlari NULL yap
-- (Hepsinin ayni 70 degerinde olmasi = hic puan girilmemis)
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
  (rating_teknik = 70 OR rating_teknik IS NULL)
  AND (rating_sut = 70 OR rating_sut IS NULL)
  AND (rating_pas = 70 OR rating_pas IS NULL)
  AND (rating_hiz = 70 OR rating_hiz IS NULL)
  AND (rating_fizik = 70 OR rating_fizik IS NULL)
  AND (rating_kondisyon = 70 OR rating_kondisyon IS NULL);

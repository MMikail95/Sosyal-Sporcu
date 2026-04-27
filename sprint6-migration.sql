-- =====================================================
-- SPRINT 6 — Karakterim + Takım Optimizasyon Migration
-- 2026-04-27  (rev 3)
-- Supabase Dashboard → SQL Editor → Yeni Sorgu
-- =====================================================

-- 0. rating_* ve gen_score sütunlarını NULL kabul edecek hale getir
--    (DEFAULT 70 yerine DEFAULT NULL — puan girilmeden boş profil)
ALTER TABLE profiles ALTER COLUMN rating_teknik    DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN rating_sut       DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN rating_pas       DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN rating_hiz       DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN rating_fizik     DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN rating_kondisyon DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN gen_score        DROP DEFAULT;

-- CHECK constraint'leri NULL'a izin verecek şekilde güncelle
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

-- Mevcut kayıtlarda DEFAULT 70 olan değerleri NULL yap
-- (sadece henüz puan girmemiş kullanıcılar için — tüm 6 rating eşit 70 ise)
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
  rating_teknik = 70 AND rating_sut = 70 AND rating_pas = 70
  AND rating_hiz = 70 AND rating_fizik = 70 AND rating_kondisyon = 70;


-- 1. match_players tablosuna oynadığı mevki sütunu ekle
ALTER TABLE match_players
  ADD COLUMN IF NOT EXISTS position_played TEXT DEFAULT NULL;

COMMENT ON COLUMN match_players.position_played IS
  'Oyuncunun bu maçta oynadığı mevki (KL, DEF, OS, FV vb.)';

-- 2. profiles tablosuna form_status sütunu ekle
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS form_status TEXT DEFAULT 'Orta'
    CHECK (form_status IN ('Yüksek', 'Orta', 'Düşük', 'Formda Değil'));

-- 3. profiles - city / age default NULL yap (yeni profil boş başlasın)
ALTER TABLE profiles ALTER COLUMN city SET DEFAULT NULL;
ALTER TABLE profiles ALTER COLUMN age  SET DEFAULT NULL;

-- 4. teams.color sütunu ekle (arma rengi)
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#00ff88';

-- 5. teams.is_active varsayılan TRUE olsun
ALTER TABLE teams
  ALTER COLUMN is_active SET DEFAULT TRUE;

-- 6. teams INSERT RLS politikası
--    (Oturum açmış kullanıcı, kendini captain_id olarak koyarak takım kurabilir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'teams' AND policyname = 'teams_insert_auth'
  ) THEN
    EXECUTE $p$
      CREATE POLICY teams_insert_auth ON teams
        FOR INSERT TO authenticated
        WITH CHECK (captain_id = auth.uid())
    $p$;
  END IF;
END;
$$;

-- 7. team_members INSERT RLS politikası
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'team_members' AND policyname = 'team_members_insert_auth'
  ) THEN
    EXECUTE $p$
      CREATE POLICY team_members_insert_auth ON team_members
        FOR INSERT TO authenticated
        WITH CHECK (
          player_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM teams
            WHERE id = team_id AND captain_id = auth.uid()
          )
        )
    $p$;
  END IF;
END;
$$;

-- Kontrol sorgusu (isteğe bağlı):
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name IN ('teams', 'match_players', 'profiles')
-- ORDER BY table_name, ordinal_position;

-- =====================================================
-- TAMAMLANDI ✅  (rev 2)
-- =====================================================

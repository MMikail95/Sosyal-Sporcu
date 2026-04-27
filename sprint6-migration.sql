-- =====================================================
-- SPRINT 6 — Karakterim + Takım Optimizasyon Migration
-- 2026-04-27  (rev 2)
-- Supabase Dashboard → SQL Editor → Yeni Sorgu
-- =====================================================

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

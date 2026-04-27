-- =====================================================
-- fix-rls-recursion.sql
-- team_members sonsuz ozyineleme duzeltmesi
-- Supabase Dashboard > SQL Editor > Run
-- =====================================================

-- SORUN: rls-privacy.sql'deki policy team_members tablosunu
-- kendi icinde sorguluyordu → infinite recursion (42P17)

-- 1. Bozuk policy'yi kaldir
DROP POLICY IF EXISTS "Takim uyelerini sadece ayni takim gorebilir" ON team_members;
DROP POLICY IF EXISTS "Takım üyelerini sadece aynı takım görebilir" ON team_members;
DROP POLICY IF EXISTS "Team members visible to same team" ON team_members;
DROP POLICY IF EXISTS "Takim uyeleri herkese acik" ON team_members;
DROP POLICY IF EXISTS "Takım üyeleri herkese açık" ON team_members;
DROP POLICY IF EXISTS "Team members are viewable by team" ON team_members;

-- 2. Temiz policy: herkese acik SELECT (teams tablosu zaten RLS ile koruyor)
CREATE POLICY "team_members_select_open"
  ON team_members FOR SELECT
  USING (true);

-- 3. Kontrol: Aktif policy'leri listele
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'team_members'
ORDER BY cmd;

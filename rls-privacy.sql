-- =====================================================
-- FAZ 5 — GİZLİLİK & YETKİLENDİRME (rls-privacy.sql)
-- Supabase Dashboard → SQL Editor → Yeni Sorgu → Run
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 1. PUBLIC_PROFILES VIEW — Herkes temel alanları görür
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public_profiles AS
SELECT
    id,
    username,
    full_name,
    avatar_url,
    city,
    position,
    ana_mevki,
    gen_score,
    total_matches,
    total_goals,
    total_assists,
    current_team_id,
    created_at
FROM profiles;

-- View'e erişim ver
GRANT SELECT ON public_profiles TO anon, authenticated;

-- ─────────────────────────────────────────────────────
-- 2. PROFILES RLS — Detaylar sadece arkadaşlara
-- ─────────────────────────────────────────────────────

-- Eski politikayı kaldır (tüm olası isimler)
DROP POLICY IF EXISTS "Herkes profilleri görebilir" ON profiles;
DROP POLICY IF EXISTS "Everyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Profil görüntüleme — kendin veya arkadaşın" ON profiles;

-- Yeni: Kendin + Arkadaşların → tam erişim
CREATE POLICY "Profil görüntüleme — kendin veya arkadaşın"
  ON profiles FOR SELECT
  USING (
    -- Kendi profilini her zaman görebilirsin
    auth.uid() = id
    OR
    -- Kabul edilmiş arkadaşlık varsa görebilirsin
    EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted'
        AND (
          (requester_id = auth.uid() AND addressee_id = profiles.id)
          OR
          (addressee_id = auth.uid() AND requester_id = profiles.id)
        )
    )
  );

-- ─────────────────────────────────────────────────────
-- 3. PROFILES_WITH_RATINGS VIEW — Aynı mantık, güncelle
-- ─────────────────────────────────────────────────────
-- Bu view zaten profiles'a JOIN ettiği için RLS otomatik devreye girer.
-- Ek bir şey gerekmez.

-- ─────────────────────────────────────────────────────
-- 4. TEAM_MEMBERS RLS — Üyeler takımı görebilir
-- ─────────────────────────────────────────────────────

-- Takım üyeleri: Aynı takımın üyeleri birbirlerini görebilir
DROP POLICY IF EXISTS "Team members are viewable by team" ON team_members;
DROP POLICY IF EXISTS "Takım üyelerini sadece aynı takım görebilir" ON team_members;
DROP POLICY IF EXISTS "Team members visible to same team" ON team_members;

CREATE POLICY "Takım üyelerini sadece aynı takım görebilir"
  ON team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.player_id = auth.uid()
    )
  );

-- Üye ekleme: Sadece kaptan
DROP POLICY IF EXISTS "Captain can add members" ON team_members;
DROP POLICY IF EXISTS "Takıma üye ekleme sadece kaptan" ON team_members;

CREATE POLICY "Takıma üye ekleme sadece kaptan"
  ON team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE id = team_members.team_id
        AND captain_id = auth.uid()
    )
    OR
    -- Davet koduyla katılım: player_id kendi id'si olmalı
    auth.uid() = team_members.player_id
  );

-- Üye silme: Kaptan herkesi silebilir, üye sadece kendini
DROP POLICY IF EXISTS "Member removal policy" ON team_members;
DROP POLICY IF EXISTS "Üye silme — kaptan veya kendisi" ON team_members;

CREATE POLICY "Üye silme — kaptan veya kendisi"
  ON team_members FOR DELETE
  USING (
    auth.uid() = player_id
    OR
    EXISTS (
      SELECT 1 FROM teams
      WHERE id = team_members.team_id
        AND captain_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────
-- 5. TEAMS TABLE — Takım görünürlüğü (keşfet için açık)
-- ─────────────────────────────────────────────────────
-- Takımlar herkes tarafından görülebilir (keşfet özelliği için)
-- Güncelleme sadece kaptana

DROP POLICY IF EXISTS "Teams are viewable by everyone" ON teams;
DROP POLICY IF EXISTS "Takımlar herkese açık" ON teams;
CREATE POLICY "Takımlar herkese açık"
  ON teams FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Captain can update team" ON teams;
DROP POLICY IF EXISTS "Takımı sadece kaptan güncelleyebilir" ON teams;
CREATE POLICY "Takımı sadece kaptan güncelleyebilir"
  ON teams FOR UPDATE
  USING (captain_id = auth.uid());

-- ─────────────────────────────────────────────────────
-- 6. NOTIFICATIONS — Sadece sahibi görebilir
-- ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can see own notifications" ON notifications;
DROP POLICY IF EXISTS "Bildirimleri sadece sahibi görebilir" ON notifications;
CREATE POLICY "Bildirimleri sadece sahibi görebilir"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can mark own notifications read" ON notifications;
DROP POLICY IF EXISTS "Bildirimleri sadece sahibi okuyabilir" ON notifications;
CREATE POLICY "Bildirimleri sadece sahibi okuyabilir"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Bildirim gönderme: authenticated kullanıcılar gönderebilir
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Kimliği doğrulanmış kullanıcılar bildirim gönderebilir" ON notifications;
CREATE POLICY "Kimliği doğrulanmış kullanıcılar bildirim gönderebilir"
  ON notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

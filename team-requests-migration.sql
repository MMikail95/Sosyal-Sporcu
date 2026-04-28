-- =====================================================
-- TEAM JOIN REQUESTS — Migration
-- Keşfet sekmesinden takıma katılma isteği sistemi
-- =====================================================

CREATE TABLE IF NOT EXISTS team_join_requests (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id     UUID        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status      TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'accepted', 'rejected')),
    message     TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, player_id)
);

ALTER TABLE team_join_requests ENABLE ROW LEVEL SECURITY;

-- Oyuncu kendi isteğini görebilir
CREATE POLICY "player_see_own_requests" ON team_join_requests
    FOR SELECT USING (player_id = auth.uid());

-- Kaptan kendi takımına gelen istekleri görebilir
CREATE POLICY "captain_see_team_requests" ON team_join_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teams
            WHERE teams.id = team_join_requests.team_id
              AND teams.captain_id = auth.uid()
        )
    );

-- Oyuncu kendi isteğini oluşturabilir
CREATE POLICY "player_insert_request" ON team_join_requests
    FOR INSERT WITH CHECK (player_id = auth.uid());

-- Kaptan istekleri onaylayabilir / reddedebilir
CREATE POLICY "captain_update_requests" ON team_join_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM teams
            WHERE teams.id = team_join_requests.team_id
              AND teams.captain_id = auth.uid()
        )
    );

-- Oyuncu bekleyen isteğini iptal edebilir
CREATE POLICY "player_cancel_request" ON team_join_requests
    FOR DELETE USING (player_id = auth.uid() AND status = 'pending');

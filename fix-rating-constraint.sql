-- =====================================================
-- FIX: community_ratings + takım istatistikleri
-- Supabase SQL Editor'da çalıştır
-- =====================================================

-- ──────────────────────────────────────────────────────
-- KISIM 1: community_ratings UNIQUE CONSTRAINT düzeltmesi
-- Sorun: UNIQUE INDEX yerine gerçek CONSTRAINT gerekli
--        çünkü Supabase upsert onConflict sadece CONSTRAINT tanır
-- ──────────────────────────────────────────────────────

-- 1a. Önce eski index'leri kaldır
DROP INDEX IF EXISTS community_ratings_per_match_unique;
DROP INDEX IF EXISTS community_ratings_global_unique;

-- 1b. Eski UNIQUE constraint kaldır (zaten kaldırılmış olabilir)
ALTER TABLE community_ratings
  DROP CONSTRAINT IF EXISTS community_ratings_rated_player_id_rater_id_key;

-- 1c. match_id kolonu ekle (yoksa)
ALTER TABLE community_ratings
  ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES matches(id) ON DELETE SET NULL DEFAULT NULL;

-- 1d. fair_play kolonu ekle (yoksa)
ALTER TABLE community_ratings
  ADD COLUMN IF NOT EXISTS fair_play INTEGER DEFAULT NULL
    CHECK (fair_play IS NULL OR fair_play BETWEEN 1 AND 5);

-- 1e. Çakışan satırları temizle: aynı (rater_id, rated_player_id, match_id) çiftinin
--     birden fazla kaydı varsa eskisini sil, yenisini koru
DELETE FROM community_ratings cr1
USING community_ratings cr2
WHERE cr1.id < cr2.id
  AND cr1.rated_player_id = cr2.rated_player_id
  AND cr1.rater_id = cr2.rater_id
  AND cr1.match_id IS NOT DISTINCT FROM cr2.match_id;

-- 1f. Gerçek UNIQUE CONSTRAINT ekle (match_id dahil, NULL-safe)
--     Bu özel constraint NULL değerleri eşit sayar
ALTER TABLE community_ratings
  ADD CONSTRAINT community_ratings_per_match_unique
    UNIQUE (rated_player_id, rater_id, match_id);

-- ──────────────────────────────────────────────────────
-- KISIM 2: Takım istatistikleri trigger'ı
-- Sorun: Maç bitince takımın wins/losses/draws güncellenmiyor
-- ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_team_stats_on_match_finish()
RETURNS TRIGGER AS $$
BEGIN
  -- Sadece status 'finished' olduğunda çalıştır
  IF NEW.status = 'finished' AND (OLD.status IS NULL OR OLD.status != 'finished') THEN
    -- Ev sahibi takımı güncelle
    IF NEW.home_team_id IS NOT NULL THEN
      IF NEW.home_score > NEW.away_score THEN
        UPDATE teams SET
          total_wins = total_wins + 1,
          total_goals_scored = total_goals_scored + NEW.home_score,
          total_goals_conceded = total_goals_conceded + NEW.away_score,
          updated_at = NOW()
        WHERE id = NEW.home_team_id;
      ELSIF NEW.home_score < NEW.away_score THEN
        UPDATE teams SET
          total_losses = total_losses + 1,
          total_goals_scored = total_goals_scored + NEW.home_score,
          total_goals_conceded = total_goals_conceded + NEW.away_score,
          updated_at = NOW()
        WHERE id = NEW.home_team_id;
      ELSE
        UPDATE teams SET
          total_draws = total_draws + 1,
          total_goals_scored = total_goals_scored + NEW.home_score,
          total_goals_conceded = total_goals_conceded + NEW.away_score,
          updated_at = NOW()
        WHERE id = NEW.home_team_id;
      END IF;
    END IF;

    -- Deplasman takımını güncelle
    IF NEW.away_team_id IS NOT NULL THEN
      IF NEW.away_score > NEW.home_score THEN
        UPDATE teams SET
          total_wins = total_wins + 1,
          total_goals_scored = total_goals_scored + NEW.away_score,
          total_goals_conceded = total_goals_conceded + NEW.home_score,
          updated_at = NOW()
        WHERE id = NEW.away_team_id;
      ELSIF NEW.away_score < NEW.home_score THEN
        UPDATE teams SET
          total_losses = total_losses + 1,
          total_goals_scored = total_goals_scored + NEW.away_score,
          total_goals_conceded = total_goals_conceded + NEW.home_score,
          updated_at = NOW()
        WHERE id = NEW.away_team_id;
      ELSE
        UPDATE teams SET
          total_draws = total_draws + 1,
          total_goals_scored = total_goals_scored + NEW.away_score,
          total_goals_conceded = total_goals_conceded + NEW.home_score,
          updated_at = NOW()
        WHERE id = NEW.away_team_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_match_finish_update_team_stats ON matches;
CREATE TRIGGER on_match_finish_update_team_stats
  AFTER UPDATE OF status ON matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_team_stats_on_match_finish();

-- ──────────────────────────────────────────────────────
-- KISIM 3: match_players'a position_played kolonu ekle (yoksa)
-- ──────────────────────────────────────────────────────
ALTER TABLE match_players
  ADD COLUMN IF NOT EXISTS position_played TEXT DEFAULT NULL;

-- ──────────────────────────────────────────────────────
-- Doğrulama sorguları
-- ──────────────────────────────────────────────────────
-- SELECT constraint_name FROM information_schema.table_constraints
-- WHERE table_name = 'community_ratings' AND constraint_type = 'UNIQUE';
-- SELECT trigger_name FROM information_schema.triggers
-- WHERE event_object_table = 'matches';

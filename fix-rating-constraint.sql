-- =====================================================
-- FIX v2: community_ratings + takım istatistikleri
-- Supabase SQL Editor'da çalıştır (idempotent)
-- =====================================================

-- ──────────────────────────────────────────────────────
-- KISIM 1: community_ratings → match_id kolonu + constraint
-- ──────────────────────────────────────────────────────

-- 1a. Eski index'leri kaldır
DROP INDEX IF EXISTS community_ratings_per_match_unique;
DROP INDEX IF EXISTS community_ratings_global_unique;

-- 1b. Eski UNIQUE constraint'leri kaldır
ALTER TABLE community_ratings
  DROP CONSTRAINT IF EXISTS community_ratings_rated_player_id_rater_id_key;
ALTER TABLE community_ratings
  DROP CONSTRAINT IF EXISTS community_ratings_per_match_unique;

-- 1c. match_id kolonu ekle (yoksa)
ALTER TABLE community_ratings
  ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES matches(id) ON DELETE SET NULL DEFAULT NULL;

-- 1d. Çakışan satırları temizle (aynı rater+rated+match kombinasyonu)
DELETE FROM community_ratings cr1
USING community_ratings cr2
WHERE cr1.id < cr2.id
  AND cr1.rated_player_id = cr2.rated_player_id
  AND cr1.rater_id = cr2.rater_id
  AND cr1.match_id IS NOT DISTINCT FROM cr2.match_id;

-- 1e. match_id IS NOT NULL olan kayıtlar için UNIQUE INDEX (maç bazlı)
--     Supabase upsert: onConflict='rated_player_id,rater_id,match_id' bu index'i kullanır
CREATE UNIQUE INDEX IF NOT EXISTS uq_community_ratings_match
  ON community_ratings (rated_player_id, rater_id, match_id)
  WHERE match_id IS NOT NULL;

-- 1f. match_id IS NULL olan kayıtlar için UNIQUE INDEX (global puan)
--     Supabase upsert: onConflict='rated_player_id,rater_id' bunu kullanır  
CREATE UNIQUE INDEX IF NOT EXISTS uq_community_ratings_global
  ON community_ratings (rated_player_id, rater_id)
  WHERE match_id IS NULL;

-- ──────────────────────────────────────────────────────
-- KISIM 2: Takım istatistikleri trigger'ı
-- Maç 'finished' olunca takımların wins/losses/draws'ını günceller
-- ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_team_stats_on_match_finish()
RETURNS TRIGGER AS $$
BEGIN
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
-- KISIM 3: match_players.position_played kolonu (yoksa)
-- ──────────────────────────────────────────────────────
ALTER TABLE match_players
  ADD COLUMN IF NOT EXISTS position_played TEXT DEFAULT NULL;

-- ──────────────────────────────────────────────────────
-- Doğrulama (çalıştırdıktan sonra kontrol et)
-- ──────────────────────────────────────────────────────
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'community_ratings';
-- SELECT indexname FROM pg_indexes WHERE tablename = 'community_ratings';
-- SELECT trigger_name FROM information_schema.triggers
--   WHERE event_object_table = 'matches';

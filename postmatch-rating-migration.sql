-- =====================================================
-- POST-MAÇ 360 DERECELİK PUANLAMA — VERİTABANI MİGRASYONU
-- postmatch-rating-migration.sql
-- Supabase SQL Editor'da bir kez çalıştır
-- =====================================================

-- 1. match_id kolonu ekle (NULL default → eski topluluk puanları korunur)
ALTER TABLE community_ratings
  ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES matches(id) ON DELETE SET NULL DEFAULT NULL;

-- 2. fair_play kolonu ekle (rakip centilmenlik puanı, 1–5 yıldız)
ALTER TABLE community_ratings
  ADD COLUMN IF NOT EXISTS fair_play INTEGER DEFAULT NULL
    CHECK (fair_play IS NULL OR fair_play BETWEEN 1 AND 5);

-- 3. Eski tek-kısıtı kaldır (match bazlı çakışma indeksleriyle değiştiriyoruz)
ALTER TABLE community_ratings
  DROP CONSTRAINT IF EXISTS community_ratings_rated_player_id_rater_id_key;

-- 4. Maç başına benzersizlik: aynı oyuncuya aynı maçta sadece bir puan verilebilir
CREATE UNIQUE INDEX IF NOT EXISTS community_ratings_per_match_unique
  ON community_ratings (rated_player_id, rater_id, match_id)
  WHERE match_id IS NOT NULL;

-- 5. Eski global puanlar hâlâ benzersiz kalır (match_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS community_ratings_global_unique
  ON community_ratings (rated_player_id, rater_id)
  WHERE match_id IS NULL;

-- 6. Performans için yardımcı indeksler
CREATE INDEX IF NOT EXISTS idx_community_ratings_rater_match
  ON community_ratings (rater_id, match_id);

CREATE INDEX IF NOT EXISTS idx_community_ratings_player_match
  ON community_ratings (rated_player_id, match_id);

-- Doğrulama sorguları (çalıştırdıktan sonra kontrol et)
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'community_ratings' AND column_name IN ('match_id', 'fair_play');
-- SELECT indexname FROM pg_indexes WHERE tablename = 'community_ratings';

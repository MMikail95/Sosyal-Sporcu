-- =====================================================
-- FAZ 2: Takımım Supabase Migration
-- teams.slug sütununu ekle (davet kodu)
-- teams tablosuna icon/color alanları
-- =====================================================

-- Slug (davet kodu) sütunu — zaten varsa atlar
ALTER TABLE teams ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'fa-shield-cat';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS icon_color TEXT DEFAULT '#00ff88';

-- Mevcut takımlar için slug üret (boşsa)
UPDATE teams
SET slug = UPPER(REGEXP_REPLACE(name, '[^A-Z0-9]', '', 'g'))
WHERE slug IS NULL OR slug = '';

-- total_wins/draws/losses sütunları (schema.sql'de zaten var, yoksa ekle)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS total_wins INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS total_losses INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS total_draws INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS total_goals_scored INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS total_goals_conceded INTEGER DEFAULT 0;

-- RLS: Kaptan veya üye takımı görebilir (halihazırda herkese açık)
-- Ekstra bir politika gerekmez.

-- ✅ Migration tamamlandı

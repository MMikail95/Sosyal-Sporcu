-- district-migration.sql
-- teams tablosuna ilçe/bölge kolonu ekler
-- Bölgesel filtreleme (Keşfet > Takımlar) için gereklidir

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS district TEXT DEFAULT '';

-- Mevcut kayıtlardaki district'i city değeriyle başlat (isteğe bağlı)
-- UPDATE teams SET district = city WHERE district = '' AND city IS NOT NULL;

COMMENT ON COLUMN teams.district IS 'İlçe/bölge (Kadıköy, Üsküdar vb.)';

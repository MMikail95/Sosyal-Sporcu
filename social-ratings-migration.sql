-- Sosyal puanlama kolonları (1-10 scale)
ALTER TABLE community_ratings
  ADD COLUMN IF NOT EXISTS rating_dakiklik INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS rating_saha_iletisimi INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS rating_mac_sosyal INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS rating_mevki_sadakati INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS rating_pres INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS rating_markaj INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS rating_pas_tercihleri INTEGER DEFAULT 5;

-- Teknik kolonların default'larını 1-10 scale için güncelle
ALTER TABLE community_ratings
  ALTER COLUMN rating_teknik SET DEFAULT 5,
  ALTER COLUMN rating_sut SET DEFAULT 5,
  ALTER COLUMN rating_pas SET DEFAULT 5,
  ALTER COLUMN rating_hiz SET DEFAULT 5,
  ALTER COLUMN rating_fizik SET DEFAULT 5,
  ALTER COLUMN rating_kondisyon SET DEFAULT 5;

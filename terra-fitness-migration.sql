-- =====================================================
-- TERRA FITNESS ENTEGRASYONU — HAZIR AMA UYGULANMADI
-- Uygulamak için: Supabase Dashboard → SQL Editor → çalıştır
-- Terra API: https://tryterra.co
-- =====================================================

-- 1) profiles: Terra bağlantı bilgisi
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terra_user_id     TEXT,
  ADD COLUMN IF NOT EXISTS terra_provider    TEXT,   -- 'apple', 'garmin', 'polar', 'strava' vb.
  ADD COLUMN IF NOT EXISTS terra_connected_at TIMESTAMPTZ;

-- 2) match_players: Maç başına fitness verisi
ALTER TABLE match_players
  ADD COLUMN IF NOT EXISTS distance_m        INTEGER,     -- toplam koşu mesafesi (metre)
  ADD COLUMN IF NOT EXISTS max_speed_kmh     NUMERIC(5,2),-- max hız (km/s)
  ADD COLUMN IF NOT EXISTS avg_speed_kmh     NUMERIC(5,2),-- ort hız
  ADD COLUMN IF NOT EXISTS calories          INTEGER,     -- yakılan kalori
  ADD COLUMN IF NOT EXISTS avg_heart_rate    INTEGER,     -- ort kalp atışı
  ADD COLUMN IF NOT EXISTS max_heart_rate    INTEGER,     -- max kalp atışı
  ADD COLUMN IF NOT EXISTS steps             INTEGER,     -- adım sayısı
  ADD COLUMN IF NOT EXISTS polyline          TEXT,        -- encoded GPS (ısı haritası için)
  ADD COLUMN IF NOT EXISTS activity_source   TEXT,        -- 'apple_health', 'garmin', 'strava' vb.
  ADD COLUMN IF NOT EXISTS activity_id       TEXT;        -- Terra aktivite ID (duplicate önleme)

-- 3) Realtime için match_players zaten publish edilmiş, ekstra gerekmez

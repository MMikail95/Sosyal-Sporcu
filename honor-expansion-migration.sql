-- honor-expansion-migration.sql
-- Onur sistemi genişletmesi: 12 yeni profil kolonu + CHECK kısıt güncellemesi

-- 1. Yeni onur kolonları ekle (profiles tablosuna)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS honor_mvp             INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS honor_fuzeci          INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS honor_duvar           INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS honor_cigersiz_honor  INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS honor_beyefendi       INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS honor_sosyal          INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS honor_gizli_cevher    INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS honor_oyunbozan       INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS honor_organizator     INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS honor_saha_komiseri   INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS honor_emanetci        INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS honor_fedakar_eldiven INT DEFAULT 0;

-- 2. match_honors CHECK kısıtını genişlet (eski tipler + yeni tipler)
ALTER TABLE match_honors
  DROP CONSTRAINT IF EXISTS match_honors_honor_type_check;

ALTER TABLE match_honors
  ADD CONSTRAINT match_honors_honor_type_check
  CHECK (honor_type IN (
    'calm', 'maestro', 'punctual', 'joker', 'dynamo',
    'mvp', 'fuzeci', 'duvar', 'cigersiz_honor', 'beyefendi',
    'sosyal', 'gizli_cevher', 'oyunbozan', 'organizator',
    'saha_komiseri', 'emanetci', 'fedakar_eldiven'
  ));

-- NOT: Trigger (trg_increment_honor) değişmiyor — dinamik kolon adıyla çalışır.
-- Doğrulama sorgusu:
-- SELECT honor_mvp, honor_fuzeci, honor_duvar FROM profiles LIMIT 1;

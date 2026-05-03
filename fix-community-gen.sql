-- =====================================================
-- FIX: Community Rating → Profile GEN Güncelleme
-- Supabase SQL Editor'da çalıştır
-- =====================================================
-- Bu script:
-- 1. community_ratings'e yeni bir kayıt eklenince/güncellenince
--    rated_player_id'nin profiles.rating_* kolonlarını
--    community ortalamasıyla günceller (1-10 skala)
-- 2. recalculate_gen_score trigger'ı otomatik olarak
--    gen_score = (teknik+sut+pas+hiz+fizik+kondisyon)/6 hesaplar
-- 3. Mevcut bozuk gen_score verilerini düzeltir (tek seferlik)
-- =====================================================

-- ──────────────────────────────────────────────────────
-- 1. Community rating → profile güncelleme trigger'ı
-- ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_profile_from_community_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_teknik    NUMERIC;
  avg_sut       NUMERIC;
  avg_pas       NUMERIC;
  avg_hiz       NUMERIC;
  avg_fizik     NUMERIC;
  avg_kondisyon NUMERIC;
BEGIN
  -- Bu oyuncuya verilen tüm community rating'lerin ortalamasını al
  SELECT
    ROUND(AVG(rating_teknik)),
    ROUND(AVG(rating_sut)),
    ROUND(AVG(rating_pas)),
    ROUND(AVG(rating_hiz)),
    ROUND(AVG(rating_fizik)),
    ROUND(AVG(rating_kondisyon))
  INTO
    avg_teknik, avg_sut, avg_pas, avg_hiz, avg_fizik, avg_kondisyon
  FROM community_ratings
  WHERE rated_player_id = NEW.rated_player_id;

  -- profiles tablosunu güncelle (NULL değilse güncelle)
  IF avg_teknik IS NOT NULL THEN
    UPDATE profiles SET
      rating_teknik    = avg_teknik::INTEGER,
      rating_sut       = avg_sut::INTEGER,
      rating_pas       = avg_pas::INTEGER,
      rating_hiz       = avg_hiz::INTEGER,
      rating_fizik     = avg_fizik::INTEGER,
      rating_kondisyon = avg_kondisyon::INTEGER
      -- gen_score: on_profile_rating_change trigger'ı otomatik hesaplar
    WHERE id = NEW.rated_player_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı ekle: INSERT veya UPDATE sonrası tetikle
DROP TRIGGER IF EXISTS on_community_rating_update_profile ON community_ratings;
CREATE TRIGGER on_community_rating_update_profile
  AFTER INSERT OR UPDATE ON community_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_from_community_rating();

-- ──────────────────────────────────────────────────────
-- 2. recalculate_gen_score: 1-10 skala için uyumlu
-- ──────────────────────────────────────────────────────
-- Mevcut trigger zaten doğru: (toplam)/6 → 1-10 aralığı
-- Sadece rating'ler 1-10 olarak girildiğinde doğru çalışır.
-- (Önceki 1-99 değerler düzeltilmeli → aşağıda yapılıyor)

-- ──────────────────────────────────────────────────────
-- 3. Mevcut bozuk verileri temizle (tek seferlik)
--    Eğer community_ratings'te 1-99 arası eski değerler varsa
--    10'a böl ve profiles'i güncelle
-- ──────────────────────────────────────────────────────

-- Önce community_ratings'teki eski 1-99 değerleri 1-10'a normalize et
UPDATE community_ratings
SET
  rating_teknik    = GREATEST(1, LEAST(10, ROUND(rating_teknik    / 9.9)::INTEGER)),
  rating_sut       = GREATEST(1, LEAST(10, ROUND(rating_sut       / 9.9)::INTEGER)),
  rating_pas       = GREATEST(1, LEAST(10, ROUND(rating_pas       / 9.9)::INTEGER)),
  rating_hiz       = GREATEST(1, LEAST(10, ROUND(rating_hiz       / 9.9)::INTEGER)),
  rating_fizik     = GREATEST(1, LEAST(10, ROUND(rating_fizik     / 9.9)::INTEGER)),
  rating_kondisyon = GREATEST(1, LEAST(10, ROUND(rating_kondisyon / 9.9)::INTEGER))
WHERE rating_teknik > 10
   OR rating_sut > 10
   OR rating_pas > 10
   OR rating_hiz > 10
   OR rating_fizik > 10
   OR rating_kondisyon > 10;

-- Profiles tablosundaki 1-99 self-rating değerlerini de normalize et
UPDATE profiles
SET
  rating_teknik    = GREATEST(1, LEAST(10, ROUND(rating_teknik    / 9.9)::INTEGER)),
  rating_sut       = GREATEST(1, LEAST(10, ROUND(rating_sut       / 9.9)::INTEGER)),
  rating_pas       = GREATEST(1, LEAST(10, ROUND(rating_pas       / 9.9)::INTEGER)),
  rating_hiz       = GREATEST(1, LEAST(10, ROUND(rating_hiz       / 9.9)::INTEGER)),
  rating_fizik     = GREATEST(1, LEAST(10, ROUND(rating_fizik     / 9.9)::INTEGER)),
  rating_kondisyon = GREATEST(1, LEAST(10, ROUND(rating_kondisyon / 9.9)::INTEGER))
WHERE rating_teknik    > 10
   OR rating_sut       > 10
   OR rating_pas       > 10
   OR rating_hiz       > 10
   OR rating_fizik     > 10
   OR rating_kondisyon > 10;

-- Gen score'ları yeniden hesapla (normalize edilmiş değerlerle)
UPDATE profiles
SET gen_score = (
  COALESCE(rating_teknik, 5) +
  COALESCE(rating_sut, 5) +
  COALESCE(rating_pas, 5) +
  COALESCE(rating_hiz, 5) +
  COALESCE(rating_fizik, 5) +
  COALESCE(rating_kondisyon, 5)
) / 6
WHERE rating_teknik IS NOT NULL;

-- ──────────────────────────────────────────────────────
-- Doğrulama:
-- SELECT id, username, gen_score, rating_teknik, rating_sut
-- FROM profiles WHERE gen_score IS NOT NULL
-- ORDER BY gen_score DESC LIMIT 10;
-- ──────────────────────────────────────────────────────

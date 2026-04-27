-- =====================================================
-- SPRINT 6 — Karakterim Optimizasyonu Migration
-- 2026-04-27
-- Supabase Dashboard → SQL Editor → Yeni Sorgu
-- Bu kodu çalıştırın, sonra JS değişikliklerini uygulayın
-- =====================================================

-- 1. match_players tablosuna oynadığı mevki sütunu ekle
ALTER TABLE match_players
  ADD COLUMN IF NOT EXISTS position_played TEXT DEFAULT NULL;

COMMENT ON COLUMN match_players.position_played IS
  'Oyuncunun bu maçta oynadığı mevki (KL, DEF, OS, FV vb.)';

-- 2. profiles tablosuna form_status sütunu ekle (#11 için)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS form_status TEXT DEFAULT 'Orta'
    CHECK (form_status IN ('Yüksek', 'Orta', 'Düşük', 'Formda Değil'));

-- 3. profiles - city default'unu NULL yap (#5, #6 fix için)
-- Mevcut kayıtlara dokunulmaz, sadece yeni kayıtlar için default kaldırılır
ALTER TABLE profiles ALTER COLUMN city SET DEFAULT NULL;
ALTER TABLE profiles ALTER COLUMN age SET DEFAULT NULL;

-- 4. match_players view'ı — maç geçmişi için JOIN sorgusu kolaylaştırma
-- (view oluşturulmaz, JS tarafında join yapılır — sadece sütun kontrolü)

-- =====================================================
-- Yeni trigger: profiles'da city/age NULL'dan dolduğunda
-- Herhangi bir değişiklik yok, sadece constraint kaldırmak için
-- =====================================================

-- Kontrol sorgusu — aşağıdakini çalıştırıp sonucu görün:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'match_players'
-- ORDER BY ordinal_position;

-- =====================================================
-- TAMAMLANDI ✅
-- Çalıştırıldıktan sonra bu dosyayı kaydedin.
-- =====================================================

-- =====================================================
-- add-ayak-column.sql
-- profiles tablosuna ayak kolonu ekler
-- Supabase Dashboard → SQL Editor'de çalıştırın
-- =====================================================

-- Ayak kolonu ekle (zaten varsa hata vermez)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ayak TEXT DEFAULT 'Sağ';

-- CHECK kısıtlaması (opsiyonel — geçerli değerleri sınırla)
-- ALTER TABLE profiles ADD CONSTRAINT profiles_ayak_check
--     CHECK (ayak IN ('Sağ', 'Sol', 'Her İkisi'));

-- Kontrol
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'ayak';

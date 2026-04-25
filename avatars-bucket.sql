-- =====================================================
-- avatars-bucket.sql
-- Supabase Storage: avatars bucket kurulumu
-- 
-- Bu SQL'i Supabase Dashboard > SQL Editor'e yapıştır ve çalıştır.
-- Ardından Storage > Buckets bölümünden bucket'ın oluştuğunu doğrula.
-- =====================================================

-- ── 1. STORAGE BUCKET OLUŞTUR ──────────────────────────────────────────────
-- Not: bucket yalnızca Dashboard UI'dan veya Service Role anahtarıyla oluşturulabilir.
-- Bu SQL politikaları kurar, bucket'ı Dashboard'dan elle oluşturmak gerekebilir.

-- Eğer Storage API erişimin varsa:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,                           -- Herkese açık (public URL)
    5242880,                        -- 5 MB limit
    ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif'];


-- ── 2. RLS POLİTİKALARI ────────────────────────────────────────────────────

-- Herkese okuma izni (public bucket)
CREATE POLICY "Avatarlar herkese açık"
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'avatars' );

-- Giriş yapan kullanıcı kendi klasörüne yükleyebilir
-- Dosya yolu: {user_id}/avatar.webp
CREATE POLICY "Kullanıcı kendi avatarını yükleyebilir"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Giriş yapan kullanıcı kendi dosyasını güncelleyebilir (upsert için)
CREATE POLICY "Kullanıcı kendi avatarını güncelleyebilir"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Giriş yapan kullanıcı kendi dosyasını silebilir
CREATE POLICY "Kullanıcı kendi avatarını silebilir"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );


-- ── 3. KONTROL SORGUSU ─────────────────────────────────────────────────────
-- Bu sorguyu çalıştırarak bucket'ın oluştuğunu doğrula:
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'avatars';

-- ── 4. NOTLAR ──────────────────────────────────────────────────────────────
-- Dashboard'dan manuel oluşturmak için:
-- 1. Supabase Dashboard > Storage > New Bucket
-- 2. Name: avatars
-- 3. Public bucket: ✅ İşaretli
-- 4. File size limit: 5 MB
-- 5. Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
-- 6. Kaydet
-- Ardından yukarıdaki sadece politika SQL'lerini çalıştır (INSERT kısmını atla)

-- =====================================================
-- FIX: Bildirim ve Realtime Düzeltmeleri
-- Supabase Dashboard → SQL Editor → Run
-- =====================================================

-- 1) Notifications Realtime'ı güçlendir (tablo seviyesi filtre)
-- Eğer daha önce eklenmişse DROP edip tekrar ekle
DO $$
BEGIN
  -- supabase_realtime publication'ına notifications yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'friendships'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE posts;
  END IF;
END $$;

-- 2) Notifications INSERT politikasını güçlendir
-- Auth kullanıcıları başkalarına bildirim gönderebilmeli
DROP POLICY IF EXISTS "Sistem bildirim ekleyebilir" ON notifications;
CREATE POLICY "Auth kullanıcı bildirim gönderebilir"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3) Friendships SELECT politikasını herkese aç (kontrol için)
-- (isteği gönderen kişi karşı tarafın isteğini görebilmeli)
DROP POLICY IF EXISTS "Kullanıcılar kendi arkadaşlıklarını görebilir" ON friendships;
CREATE POLICY "Kullanıcılar arkadaşlıkları görebilir"
  ON friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- 4) Profiles_with_ratings view'ine SELECT grant
GRANT SELECT ON profiles_with_ratings TO anon, authenticated;

-- ✅ Düzeltmeler tamamlandı
SELECT 'Düzeltmeler başarıyla uygulandı ✅' AS result;

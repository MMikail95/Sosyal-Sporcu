-- =====================================================
-- Google OAuth Migration
-- Supabase Dashboard → SQL Editor → Çalıştır
-- =====================================================

-- 1. Onboarding durumu kolonu ekle
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN DEFAULT FALSE;

-- Mevcut kullanıcılar onboarding'i tamamlamış sayılır
UPDATE public.profiles SET onboarding_done = TRUE WHERE onboarding_done = FALSE;

-- 2. Trigger'ı Google metadata formatını da destekleyecek şekilde güncelle
--    (Google 'name' kullanır, 'full_name' değil; avatar 'picture' olarak gelir)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INT := 0;
BEGIN
  -- Kullanıcı adı: email kaydında metadata'dan, Google'da ismin ilk kelimesi
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    REGEXP_REPLACE(
      LOWER(SPLIT_PART(
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        ' ', 1
      )),
      '[^a-z0-9_]', '', 'g'
    ),
    split_part(NEW.email, '@', 1)
  );

  -- En az 3 karakter
  IF LENGTH(COALESCE(base_username, '')) < 3 THEN
    base_username := COALESCE(base_username, 'sporcu') || 'ss';
  END IF;

  -- Çakışma olursa sayı ekle
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, username, full_name, avatar_url, onboarding_done)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

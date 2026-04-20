-- =====================================================
-- SOSYAL SPORCU — Supabase SQL Şeması
-- FAZ 0: Tam veritabanı kurulumu
-- Supabase Dashboard → SQL Editor → Yeni Sorgu
-- Tüm bu kodu kopyalayıp yapıştırın ve Run'a basın
-- =====================================================


-- =====================================================
-- TABLO 1: profiles (Oyuncu profilleri)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  city TEXT DEFAULT 'İstanbul',
  -- Mevki & Oyun
  position TEXT DEFAULT 'OS',
  ana_mevki TEXT DEFAULT 'Ofansif OS (10 Numara)',
  alt_pos TEXT DEFAULT '',
  oyun_tarzi TEXT DEFAULT 'Box-to-Box',
  -- Kimlik
  age INTEGER DEFAULT 24,
  height INTEGER DEFAULT 180,
  weight INTEGER DEFAULT 75,
  -- Karakter özellikleri
  ekol TEXT DEFAULT 'Halısaha Gazisi',
  sakatlik TEXT DEFAULT 'Maç Seçer',
  macsatma TEXT DEFAULT 'Keyfine Bağlı',
  mizac TEXT DEFAULT 'Makara Yapıcı',
  lojistik TEXT DEFAULT 'Kendi Gelir',
  dakiklik TEXT DEFAULT 'Son Dakika Yetişir',
  saha_iletisim TEXT DEFAULT 'Sessiz Oynar',
  mac_sonu TEXT DEFAULT 'Bir Çay İçip Gider',
  mevki_sadakat TEXT DEFAULT 'Bazen Gezer',
  pres_gucu TEXT DEFAULT 'Yorgunsa Yavaş',
  pas_tercihi TEXT DEFAULT 'Dengeli',
  markaj TEXT DEFAULT 'Yakın Takip',
  -- Self-ratings (kendi puanlaması)
  rating_teknik INTEGER DEFAULT 70 CHECK (rating_teknik BETWEEN 1 AND 99),
  rating_sut INTEGER DEFAULT 70 CHECK (rating_sut BETWEEN 1 AND 99),
  rating_pas INTEGER DEFAULT 70 CHECK (rating_pas BETWEEN 1 AND 99),
  rating_hiz INTEGER DEFAULT 70 CHECK (rating_hiz BETWEEN 1 AND 99),
  rating_fizik INTEGER DEFAULT 70 CHECK (rating_fizik BETWEEN 1 AND 99),
  rating_kondisyon INTEGER DEFAULT 70 CHECK (rating_kondisyon BETWEEN 1 AND 99),
  -- İstatistikler
  gen_score INTEGER DEFAULT 70,
  total_matches INTEGER DEFAULT 0,
  total_goals INTEGER DEFAULT 0,
  total_assists INTEGER DEFAULT 0,
  -- Takım bilgisi (kolay erişim için denormalize)
  current_team_id UUID,
  -- Meta
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS politikaları
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes profilleri görebilir"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Kullanıcılar kendi profilini oluşturabilir"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Kullanıcılar kendi profilini güncelleyebilir"
  ON profiles FOR UPDATE USING (auth.uid() = id);


-- =====================================================
-- TABLO 2: friendships (Arkadaşlık sistemi)
-- =====================================================
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  addressee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcılar kendi arkadaşlıklarını görebilir"
  ON friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Kullanıcılar arkadaşlık isteği gönderebilir"
  ON friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Alıcı isteği güncelleyebilir"
  ON friendships FOR UPDATE USING (auth.uid() = addressee_id OR auth.uid() = requester_id);

CREATE POLICY "Kullanıcılar kendi arkadaşlıklarını silebilir"
  ON friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);


-- =====================================================
-- TABLO 3: teams (Takımlar)
-- =====================================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  captain_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  logo_url TEXT,
  city TEXT DEFAULT 'İstanbul',
  description TEXT,
  formation TEXT DEFAULT '2-3-1',
  gen_score INTEGER DEFAULT 70,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  total_draws INTEGER DEFAULT 0,
  total_goals_scored INTEGER DEFAULT 0,
  total_goals_conceded INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Takımlar herkese açık"
  ON teams FOR SELECT USING (true);

CREATE POLICY "Auth kullanıcı takım kurabilir"
  ON teams FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Kaptan takımını güncelleyebilir"
  ON teams FOR UPDATE USING (auth.uid() = captain_id);

CREATE POLICY "Kaptan takımını silebilir"
  ON teams FOR DELETE USING (auth.uid() = captain_id);


-- =====================================================
-- TABLO 4: team_members (Takım üyeliği)
-- =====================================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'player' CHECK (role IN ('captain', 'player', 'substitute')),
  jersey_number INTEGER CHECK (jersey_number BETWEEN 1 AND 99),
  position_in_team TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, player_id),
  UNIQUE(team_id, jersey_number)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Takım üyeleri herkese açık"
  ON team_members FOR SELECT USING (true);

CREATE POLICY "Kaptan üye ekleyebilir"
  ON team_members FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT captain_id FROM teams WHERE id = team_id)
    OR auth.uid() = player_id
  );

CREATE POLICY "Kaptan üye çıkarabilir"
  ON team_members FOR DELETE USING (
    auth.uid() IN (SELECT captain_id FROM teams WHERE id = team_id)
    OR auth.uid() = player_id
  );


-- =====================================================
-- TABLO 5: venues (Sahalar)
-- =====================================================
CREATE TABLE IF NOT EXISTS venues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT DEFAULT 'İstanbul',
  district TEXT,
  phone TEXT,
  price_per_hour INTEGER DEFAULT 0,
  surface_type TEXT DEFAULT 'halı' CHECK (surface_type IN ('çim', 'halı', 'beton', 'sentetik')),
  lighting BOOLEAN DEFAULT true,
  changing_room BOOLEAN DEFAULT true,
  parking BOOLEAN DEFAULT false,
  capacity INTEGER DEFAULT 14,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  avg_rating DECIMAL(3,1) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sahalar herkese açık"
  ON venues FOR SELECT USING (true);

CREATE POLICY "Auth kullanıcı saha ekleyebilir"
  ON venues FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = added_by);

CREATE POLICY "Ekleyen güncelleyebilir"
  ON venues FOR UPDATE USING (auth.uid() = added_by);


-- =====================================================
-- TABLO 6: matches (Maçlar)
-- =====================================================
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  away_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'ongoing', 'finished', 'cancelled')),
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 60,
  match_type TEXT DEFAULT 'friendly' CHECK (match_type IN ('friendly', 'league', 'tournament', 'practice')),
  notes TEXT,
  mvp_player_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Maçlar herkese açık"
  ON matches FOR SELECT USING (true);

CREATE POLICY "Auth kullanıcı maç oluşturabilir"
  ON matches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Oluşturan maçı güncelleyebilir"
  ON matches FOR UPDATE USING (auth.uid() = created_by);


-- =====================================================
-- TABLO 7: match_players (Maç katılımcıları)
-- =====================================================
CREATE TABLE IF NOT EXISTS match_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  team_side TEXT CHECK (team_side IN ('home', 'away')),
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  own_goals INTEGER DEFAULT 0,
  performance_rating DECIMAL(3,1) CHECK (performance_rating BETWEEN 1 AND 10),
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  UNIQUE(match_id, player_id)
);

ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Maç oyuncuları herkese açık"
  ON match_players FOR SELECT USING (true);

CREATE POLICY "Auth kullanıcı maça eklenebilir"
  ON match_players FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Oyuncu kendi kaydını güncelleyebilir"
  ON match_players FOR UPDATE USING (auth.uid() = player_id);


-- =====================================================
-- TABLO 8: community_ratings (Oyuncu puanlaması)
-- =====================================================
CREATE TABLE IF NOT EXISTS community_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rated_player_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rater_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating_teknik INTEGER DEFAULT 70 CHECK (rating_teknik BETWEEN 1 AND 99),
  rating_sut INTEGER DEFAULT 70 CHECK (rating_sut BETWEEN 1 AND 99),
  rating_pas INTEGER DEFAULT 70 CHECK (rating_pas BETWEEN 1 AND 99),
  rating_hiz INTEGER DEFAULT 70 CHECK (rating_hiz BETWEEN 1 AND 99),
  rating_fizik INTEGER DEFAULT 70 CHECK (rating_fizik BETWEEN 1 AND 99),
  rating_kondisyon INTEGER DEFAULT 70 CHECK (rating_kondisyon BETWEEN 1 AND 99),
  comment TEXT CHECK (char_length(comment) <= 200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rated_player_id, rater_id),
  CHECK (rated_player_id != rater_id)
);

ALTER TABLE community_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Puanlar herkese açık"
  ON community_ratings FOR SELECT USING (true);

CREATE POLICY "Auth kullanıcı puan verebilir (kendine değil)"
  ON community_ratings FOR INSERT
  WITH CHECK (auth.uid() = rater_id AND auth.uid() != rated_player_id);

CREATE POLICY "Puanlayan kendi puanını güncelleyebilir"
  ON community_ratings FOR UPDATE USING (auth.uid() = rater_id);

CREATE POLICY "Puanlayan kendi puanını silebilir"
  ON community_ratings FOR DELETE USING (auth.uid() = rater_id);


-- =====================================================
-- TABLO 9: venue_ratings (Saha puanlaması)
-- =====================================================
CREATE TABLE IF NOT EXISTS venue_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  rater_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT CHECK (char_length(comment) <= 300),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_id, rater_id)
);

ALTER TABLE venue_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Saha puanları herkese açık"
  ON venue_ratings FOR SELECT USING (true);

CREATE POLICY "Auth kullanıcı saha puanlayabilir"
  ON venue_ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);

CREATE POLICY "Puanlayan güncelleyebilir"
  ON venue_ratings FOR UPDATE USING (auth.uid() = rater_id);


-- =====================================================
-- TABLO 10: posts (Sosyal feed paylaşımları)
-- =====================================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  post_type TEXT DEFAULT 'status' CHECK (post_type IN (
    'status', 'match_result', 'rating', 'invitation',
    'achievement', 'team_news', 'venue_review'
  )),
  related_match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  related_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  related_venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  related_player_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  media_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paylaşımlar herkese açık"
  ON posts FOR SELECT USING (true);

CREATE POLICY "Auth kullanıcı paylaşım yapabilir"
  ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Yazar kendi paylaşımını silebilir"
  ON posts FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Yazar kendi paylaşımını güncelleyebilir"
  ON posts FOR UPDATE USING (auth.uid() = author_id);


-- =====================================================
-- TABLO 11: post_comments (Yorum sistemi)
-- =====================================================
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 300),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Yorumlar herkese açık"
  ON post_comments FOR SELECT USING (true);

CREATE POLICY "Auth kullanıcı yorum yapabilir"
  ON post_comments FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Yorum sahibi silebilir"
  ON post_comments FOR DELETE USING (auth.uid() = author_id);


-- =====================================================
-- TABLO 12: post_likes (Beğeni sistemi)
-- =====================================================
CREATE TABLE IF NOT EXISTS post_likes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Beğeniler herkese açık"
  ON post_likes FOR SELECT USING (true);

CREATE POLICY "Auth kullanıcı beğenebilir"
  ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcı beğeniyi geri alabilir"
  ON post_likes FOR DELETE USING (auth.uid() = user_id);


-- =====================================================
-- TABLO 13: notifications (Bildirimler)
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'friend_request', 'friend_accepted',
    'match_invite', 'match_result',
    'team_invite', 'team_join',
    'rating_received', 'comment_received',
    'like_received', 'achievement_unlocked'
  )),
  title TEXT NOT NULL,
  body TEXT,
  related_id UUID,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcılar kendi bildirimlerini görür"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Sistem bildirim ekleyebilir"
  ON notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Kullanıcı okundu işaretleyebilir"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcı kendi bildirimini silebilir"
  ON notifications FOR DELETE USING (auth.uid() = user_id);


-- =====================================================
-- TABLO 14: match_invitations (Maç davetleri)
-- =====================================================
CREATE TABLE IF NOT EXISTS match_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  invitee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message TEXT CHECK (char_length(message) <= 200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  CHECK (inviter_id != invitee_id)
);

ALTER TABLE match_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcılar kendi davetlerini görür"
  ON match_invitations FOR SELECT
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Auth kullanıcı davet gönderebilir"
  ON match_invitations FOR INSERT WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Davet alıcısı yanıt verebilir"
  ON match_invitations FOR UPDATE USING (auth.uid() = invitee_id);


-- =====================================================
-- FONKSİYONLAR & TETİKLEYİCİLER
-- =====================================================

-- Kayıt olunca otomatik profil oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- GEN skoru otomatik hesapla
CREATE OR REPLACE FUNCTION public.recalculate_gen_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.gen_score := (
    NEW.rating_teknik + NEW.rating_sut + NEW.rating_pas +
    NEW.rating_hiz + NEW.rating_fizik + NEW.rating_kondisyon
  ) / 6;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_rating_change ON profiles;
CREATE TRIGGER on_profile_rating_change
  BEFORE UPDATE OF rating_teknik, rating_sut, rating_pas,
                   rating_hiz, rating_fizik, rating_kondisyon
  ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_gen_score();

-- Post beğeni sayacı güncelle
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_post_like_change ON post_likes;
CREATE TRIGGER on_post_like_change
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- Post yorum sayacı güncelle
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_post_comment_change ON post_comments;
CREATE TRIGGER on_post_comment_change
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- Saha ortalama puanı güncelle
CREATE OR REPLACE FUNCTION public.update_venue_avg_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE venues
  SET
    avg_rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM venue_ratings WHERE venue_id = COALESCE(NEW.venue_id, OLD.venue_id)),
    total_ratings = (SELECT COUNT(*) FROM venue_ratings WHERE venue_id = COALESCE(NEW.venue_id, OLD.venue_id))
  WHERE id = COALESCE(NEW.venue_id, OLD.venue_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_venue_rating_change ON venue_ratings;
CREATE TRIGGER on_venue_rating_change
  AFTER INSERT OR UPDATE OR DELETE ON venue_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_venue_avg_rating();


-- =====================================================
-- GÖRÜNÜMLER (Views) — Kolay sorgu için
-- =====================================================

-- Tam profil + community avg puanı
CREATE OR REPLACE VIEW profiles_with_ratings AS
SELECT
  p.*,
  COALESCE(AVG(cr.rating_teknik), p.rating_teknik) AS community_teknik,
  COALESCE(AVG(cr.rating_sut), p.rating_sut) AS community_sut,
  COALESCE(AVG(cr.rating_pas), p.rating_pas) AS community_pas,
  COALESCE(AVG(cr.rating_hiz), p.rating_hiz) AS community_hiz,
  COALESCE(AVG(cr.rating_fizik), p.rating_fizik) AS community_fizik,
  COALESCE(AVG(cr.rating_kondisyon), p.rating_kondisyon) AS community_kondisyon,
  COUNT(cr.id) AS community_rating_count,
  COALESCE(
    (AVG(cr.rating_teknik) + AVG(cr.rating_sut) + AVG(cr.rating_pas) +
     AVG(cr.rating_hiz) + AVG(cr.rating_fizik) + AVG(cr.rating_kondisyon)) / 6,
    p.gen_score
  ) AS community_gen
FROM profiles p
LEFT JOIN community_ratings cr ON cr.rated_player_id = p.id
GROUP BY p.id;


-- =====================================================
-- REALTIME AYARLARI — Feed için
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE match_invitations;
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;


-- =====================================================
-- KURULUM TAMAMLANDI ✅
-- =====================================================
-- Toplam: 14 tablo, 4 fonksiyon, 4 tetikleyici,
--         1 görünüm, Realtime etkin
-- =====================================================

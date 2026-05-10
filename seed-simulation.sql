-- =====================================================
-- SOSYAL SPORCU — seed-simulation.sql
-- MANAGER++ Test Ortamı Simülasyon Verisi
-- Supabase Dashboard → SQL Editor'de çalıştırın
-- Production'da KULLANMAYIN!
-- =====================================================

BEGIN;

-- ─────────────────────────────────────────────────────
-- ADIM 0: 9 Takım Oluştur + 63 Bot Dağıt (7 kişi/takım)
-- ─────────────────────────────────────────────────────

-- 0A: 9 Takımı ekle (zaten varsa güncelle)
INSERT INTO teams (id, name, slug, city, description, color, icon, gen_score, is_active)
VALUES
  ('00000000-0000-0000-0001-000000000001', 'Boğaz FC',         'bogaz',     'İstanbul', 'Boğaz kıyısının gözde takımı',    '#00e5ff', 'fa-shield-cat', 72, true),
  ('00000000-0000-0000-0001-000000000002', 'Anadolu SK',        'anadolu',   'Ankara',   'Başkentin köklü spor kulübü',     '#adff2f', 'fa-shield-cat', 70, true),
  ('00000000-0000-0000-0001-000000000003', 'Galata Spor',       'galata',    'İstanbul', 'Tarihin izlerini taşıyan kulüp',  '#ff007f', 'fa-shield-cat', 74, true),
  ('00000000-0000-0000-0001-000000000004', 'Ege United',        'ege',       'İzmir',    'Ege rüzgarının çocukları',        '#ffa500', 'fa-shield-cat', 68, true),
  ('00000000-0000-0000-0001-000000000005', 'Karadeniz SK',      'karade',    'Trabzon',  'Doğunun demir gibi takımı',       '#00e5ff', 'fa-shield-cat', 71, true),
  ('00000000-0000-0000-0001-000000000006', 'Marmara United',    'marmara',   'İstanbul', 'Marmara kıyısından yükselen güç','#adff2f', 'fa-shield-cat', 69, true),
  ('00000000-0000-0000-0001-000000000007', 'Bosphorus City FC', 'bosphorus', 'İstanbul', 'Şehrin kalbinden doğan takım',   '#ff007f', 'fa-shield-cat', 73, true),
  ('00000000-0000-0000-0001-000000000008', 'Güneş FK',          'gunes',     'Antalya',  'Akdenizin ateşli takımı',        '#ffa500', 'fa-shield-cat', 67, true),
  ('00000000-0000-0000-0001-000000000009', 'Bozkır Spor',       'bozkir',    'Konya',    'Bozkırın yenilmez ruhu',          '#adff2f', 'fa-shield-cat', 75, true)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name, is_active = true;

-- 0B: İlk 63 bot profili 9 gruba böl, team_members'a ekle
WITH ordered_bots AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM profiles
  WHERE username != 'Mikimon'
  LIMIT 63
),
assignments AS (
  SELECT
    id AS player_id,
    (ARRAY[
      '00000000-0000-0000-0001-000000000001',
      '00000000-0000-0000-0001-000000000002',
      '00000000-0000-0000-0001-000000000003',
      '00000000-0000-0000-0001-000000000004',
      '00000000-0000-0000-0001-000000000005',
      '00000000-0000-0000-0001-000000000006',
      '00000000-0000-0000-0001-000000000007',
      '00000000-0000-0000-0001-000000000008',
      '00000000-0000-0000-0001-000000000009'
    ])[((rn - 1) / 7) + 1]::UUID AS team_id,
    CASE WHEN (rn - 1) % 7 = 0 THEN 'captain' ELSE 'player' END AS role
  FROM ordered_bots
)
INSERT INTO team_members (id, team_id, player_id, role)
SELECT gen_random_uuid(), team_id, player_id, role
FROM assignments
ON CONFLICT (team_id, player_id) DO UPDATE
  SET role = EXCLUDED.role;

-- 0C: Bot profillerin current_team_id'sini güncelle
WITH ordered_bots AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM profiles
  WHERE username != 'Mikimon'
  LIMIT 63
)
UPDATE profiles p
SET current_team_id = (
  ARRAY[
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0001-000000000003',
    '00000000-0000-0000-0001-000000000004',
    '00000000-0000-0000-0001-000000000005',
    '00000000-0000-0000-0001-000000000006',
    '00000000-0000-0000-0001-000000000007',
    '00000000-0000-0000-0001-000000000008',
    '00000000-0000-0000-0001-000000000009'
  ][((ob.rn - 1) / 7) + 1]
)::UUID
FROM ordered_bots ob
WHERE p.id = ob.id;

-- 0D: Her takımın captain_id'sini ilk üyeye (kaptan) ayarla
UPDATE teams t
SET captain_id = (
  SELECT player_id FROM team_members
  WHERE team_id = t.id AND role = 'captain'
  LIMIT 1
)
WHERE id IN (
  '00000000-0000-0000-0001-000000000001','00000000-0000-0000-0001-000000000002',
  '00000000-0000-0000-0001-000000000003','00000000-0000-0000-0001-000000000004',
  '00000000-0000-0000-0001-000000000005','00000000-0000-0000-0001-000000000006',
  '00000000-0000-0000-0001-000000000007','00000000-0000-0000-0001-000000000008',
  '00000000-0000-0000-0001-000000000009'
);

-- 0E: Takımların gen_score'unu üye ortalamalarından hesapla
UPDATE teams t
SET gen_score = (
  SELECT COALESCE(ROUND(AVG(p.gen_score))::int, 70)
  FROM team_members tm
  JOIN profiles p ON p.id = tm.player_id
  WHERE tm.team_id = t.id AND p.gen_score IS NOT NULL
)
WHERE id IN (
  '00000000-0000-0000-0001-000000000001','00000000-0000-0000-0001-000000000002',
  '00000000-0000-0000-0001-000000000003','00000000-0000-0000-0001-000000000004',
  '00000000-0000-0000-0001-000000000005','00000000-0000-0000-0001-000000000006',
  '00000000-0000-0000-0001-000000000007','00000000-0000-0000-0001-000000000008',
  '00000000-0000-0000-0001-000000000009'
);

-- ─────────────────────────────────────────────────────
-- ADIM 1: Profil Derinleştirme (60 bot kullanıcı)
-- Yaş, boy, kilo, tercih edilen ayak, şehir, mevki
-- ─────────────────────────────────────────────────────

WITH bot_profiles AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM profiles
  WHERE username != 'Mikimon'
  LIMIT 60
)
UPDATE profiles p
SET
  age       = 18 + (bp.rn % 23),
  height    = 165 + (bp.rn % 31),
  weight    = 60  + (bp.rn % 41),
  ayak      = (ARRAY['Sağ','Sol','Her İkisi'])[(bp.rn % 3) + 1],
  city      = (ARRAY[
                'İstanbul','Ankara','İzmir','Bursa','Antalya','Adana',
                'Konya','Gaziantep','Mersin','Kayseri','Eskişehir',
                'Trabzon','Samsun','Diyarbakır','Kocaeli'
              ])[(bp.rn % 15) + 1],
  position  = (ARRAY[
                'GK','CB','RB','LB','CDM',
                'CM','RW','LW','CAM','ST'
              ])[(bp.rn % 10) + 1],
  ana_mevki = (ARRAY[
                'Ofansif OS (10 Numara)','Santrafor','Sağ Kanat',
                'Sol Kanat','Stoper','Defansif OS','Kaleci',
                'Sağ Bek','Sol Bek','Merkez OS'
              ])[(bp.rn % 10) + 1],
  form_status = (ARRAY['Yüksek','Orta','Orta','Düşük','Formda Değil'])[(bp.rn % 5) + 1]
FROM bot_profiles bp
WHERE p.id = bp.id;

-- ─────────────────────────────────────────────────────
-- ADIM 2A: match_players Doldurma
-- 15 bitmiş maçın team_members'ını katılımcı olarak ekle
-- Gol/asist dağılımı: 1. oyuncu 2 gol, 2. oyuncu 1 gol, 3. oyuncu 1 asist
-- ─────────────────────────────────────────────────────

WITH finished AS (
  SELECT id, home_team_id, away_team_id
  FROM matches
  WHERE status = 'finished'
    AND home_team_id IS NOT NULL
    AND away_team_id IS NOT NULL
  LIMIT 15
),
participants AS (
  SELECT
    f.id AS match_id,
    tm.player_id,
    CASE WHEN tm.team_id = f.home_team_id THEN 'home' ELSE 'away' END AS team_side,
    ROW_NUMBER() OVER (
      PARTITION BY f.id, tm.team_id
      ORDER BY tm.player_id
    ) AS pos
  FROM finished f
  JOIN team_members tm ON tm.team_id IN (f.home_team_id, f.away_team_id)
)
INSERT INTO match_players (id, match_id, player_id, team_side, goals, assists, confirmed)
SELECT
  gen_random_uuid(),
  match_id,
  player_id,
  team_side,
  CASE WHEN pos = 1 THEN 2 WHEN pos = 2 THEN 1 ELSE 0 END AS goals,
  CASE WHEN pos = 3 THEN 1 ELSE 0 END                       AS assists,
  true
FROM participants
ON CONFLICT (match_id, player_id) DO UPDATE
  SET goals   = EXCLUDED.goals,
      assists = EXCLUDED.assists,
      confirmed = true;

-- ─────────────────────────────────────────────────────
-- ADIM 2B: Profil Totalleri Güncelle
-- match_players'dan toplam gol/asist/maç say
-- ─────────────────────────────────────────────────────

UPDATE profiles p
SET
  total_goals   = COALESCE(agg.g, 0),
  total_assists = COALESCE(agg.a, 0),
  total_matches = COALESCE(agg.m, 0)
FROM (
  SELECT
    player_id,
    SUM(goals)   AS g,
    SUM(assists) AS a,
    COUNT(*)     AS m
  FROM match_players
  GROUP BY player_id
) agg
WHERE p.id = agg.player_id;

-- ─────────────────────────────────────────────────────
-- ADIM 3: Takım İstatistikleri
-- Bitmiş maç verisinden W/D/L ve gol sayılarını hesapla
-- ─────────────────────────────────────────────────────

WITH raw_stats AS (
  -- Ev sahibi perspektifi
  SELECT
    home_team_id AS team_id,
    (home_score > away_score)::int AS win,
    (home_score = away_score)::int AS draw,
    (home_score < away_score)::int AS loss,
    home_score AS gf,
    away_score AS ga
  FROM matches
  WHERE status = 'finished' AND home_team_id IS NOT NULL

  UNION ALL

  -- Deplasman perspektifi
  SELECT
    away_team_id AS team_id,
    (away_score > home_score)::int,
    (away_score = home_score)::int,
    (away_score < home_score)::int,
    away_score AS gf,
    home_score AS ga
  FROM matches
  WHERE status = 'finished' AND away_team_id IS NOT NULL
),
match_stats AS (
  SELECT
    team_id,
    SUM(win)  AS total_wins,
    SUM(draw) AS total_draws,
    SUM(loss) AS total_losses,
    SUM(gf)   AS total_goals_scored,
    SUM(ga)   AS total_goals_conceded
  FROM raw_stats
  GROUP BY team_id
)
UPDATE teams t
SET
  total_wins           = ms.total_wins,
  total_draws          = ms.total_draws,
  total_losses         = ms.total_losses,
  total_goals_scored   = ms.total_goals_scored,
  total_goals_conceded = ms.total_goals_conceded
FROM match_stats ms
WHERE t.id = ms.team_id;

-- İleride tek komutla yeniden hesaplamak için yardımcı fonksiyon
CREATE OR REPLACE FUNCTION recalc_team_stats(p_team_id UUID DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  WITH raw_stats AS (
    SELECT home_team_id AS team_id,
      (home_score > away_score)::int AS win,
      (home_score = away_score)::int AS draw,
      (home_score < away_score)::int AS loss,
      home_score AS gf, away_score AS ga
    FROM matches WHERE status='finished' AND home_team_id IS NOT NULL
    UNION ALL
    SELECT away_team_id,
      (away_score > home_score)::int,
      (away_score = home_score)::int,
      (away_score < home_score)::int,
      away_score, home_score
    FROM matches WHERE status='finished' AND away_team_id IS NOT NULL
  ),
  ms AS (
    SELECT team_id,
      SUM(win) AS w, SUM(draw) AS d, SUM(loss) AS l,
      SUM(gf) AS gf, SUM(ga) AS ga
    FROM raw_stats GROUP BY team_id
  )
  UPDATE teams t SET
    total_wins=ms.w, total_draws=ms.d, total_losses=ms.l,
    total_goals_scored=ms.gf, total_goals_conceded=ms.ga
  FROM ms WHERE t.id=ms.team_id
    AND (p_team_id IS NULL OR t.id = p_team_id);
END;
$$;

-- ─────────────────────────────────────────────────────
-- ADIM 4: Onur Simülasyonu (200 kayıt)
-- match_players cross-join → unique (match_id, rater_id, rated_id)
-- Trigger: trg_increment_honor → profiles.honor_* otomatik artar
-- ─────────────────────────────────────────────────────

-- 4A: Temel 200 onur kaydı
WITH match_pairs AS (
  SELECT
    r.match_id,
    r.player_id AS rater_id,
    d.player_id AS rated_id,
    ROW_NUMBER() OVER (
      ORDER BY r.match_id, r.player_id, d.player_id
    ) AS rn
  FROM match_players r
  JOIN match_players d
    ON r.match_id = d.match_id
   AND r.player_id != d.player_id
)
INSERT INTO match_honors (id, match_id, rater_id, rated_id, honor_type)
SELECT
  gen_random_uuid(),
  match_id,
  rater_id,
  rated_id,
  (ARRAY['calm','maestro','punctual','joker','dynamo'])[(rn % 5) + 1]
FROM match_pairs
WHERE rn <= 200
ON CONFLICT ON CONSTRAINT match_honors_match_id_rater_id_rated_id_key DO NOTHING;

-- 4B: Bonus round — En çok maça katılan 5 bota yoğunlaştırılmış onur
-- Hedef: Bu botlar 15+ (Gümüş) ve 30+ (Altın) seviyelerine ulaşsın
WITH top_bots AS (
  SELECT player_id, COUNT(DISTINCT match_id) AS match_count
  FROM match_players
  GROUP BY player_id
  ORDER BY match_count DESC
  LIMIT 5
),
bonus_pairs AS (
  SELECT
    mp.match_id,
    mp.player_id AS rater_id,
    tb.player_id AS rated_id,
    ROW_NUMBER() OVER (ORDER BY tb.player_id, mp.match_id, mp.player_id) AS rn
  FROM match_players mp
  JOIN top_bots tb ON mp.match_id IN (
    SELECT match_id FROM match_players WHERE player_id = tb.player_id
  )
  WHERE mp.player_id != tb.player_id
)
INSERT INTO match_honors (id, match_id, rater_id, rated_id, honor_type)
SELECT
  gen_random_uuid(),
  match_id,
  rater_id,
  rated_id,
  (ARRAY['dynamo','maestro','calm','joker','punctual'])[(rn % 5) + 1]
FROM bonus_pairs
WHERE rn <= 150
ON CONFLICT ON CONSTRAINT match_honors_match_id_rater_id_rated_id_key DO NOTHING;

-- ─────────────────────────────────────────────────────
-- ADIM 5: Admin Yetkisi
-- Mikimon'a is_admin = true ver
-- ─────────────────────────────────────────────────────

UPDATE profiles
SET is_admin = true
WHERE username = 'Mikimon';

-- ─────────────────────────────────────────────────────
-- ADIM 6A: 50 Yorum (bot kullanıcılardan)
-- ─────────────────────────────────────────────────────

INSERT INTO post_comments (id, post_id, author_id, content)
SELECT gen_random_uuid(), post_id, author_id, content FROM (
  SELECT
    p.id AS post_id,
    b.id AS author_id,
    (ARRAY[
      'Harika maç! 🔥',
      'Tebrikler ekip!',
      'Süper performans, devam et böyle!',
      'Gol krallığına koşuyorsun!',
      'Takım olarak muhteşemsiniz',
      'Aferin! Hepinize tebrikler',
      'Bu sezon çok iyi gidiyorsunuz',
      'Daha fazla maç paylaş lütfen',
      'Görmek isterdim keşke 😢',
      'Rakip takım ne dedi acaba 😄',
      'Skor inanılmaz, efsane!',
      'Haftaya maçınız var mı?',
      'Bende takıma katılabilir miyim?',
      'Kazanmak güzel ama asıl önemli katılım',
      'Maç sonu kutlama neredeydi 😂'
    ])[(ROW_NUMBER() OVER (ORDER BY p.id, b.id) % 15) + 1] AS content
  FROM (SELECT id FROM posts ORDER BY created_at DESC LIMIT 10) p
  CROSS JOIN (
    SELECT id FROM profiles WHERE username != 'Mikimon'
    ORDER BY created_at LIMIT 5
  ) b
  LIMIT 50
) sub;

-- ─────────────────────────────────────────────────────
-- ADIM 6B: 100+ Beğeni (bot kullanıcılardan)
-- ON CONFLICT DO NOTHING: duplicate (post_id, user_id) güvenli
-- ─────────────────────────────────────────────────────

INSERT INTO post_likes (post_id, user_id)
SELECT post_id, user_id FROM (
  SELECT p.id AS post_id, b.id AS user_id
  FROM (SELECT id FROM posts ORDER BY created_at DESC LIMIT 15) p
  CROSS JOIN (
    SELECT id FROM profiles WHERE username != 'Mikimon'
    ORDER BY created_at LIMIT 10
  ) b
  LIMIT 120
) sub
ON CONFLICT (post_id, user_id) DO NOTHING;

-- ─────────────────────────────────────────────────────
-- ADIM 6C: Denormalized counter senkronizasyonu
-- likes_count ve comments_count'u gerçek veriyle eşitle
-- ─────────────────────────────────────────────────────

UPDATE posts p
SET likes_count = (
  SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id
);

UPDATE posts p
SET comments_count = (
  SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id
);

-- ─────────────────────────────────────────────────────
-- CANLILIK RAPORU
-- Tüm değerler > 0 olmalı — aksi hâlde ilgili adımı kontrol et
-- ─────────────────────────────────────────────────────

SELECT 'profiles_deepened'       AS metric, COUNT(*)::text AS value
  FROM profiles WHERE age IS NOT NULL AND username != 'Mikimon'
UNION ALL
SELECT 'match_players_inserted', COUNT(*)::text FROM match_players
UNION ALL
SELECT 'honors_total',           COUNT(*)::text FROM match_honors
UNION ALL
SELECT 'silver_bots_15plus',     COUNT(*)::text FROM profiles
  WHERE (honor_calm+honor_maestro+honor_punctual+honor_joker+honor_dynamo) >= 15
UNION ALL
SELECT 'gold_bots_30plus',       COUNT(*)::text FROM profiles
  WHERE (honor_calm+honor_maestro+honor_punctual+honor_joker+honor_dynamo) >= 30
UNION ALL
SELECT 'comments_total',         COUNT(*)::text FROM post_comments
UNION ALL
SELECT 'likes_total',            COUNT(*)::text FROM post_likes
UNION ALL
SELECT 'mikimon_is_admin',       is_admin::text FROM profiles WHERE username='Mikimon'
UNION ALL
SELECT 'teams_with_stats',       COUNT(*)::text FROM teams
  WHERE total_wins + total_draws + total_losses > 0;

COMMIT;

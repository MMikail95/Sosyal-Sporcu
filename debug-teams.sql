-- =====================================================
-- TANI SORGUSU — Kesfet Takimlar Debug
-- Supabase Dashboard > SQL Editor > Run
-- =====================================================

-- 1. teams tablosu var mi ve kac kayit var?
SELECT COUNT(*) AS toplam_takim FROM teams;

-- 2. is_active kolonu var mi?
SELECT COUNT(*) AS aktif_takim FROM teams WHERE is_active = true;

-- 3. Tam sorgu (JS kodunun calistirdigi ile ayni)
SELECT
  t.*,
  p.id AS captain_id_val,
  p.username AS captain_username,
  p.avatar_url AS captain_avatar
FROM teams t
LEFT JOIN profiles p ON p.id = t.captain_id
WHERE t.is_active = true
ORDER BY t.created_at DESC
LIMIT 10;

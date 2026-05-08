// =====================================================
// SUPABASE CLIENT — Sosyal Sporcu
// Anon (publishable) key — public kullanım için güvenli.
// RLS politikaları veri erişimini korur.
// =====================================================

// ⚠️  STAGING ORTAMI — Production'a dokunma!
// Production → https://lgfhtzxmwrabrsqbccty.supabase.co
const SUPABASE_URL = 'https://rpwbmvpapfouhpyvoeol.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Xun6Vf1wYi1QvoamW2EtjQ_NuknsLok';

// Global supabase client — diğer tüm dosyalar window.sbClient kullanır
window.sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔶 Supabase client hazır [STAGING]:', SUPABASE_URL);

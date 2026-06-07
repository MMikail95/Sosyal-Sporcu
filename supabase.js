// =====================================================
// SUPABASE CLIENT — Sosyal Sporcu
// Anon (publishable) key — public kullanım için güvenli.
// RLS politikaları veri erişimini korur.
// =====================================================

const SUPABASE_URL = 'https://rpwbmvpapfouhpyvoeol.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Xun6Vf1wYi1QvoamW2EtjQ_NuknsLok';

// Global supabase client — diğer tüm dosyalar window.sbClient kullanır
window.sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

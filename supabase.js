// =====================================================
// SUPABASE CLIENT — Sosyal Sporcu
// Anon (publishable) key — public kullanım için güvenli.
// RLS politikaları veri erişimini korur.
// =====================================================

const SUPABASE_URL = 'https://lgfhtzxmwrabrsqbccty.supabase.co';
const SUPABASE_KEY = 'sb_publishable_q16aFPkzLQAV72e1Fx3Mmw_4sJ9an-J';

// Global supabase client — diğer tüm dosyalar window.sbClient kullanır
window.sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✅ Supabase client hazır:', SUPABASE_URL);

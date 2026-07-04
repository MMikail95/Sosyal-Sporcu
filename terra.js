'use strict';

// =====================================================
// TERRA FITNESS ENTEGRASYONU
// Durum: HAZIR AMA AKTİF DEĞİL
//
// Aktif etmek için:
//   1. terra-fitness-migration.sql'i Supabase'e uygula
//   2. Terra developer hesabı aç → https://tryterra.co
//   3. API key'i aşağıya yaz
//   4. Bu dosyayı index.html ve matches/index.html'e ekle
// =====================================================

const TERRA_API_KEY  = '';  // Terra dashboard'dan alınacak
const TERRA_DEV_ID   = '';  // Terra dashboard'dan alınacak

// ── Kullanıcı Terra'ya bağlı mı? ──────────────────────
window.TerraFitness = {

  isConnected(profile) {
    return !!(profile?.terra_user_id);
  },

  // Terra Widget aç — kullanıcı kendi cihazını seçer
  async connect(userId) {
    if (!TERRA_API_KEY || !TERRA_DEV_ID) {
      showToast?.('⚠️ Terra API henüz yapılandırılmadı.');
      return;
    }
    // Terra'dan kullanıcı token al
    const res = await fetch('https://api.tryterra.co/v2/auth/generateAuthToken', {
      method:  'POST',
      headers: {
        'dev-id':    TERRA_DEV_ID,
        'x-api-key': TERRA_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reference_id: userId })
    });
    const { token, status } = await res.json();
    if (status !== 'success' || !token) {
      showToast?.('Terra bağlantısı başlatılamadı.');
      return;
    }
    // Terra Connect Widget — kullanıcı cihazını seçer
    // terra_user_id webhook ile döner, bunu Supabase'e kaydetmek için
    // backend/edge function gerekir (ileride eklenecek)
    window.open(`https://widget.tryterra.co/session/${token}`, '_blank', 'width=480,height=640');
    showToast?.('Cihaz bağlantı penceresi açıldı.');
  },

  // Belirli bir tarih için aktivite çek
  async fetchActivityForMatch(terraUserId, matchDate) {
    if (!TERRA_API_KEY || !TERRA_DEV_ID || !terraUserId) return null;

    const dateStr  = matchDate.toISOString().split('T')[0];
    const startISO = `${dateStr}T00:00:00Z`;
    const endISO   = `${dateStr}T23:59:59Z`;

    const res = await fetch(
      `https://api.tryterra.co/v2/activity?user_id=${terraUserId}&start_time=${startISO}&end_time=${endISO}&to_webhook=false`,
      {
        headers: {
          'dev-id':    TERRA_DEV_ID,
          'x-api-key': TERRA_API_KEY
        }
      }
    );
    const json = await res.json();
    const activities = json?.data || [];
    if (!activities.length) return null;

    // En uzun aktiviteyi al (maç büyük ihtimalle o)
    const best = activities.sort((a, b) =>
      (b.distance_data?.summary?.distance_meters || 0) -
      (a.distance_data?.summary?.distance_meters || 0)
    )[0];

    return {
      distance_m:     Math.round(best.distance_data?.summary?.distance_meters || 0),
      max_speed_kmh:  parseFloat(((best.movement_data?.max_velocity_metres_per_second || 0) * 3.6).toFixed(2)),
      avg_speed_kmh:  parseFloat(((best.movement_data?.avg_velocity_metres_per_second || 0) * 3.6).toFixed(2)),
      calories:       Math.round(best.calories_data?.total_burned_calories || 0),
      avg_heart_rate: Math.round(best.heart_rate_data?.summary?.avg_hr_bpm || 0),
      max_heart_rate: Math.round(best.heart_rate_data?.summary?.max_hr_bpm || 0),
      steps:          Math.round(best.distance_data?.summary?.steps || 0),
      polyline:       best.position_data?.position_samples?.[0]?.polyline || null,
      activity_source: best.metadata?.type || 'unknown',
      activity_id:    best.metadata?.id || null
    };
  },

  // Maç sonrası aktiviteyi match_players'a kaydet
  async importForMatch(matchId, playerId, terraUserId, matchDate) {
    const data = await TerraFitness.fetchActivityForMatch(terraUserId, matchDate);
    if (!data) {
      showToast?.('Bu tarihe ait aktivite bulunamadı.');
      return false;
    }
    const { error } = await window.sbClient
      .from('match_players')
      .update(data)
      .eq('match_id', matchId)
      .eq('player_id', playerId);
    if (error) { showToast?.('Veri kaydedilemedi.'); return false; }
    showToast?.(`✅ ${(data.distance_m / 1000).toFixed(1)} km koşu verisi eklendi!`);
    return true;
  },

  // Profil kartında Terra bağlantı butonunu render et
  renderConnectButton(profile, userId, containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    const connected = TerraFitness.isConnected(profile);
    container.innerHTML = connected
      ? `<div style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;">
           <i class="fa-solid fa-heart-pulse" style="color:var(--neon-green);"></i>
           <span style="color:var(--neon-green);">Fitness cihazı bağlı</span>
           <span style="color:var(--text-muted);">(${profile.terra_provider || 'bilinmiyor'})</span>
         </div>`
      : `<button class="btn-secondary" style="font-size:0.85rem;" onclick="TerraFitness.connect('${userId}')">
           <i class="fa-solid fa-heart-pulse"></i> Fitness Cihazı Bağla
         </button>`;
  },

  // Maç sonrası "Aktivitemi İçe Aktar" butonu render et
  renderImportButton(matchId, playerId, terraUserId, matchDate, containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    if (!terraUserId) {
      container.innerHTML = `<div style="font-size:0.8rem;color:var(--text-muted);">
        <i class="fa-solid fa-link-slash"></i> Cihaz bağlı değil — <a href="#profile" style="color:var(--neon-cyan);">profilde bağla</a>
      </div>`;
      return;
    }
    container.innerHTML = `
      <button class="btn-secondary" style="font-size:0.85rem;"
        onclick="TerraFitness.importForMatch('${matchId}','${playerId}','${terraUserId}',new Date('${matchDate}'))">
        <i class="fa-solid fa-file-import"></i> Koşu Verisini İçe Aktar
      </button>`;
  },

  // Maç kartında fitness özetini render et (mesafe + max hız)
  renderMatchStats(playerData) {
    if (!playerData?.distance_m) return '';
    const km = (playerData.distance_m / 1000).toFixed(1);
    const spd = playerData.max_speed_kmh ? `· ${playerData.max_speed_kmh} km/s` : '';
    const hr  = playerData.avg_heart_rate ? `· ❤️ ${playerData.avg_heart_rate} bpm` : '';
    return `<div style="display:flex;gap:0.75rem;font-size:0.8rem;color:var(--neon-cyan);margin-top:0.25rem;">
      <span>🏃 ${km} km</span>${spd ? `<span>${spd}</span>` : ''}${hr ? `<span>${hr}</span>` : ''}
    </div>`;
  }
};

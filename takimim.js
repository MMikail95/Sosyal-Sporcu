// ======================================================
// TAKIMIM.JS — Supabase-First Takım Yönetim Modülü
// FAZ 2: Takım Kur/Katıl + Supabase Entegrasyonu
// ======================================================
'use strict';

// ──────────────────────────────────────────────────────
// 1. GLOBAL STATE
// ──────────────────────────────────────────────────────

let _tmState = {
  userId:      null,   // Supabase auth user id
  profile:     null,   // profiles row
  team:        null,   // aktif takım row (null = takımsız)
  members:     [],     // team_members + player join
  myRole:      null,   // 'captain' | 'player' | 'substitute'
  myTeams:     [],     // kullanıcının tüm aktif takımları
  realtimeSub: null,
  loading:     false,
};
window._tmState = _tmState; // Expose globally for faz2-7.js

// Geriye uyumluluk için eski takımım.js global değişkenleri
let teamData = null; // eski referansları kırmamak için

// ──────────────────────────────────────────────────────
// 2. YARDIMCI
// ──────────────────────────────────────────────────────

function _tmSetLoading(on) {
  _tmState.loading = on;
  const el = document.getElementById('team-main-header');
  if (!el) return;
  if (on) {
    el.innerHTML = `<div class="team-header-skeleton">
      <i class="fa-solid fa-circle-notch fa-spin" style="color:var(--neon-green);font-size:1.8rem;"></i>
      <span style="color:#555;margin-left:1rem;">Yükleniyor…</span>
    </div>`;
  }
}

function _tmAvatar(seed, size = 36) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed || 'user')}`;
}

function _tmIsCapOrAdmin() {
  return _tmState.myRole === 'captain' || (_tmState.profile && _tmState.profile.is_admin);
}

// GEN hesaplama (Supabase profil objesi üzerinden)
function _tmPlayerGEN(p) {
  if (!p) return 70;
  const vals = [
    p.rating_teknik, p.rating_sut, p.rating_pas,
    p.rating_hiz, p.rating_fizik, p.rating_kondisyon,
  ].map(v => v || 70);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function _tmTeamGEN() {
  if (!_tmState.members.length) return 0;
  const sorted = [..._tmState.members]
    .map(m => ({ ...m, _gen: _tmPlayerGEN(m.player) }))
    .sort((a, b) => b._gen - a._gen)
    .slice(0, 7);
  return Math.round(sorted.reduce((s, m) => s + m._gen, 0) / sorted.length);
}

function _tmTeamStatProfile() {
  const members = _tmState.members.slice();
  const sorted  = members
    .map(m => ({ ...m.player, _gen: _tmPlayerGEN(m.player) }))
    .sort((a, b) => b._gen - a._gen)
    .slice(0, 7);
  const keys = ['rating_teknik','rating_sut','rating_pas','rating_hiz','rating_fizik','rating_kondisyon'];
  const labels = { rating_teknik:'teknik', rating_sut:'sut', rating_pas:'pas',
                   rating_hiz:'hiz', rating_fizik:'fizik', rating_kondisyon:'kondisyon' };
  const result = {};
  keys.forEach(k => {
    const avg = sorted.length
      ? Math.round(sorted.reduce((s, p) => s + (p[k] || 70), 0) / sorted.length)
      : 70;
    result[labels[k]] = avg;
  });
  return result;
}

// ──────────────────────────────────────────────────────
// 3. INIT — Oturum → Profil → Takım durumu
// ──────────────────────────────────────────────────────

async function initTakimim() {
  _tmSetLoading(true);

  try {
    const authUser = window.__AUTH_USER__ || await DB.Auth.getCurrentUser();
    if (!authUser) { _tmRenderNoAuth(); return; }
    _tmState.userId  = authUser.id;
    _tmState.profile = await DB.Profiles.get(authUser.id);

    const allTeams = await DB.Teams.getMyTeams(authUser.id);
    _tmState.myTeams = allTeams || [];

    if (!_tmState.myTeams.length) {
      if (_tmState.team) {
        console.log('ℹ️ getMyTeams boş döndü ama _tmState.team mevcut, UI korunuyor.');
        return;
      }
      _tmState.team = null; _tmState.members = []; _tmState.myRole = null;
      _tmRenderNoTeamScreen();
      return;
    }

    const prevId   = _tmState.team?.id;
    const keepPrev = prevId && _tmState.myTeams.find(t => t.id === prevId);
    const teamId   = keepPrev?.id
      || _tmState.myTeams.find(t => t.role === 'captain')?.id
      || _tmState.myTeams[0].id;

    await _tmLoadTeam(teamId);
  } catch (e) {
    console.error('initTakimim error:', e);
    window.showToast?.('❌ Takım verileri yüklenemedi: ' + e.message, 'error');
  } finally {
    _tmSetLoading(false);
  }
}

async function _tmLoadTeam(teamId) {
  const myTeamRow  = _tmState.myTeams.find(t => t.id === teamId);
  _tmState.myRole  = myTeamRow?.role || 'player';
  _tmState.team    = await DB.Teams.get(teamId);
  _tmState.members = _tmState.team?.team_members || [];
  teamData         = _tmState.team;
  _tmRenderTeamUI();
  _tmSubscribeRealtime();
}

window._tmSwitchTeam = async function(teamId) {
  if (teamId === _tmState.team?.id) return;
  _tmSetLoading(true);
  try {
    await _tmLoadTeam(teamId);
  } catch (e) {
    window.showToast?.('❌ Takım değiştirilemedi: ' + e.message, 'error');
  } finally {
    _tmSetLoading(false);
  }
};

// ──────────────────────────────────────────────────────
// 4. NO-AUTH EKRANI
// ──────────────────────────────────────────────────────

function _tmRenderNoAuth() {
  const hdr = document.getElementById('team-main-header');
  if (hdr) hdr.innerHTML = `<div class="team-header-skeleton">
    <i class="fa-solid fa-lock" style="color:#ff007f;font-size:1.8rem;"></i>
    <span style="color:#ff007f;margin-left:1rem;">Giriş yapmanız gerekiyor.</span>
  </div>`;
  _tmHideSubtabs();
}

// ──────────────────────────────────────────────────────
// 5. TAKIMSIZ EKRANI — Takım Kur / Katıl
// ──────────────────────────────────────────────────────

function _tmHideSubtabs() {
  const tabs = document.getElementById('team-sub-tabs');
  if (tabs) tabs.style.display = 'none';
  document.querySelectorAll('.team-subtab').forEach(el => { el.style.display = 'none'; });
}

function _tmShowSubtabs() {
  const tabs = document.getElementById('team-sub-tabs');
  if (tabs) tabs.style.display = '';
  document.querySelectorAll('.team-subtab').forEach(el => { el.style.display = 'none'; });
  const first = document.getElementById('ttab-genel');
  if (first) first.style.display = 'block';
  document.querySelectorAll('.team-tab-btn').forEach(b => b.classList.remove('active'));
  const firstBtn = document.querySelector('.team-tab-btn[data-tab="ttab-genel"]');
  if (firstBtn) firstBtn.classList.add('active');
}

function _tmRenderNoTeamScreen() {
  _tmHideSubtabs();

  // Başlık alanını onboarding ekranı olarak kullan
  const hdr = document.getElementById('team-main-header');
  if (!hdr) return;

  hdr.innerHTML = `
    <div class="no-team-onboarding" id="no-team-onboarding">
      <div class="no-team-hero">
        <div class="no-team-icon-ring">
          <i class="fa-solid fa-shield-cat"></i>
        </div>
        <h2 class="no-team-title">Henüz Bir Takımın Yok</h2>
        <p class="no-team-sub">Kendi takımını kur veya davet koduyla mevcut bir takıma katıl.</p>
      </div>

      <div class="no-team-cards-row">
        <!-- Takım Kur -->
        <div class="no-team-card" id="card-create-team">
          <div class="ntc-icon" style="color:var(--neon-green);">
            <i class="fa-solid fa-plus-circle"></i>
          </div>
          <h3 class="ntc-title">Takım Kur</h3>
          <p class="ntc-desc">Kaptan ol, takımını oluştur ve oyuncuları davet et.</p>
          <button class="ntc-btn ntc-btn-create" onclick="_tmOpenCreateFlow()">
            <i class="fa-solid fa-shield-plus"></i> Takım Oluştur
          </button>
        </div>

        <!-- Takıma Katıl -->
        <div class="no-team-card" id="card-join-team">
          <div class="ntc-icon" style="color:var(--neon-cyan);">
            <i class="fa-solid fa-right-to-bracket"></i>
          </div>
          <h3 class="ntc-title">Takıma Katıl</h3>
          <p class="ntc-desc">Davet kodunu girerek veya takım listesinden bir takıma katıl.</p>
          <button class="ntc-btn ntc-btn-join" onclick="_tmOpenJoinFlow()">
            <i class="fa-solid fa-key"></i> Kod ile Katıl
          </button>
        </div>
      </div>

      <!-- Create Form (hidden by default) -->
      <div class="ntc-form-panel" id="ntc-create-panel" style="display:none;">
        <div class="ntc-form-header">
          <i class="fa-solid fa-shield-plus" style="color:var(--neon-green);"></i>
          <span>Yeni Takım Oluştur</span>
          <button class="ntc-form-close" onclick="_tmCloseFlows()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="ntc-form-body">
          <div class="ntc-field">
            <label>Takım Adı <span style="color:#ff007f">*</span></label>
            <input type="text" id="ntc-name" class="profile-input" maxlength="30"
                   placeholder="Örn: Yıldızlar FC" oninput="_tmPreviewSlug()">
          </div>
          <div class="ntc-field">
            <label>Davet Kodu <span style="color:#888;font-weight:400;">(otomatik)</span></label>
            <div class="ntc-slug-preview" id="ntc-slug-preview">—</div>
          </div>
          <div class="ntc-field">
            <label>Şehir</label>
            <input type="text" id="ntc-city" class="profile-input" maxlength="30"
                   placeholder="İstanbul" value="${_tmState.profile?.city || 'İstanbul'}">
          </div>
          <div class="ntc-field">
            <label>Takım Açıklaması</label>
            <input type="text" id="ntc-desc" class="profile-input" maxlength="80"
                   placeholder="Kısa bir slogan…">
          </div>
          <div class="ntc-field">
            <label>Arma Rengi</label>
            <div class="ntc-color-row" id="ntc-color-row">
              ${['#00ff88','#00e5ff','#ff007f','#ffd700','#ff6b35','#a855f7','#ef4444','#3b82f6','#ffffff']
                .map((c,i) => `<div class="ntc-color-dot ${i===0?'selected':''}" style="background:${c};"
                  onclick="_tmSelectColor(this,'${c}')" data-color="${c}"></div>`).join('')}
            </div>
          </div>
        </div>
        <div class="ntc-form-footer">
          <button class="btn-outline ntc-cancel-btn" onclick="_tmCloseFlows()">İptal</button>
          <button class="ntc-submit-btn ntc-submit-create" id="ntc-create-btn" onclick="_tmSubmitCreate()">
            <i class="fa-solid fa-shield-plus"></i> Takımı Kur
          </button>
        </div>
      </div>

      <!-- Join Form (hidden by default) -->
      <div class="ntc-form-panel" id="ntc-join-panel" style="display:none;">
        <div class="ntc-form-header">
          <i class="fa-solid fa-key" style="color:var(--neon-cyan);"></i>
          <span>Davet Koduyla Katıl</span>
          <button class="ntc-form-close" onclick="_tmCloseFlows()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="ntc-form-body">
          <div class="ntc-field">
            <label>Davet Kodu <span style="color:#ff007f">*</span></label>
            <input type="text" id="ntc-code" class="profile-input ntc-code-input"
                   maxlength="12" placeholder="YILDIZFC"
                   oninput="this.value=this.value.toUpperCase()">
          </div>
          <div id="ntc-join-preview" style="display:none;" class="ntc-join-preview-box"></div>
          <div class="ntc-field">
            <button class="ntc-lookup-btn" onclick="_tmLookupCode()">
              <i class="fa-solid fa-magnifying-glass"></i> Takımı Sorgula
            </button>
          </div>
        </div>
        <div class="ntc-form-footer">
          <button class="btn-outline ntc-cancel-btn" onclick="_tmCloseFlows()">İptal</button>
          <button class="ntc-submit-btn ntc-submit-join" id="ntc-join-btn"
                  onclick="_tmSubmitJoin()" disabled>
            <i class="fa-solid fa-right-to-bracket"></i> Takıma Katıl
          </button>
        </div>
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────────────
// 6. TAKIMSIZ — Flow Helpers
// ──────────────────────────────────────────────────────

let _ntcSelectedColor = '#00ff88';
let _ntcFoundTeam     = null;

window._tmOpenCreateFlow = function() {
  document.getElementById('ntc-create-panel').style.display = 'block';
  document.getElementById('ntc-join-panel').style.display   = 'none';
  document.getElementById('ntc-name')?.focus();
};

window._tmOpenJoinFlow = function() {
  document.getElementById('ntc-join-panel').style.display   = 'block';
  document.getElementById('ntc-create-panel').style.display = 'none';
  document.getElementById('ntc-code')?.focus();
};

window._tmCloseFlows = function() {
  document.getElementById('ntc-create-panel').style.display = 'none';
  document.getElementById('ntc-join-panel').style.display   = 'none';
};

window._tmPreviewSlug = function() {
  const name = document.getElementById('ntc-name')?.value || '';
  const slug = DB.Teams.generateSlug(name) || '—';
  const el   = document.getElementById('ntc-slug-preview');
  if (el) el.textContent = slug;
};

window._tmSelectColor = function(el, color) {
  _ntcSelectedColor = color;
  document.querySelectorAll('.ntc-color-dot').forEach(d => d.classList.remove('selected'));
  el.classList.add('selected');
};

window._tmLookupCode = async function() {
  const code = document.getElementById('ntc-code')?.value?.trim();
  if (!code) { window.showToast?.('Lütfen bir davet kodu girin', 'error'); return; }

  const preview = document.getElementById('ntc-join-preview');
  const joinBtn = document.getElementById('ntc-join-btn');
  _ntcFoundTeam = null;
  if (joinBtn) joinBtn.disabled = true;

  try {
    // Arama: slug = code
    const teams = await DB.Teams.search(code, 5);
    const found = teams.find(t => (t.slug || '').toUpperCase() === code.toUpperCase());

    if (!found) {
      if (preview) {
        preview.style.display = 'block';
        preview.innerHTML = `<div class="ntc-join-not-found">
          <i class="fa-solid fa-circle-xmark" style="color:#ff007f;"></i>
          <span>"<b>${code}</b>" koduyla bir takım bulunamadı.</span>
        </div>`;
      }
      return;
    }

    _ntcFoundTeam = found;
    if (preview) {
      preview.style.display = 'block';
      preview.innerHTML = `<div class="ntc-join-found">
        <div class="ntc-found-row">
          <img src="${_tmAvatar(found.captain?.username || found.name, 40)}" class="ntc-found-avatar">
          <div class="ntc-found-info">
            <div class="ntc-found-name">${found.name}</div>
            <div class="ntc-found-meta">
              <span><i class="fa-solid fa-crown" style="color:#ffd700;"></i> ${found.captain?.username || 'Kaptan'}</span>
              <span><i class="fa-solid fa-city"></i> ${found.city || '—'}</span>
              <span><i class="fa-solid fa-star" style="color:var(--neon-green);"></i> ${found.gen_score || 70} GEN</span>
            </div>
          </div>
        </div>
      </div>`;
    }
    if (joinBtn) joinBtn.disabled = false;
  } catch (e) {
    window.showToast?.('❌ Sorgulama hatası: ' + e.message, 'error');
  }
};

window._tmSubmitCreate = async function() {
  const name = document.getElementById('ntc-name')?.value?.trim();
  const city = document.getElementById('ntc-city')?.value?.trim();
  const desc = document.getElementById('ntc-desc')?.value?.trim();
  if (!name) { window.showToast?.('Takım adı zorunlu', 'error'); return; }

  const btn = document.getElementById('ntc-create-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kuruluyor…'; }

  try {
    // Slug oluştur
    let slug = DB.Teams.generateSlug(name);

    // Slug çakışma kontrolü
    try {
      const existing = await DB.Teams.search(slug, 5);
      const slugTaken = existing.some(t => (t.slug || '').toUpperCase() === slug.toUpperCase());
      if (slugTaken) {
        slug = slug.substring(0, 6) + Math.random().toString(36).slice(2, 4).toUpperCase();
      }
    } catch(e) { /* slug kontrolü opsiyonel, devam et */ }

    console.log('📤 Takım oluşturuluyor:', { name, slug, userId: _tmState.userId });

    const team = await DB.Teams.create(_tmState.userId, {
      name,
      slug,
      city:        city || _tmState.profile?.city || 'İstanbul',
      description: desc || '',
      color:       _ntcSelectedColor || '#00ff88',
      gen_score:   _tmPlayerGEN(_tmState.profile),
    });

    console.log('✅ Takım oluşturuldu:', team);
    window.showToast?.(`🎉 "${name}" kuruldu! Davet kodu: ${slug}`, 'success');

    // myTeams listesine ekle
    _tmState.myTeams.push({
      id:   team.id,
      name: team.name,
      slug: team.slug,
      city: team.city,
      color: team.color || _ntcSelectedColor,
      role: 'captain',
    });

    // Modal kapat (hem onboarding paneli hem de yeni takım modali)
    document.getElementById('tm-new-team-modal')?.remove();

    // Direkt state'i set et ve UI'ı render et
    _tmState.team    = team;
    _tmState.myRole  = 'captain';
    _tmState.members = [{
      player_id: _tmState.userId,
      role: 'captain',
      player: _tmState.profile
    }];
    _tmRenderTeamUI();
    _tmShowSubtabs();
    _tmSubscribeRealtime();

  } catch (e) {
    console.error('❌ _tmSubmitCreate error:', e);
    const msg = e.message || 'Bilinmeyen hata';
    window.showToast?.('❌ Takım kurulamadı: ' + msg, 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-shield-plus"></i> Takımı Kur'; }
  }
};

window._tmSubmitJoin = async function() {
  if (!_ntcFoundTeam) { window.showToast?.('Önce takımı sorgula', 'error'); return; }

  const btn = document.getElementById('ntc-join-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Katılıyor…'; }

  try {
    await DB.Teams.addMember(_ntcFoundTeam.id, _tmState.userId, 'player');
    await window.sbClient.from('profiles')
      .update({ current_team_id: _ntcFoundTeam.id })
      .eq('id', _tmState.userId);

    window.showToast?.(`✅ "${_ntcFoundTeam.name}" takımına katıldın!`, 'success');

    // myTeams listesine ekle (zaten yoksa)
    if (!_tmState.myTeams.find(t => t.id === _ntcFoundTeam.id)) {
      _tmState.myTeams.push({
        id:   _ntcFoundTeam.id,
        name: _ntcFoundTeam.name,
        slug: _ntcFoundTeam.slug,
        city: _ntcFoundTeam.city,
        color: _ntcFoundTeam.color,
        role: 'player',
      });
    }

    // Modal kapat
    document.getElementById('tm-new-team-modal')?.remove();

    // Direkt state güncelle ve render et
    _tmState.team    = _ntcFoundTeam;
    _tmState.myRole  = 'player';
    _tmState.members = [];
    _tmRenderTeamUI();
    _tmShowSubtabs();

  } catch (e) {
    console.error('❌ _tmSubmitJoin error:', e);
    window.showToast?.('❌ Katılım hatası: ' + (e.message || 'Hata'), 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Takıma Katıl'; }
  }
};

// ──────────────────────────────────────────────────────
// 7. TAKIM UI — Ana Render
// ──────────────────────────────────────────────────────

function _tmRenderTeamSelector() {
  let strip = document.getElementById('team-selector-strip');
  if (!strip) {
    const hdr = document.getElementById('team-main-header');
    if (!hdr) return;
    strip = document.createElement('div');
    strip.id = 'team-selector-strip';
    hdr.parentNode.insertBefore(strip, hdr);
  }

  if (_tmState.myTeams.length <= 1) {
    strip.style.display = 'none';
    return;
  }

  strip.className = 'team-selector-strip';
  strip.style.display = '';
  strip.innerHTML = _tmState.myTeams.map(t => `
    <button class="ts-chip ${t.id === _tmState.team?.id ? 'ts-chip-active' : ''}"
            onclick="_tmSwitchTeam('${t.id}')" title="${t.name}">
      <i class="fa-solid fa-shield-cat" style="color:${t.color || '#00ff88'};"></i>
      <span>${t.name}</span>
      ${t.role === 'captain' ? '<i class="fa-solid fa-crown" style="color:#ffd700;font-size:0.65rem;"></i>' : ''}
    </button>
  `).join('') + `
    <button class="ts-chip ts-chip-add" onclick="_tmNewTeamModal()" title="Yeni Takım Ekle">
      <i class="fa-solid fa-plus"></i>
    </button>
  `;
}

function _tmRenderTeamUI() {
  _tmShowSubtabs();
  _tmRenderTeamSelector();
  _tmRenderHeader();
  renderTeamOverview();
}

window._tmNewTeamModal = function() {
  document.getElementById('tm-new-team-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'tm-new-team-modal';
  modal.className = 'tm-modal-overlay';
  modal.innerHTML = `
    <div class="tm-modal-box" style="max-width:480px;">
      <div class="tm-modal-header">
        <i class="fa-solid fa-shield-plus" style="color:var(--neon-green)"></i>
        <span>Takım Ekle</span>
        <button class="tm-modal-close" onclick="document.getElementById('tm-new-team-modal').remove()">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="tm-invite-tabs">
        <button class="tm-invite-tab active" id="ntm-btn-create" onclick="_tmNewTeamTab('create')">
          <i class="fa-solid fa-plus-circle"></i> Takım Kur
        </button>
        <button class="tm-invite-tab" id="ntm-btn-join" onclick="_tmNewTeamTab('join')">
          <i class="fa-solid fa-right-to-bracket"></i> Katıl
        </button>
      </div>
      <div id="ntm-create-panel" style="padding:1rem 1.25rem;">
        <div class="ntc-field">
          <label>Takım Adı <span style="color:#ff007f">*</span></label>
          <input type="text" id="ntc-name" class="profile-input" maxlength="30"
                 placeholder="Örn: Yıldızlar FC" oninput="_tmPreviewSlug()">
        </div>
        <div class="ntc-field">
          <label>Davet Kodu <span style="color:#888;font-weight:400;">(otomatik)</span></label>
          <div class="ntc-slug-preview" id="ntc-slug-preview">—</div>
        </div>
        <div class="ntc-field">
          <label>Şehir</label>
          <input type="text" id="ntc-city" class="profile-input" maxlength="30"
                 placeholder="İstanbul" value="${_tmState.profile?.city || 'İstanbul'}">
        </div>
        <div class="ntc-field">
          <label>Açıklama</label>
          <input type="text" id="ntc-desc" class="profile-input" maxlength="80"
                 placeholder="Kısa bir slogan…">
        </div>
        <div class="ntc-field">
          <label>Arma Rengi</label>
          <div class="ntc-color-row" id="ntc-color-row">
            ${['#00ff88','#00e5ff','#ff007f','#ffd700','#ff6b35','#a855f7','#ef4444','#3b82f6','#ffffff']
              .map((c,i) => `<div class="ntc-color-dot ${i===0?'selected':''}" style="background:${c};"
                onclick="_tmSelectColor(this,'${c}')" data-color="${c}"></div>`).join('')}
          </div>
        </div>
        <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1.2rem;">
          <button class="btn-outline" onclick="document.getElementById('tm-new-team-modal').remove()">İptal</button>
          <button class="ntc-submit-btn ntc-submit-create" id="ntc-create-btn" onclick="_tmSubmitCreate()">
            <i class="fa-solid fa-shield-plus"></i> Takımı Kur
          </button>
        </div>
      </div>
      <div id="ntm-join-panel" style="display:none;padding:1rem 1.25rem;">
        <div class="ntc-field">
          <label>Davet Kodu <span style="color:#ff007f">*</span></label>
          <input type="text" id="ntc-code" class="profile-input ntc-code-input"
                 maxlength="12" placeholder="YILDIZFC"
                 oninput="this.value=this.value.toUpperCase()">
        </div>
        <div id="ntc-join-preview" style="display:none;" class="ntc-join-preview-box"></div>
        <div class="ntc-field">
          <button class="ntc-lookup-btn" onclick="_tmLookupCode()">
            <i class="fa-solid fa-magnifying-glass"></i> Takımı Sorgula
          </button>
        </div>
        <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1.2rem;">
          <button class="btn-outline" onclick="document.getElementById('tm-new-team-modal').remove()">İptal</button>
          <button class="ntc-submit-btn ntc-submit-join" id="ntc-join-btn"
                  onclick="_tmSubmitJoin()" disabled>
            <i class="fa-solid fa-right-to-bracket"></i> Takıma Katıl
          </button>
        </div>
      </div>
    </div>
  `;

  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('visible'));
};

window._tmNewTeamTab = function(tab) {
  document.getElementById('ntm-create-panel').style.display = tab === 'create' ? '' : 'none';
  document.getElementById('ntm-join-panel').style.display   = tab === 'join'   ? '' : 'none';
  document.querySelectorAll('#tm-new-team-modal .tm-invite-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(`ntm-btn-${tab}`)?.classList.add('active');
};

// ──────────────────────────────────────────────────────
// 8. TAKIM HEADER
// ──────────────────────────────────────────────────────

function _tmRenderHeader() {
  const hdr = document.getElementById('team-main-header');
  if (!hdr || !_tmState.team) return;

  const t    = _tmState.team;
  const gen  = _tmTeamGEN();
  const cap  = t.captain || {};
  const isCA = _tmIsCapOrAdmin();

  hdr.innerHTML = `
    <div class="team-identity-block">
      <div class="team-crest" id="team-crest-display" style="color:${_ntcSelectedColor || '#00ff88'};"
           ${isCA ? 'onclick="openTeamEditModal()" title="Takımı düzenle"' : ''}>
        <i class="fa-solid fa-shield-cat"></i>
      </div>
      <div class="team-name-block">
        <h1 class="team-main-name" id="team-name-display">${t.name}</h1>
        <div class="team-meta-row">
          <span class="team-gen-badge">
            <span id="team-gen-number">${gen}</span> GEN
          </span>
          <span class="team-member-count">
            <i class="fa-solid fa-users"></i> ${_tmState.members.length} Oyuncu
          </span>
          <span class="team-captain-badge" title="Kaptan">
            <i class="fa-solid fa-crown" style="color:#ffd700;"></i>
            ${cap.username || 'Kaptan'}
          </span>
          <span class="team-invite-code" title="Davet Kodu" onclick="_tmCopyCode('${t.slug || ''}')">
            <i class="fa-solid fa-key" style="color:var(--neon-cyan);"></i>
            ${t.slug || '—'}
          </span>
        </div>
        <div class="team-desc" id="team-desc-display">${t.description || ''}</div>
      </div>
    </div>
    <div class="team-header-actions">
      <div class="team-season-counters">
        <div class="ts-counter"><span class="ts-val">${(t.total_wins||0)+(t.total_draws||0)+(t.total_losses||0)}</span><span class="ts-lbl">Maç</span></div>
        <div class="ts-counter win"><span class="ts-val">${t.total_wins||0}</span><span class="ts-lbl">Galibiyet</span></div>
        <div class="ts-counter draw"><span class="ts-val">${t.total_draws||0}</span><span class="ts-lbl">Beraberlik</span></div>
        <div class="ts-counter loss"><span class="ts-val">${t.total_losses||0}</span><span class="ts-lbl">Mağlubiyet</span></div>
      </div>
      <div class="team-header-btns">
        <button class="btn-invite-team" onclick="_tmOpenInviteModal()">
          <i class="fa-solid fa-user-plus"></i> Oyuncu Davet Et
        </button>
        ${isCA ? `<button class="btn-edit-team" onclick="openTeamEditModal()">
          <i class="fa-solid fa-pen-to-square"></i> Düzenle
        </button>` : ''}
        <button class="btn-leave-team" onclick="_tmLeaveOrDissolve()">
          ${_tmIsCapOrAdmin() ? '<i class="fa-solid fa-bomb"></i> Dağıt' : '<i class="fa-solid fa-right-from-bracket"></i> Ayrıl'}
        </button>
      </div>
    </div>
  `;
}

window._tmCopyCode = function(slug) {
  if (!slug) return;
  navigator.clipboard?.writeText(slug).then(() => {
    window.showToast?.(`📋 Davet kodu kopyalandı: ${slug}`, 'success');
  });
};

// ──────────────────────────────────────────────────────
// DAVET MODALI
// ──────────────────────────────────────────────────────

window._tmOpenInviteModal = function() {
  // Varsa temizle
  document.getElementById('tm-invite-modal')?.remove();

  const t = _tmState.team;
  if (!t) return;

  const slug = t.slug || '—';
  const shareUrl = `${location.origin}${location.pathname}?join=${slug}`;

  const modal = document.createElement('div');
  modal.id = 'tm-invite-modal';
  modal.className = 'tm-modal-overlay';
  modal.innerHTML = `
    <div class="tm-modal-box tm-invite-box">
      <div class="tm-modal-header">
        <i class="fa-solid fa-user-plus" style="color:var(--neon-green)"></i>
        <span>Oyuncu Davet Et</span>
        <button class="tm-modal-close" onclick="document.getElementById('tm-invite-modal').remove()">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Sekmeler -->
      <div class="tm-invite-tabs">
        <button class="tm-invite-tab active" id="itab-btn-code" onclick="_tmInviteTab('code')">
          <i class="fa-solid fa-key"></i> Davet Kodu
        </button>
        <button class="tm-invite-tab" id="itab-btn-search" onclick="_tmInviteTab('search')">
          <i class="fa-solid fa-magnifying-glass"></i> Oyuncu Ara
        </button>
      </div>

      <!-- Davet Kodu Tab -->
      <div id="itab-code" class="tm-invite-tab-content" style="display:block">
        <p class="tm-invite-hint">Bu kodu paylaş, arkadaşların "Takıma Katıl" ekranından girebilir.</p>
        <div class="tm-invite-code-display">
          <span class="tm-inv-code-text" id="tm-inv-code-text">${slug}</span>
          <button class="tm-inv-copy-btn" onclick="_tmCopyCode('${slug}')">
            <i class="fa-solid fa-copy"></i> Kopyala
          </button>
        </div>
        <button class="tm-inv-share-btn" onclick="_tmShareInvite('${slug}','${shareUrl}')">
          <i class="fa-solid fa-share-nodes"></i> Linki Paylaş
        </button>
      </div>

      <!-- Oyuncu Arama Tab -->
      <div id="itab-search" class="tm-invite-tab-content" style="display:none">
        <p class="tm-invite-hint">Kullanıcı adıyla oyuncu arayın ve davet bildirimi gönderin.</p>
        <div class="tm-invite-search-row">
          <input type="text" id="tm-inv-search-input" class="profile-input"
                 placeholder="Kullanıcı adı..." maxlength="30"
                 onkeydown="if(event.key==='Enter') _tmSearchPlayers()">
          <button class="ntc-lookup-btn" onclick="_tmSearchPlayers()">
            <i class="fa-solid fa-magnifying-glass"></i>
          </button>
        </div>
        <div id="tm-inv-results" class="tm-inv-results-list"></div>
      </div>
    </div>
  `;

  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('visible'));
};

window._tmInviteTab = function(tab) {
  document.getElementById('itab-code').style.display   = tab === 'code'   ? 'block' : 'none';
  document.getElementById('itab-search').style.display = tab === 'search' ? 'block' : 'none';
  document.querySelectorAll('.tm-invite-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(`itab-btn-${tab}`)?.classList.add('active');
  if (tab === 'search') setTimeout(() => document.getElementById('tm-inv-search-input')?.focus(), 50);
};

window._tmShareInvite = function(slug, url) {
  if (navigator.share) {
    navigator.share({ title: `${_tmState.team?.name} takımına katıl!`, text: `Davet kodum: ${slug}`, url })
      .catch(() => {});
  } else {
    navigator.clipboard?.writeText(url).then(() => {
      window.showToast?.('🔗 Davet linki kopyalandı!', 'success');
    });
  }
};

window._tmSearchPlayers = async function() {
  const q = document.getElementById('tm-inv-search-input')?.value?.trim();
  if (!q || q.length < 2) { window.showToast?.('En az 2 karakter girin', 'error'); return; }

  const resultsEl = document.getElementById('tm-inv-results');
  if (!resultsEl) return;
  resultsEl.innerHTML = `<div class="tm-inv-searching"><i class="fa-solid fa-spinner fa-spin"></i> Aranıyor…</div>`;

  try {
    const { data, error } = await window.sbClient
      .from('profiles')
      .select('id, username, avatar_url, position, ana_mevki, gen_score, current_team_id')
      .ilike('username', `%${q}%`)
      .neq('id', _tmState.userId)
      .limit(8);

    if (error) throw error;

    const members = _tmState.members.map(m => m.player_id || m.player?.id);

    if (!data || data.length === 0) {
      resultsEl.innerHTML = `<div class="tm-inv-empty"><i class="fa-solid fa-user-slash"></i> Oyuncu bulunamadı.</div>`;
      return;
    }

    resultsEl.innerHTML = data.map(p => {
      const isMember = members.includes(p.id);
      const hasTeam  = !!p.current_team_id;
      const avatar   = p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.username||'u')}`;
      const pos      = p.ana_mevki || p.position || 'OS';
      const gen      = p.gen_score || 70;

      return `
        <div class="tm-inv-result-row">
          <img src="${avatar}" class="tm-inv-result-avatar" alt="${p.username}">
          <div class="tm-inv-result-info">
            <span class="tm-inv-result-name">${p.username}</span>
            <span class="tm-inv-result-meta">${pos} · ${gen} GEN${hasTeam ? ' · <span style="color:#ff6b35">Takımlı</span>' : ''}</span>
          </div>
          ${isMember
            ? `<span class="tm-inv-badge-member"><i class="fa-solid fa-check"></i> Üye</span>`
            : `<button class="tm-inv-send-btn" onclick="_tmSendInvite('${p.id}','${p.username}',this)">
                 <i class="fa-solid fa-paper-plane"></i> Davet Et
               </button>`
          }
        </div>`;
    }).join('');

  } catch (e) {
    resultsEl.innerHTML = `<div class="tm-inv-empty" style="color:#ff007f">Hata: ${e.message}</div>`;
  }
};

window._tmSendInvite = async function(targetUserId, targetUsername, btn) {
  const t = _tmState.team;
  if (!t) return;

  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; }

  try {
    // Bildirim gönder
    await DB.Notifications.send(
      targetUserId,
      'team_invite',
      `${t.name} Takımına Davet`,
      `${_tmState.profile?.username || 'Kaptan'} seni ${t.name} takımına davet etti! Davet kodu: ${t.slug || ''}`,
      _tmState.userId
    );

    window.showToast?.(`✅ ${targetUsername} davet edildi!`, 'success');
    if (btn) { btn.innerHTML = '<i class="fa-solid fa-check"></i> Gönderildi'; btn.style.color = 'var(--neon-green)'; }
  } catch (e) {
    window.showToast?.('❌ Davet gönderilemedi: ' + e.message, 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Davet Et'; }
  }
};

function _tmRemoveFromMyTeams(teamId) {
  _tmState.myTeams = _tmState.myTeams.filter(t => t.id !== teamId);
  // Başka takım varsa ona geç, yoksa onboarding ekranına dön
  if (_tmState.myTeams.length > 0) {
    const next = _tmState.myTeams[0];
    _tmState.team = null; // zorla yenile
    _tmLoadTeam(next.id);
  } else {
    _tmState.team = null; _tmState.members = []; _tmState.myRole = null;
    const strip = document.getElementById('team-selector-strip');
    if (strip) strip.style.display = 'none';
    _tmRenderNoTeamScreen();
  }
}

window._tmLeaveOrDissolve = async function() {
  const t = _tmState.team;
  if (!t) return;

  if (_tmIsCapOrAdmin()) {
    if (!confirm(`"${t.name}" takımını dağıtmak istediğinden emin misin? Tüm üyeler takımdan çıkarılır.`)) return;
    try {
      await DB.Teams.dissolve(t.id, _tmState.userId);
      window.showToast?.('Takım dağıtıldı.', 'success');
      _tmRemoveFromMyTeams(t.id);
    } catch (e) { window.showToast?.('❌ ' + e.message, 'error'); }
  } else {
    if (!confirm(`"${t.name}" takımından ayrılmak istediğinden emin misin?`)) return;
    try {
      await DB.Teams.leave(t.id, _tmState.userId);
      window.showToast?.('Takımdan ayrıldın.', 'success');
      _tmRemoveFromMyTeams(t.id);
    } catch (e) { window.showToast?.('❌ ' + e.message, 'error'); }
  }
};

// ──────────────────────────────────────────────────────
// 9. TAKIM GENEL BAKIŞ
// ──────────────────────────────────────────────────────

let teamChartInstance = null;

function renderTeamOverview() {
  if (!_tmState.team) return;
  _tmRenderHeader();
  renderTeamRadarChart();
  renderTeamStrengthBadges();
  renderCoreSquadSection();
  renderTeamMemberGrid();
}

function renderTeamRadarChart() {
  const genChip = document.getElementById('team-gen-radar-val');
  if (genChip) genChip.textContent = _tmTeamGEN();

  const ctx = document.getElementById('team-radar-chart');
  if (!ctx || typeof Chart === 'undefined') return;

  const profile = _tmTeamStatProfile();
  const vals = [profile.teknik, profile.sut, profile.pas, profile.hiz, profile.fizik, profile.kondisyon];

  if (teamChartInstance) {
    teamChartInstance.data.datasets[0].data = vals;
    teamChartInstance.update();
    return;
  }
  teamChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Teknik','Şut','Pas','Hız','Fizik','Kondisyon'],
      datasets: [{
        label: 'Takım Profili',
        data: vals,
        backgroundColor: 'rgba(0,255,136,0.15)',
        borderColor: '#00ff88',
        borderWidth: 2.5,
        pointBackgroundColor: '#00ff88',
        pointRadius: 5,
        pointHoverRadius: 7,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { r: {
        angleLines: { color: 'rgba(255,255,255,0.1)' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        pointLabels: { color: '#ddd', font: { size: 13, weight: '600' } },
        suggestedMin: 0, suggestedMax: 99,
        ticks: { display: false },
      }},
      plugins: { legend: { display: false } },
      animation: { duration: 800, easing: 'easeInOutQuart' },
    },
  });
}

function renderTeamStrengthBadges() {
  const container = document.getElementById('team-strength-badges');
  if (!container) return;

  const profile = _tmTeamStatProfile();
  const allStats = Object.entries(profile).sort((a, b) => b[1] - a[1]);
  const labels  = { teknik:'Teknik', sut:'Şut', pas:'Pas', hiz:'Hız', fizik:'Fizik', kondisyon:'Kondisyon' };
  const icons   = { teknik:'fa-wand-magic-sparkles', sut:'fa-bullseye', pas:'fa-arrows-split-up-and-left',
                    hiz:'fa-person-running', fizik:'fa-dumbbell', kondisyon:'fa-heart-pulse' };
  const colors  = { teknik:'#00e5ff', sut:'#ff007f', pas:'#00ff88',
                    hiz:'#ff6b35', fizik:'#a855f7', kondisyon:'#ffd700' };

  container.innerHTML = `
    <div class="strength-header">
      <i class="fa-solid fa-chart-bar" style="color:var(--neon-green);"></i> TAKIM ÖZELLİK PROFİLİ
    </div>
    <div class="strength-bar-list">
      ${allStats.map(([key, val], i) => `
      <div class="strength-bar-row ${i === 0 ? 'top-stat' : ''}">
        <div class="strength-bar-label">
          <i class="fa-solid ${icons[key]}" style="color:${colors[key]};"></i>
          <span>${labels[key]}</span>
          ${i === 0 ? '<span class="top-badge">EN GÜÇLÜ</span>' : ''}
          ${i === allStats.length - 1 ? '<span class="weak-badge">GELİŞTİR</span>' : ''}
        </div>
        <div class="strength-bar-track">
          <div class="strength-bar-fill" style="width:${val}%;background:${colors[key]};animation-delay:${i*0.1}s;"></div>
        </div>
        <span class="strength-bar-val" style="color:${colors[key]};">${val}</span>
      </div>`).join('')}
    </div>
  `;
}

function renderCoreSquadSection() {
  const container = document.getElementById('team-core-squad');
  if (!container) return;

  const top7 = [..._tmState.members]
    .map(m => ({ ...m, _gen: _tmPlayerGEN(m.player) }))
    .sort((a, b) => b._gen - a._gen)
    .slice(0, 7);

  const posColors = { KL:'#ffd700', DEF:'#00e5ff', OS:'#00ff88', FV:'#ff007f' };

  container.innerHTML = `
    <div class="core-squad-header">
      <div class="section-label-pill">
        <i class="fa-solid fa-star" style="color:#ffd700;"></i> BAŞLANGIÇ 7 / KİLİT KADRO
      </div>
      <span class="core-gen-total">Ort. GEN: <b style="color:var(--neon-green);">${_tmTeamGEN()}</b></span>
    </div>
    <div class="core-squad-grid">
      ${top7.map((m, i) => {
        const p   = m.player || {};
        const col = posColors[p.position] || '#aaa';
        const isCap = m.role === 'captain';
        return `
        <div class="core-player-card ${isCap ? 'is-core' : ''}">
          <div class="core-rank">${i + 1}</div>
          <div class="core-avatar-wrap">
            <img src="${_tmAvatar(p.username)}" class="core-avatar">
            <div class="core-pos-dot" style="background:${col};" title="${p.position || ''}"></div>
          </div>
          <div class="core-info">
            <span class="core-name">${p.username || '—'}</span>
            <span class="core-pos" style="color:${col};">${p.ana_mevki || p.position || '—'}</span>
          </div>
          <div class="core-gen-chip" style="border-color:${m._gen>=80?'var(--neon-green)':'#555'};">${m._gen}</div>
          ${isCap ? '<i class="fa-solid fa-crown core-bone-icon" style="color:#ffd700;" title="Kaptan"></i>' : ''}
        </div>`;
      }).join('')}
    </div>
  `;
}

function renderTeamMemberGrid() {
  const container = document.getElementById('team-member-grid');
  if (!container) return;

  const isCA = _tmIsCapOrAdmin(); // FAZ 5D: Kaptan kontrolü
  const posColors = { KL:'#ffd700', DEF:'#00e5ff', OS:'#00ff88', FV:'#ff007f' };
  const byPos = { KL:[], DEF:[], OS:[], FV:[], 'Diğer':[] };

  _tmState.members.forEach(m => {
    const pos = (m.player?.position || 'OS').toUpperCase();
    if (byPos[pos]) byPos[pos].push(m);
    else byPos['Diğer'].push(m);
  });

  const posOrder  = ['KL','DEF','OS','FV','Diğer'];
  const posLabels = { KL:'🧤 KALE', DEF:'🛡️ DEFANS', OS:'⚡ ORTA SAHA', FV:'⚽ FORVET', 'Diğer':'👟 DİĞER' };

  const roleBadge = (role) => {
    if (role === 'captain')    return `<span style="font-size:0.6rem;background:rgba(255,215,0,0.15);border:1px solid rgba(255,215,0,0.4);color:#ffd700;border-radius:4px;padding:1px 4px;margin-left:3px;">KAPTAN</span>`;
    if (role === 'substitute') return `<span style="font-size:0.6rem;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#666;border-radius:4px;padding:1px 4px;margin-left:3px;">YEDEK</span>`;
    return '';
  };

  container.innerHTML = `
    <div class="section-label-pill" style="margin-bottom:1.5rem;">
      <i class="fa-solid fa-users"></i> TÜM KADRO (${_tmState.members.length} Oyuncu)
    </div>
    ${!isCA ? `<div style="display:flex;align-items:center;gap:0.5rem;background:rgba(255,255,255,0.03);
        border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:0.6rem 1rem;
        margin-bottom:1rem;font-size:0.8rem;color:#666;">
        <i class="fa-solid fa-eye"></i> Görüntüleme modundasın. Düzenleme yetkisi kaptana aittir.
    </div>` : ''}
    ${posOrder.map(pos => {
      if (!byPos[pos]?.length) return '';
      const col = posColors[pos] || '#aaa';
      return `
      <div class="pos-group">
        <div class="pos-group-label" style="border-color:${col};color:${col};">
          ${posLabels[pos]} <span class="pos-count">${byPos[pos].length}</span>
        </div>
        <div class="member-row">
          ${byPos[pos].map(m => {
            const p      = m.player || {};
            const gen    = _tmPlayerGEN(p);
            const isCap  = m.role === 'captain';
            return `
            <div class="member-chip" onclick="viewPlayerFromTeam('${p.id}')" title="${p.username||'—'} — GEN ${gen}">
              <img src="${_tmAvatar(p.username)}" class="member-chip-avatar">
              <div class="member-chip-info">
                <span class="member-chip-name">
                  ${p.username || '—'}
                  ${isCap ? '<i class="fa-solid fa-crown" style="color:#ffd700;font-size:0.7rem;"></i>' : ''}
                  ${roleBadge(m.role)}
                </span>
                <span class="member-chip-gen" style="color:${gen>=80?'var(--neon-green)':'orange'};">${gen} GEN</span>
              </div>
              ${isCA && !isCap ? `<button class="member-chip-remove" title="Takımdan Çıkar"
                  onclick="event.stopPropagation();_tmRemoveMemberPrompt('${p.id}','${p.username||'Oyuncu'}')">
                <i class="fa-solid fa-user-minus"></i>
              </button>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }).join('')}
  `;
}


// ──────────────────────────────────────────────────────

// FAZ 5D — Kaptan: Üye Çıkarma Onay Dialogu
window._tmRemoveMemberPrompt = async function(playerId, playerName) {
  if (!_tmIsCapOrAdmin()) return;
  const confirmed = confirm(`"${playerName}" adlı oyuncuyu takımdan çıkarmak istediğinizden emin misiniz?`);
  if (!confirmed) return;

  try {
    await window.DB.Teams.removeMember(_tmState.team.id, playerId);
    window.showToast?.(`✅ ${playerName} takımdan çıkarıldı.`, 'success');
    // State'i güncelle
    _tmState.members = _tmState.members.filter(m => m.player_id !== playerId && m.player?.id !== playerId);
    renderTeamMemberGrid();
  } catch(e) {
    window.showToast?.('❌ Çıkarma işlemi başarısız: ' + e.message, 'error');
  }
};

// 10. SUB-TAB NAVİGASYON
// ──────────────────────────────────────────────────────


window.switchTeamTab = function(tabId) {
  document.querySelectorAll('.team-subtab').forEach(el => {
    el.style.display = 'none';
    el.classList.remove('active');
  });
  document.querySelectorAll('.team-tab-btn').forEach(b => b.classList.remove('active'));

  const target = document.getElementById(tabId);
  if (target) {
    target.style.display = 'block';
    setTimeout(() => target.classList.add('active'), 10);
  }
  const activeBtn = document.querySelector(`.team-tab-btn[data-tab="${tabId}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  if (tabId === 'ttab-genel')      renderTeamOverview();
  if (tabId === 'ttab-basarimlar') renderTeamAchievements();
  if (tabId === 'ttab-kadro')      renderKadroTab();
  if (tabId === 'ttab-saha')       renderSahaTab();
  if (tabId === 'ttab-olustur')    renderTakimOlusturTab();
  if (tabId === 'ttab-rakipler')   renderRakiplerTab();
  if (tabId === 'ttab-odemeler')   renderOdemelerTab();
  if (tabId === 'ttab-sinerji')    renderSinerjiTab();
};

// ──────────────────────────────────────────────────────
// 11. TAKIM DÜZENLEME MODALİ (Supabase)
// ──────────────────────────────────────────────────────

window.openTeamEditModal = function() {
  if (!_tmIsCapOrAdmin() || !_tmState.team) return;
  const t = _tmState.team;

  let modal = document.getElementById('team-edit-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'team-edit-modal';
    modal.className = 'modal-backdrop';
    modal.onclick = e => { if (e.target === modal) closeTeamEditModal(); };
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-box" onclick="event.stopPropagation()" style="max-width:520px;">
      <div class="modal-header">
        <h3><i class="fa-solid fa-pen-to-square" style="color:var(--neon-green);"></i> Takım Profilini Düzenle</h3>
        <button class="modal-close" onclick="closeTeamEditModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <div class="modal-field">
          <label>Takım İsmi</label>
          <input type="text" id="team-edit-name" class="profile-input" value="${t.name}" maxlength="30">
        </div>
        <div class="modal-field">
          <label>Açıklama</label>
          <input type="text" id="team-edit-desc" class="profile-input" value="${t.description || ''}" maxlength="80">
        </div>
        <div class="modal-field">
          <label>Şehir</label>
          <input type="text" id="team-edit-city" class="profile-input" value="${t.city || ''}" maxlength="30">
        </div>
        <div class="modal-field">
          <label>Sezon İstatistikleri</label>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;">
            <div><label style="font-size:.75rem;color:var(--neon-green);">Galibiyet</label>
              <input type="number" id="team-stat-wins" class="profile-input" value="${t.total_wins||0}" min="0"></div>
            <div><label style="font-size:.75rem;color:#aaa;">Beraberlik</label>
              <input type="number" id="team-stat-draws" class="profile-input" value="${t.total_draws||0}" min="0"></div>
            <div><label style="font-size:.75rem;color:var(--neon-pink);">Mağlubiyet</label>
              <input type="number" id="team-stat-losses" class="profile-input" value="${t.total_losses||0}" min="0"></div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-outline" onclick="closeTeamEditModal()">İptal</button>
        <button class="btn-primary" onclick="saveTeamEdit()"
                style="background:var(--neon-green);color:black;">
          <i class="fa-solid fa-floppy-disk"></i> Kaydet
        </button>
      </div>
    </div>
  `;
  modal.style.display = 'flex';
};

window.closeTeamEditModal = function() {
  const modal = document.getElementById('team-edit-modal');
  if (modal) modal.style.display = 'none';
};

window.saveTeamEdit = async function() {
  const name  = document.getElementById('team-edit-name')?.value?.trim();
  const desc  = document.getElementById('team-edit-desc')?.value?.trim();
  const city  = document.getElementById('team-edit-city')?.value?.trim();
  const wins  = parseInt(document.getElementById('team-stat-wins')?.value)  || 0;
  const draws = parseInt(document.getElementById('team-stat-draws')?.value) || 0;
  const losses= parseInt(document.getElementById('team-stat-losses')?.value)|| 0;
  if (!name) { window.showToast?.('Takım adı boş bırakılamaz', 'error'); return; }

  try {
    await DB.Teams.update(_tmState.team.id, {
      name, description: desc, city,
      total_wins: wins, total_draws: draws, total_losses: losses,
    });
    window.showToast?.('Takım güncellendi', 'success');
    closeTeamEditModal();
    await initTakimim();
  } catch (e) {
    window.showToast?.('❌ ' + e.message, 'error');
  }
};

// ──────────────────────────────────────────────────────
// 12. BAŞARIMLAR
// ──────────────────────────────────────────────────────

const TEAM_ACHIEVEMENT_DEFS = [
  { id:'ta-unbeatable', title:'Yenilmez Kale',  emoji:'🧱', icon:'fa-shield-halved', tier:'gumus', color:'#aaa',
    desc:'Sezon boyunca 5 maçta gol yemeden kapattınız.', check: t => (t.total_wins||0) >= 5 },
  { id:'ta-champion',   title:'Şampiyon',        emoji:'🏆', icon:'fa-trophy',        tier:'altin', color:'#ffd700',
    desc:'Lig şampiyonu oldunuz.', check: _ => false },
  { id:'ta-solidarity', title:'Dayanışma',       emoji:'🤝', icon:'fa-handshake',     tier:'bronz', color:'#cd7f32',
    desc:'10 farklı oyuncu ile maç oynadınız.', check: (_, m) => m >= 10 },
];

function renderTeamAchievements() {
  const container = document.getElementById('team-achievements-content');
  if (!container) return;
  const t = _tmState.team || {};
  const memberCount = _tmState.members.length;
  const achs = TEAM_ACHIEVEMENT_DEFS.map(d => ({ ...d, unlocked: d.check(t, memberCount) }));
  const unlocked = achs.filter(a => a.unlocked).length;

  container.innerHTML = `
    <div class="team-ach-header">
      <div class="team-ach-progress">
        <i class="fa-solid fa-trophy" style="color:#ffd700;"></i>
        Toplam: <b style="color:var(--neon-green);">${unlocked}</b> / ${achs.length} Başarım Açık
      </div>
    </div>
    <div class="ach-cards-grid">
      ${achs.map(a => `
      <div class="ach-card ${a.unlocked ? 'ach-unlocked' : 'ach-locked'} ach-tier-${a.tier}" title="${a.desc}">
        <div class="ach-card-top">
          <div class="ach-card-icon" style="${a.unlocked ? `color:${a.color};` : 'color:#444;'}">
            <i class="fa-solid ${a.icon}"></i></div>
          <span class="ach-card-emoji">${a.emoji}</span>
          ${a.unlocked
            ? '<div class="ach-status-badge ach-status-unlock"><i class="fa-solid fa-check"></i></div>'
            : '<div class="ach-status-badge ach-status-lock"><i class="fa-solid fa-lock"></i></div>'}
        </div>
        <div class="ach-card-body">
          <h4 class="ach-card-title" style="${a.unlocked ? `color:${a.color}` : 'color:#555'}">${a.title}</h4>
          <p class="ach-card-desc">${a.desc}</p>
        </div>
        ${a.unlocked ? `<div class="ach-tier-stamp">${{bronz:'🥉',gumus:'🥈',altin:'🥇'}[a.tier]||''}</div>` : ''}
      </div>`).join('')}
    </div>`;
}

// ──────────────────────────────────────────────────────
// 13. REALTIME
// ──────────────────────────────────────────────────────

function _tmSubscribeRealtime() {
  if (_tmState.realtimeSub) {
    try { _tmState.realtimeSub.unsubscribe(); } catch (_) {}
  }
  if (!_tmState.team) return;
  _tmState.realtimeSub = DB.Teams.subscribeToTeam(_tmState.team.id, async () => {
    const updated = await DB.Teams.get(_tmState.team.id);
    _tmState.team    = updated;
    _tmState.members = updated?.team_members || [];
    teamData = updated;
    renderTeamOverview();
  });
}

// ──────────────────────────────────────────────────────
// 14. viewPlayerFromTeam
// ──────────────────────────────────────────────────────

window.viewPlayerFromTeam = function(playerId) {
  if (!playerId) return;
  if (typeof window.viewPublicProfile === 'function') {
    window.viewPublicProfile(playerId);
  } else if (typeof updateUI === 'function') {
    window.activePlayerId = playerId;
    updateUI();
    if (typeof showSection === 'function') showSection('profile');
  }
};

// ──────────────────────────────────────────────────────
// 15. STUBS — faz2-7.js override eder
// ──────────────────────────────────────────────────────

window.renderKadroTab        = window.renderKadroTab        || function() {};
window.renderSahaTab         = window.renderSahaTab         || function() {};
window.renderTakimOlusturTab = window.renderTakimOlusturTab || function() {};
window.renderRakiplerTab     = window.renderRakiplerTab     || function() {};
window.renderOdemelerTab     = window.renderOdemelerTab     || function() {};
window.renderSinerjiTab      = window.renderSinerjiTab      || function() {};

// ──────────────────────────────────────────────────────
// 16. DOMContentLoaded INIT
// ──────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Takımım sekmesine tıklanınca init et
  document.querySelectorAll('.nav-item[data-target="takimim"]').forEach(nav => {
    nav.addEventListener('click', () => {
      if (!_tmState.userId) initTakimim();
    });
  });

  // showSection hook
  const _origShowSection = window.showSection;
  window.showSection = function(sec) {
    if (typeof _origShowSection === 'function') _origShowSection(sec);
    if (sec === 'takimim' && !_tmState.userId) initTakimim();
  };
});

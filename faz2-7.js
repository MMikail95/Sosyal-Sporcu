
// ======================================================
// FAZ 2-7: Takımım Kapsamlı Yönetim Modülü
// ======================================================

// Supabase Faz 2 Uyum Sağlayıcı
window.getTeamPlayers = window.getTeamPlayers || function() {
    if (window._tmState && _tmState.members && _tmState.members.length > 0) {
        return _tmState.members.map(m => {
            // Misafir oyuncu (hesapsız)
            if (!m.player && m.guest_name) {
                return {
                    id: 'guest_' + m.id,
                    _memberId: m.id,
                    _isGuest: true,
                    username: m.guest_name,
                    name: m.guest_name,
                    position: m.guest_position || 'OS',
                    ana_mevki: m.guest_position || 'OS',
                    gen_score: null,
                    avatar_url: null,
                    details: { pos: m.guest_position || 'OS' }
                };
            }
            const p = m.player || {};
            p.details = p.details || { pos: p.ana_mevki || p.position || 'OS' };
            p.name = p.username || 'İsimsiz';
            return p;
        }).filter(Boolean);
    }
    return [];
};

// Mevki normalizer — DB'deki Türkçe tam adları ve kısa kodları standartlaştırır
// Büyük/küçük harf duyarsız karşılaştırma kullanır
window._normalizePosKey = function(raw) {
    if (!raw) return 'OS';
    const p = String(raw).trim();
    const pl = p.toLowerCase();
    if (pl === 'kl' || pl.includes('kaleci') || pl.includes('kale')) return 'KL';
    if (pl === 'def' || pl.includes('defan') || pl.includes('stoper') || pl.includes('bek') ||
        pl.includes('libero')) return 'DEF';
    if (pl === 'fv' || pl.includes('forvet') || pl.includes('santrafor') ||
        (pl.includes('kanat') && !pl.includes('orta'))) return 'FV';
    return 'OS';
};
const _POS_SHORT = { KL: 'KL', DEF: 'DEF', OS: 'OS', FV: 'FV' };

window._getPInfo = function(p) {
    if (!p) return { id:'', name:'', pos:'OS', posKey:'OS', col:'#aaa', avatar:'', details:{} };
    const id = p.id || p.supabase_id;
    const _safeStr = v => (v && v !== 'null' && v !== 'undefined') ? v : null;
    const name = _safeStr(p.username) || _safeStr(p.name) || 'Oyuncu';
    const rawPos = p.ana_mevki || p.position || p.details?.anaMevki || p.details?.pos || 'OS';
    const posKey = window._normalizePosKey(rawPos);
    const posColors = { KL: '#ffd700', DEF: '#00e5ff', OS: '#00ff88', FV: '#ff007f' };
    return {
        id, name,
        pos: _POS_SHORT[posKey] || posKey, // Standart kısa kod (DEF / OS / KL / FV)
        posKey,
        col: posColors[posKey] || '#aaa',
        avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        details: p.details || {}
    };
};

window.calcPlayerGEN = window.calcPlayerGEN || function(p) {
    if (!p) return 7;
    if (p.gen_score) return p.gen_score;
    if (p.rating_teknik !== undefined) {
        const vals = [p.rating_teknik, p.rating_sut, p.rating_pas, p.rating_hiz, p.rating_fizik, p.rating_kondisyon].filter(v => v != null && v > 0);
        return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    }
    return null;
};

window.calcTeamGEN = window.calcTeamGEN || function() {
    const players = getTeamPlayers();
    if (players.length === 0) return 70;
    const sum = players.reduce((acc, p) => acc + calcPlayerGEN(p), 0);
    return Math.round(sum / players.length);
};

// ──────────────────────────────────────────────────────
// FAZ 2: KADRO & DAVET
// ──────────────────────────────────────────────────────

window.renderKadroTab = function () {
    const c = document.getElementById('ttab-kadro-content');
    const t = window._tmState?.team;
    if (!c || !t) return;
    try {

    const acc = (typeof getActiveAccount === 'function') ? getActiveAccount() : null;
    const isCapOrAdmin = typeof _tmIsCapOrAdmin === 'function' ? _tmIsCapOrAdmin() : false;
    const teamPlayers = getTeamPlayers();
    const coreSquad = JSON.parse(localStorage.getItem('ss_core_' + t.id) || '[]');

    const posColors = { KL: '#ffd700', DEF: '#00e5ff', OS: '#00ff88', FV: '#ff007f' };
    const posLabels = { KL: '🧤 Kaleci', DEF: '🛡️ Defans', OS: '⚡ Orta Saha', FV: '⚽ Forvet' };

    c.innerHTML = `
        <div class="kadro-tab-wrapper">

            <!-- SECTION: Kadro Listesi -->
            <div class="kadro-section glass-card">
                <div class="kadro-section-header">
                    <div class="section-label-pill">
                        <i class="fa-solid fa-users" style="color:var(--neon-green);"></i>
                        KADRO LİSTESİ
                        <span class="pill-badge">${teamPlayers.length} oyuncu</span>
                    </div>
                    <div class="kadro-actions-row">
                        <button class="btn-sm btn-accent" onclick="if(typeof _tmOpenInviteModal === 'function') _tmOpenInviteModal(); else alert('Davet modülü yüklenemedi.');">
                            <i class="fa-solid fa-user-plus"></i> Oyuncu Davet Et
                        </button>
                        ${isCapOrAdmin ? `
                        <button class="btn-sm btn-outline-sm" onclick="_tmOpenGuestModal()" style="border-color:rgba(255,107,53,0.4);color:#ff6b35;">
                            <i class="fa-solid fa-user-tag"></i> Hesapsız Ekle
                        </button>` : ''}
                    </div>
                </div>

                <div class="kadro-player-table">
                    <div class="kadro-table-head">
                        <span></span>
                        <span>Oyuncu</span>
                        <span>Mevki</span>
                        <span>GEN</span>
                        <span>Kemik</span>
                        ${isCapOrAdmin ? '<span>İşlem</span>' : ''}
                    </div>
                    ${teamPlayers.map((p, i) => {
                        const isGuest = !!p._isGuest;
                        const gen = isGuest ? null : calcPlayerGEN(p);
                        const pInfo = _getPInfo(p);
                        const isCore = !isGuest && coreSquad.includes(pInfo.id);
                        const isCap = !isGuest && pInfo.id === t.captain_id;
                        return `
                        <div class="kadro-table-row ${isCore ? 'is-core-row' : ''}" id="krow-${pInfo.id}">
                            <span class="krow-rank">${i + 1}</span>
                            <span class="krow-player" ${isGuest ? '' : `onclick="viewPlayerFromTeam('${pInfo.id}')"`} style="${isGuest ? 'cursor:default' : ''}">
                                <img src="${pInfo.avatar}" class="krow-avatar" style="opacity:${isGuest?'0.6':'1'}">
                                <span class="krow-name">
                                    ${pInfo.name}
                                    ${isCap ? '<i class="fa-solid fa-crown" style="color:#ffd700; font-size:0.7rem;" title="Kaptan"></i>' : ''}
                                    ${isGuest ? '<span style="font-size:0.6rem;color:#ff6b35;border:1px solid rgba(255,107,53,0.35);border-radius:3px;padding:0 4px;margin-left:3px;vertical-align:middle;">Misafir</span>' : ''}
                                </span>
                            </span>
                            <span class="krow-pos" style="color:${pInfo.col};">
                                ${posLabels[pInfo.posKey] || pInfo.pos}
                            </span>
                            <span class="krow-gen" style="color:#555;">
                                ${gen != null ? `<span style="color:${gen >= 80 ? 'var(--neon-green)' : gen >= 70 ? '#ffd700' : 'orange'}">${gen}</span>` : '—'}
                            </span>
                            <span class="krow-core">
                                ${(!isGuest && isCapOrAdmin) ? `
                                <label class="core-toggle-switch" title="${isCore ? 'Kemik Kadroda' : 'Kemik Kadro Dışı'}">
                                    <input type="checkbox" ${isCore ? 'checked' : ''}
                                           onchange="toggleCoreSquad('${p.id}', this.checked)">
                                    <span class="core-toggle-slider"></span>
                                </label>` : (!isGuest ? `
                                <span class="${isCore ? 'core-dot-on' : 'core-dot-off'}"
                                      title="${isCore ? 'Kemik Kadro' : 'Yedek'}"></span>` : '')}
                            </span>
                            ${isCapOrAdmin ? `
                            <span class="krow-actions">
                                <button class="btn-icon-sm btn-danger-ghost"
                                        onclick="${isGuest ? `_tmRemoveGuestMember('${p._memberId}')` : `removeFromTeam('${p.id}')`}"
                                        title="${isGuest ? 'Misafiri Çıkar' : 'Takımdan Çıkar'}" ${isCap ? 'disabled' : ''}>
                                    <i class="fa-solid fa-user-minus"></i>
                                </button>
                            </span>` : ''}
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <!-- SECTION: Kemik Kadro Özeti -->
            <div class="kadro-section glass-card">
                <div class="kadro-section-header">
                    <div class="section-label-pill">
                        <i class="fa-solid fa-bone" style="color:#ffd700;"></i>
                        KEMİK KADRO (${coreSquad.length}/7)
                    </div>
                    <span class="kadro-gen-avg">
                        Ort. GEN: <b style="color:var(--neon-green);">${calcTeamGEN()}</b>
                    </span>
                </div>
                <div class="core-squad-chips-row">
                    ${(function(){
                        const cores = teamPlayers.filter(p => coreSquad.includes(p.id || p.supabase_id));
                        if (cores.length === 0) return `<div class="empty-state-sm">Henüz kemik kadro seçilmedi. Yukarıdan toggle yapın.</div>`;
                        return cores.map(p => {
                            const pInfo = _getPInfo(p);
                            const gen = calcPlayerGEN(p);
                            return `
                            <div class="core-chip-card">
                                <img src="${pInfo.avatar}" class="core-chip-avatar">
                                <div class="core-chip-info">
                                    <span class="core-chip-name">${pInfo.name}</span>
                                    <span class="core-chip-pos" style="color:${pInfo.col};">${pInfo.pos}</span>
                                </div>
                                <span class="core-chip-gen" style="color:${gen>=80?'var(--neon-green)':'#ffd700'};">${gen}</span>
                            </div>`;
                        }).join('');
                    })()}
                </div>
                ${coreSquad.length < 7 ? `
                <div class="core-warning">
                    <i class="fa-solid fa-triangle-exclamation" style="color:#ffd700;"></i>
                    Kemik kadro için ${7 - coreSquad.length} oyuncu daha seçin
                </div>` : `
                <div class="core-ok">
                    <i class="fa-solid fa-check-circle" style="color:var(--neon-green);"></i>
                    Kemik kadro tamam! 7v7 için hazır.
                </div>`}
            </div>

            <!-- SECTION: Gelen Katılım İstekleri (sadece kaptan görür) -->
            ${isCapOrAdmin ? `
            <div class="kadro-section glass-card" id="join-requests-card">
                <div class="kadro-section-header">
                    <div class="section-label-pill">
                        <i class="fa-solid fa-inbox" style="color:var(--neon-green);"></i>
                        GELEN KATILIM İSTEKLERİ
                    </div>
                    <button class="btn-sm btn-accent" onclick="_refreshJoinRequests()" title="Yenile">
                        <i class="fa-solid fa-rotate-right"></i>
                    </button>
                </div>
                <div id="join-requests-list">
                    <div style="text-align:center; padding:1.5rem; color:#444;">
                        <i class="fa-solid fa-spinner fa-spin"></i> Yükleniyor...
                    </div>
                </div>
            </div>` : ''}

            <!-- SECTION: Gönderilen Davetler -->
            <div class="kadro-section glass-card" id="pending-invites-card">
                <div class="kadro-section-header">
                    <div class="section-label-pill">
                        <i class="fa-solid fa-envelope-open-text" style="color:var(--neon-cyan);"></i>
                        DAVETLER
                    </div>
                </div>
                <div id="team-invites-list">
                    <div class="empty-state-sm" style="color:#666; font-size:0.82rem; padding:1rem 0;">
                        <i class="fa-solid fa-bell" style="color:var(--neon-cyan); margin-right:6px;"></i>
                        Davetler bildirim olarak gönderilir. Yukarıdan <b>Oyuncu Davet Et</b>'e tıkla.
                    </div>
                </div>
            </div>

        </div>
    `;
    // Kaptan ise join requests'i async yükle
    if (isCapOrAdmin && t?.id) {
        _refreshJoinRequests();
    }

    } catch(e) {
        c.innerHTML = `<div style="padding:2rem;color:#ff5555;background:#222;border-radius:10px;"><b>Kadro Sekmesi Hatası:</b> ${e.message}<br>${e.stack}</div>`;
        console.error("renderKadroTab Error:", e);
    }
};

// Gelen katılım isteklerini yükle ve renderla
window._refreshJoinRequests = async function() {
    const container = document.getElementById('join-requests-list');
    if (!container) return;
    const teamId = window._tmState?.team?.id;
    if (!teamId || !window.DB?.TeamRequests) return;

    container.innerHTML = `<div style="text-align:center; padding:1.5rem; color:#444;">
        <i class="fa-solid fa-spinner fa-spin"></i> Yükleniyor...
    </div>`;

    try {
        const requests = await window.DB.TeamRequests.getPendingForTeam(teamId);

        if (!requests || requests.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:1.5rem; color:#555; font-size:0.85rem;">
                <i class="fa-solid fa-inbox" style="font-size:1.5rem; display:block; margin-bottom:0.5rem; color:#333;"></i>
                Bekleyen katılım isteği yok.
            </div>`;
            return;
        }

        container.innerHTML = requests.map(req => {
            const p  = req.player || {};
            const av = p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.username||'u')}`;
            const gen = p.gen_score ? Math.round(p.gen_score) : null;
            const date = req.created_at ? new Date(req.created_at).toLocaleDateString('tr-TR') : '';
            return `
            <div class="kadro-table-row" id="jr-row-${req.id}" style="display:flex; align-items:center; gap:0.6rem; padding:0.7rem 0.5rem;">
                <img src="${av}" style="width:36px; height:36px; border-radius:50%; border:1px solid #333; flex-shrink:0;"
                     onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=u'">
                <div style="flex:1; min-width:0;">
                    <div style="font-size:0.85rem; font-weight:600; color:#ddd;">${p.username || 'Oyuncu'}</div>
                    <div style="font-size:0.7rem; color:#555;">
                        ${p.ana_mevki || p.position || 'Oyuncu'}
                        ${p.city ? ` · ${p.city}` : ''}
                        ${gen ? ` · <span style="color:var(--neon-green);">${gen} GEN</span>` : ''}
                        ${date ? ` · ${date}` : ''}
                    </div>
                </div>
                <div style="display:flex; gap:0.4rem; flex-shrink:0;">
                    <button class="btn-sm btn-success-sm" onclick="_approveJoinRequest('${req.id}', '${req.player_id}')">
                        <i class="fa-solid fa-check"></i> Kabul
                    </button>
                    <button class="btn-sm btn-danger-sm" onclick="_rejectJoinRequest('${req.id}')">
                        <i class="fa-solid fa-xmark"></i> Reddet
                    </button>
                </div>
            </div>`;
        }).join('');
    } catch(e) {
        container.innerHTML = `<div style="text-align:center; padding:1rem; color:#f55; font-size:0.8rem;">
            Hata: ${e.message}
        </div>`;
    }
};

window._approveJoinRequest = async function(requestId, playerId) {
    const row = document.getElementById(`jr-row-${requestId}`);
    if (row) row.style.opacity = '0.5';
    try {
        await window.DB.TeamRequests.approve(requestId);
        if (row) row.remove();
        if (typeof showToast === 'function') showToast('✅ Oyuncu takıma eklendi!');
        // Kadroyu güncelle
        if (typeof renderKadroTab === 'function') {
            setTimeout(() => { if (window._tmState?.team) renderKadroTab(); }, 500);
        }
    } catch(e) {
        if (row) row.style.opacity = '1';
        if (typeof showToast === 'function') showToast('❌ Hata: ' + e.message);
    }
};

window._rejectJoinRequest = async function(requestId) {
    const row = document.getElementById(`jr-row-${requestId}`);
    if (row) row.style.opacity = '0.5';
    try {
        await window.DB.TeamRequests.reject(requestId);
        if (row) row.remove();
        if (typeof showToast === 'function') showToast('İstek reddedildi.');
    } catch(e) {
        if (row) row.style.opacity = '1';
        if (typeof showToast === 'function') showToast('❌ Hata: ' + e.message);
    }
};

function renderTeamInvitesList() {
    const invites = JSON.parse(localStorage.getItem('ss_team_invites') || '[]');
    if (invites.length === 0) return `<div class="empty-state-sm">Aktif davet bulunmuyor.</div>`;

    return invites.map(inv => {
        const player = (window.players || []).find(p => p.id === inv.playerId);
        const statusColors = { pending: '#ffd700', accepted: '#00ff88', rejected: '#ff007f' };
        const statusLabels = { pending: '⏳ Bekliyor', accepted: '✅ Kabul', rejected: '❌ Reddedildi' };
        return `
        <div class="invite-row">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${player?.name||'x'}" class="invite-avatar">
            <div class="invite-info">
                <span class="invite-name">${player?.name || 'Bilinmeyen'}</span>
                <span class="invite-date">${new Date(inv.date).toLocaleDateString('tr-TR')}</span>
            </div>
            <span class="invite-status" style="color:${statusColors[inv.status]};">
                ${statusLabels[inv.status]}
            </span>
            ${inv.status === 'pending' ? `
            <div class="invite-actions">
                <button class="btn-sm btn-success-sm" onclick="acceptTeamInvite('${inv.id}')">Kabul</button>
                <button class="btn-sm btn-danger-sm" onclick="rejectTeamInvite('${inv.id}')">Reddet</button>
            </div>` : ''}
        </div>`;
    }).join('');
}

window.toggleCoreSquad = function(playerId, checked) {
    const t = window._tmState?.team;
    if (!t) return;
    let core = JSON.parse(localStorage.getItem('ss_core_' + t.id) || '[]');
    
    if (checked) {
        if (!core.includes(playerId)) {
            if (core.length >= 7) {
                const nonCap = core.find(id => id !== t.captain_id);
                if (nonCap) core = core.filter(id => id !== nonCap);
                else { showToast('Kemik kadro maksimum 7 oyuncu!'); return; }
            }
            core.push(playerId);
        }
    } else {
        core = core.filter(id => id !== playerId);
    }
    localStorage.setItem('ss_core_' + t.id, JSON.stringify(core));
    renderKadroTab();
    if (typeof renderCoreSquadSection === 'function') renderCoreSquadSection();
};

window.removeFromTeam = async function(playerId) {
    const t = window._tmState?.team;
    if (!t) return;
    if (playerId === t.captain_id) return;
    if (!confirm('Bu oyuncuyu takımdan çıkarmak istiyor musunuz?')) return;
    
    if (window.DB && window.DB.Teams) {
        try {
            await window.DB.Teams.removeMember(t.id, playerId);
            showToast('Oyuncu takımdan çıkarıldı.', 'success');
            if (window.initTakimim) await window.initTakimim();
            renderKadroTab();
            renderTeamOverview();
        } catch (e) {
            showToast('Hata: ' + e.message, 'error');
        }
    }
};

window.openDavetModal = function() {
    const modal = document.getElementById('team-davet-modal');
    if (modal) modal.style.display = 'flex';
};

window.closeDavetModal = function() {
    const modal = document.getElementById('team-davet-modal');
    if (modal) modal.style.display = 'none';
};

window.sendTeamInvite = function() {
    // Legacy modal submission
    closeDavetModal();
    renderKadroTab();
    if (typeof showToast === 'function') showToast(`✅ Oyuncu takıma davet edildi!`);
};


window.acceptTeamInvite = function(invId) {
    const invites = JSON.parse(localStorage.getItem('ss_team_invites') || '[]');
    const inv = invites.find(i => i.id === invId);
    if (!inv) return;
    inv.status = 'accepted';
    localStorage.setItem('ss_team_invites', JSON.stringify(invites));

    // Add to team
    if (!teamData.members.includes(inv.playerId)) {
        teamData.members.push(inv.playerId);
        saveTeamData();
    }
    renderKadroTab();
    renderTeamOverview();
    showToast('✅ Oyuncu takıma katıldı!');
};

window.rejectTeamInvite = function(invId) {
    const invites = JSON.parse(localStorage.getItem('ss_team_invites') || '[]');
    const inv = invites.find(i => i.id === invId);
    if (!inv) return;
    inv.status = 'rejected';
    localStorage.setItem('ss_team_invites', JSON.stringify(invites));
    renderKadroTab();
    showToast('Davet reddedildi.');
};

// showToast is defined in faz1.js — no override needed


// ──────────────────────────────────────────────────────
// FAZ 3: SAHA DÜZENİ (Drag & Drop Pitch)
// ──────────────────────────────────────────────────────

const FORMATIONS_7V7 = {
    '3-2-1': {
        name: '3-2-1',
        desc: 'Dengeli ve klasik',
        positions: [
            { id: 'kl',   label: 'KL',  x: 50, y: 88, pos: 'KL'  },
            { id: 'def1', label: 'SMD', x: 20, y: 68, pos: 'DEF' },
            { id: 'def2', label: 'STR', x: 50, y: 68, pos: 'DEF' },
            { id: 'def3', label: 'SMD', x: 80, y: 68, pos: 'DEF' },
            { id: 'os1',  label: 'OS',  x: 30, y: 45, pos: 'OS'  },
            { id: 'os2',  label: 'OS',  x: 70, y: 45, pos: 'OS'  },
            { id: 'fv',   label: 'FV',  x: 50, y: 18, pos: 'FV'  },
        ]
    },
    '2-3-1': {
        name: '2-3-1',
        desc: 'Orta saha kontrolü',
        positions: [
            { id: 'kl',   label: 'KL',  x: 50, y: 88, pos: 'KL'  },
            { id: 'def1', label: 'STR', x: 30, y: 70, pos: 'DEF' },
            { id: 'def2', label: 'STR', x: 70, y: 70, pos: 'DEF' },
            { id: 'os1',  label: 'OS',  x: 20, y: 48, pos: 'OS'  },
            { id: 'os2',  label: 'OS',  x: 50, y: 44, pos: 'OS'  },
            { id: 'os3',  label: 'OS',  x: 80, y: 48, pos: 'OS'  },
            { id: 'fv',   label: 'FV',  x: 50, y: 18, pos: 'FV'  },
        ]
    },
    '2-2-2': {
        name: '2-2-2',
        desc: 'Simetrik güç',
        positions: [
            { id: 'kl',   label: 'KL',  x: 50, y: 88, pos: 'KL'  },
            { id: 'def1', label: 'STR', x: 30, y: 70, pos: 'DEF' },
            { id: 'def2', label: 'STR', x: 70, y: 70, pos: 'DEF' },
            { id: 'os1',  label: 'OS',  x: 30, y: 48, pos: 'OS'  },
            { id: 'os2',  label: 'OS',  x: 70, y: 48, pos: 'OS'  },
            { id: 'fv1',  label: 'FV',  x: 30, y: 22, pos: 'FV'  },
            { id: 'fv2',  label: 'FV',  x: 70, y: 22, pos: 'FV'  },
        ]
    },
    '1-3-2': {
        name: '1-3-2',
        desc: 'Hücuma yatkın',
        positions: [
            { id: 'kl',   label: 'KL',  x: 50, y: 88, pos: 'KL'  },
            { id: 'def1', label: 'STR', x: 50, y: 70, pos: 'DEF' },
            { id: 'os1',  label: 'OS',  x: 20, y: 50, pos: 'OS'  },
            { id: 'os2',  label: 'OS',  x: 50, y: 48, pos: 'OS'  },
            { id: 'os3',  label: 'OS',  x: 80, y: 50, pos: 'OS'  },
            { id: 'fv1',  label: 'FV',  x: 32, y: 18, pos: 'FV'  },
            { id: 'fv2',  label: 'FV',  x: 68, y: 18, pos: 'FV'  },
        ]
    },
    '3-1-2': {
        name: '3-1-2',
        desc: 'Sağlam dip + ikili forvet',
        positions: [
            { id: 'kl',   label: 'KL',  x: 50, y: 88, pos: 'KL'  },
            { id: 'def1', label: 'STR', x: 20, y: 68, pos: 'DEF' },
            { id: 'def2', label: 'STR', x: 50, y: 68, pos: 'DEF' },
            { id: 'def3', label: 'STR', x: 80, y: 68, pos: 'DEF' },
            { id: 'os1',  label: 'OS',  x: 50, y: 46, pos: 'OS'  },
            { id: 'fv1',  label: 'FV',  x: 32, y: 18, pos: 'FV'  },
            { id: 'fv2',  label: 'FV',  x: 68, y: 18, pos: 'FV'  },
        ]
    },
    '1-4-1': {
        name: '1-4-1',
        desc: 'Sıkı savunma, 4 orta saha',
        positions: [
            { id: 'kl',   label: 'KL',  x: 50, y: 88, pos: 'KL'  },
            { id: 'def1', label: 'STR', x: 50, y: 70, pos: 'DEF' },
            { id: 'os1',  label: 'SOK', x: 15, y: 50, pos: 'OS'  },
            { id: 'os2',  label: 'OS',  x: 38, y: 48, pos: 'OS'  },
            { id: 'os3',  label: 'OS',  x: 62, y: 48, pos: 'OS'  },
            { id: 'os4',  label: 'SAK', x: 85, y: 50, pos: 'OS'  },
            { id: 'fv',   label: 'FV',  x: 50, y: 18, pos: 'FV'  },
        ]
    },
    '2-4-0': {
        name: '2-4-0',
        desc: 'Orta saha hakimiyeti, forvet yok',
        positions: [
            { id: 'kl',   label: 'KL',  x: 50, y: 88, pos: 'KL'  },
            { id: 'def1', label: 'STR', x: 30, y: 70, pos: 'DEF' },
            { id: 'def2', label: 'STR', x: 70, y: 70, pos: 'DEF' },
            { id: 'os1',  label: 'SOK', x: 15, y: 46, pos: 'OS'  },
            { id: 'os2',  label: 'OS',  x: 38, y: 42, pos: 'OS'  },
            { id: 'os3',  label: 'OS',  x: 62, y: 42, pos: 'OS'  },
            { id: 'os4',  label: 'SAK', x: 85, y: 46, pos: 'OS'  },
        ]
    },
    '1-2-3': {
        name: '1-2-3',
        desc: 'Hücum odaklı, üçlü forvet',
        positions: [
            { id: 'kl',   label: 'KL',  x: 50, y: 88, pos: 'KL'  },
            { id: 'def1', label: 'STR', x: 50, y: 70, pos: 'DEF' },
            { id: 'os1',  label: 'OS',  x: 30, y: 50, pos: 'OS'  },
            { id: 'os2',  label: 'OS',  x: 70, y: 50, pos: 'OS'  },
            { id: 'fv1',  label: 'SOL', x: 20, y: 22, pos: 'FV'  },
            { id: 'fv2',  label: 'SAN', x: 50, y: 15, pos: 'FV'  },
            { id: 'fv3',  label: 'SAĞ', x: 80, y: 22, pos: 'FV'  },
        ]
    },
    '4-2-0': {
        name: '4-2-0',
        desc: 'Ultra defansif, 4 stoper',
        positions: [
            { id: 'kl',   label: 'KL',  x: 50, y: 88, pos: 'KL'  },
            { id: 'def1', label: 'STR', x: 15, y: 68, pos: 'DEF' },
            { id: 'def2', label: 'STR', x: 38, y: 68, pos: 'DEF' },
            { id: 'def3', label: 'STR', x: 62, y: 68, pos: 'DEF' },
            { id: 'def4', label: 'STR', x: 85, y: 68, pos: 'DEF' },
            { id: 'os1',  label: 'OS',  x: 30, y: 44, pos: 'OS'  },
            { id: 'os2',  label: 'OS',  x: 70, y: 44, pos: 'OS'  },
        ]
    },
};

let pitchDragState = {
    draggingId: null,
    formation: '3-2-1',
    assignments: {}, // posId -> playerId
    customPositions: {}, // posId -> {x, y}
};

// ── MOBİL: SEÇ-VE-YERLEŞTİR (tap-to-select / tap-to-place) ──────────────
// Basit ve güvenli: tıklama olaylarını BOZMAZ, sadece oyuncu ataması yapar.
let _pitchSelected = null; // { id, srcSlot } — yedekten ya da slottan seçilen oyuncu

window._pitchSelect = function(origin, id, slotId) {
    const prevId = _pitchSelected ? _pitchSelected.id : null;

    // Görsel seçim temizle
    document.querySelectorAll('.psn-bench-chip.tap-sel, .psn-card.tap-sel').forEach(el => el.classList.remove('tap-sel'));

    if (origin === 'bench') {
        if (prevId === id && !_pitchSelected?.srcSlot) {
            _pitchSelected = null; // aynı yedek chip'e ikinci kez tap → seçimi kaldır
            return;
        }
        _pitchSelected = { id, srcSlot: null };
        const chip = document.getElementById('bench-' + id);
        if (chip) chip.classList.add('tap-sel');

    } else if (origin === 'slot') {
        if (!_pitchSelected) {
            // Seçim yok: slottaki oyuncuyu seç (taşımak için)
            if (id) {
                _pitchSelected = { id, srcSlot: slotId };
                const card = document.querySelector(`#slot-${slotId} .psn-card`);
                if (card) card.classList.add('tap-sel');
            }
            return;
        }
        // Seçili oyuncuyu bu slota yerleştir
        const playerId = _pitchSelected.id;
        const srcSlot  = _pitchSelected.srcSlot;
        const targetId = pitchDragState.assignments[slotId]; // slottaki mevcut oyuncu

        if (srcSlot) {
            // Slottan slota → swap
            if (targetId) pitchDragState.assignments[srcSlot] = targetId;
            else          delete pitchDragState.assignments[srcSlot];
        }
        pitchDragState.assignments[slotId] = playerId;
        _pitchSelected = null;

        savePitchState();
        if (typeof window.refreshPitchUI === 'function') window.refreshPitchUI();
        else if (typeof renderSahaTab === 'function') renderSahaTab();
    }
};

// 3 kayıt slotu
let pitchSlots = { slot1: null, slot2: null, slot3: null };
let currentPitchSlot = 'slot1';
let _pitchSlotsLoaded = false;

function _slotLsKey() {
    const tid = window._tmState?.team?.id || 'default';
    return `ss_pitch_slots_${tid}`;
}

function loadPitchState() {
    // 1) Slot listesini localStorage'dan yükle (Supabase yüklenmemişse fallback)
    if (!_pitchSlotsLoaded) {
        try {
            const raw = localStorage.getItem(_slotLsKey());
            if (raw) pitchSlots = JSON.parse(raw);
        } catch(e) {}
    }
    // 2) Aktif slotun verisini pitchDragState'e yükle
    const slotData = pitchSlots[currentPitchSlot];
    if (slotData) {
        pitchDragState.formation       = slotData.formation       || '3-2-1';
        pitchDragState.assignments     = slotData.assignments     || {};
        pitchDragState.customPositions = slotData.customPositions || {};
    } else {
        pitchDragState.formation       = '3-2-1';
        pitchDragState.assignments     = {};
        pitchDragState.customPositions = {};
    }
}

function savePitchState() {
    const snapshot = {
        formation:       pitchDragState.formation,
        assignments:     pitchDragState.assignments,
        customPositions: pitchDragState.customPositions
    };
    pitchSlots[currentPitchSlot] = snapshot;
    localStorage.setItem(_slotLsKey(), JSON.stringify(pitchSlots));
    // Eski tek-slot key'ini de güncelle (geriye dönük uyum)
    localStorage.setItem('ss_pitch_v2', JSON.stringify(snapshot));
}

async function savePitchToSupabase() {
    const teamId = window._tmState?.team?.id;
    if (!teamId || !window.DB) return;
    try {
        await window.DB.Teams.update(teamId, { formations_json: JSON.stringify(pitchSlots) });
    } catch(e) { console.warn('Saha Supabase kayıt hatası:', e); }
}

async function loadPitchFromSupabase() {
    const teamId = window._tmState?.team?.id;
    if (!teamId || !window.sbClient) return;
    try {
        const { data } = await window.sbClient.from('teams').select('formations_json').eq('id', teamId).single();
        if (data?.formations_json) {
            pitchSlots = JSON.parse(data.formations_json);
            localStorage.setItem(_slotLsKey(), JSON.stringify(pitchSlots));
        }
    } catch(e) {}
    _pitchSlotsLoaded = true; // Her durumda işaretle — sonsuz döngüyü önler
}

window.switchPitchSlot = function(slot) {
    currentPitchSlot = slot;
    loadPitchState();
    renderSahaTab();
};

window.initPitchSlots = async function() {
    _pitchSlotsLoaded = false;
    await loadPitchFromSupabase();
    loadPitchState();
    renderSahaTab();
};

window.renderSahaTab = function () {
    const c = document.getElementById('ttab-saha-content');
    if (!c) return;
    try {
    // Her tam yeniden render'da çizim modunu sıfırla (stale state önleme)
    _tacticDrawMode = false;

    // İlk açılışta Supabase'den slot verilerini getir ve yeniden render et
    if (!_pitchSlotsLoaded && window._tmState?.team?.id) {
        loadPitchFromSupabase().then(() => {
            loadPitchState();
            renderSahaTab();
        });
    }

    // FAZ 2: _tmState.members kullan (Supabase), eski getTeamPlayers() fallback
    // Misafir oyuncuları da dahil et
    const getMembers = () => {
        if (window._tmState && _tmState.members && _tmState.members.length) {
            return _tmState.members.map(m => {
                if (!m.player && m.guest_name) {
                    return {
                        id: 'guest_' + m.id,
                        _isGuest: true,
                        username: m.guest_name,
                        name: m.guest_name,
                        position: m.guest_position || 'OS',
                        ana_mevki: m.guest_position || 'OS',
                        gen_score: null,
                        avatar_url: null,
                        details: { pos: m.guest_position || 'OS' }
                    };
                }
                return m.player || null;
            }).filter(Boolean);
        }
        return typeof getTeamPlayers === 'function' ? getTeamPlayers() : [];
    };

    const getPlayerGenFromMember = (p) => {
        if (!p) return null;
        // gen_score öncelikli — null veya 0 değilse kullan
        if (p.gen_score != null && p.gen_score > 0) return p.gen_score;
        // rating alanları varsa ve en az biri > 0 ise ortalama hesapla
        const ratingFields = [p.rating_teknik, p.rating_sut, p.rating_pas,
                              p.rating_hiz, p.rating_fizik, p.rating_kondisyon];
        if (ratingFields.some(v => v != null)) {
            const vals = ratingFields.filter(v => v != null && v > 0);
            if (vals.length > 0) return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        }
        return null; // Henüz puan yok — mock 70 gösterme
    };

    const teamPlayers = getMembers();

    loadPitchState();
    const formation = FORMATIONS_7V7[pitchDragState.formation];

    // Pitch slot renderer — PES/FIFA kart stili
    const renderSlots = () => {
        return (formation?.positions || []).map(pos => {
            const posData = pitchDragState.customPositions[pos.id] || pos;
            const assignedId = pitchDragState.assignments[pos.id];
            const p = assignedId ? teamPlayers.find(pl => (pl.id || pl.supabase_id) === assignedId) : null;
            const gen = p ? getPlayerGenFromMember(p) : null;
            const posColors = { KL: '#ffd700', DEF: '#4fc3f7', OS: '#69f0ae', FV: '#ff5252' };
            const col = posColors[pos.pos] || '#aaa';
            const name = p ? (p.username || p.name || 'Oyuncu') : '';
            const avatar = p ? (p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`) : '';
            const genColor = gen != null ? (gen >= 80 ? '#00ff88' : gen >= 70 ? '#ffd700' : '#ff6b35') : '#555';

            return `
            <div class="pitch-slot-new ${p ? 'filled' : 'empty'}"
                 id="slot-${pos.id}"
                 data-pos-id="${pos.id}"
                 data-pos-type="${pos.pos}"
                 style="left:${posData.x}%; top:${posData.y}%;"
                 ondragover="event.preventDefault(); this.classList.add('drag-over-new');"
                 ondragleave="this.classList.remove('drag-over-new');"
                 ondrop="dropOnSlot(event,'${pos.id}')">
              ${p ? `
                <div class="psn-card" draggable="true"
                     ondragstart="startDragFromSlot(event,'${pos.id}','${assignedId}')">
                  ${gen != null ? `<div class="psn-gen" style="background:${genColor}; color:#000">${gen}</div>` : ''}
                  <img src="${avatar}" class="psn-avatar" alt="${name}">
                  <div class="psn-name">${name.split(' ')[0].substring(0, 8)}</div>
                  <div class="psn-pos" style="color:${col}">${pos.label}</div>
                </div>
              ` : `
                <div class="psn-empty">
                  <span class="psn-empty-pos" style="color:${col}">${pos.label}</span>
                  <i class="fa-solid fa-plus" style="color:${col}; opacity:0.4; font-size:0.7rem;"></i>
                </div>
              `}
            </div>`;
        }).join('');
    };

    // Bench renderer
    const renderBench = () => {
        const assigned = Object.values(pitchDragState.assignments);
        const bench = teamPlayers.filter(p => !assigned.includes(p.id || p.supabase_id));
        if (!bench.length) return `<div class="psn-bench-empty"><i class="fa-solid fa-check-circle" style="color:var(--neon-green)"></i> Tüm oyuncular sahada!</div>`;
        return bench.map(p => {
            const gen = getPlayerGenFromMember(p);
            const pid = p.id || p.supabase_id;
            const name = p.username || p.name || 'Oyuncu';
            const avatar = p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
            const rawPos = p.ana_mevki || p.position || (p.details && (p.details.anaMevki || p.details.pos)) || 'OS';
            const posColors = { KL: '#ffd700', DEF: '#4fc3f7', OS: '#69f0ae', FV: '#ff5252' };
            const posKey = window._normalizePosKey(rawPos);
            const pos = { KL:'KL', DEF:'DEF', OS:'OS', FV:'FV' }[posKey] || posKey;
            const col = posColors[posKey] || '#aaa';
            const genColor = gen >= 80 ? 'var(--neon-green)' : gen >= 70 ? '#ffd700' : '#ff6b35';
            return `
            <div class="psn-bench-chip" draggable="true"
                 id="bench-${pid}" data-player-id="${pid}"
                 ondragstart="startDragFromBench(event,'${pid}')">
              <img src="${avatar}" class="psn-bench-avatar">
              <div class="psn-bench-info">
                <span class="psn-bench-name">${name}</span>
                <span class="psn-bench-pos" style="color:${col}">${pos}</span>
              </div>
              <span class="psn-bench-gen" style="color:${genColor}">${gen != null ? gen : '—'}</span>
            </div>`;
        }).join('');
    };

    c.innerHTML = `
    <div class="psn-wrapper">

      <!-- Formasyon Seçici -->
      <div class="glass-card psn-formation-card">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.75rem;">
          <div class="psn-section-title" style="margin-bottom:0;">
            <i class="fa-solid fa-sliders" style="color:var(--neon-green)"></i> FORMASYON
          </div>
          <!-- 3 Kayıt Slotu -->
          <div style="display:flex;gap:0.35rem;">
            ${['slot1','slot2','slot3'].map((s,i) => `
            <button class="psn-slot-btn ${currentPitchSlot===s?'active':''}"
                    data-slot="${s}" onclick="switchPitchSlot('${s}')" title="Düzen ${i+1}">
              <span>Düzen ${i+1}</span>
              <span class="slot-saved-dot ${pitchSlots[s]?'visible':''}" style="width:6px;height:6px;border-radius:50%;background:var(--neon-green);display:inline-block;margin-left:3px;${pitchSlots[s]?'':'opacity:0'}"></span>
            </button>`).join('')}
          </div>
        </div>
        <div class="psn-formation-row">
          ${Object.keys(FORMATIONS_7V7).map(key => `
          <button class="psn-form-btn ${pitchDragState.formation === key ? 'active' : ''}"
                  onclick="selectFormation('${key}')">
            <span class="psn-form-name">${key}</span>
            <span class="psn-form-desc">${FORMATIONS_7V7[key].desc}</span>
          </button>`).join('')}
        </div>
      </div>

      <!-- Saha + Yedek -->
      <div class="psn-main-layout">

        <!-- Sol: Saha -->
        <div class="psn-field-card glass-card">
          <div class="psn-field-header">
            <span style="color:#555; font-size:0.8rem">
              <i class="fa-solid fa-circle-info"></i> Oyuncuyu sürükle, mevkiye bırak
            </span>
            <div style="display:flex; gap:0.5rem;">
              <button class="btn-sm btn-accent" onclick="psn_autoFill()">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Otomatik
              </button>
              <button class="btn-sm btn-outline-sm" onclick="clearPitchAssignments()">
                <i class="fa-solid fa-rotate-left"></i>
              </button>
            </div>
          </div>

          <!-- FIFA/PES Saha -->
          <div class="psn-pitch" id="psn-pitch">
            <!-- Saha çizgileri -->
            <div class="psn-field-bg">
              <div class="psn-stripe"></div><div class="psn-stripe dark"></div>
              <div class="psn-stripe"></div><div class="psn-stripe dark"></div>
              <div class="psn-stripe"></div><div class="psn-stripe dark"></div>
            </div>
            <div class="psn-lines">
              <div class="psn-center-circle"></div>
              <div class="psn-center-dot"></div>
              <div class="psn-halfway-line"></div>
              <div class="psn-penalty-top"></div>
              <div class="psn-penalty-bot"></div>
              <div class="psn-goal-top"></div>
              <div class="psn-goal-bot"></div>
              <div class="psn-corner tl"></div>
              <div class="psn-corner tr"></div>
              <div class="psn-corner bl"></div>
              <div class="psn-corner br"></div>
            </div>
            <div class="psn-formation-label">${pitchDragState.formation}</div>

            <!-- Oyuncu Slotları -->
            ${renderSlots()}

            <!-- Taktik Canvas — sahaya overlay (pointer-events:none + z-index<slot iken sürüklemeye karışmaz) -->
            <canvas id="tactic-board-canvas"
              style="position:absolute;inset:0;width:100%;height:100%;border-radius:12px;pointer-events:none;z-index:8;touch-action:auto;">
            </canvas>
          </div>

          <!-- Taktik Toolbar (saha ile birlikte çalışır) -->
          <div class="psn-tactic-toolbar" id="psn-tactic-toolbar">
            <button class="psn-draw-toggle" id="psn-draw-toggle" onclick="tacticToggleDraw()" title="Çizim modunu aç/kapat">
              <i class="fa-solid fa-pen-nib"></i> Taktik Çiz
            </button>
            <div class="psn-tactic-tools" id="psn-tactic-tools" style="display:none;">
              <button class="tactic-tool-btn active" id="tbtool-pen" onclick="tacticSetTool('pen')" title="Kalem">✏️</button>
              <button class="tactic-tool-btn" id="tbtool-arrow" onclick="tacticSetTool('arrow')" title="Ok">➡️</button>
              <input type="color" id="tactic-color" value="#00ff88" title="Renk"
                style="width:26px;height:26px;border:none;background:none;cursor:pointer;border-radius:4px;padding:0;">
              <button class="tactic-tool-btn" onclick="tacticUndo()" title="Geri Al">↩️</button>
              <button class="tactic-tool-btn" onclick="tacticClear()" title="Temizle" style="color:#ff5555;">🗑️</button>
            </div>
          </div>

          <button class="psn-save-btn" onclick="savePitchAndShowToast()">
            <i class="fa-solid fa-floppy-disk"></i> Düzeni Kaydet
          </button>
        </div>

        <!-- Sağ: Yedek Kulübesi -->
        <div class="glass-card psn-bench-card">
          <div class="psn-section-title">
            <i class="fa-solid fa-chair" style="color:#888"></i> YEDEK KULÜBESİ
          </div>
          <div class="psn-bench-list" id="psn-bench">
            ${renderBench()}
          </div>
        </div>

      </div>

    </div>`;

    // refreshPitchUI override — yeni sistemle güncelle
    window.refreshPitchUI = function() {
        const slotsContainer = document.getElementById('psn-pitch');
        if (slotsContainer) {
            document.querySelectorAll('.pitch-slot-new').forEach(el => el.remove());
            slotsContainer.insertAdjacentHTML('beforeend', renderSlots());
        }
        const bench = document.getElementById('psn-bench');
        if (bench) bench.innerHTML = renderBench();
        const lbl = slotsContainer?.querySelector('.psn-formation-label');
        if (lbl) lbl.textContent = pitchDragState.formation;
    };

    // ── Tıklama delegasyonu: draggable="true" çakışmasını önlemek için onclick YEK olarak burada ──
    requestAnimationFrame(() => {
        // Saha slotları — pitch container'ına tek listener
        const pitchEl = document.getElementById('psn-pitch');
        if (pitchEl) {
            pitchEl.addEventListener('click', function(e) {
                if (_tacticDrawMode) return;
                const slot = e.target.closest('.pitch-slot-new');
                if (!slot) return;
                const posId = slot.dataset.posId;
                const assignedId = pitchDragState.assignments[posId] || '';
                window._pitchSelect('slot', assignedId, posId);
            });
        }
        // Yedek kulübesi — bench container'ına tek listener
        const benchEl = document.getElementById('psn-bench');
        if (benchEl) {
            benchEl.addEventListener('click', function(e) {
                const chip = e.target.closest('.psn-bench-chip');
                if (!chip) return;
                const pid = chip.dataset.playerId;
                if (pid) window._pitchSelect('bench', pid);
            });
        }
        // Taktik tahtasını başlat
        initTacticBoard();
    });

    } catch(e) {
        c.innerHTML = `<div style="padding:2rem;color:#ff5555;background:#222;border-radius:10px;"><b>Saha Sekmesi Hatası:</b> ${e.message}<br>${e.stack}</div>`;
        console.error("renderSahaTab Error:", e);
    }
};

// ──────────────────────────────────────────────────────
// TAKTİK TAHTASI — Canvas çizim motoru
// ──────────────────────────────────────────────────────
let _tacticCtx = null;
let _tacticTool = 'pen';
let _tacticColor = '#00ff88';
let _tacticDrawing = false;
let _tacticStart = null;
let _tacticStrokes = []; // { type, color, points/start/end/text }
let _tacticUndoStack = [];

function _tacticKey() {
    return 'ss_tactic_' + (window._tmState?.team?.id || 'default');
}

function _tacticSave() {
    try { localStorage.setItem(_tacticKey(), JSON.stringify(_tacticStrokes)); } catch(_) {}
}

function _tacticLoad() {
    try { return JSON.parse(localStorage.getItem(_tacticKey()) || '[]'); } catch(_) { return []; }
}

function _tacticRedraw() {
    if (!_tacticCtx) return;
    const canvas = _tacticCtx.canvas;
    _tacticCtx.clearRect(0, 0, canvas.width, canvas.height);
    _tacticStrokes.forEach(s => _tacticDrawStroke(s));
}

function _tacticDrawStroke(s) {
    const ctx = _tacticCtx;
    ctx.save();
    ctx.strokeStyle = s.color || '#00ff88';
    ctx.fillStyle   = s.color || '#00ff88';
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    if (s.type === 'pen' && s.points?.length > 1) {
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        s.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
    } else if (s.type === 'arrow' && s.start && s.end) {
        const { x: x1, y: y1 } = s.start;
        const { x: x2, y: y2 } = s.end;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        // Arrow head
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLen = 12;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLen * Math.cos(angle - 0.4), y2 - headLen * Math.sin(angle - 0.4));
        ctx.lineTo(x2 - headLen * Math.cos(angle + 0.4), y2 - headLen * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fill();
    } else if (s.type === 'text' && s.text) {
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(s.text, s.x, s.y);
    }
    ctx.restore();
}

function _tacticGetPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
        x: (src.clientX - rect.left) * scaleX,
        y: (src.clientY - rect.top)  * scaleY
    };
}

function initTacticBoard() {
    const canvas = document.getElementById('tactic-board-canvas');
    if (!canvas) return;

    // Canvas pitch div boyutuna göre ayarla
    const pitch = document.getElementById('psn-pitch');
    const rect  = pitch ? pitch.getBoundingClientRect() : canvas.getBoundingClientRect();
    canvas.width  = rect.width  || 600;
    canvas.height = rect.height || 300;

    _tacticCtx = canvas.getContext('2d');
    _tacticStrokes = _tacticLoad();
    _tacticRedraw();

    // isCA kontrolünü kaldır — event listener her zaman ekle,
    // drawing mode sadece buton tıklamasıyla açılır (tacticToggleDraw)

    let currentStroke = null;

    const startDraw = (e) => {
        e.preventDefault();
        _tacticDrawing = true;
        const pos = _tacticGetPos(e, canvas);
        _tacticStart = pos;
        if (_tacticTool === 'text') {
            const txt = prompt('Not girin:');
            if (txt) {
                _tacticStrokes.push({ type: 'text', color: _tacticColor, text: txt, x: pos.x, y: pos.y });
                _tacticRedraw();
                _tacticSave();
            }
            _tacticDrawing = false;
            return;
        }
        currentStroke = { type: _tacticTool, color: _tacticColor, points: [pos], start: pos };
    };

    const moveDraw = (e) => {
        if (!_tacticDrawing || !currentStroke) return;
        e.preventDefault();
        const pos = _tacticGetPos(e, canvas);
        if (_tacticTool === 'pen') {
            currentStroke.points.push(pos);
            _tacticRedraw();
            _tacticDrawStroke(currentStroke);
        } else if (_tacticTool === 'arrow') {
            _tacticRedraw();
            _tacticDrawStroke({ ...currentStroke, end: pos });
        }
    };

    const endDraw = (e) => {
        if (!_tacticDrawing || !currentStroke) return;
        e.preventDefault();
        _tacticDrawing = false;
        const pos = e.changedTouches
            ? { x: (e.changedTouches[0].clientX - canvas.getBoundingClientRect().left) * (canvas.width / canvas.getBoundingClientRect().width),
                y: (e.changedTouches[0].clientY - canvas.getBoundingClientRect().top)  * (canvas.height / canvas.getBoundingClientRect().height) }
            : _tacticGetPos(e, canvas);
        if (_tacticTool === 'arrow') currentStroke.end = pos;
        _tacticStrokes.push(currentStroke);
        _tacticRedraw();
        _tacticSave();
        currentStroke = null;
    };

    canvas.addEventListener('mousedown',  startDraw);
    canvas.addEventListener('mousemove',  moveDraw);
    canvas.addEventListener('mouseup',    endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove',  moveDraw,  { passive: false });
    canvas.addEventListener('touchend',   endDraw,   { passive: false });
}

window.tacticSetTool = function(tool) {
    _tacticTool = tool;
    document.querySelectorAll('.tactic-tool-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('tbtool-' + tool);
    if (btn) btn.classList.add('active');
};

window.tacticSetColor = function(color) { _tacticColor = color; };

window.tacticUndo = function() {
    if (_tacticStrokes.length === 0) return;
    _tacticStrokes.pop();
    _tacticRedraw();
    _tacticSave();
};

window.tacticClear = function() {
    if (!confirm('Tüm çizimler silinsin mi?')) return;
    _tacticStrokes = [];
    _tacticRedraw();
    _tacticSave();
};

let _tacticDrawMode = false;

window.tacticToggleDraw = function() {
    _tacticDrawMode = !_tacticDrawMode;
    const canvas  = document.getElementById('tactic-board-canvas');
    const toggle  = document.getElementById('psn-draw-toggle');
    const tools   = document.getElementById('psn-tactic-tools');
    if (!canvas) return;

    if (_tacticDrawMode) {
        canvas.style.pointerEvents = 'all';
        canvas.style.zIndex = '25';
        canvas.style.touchAction = 'none';
        canvas.style.cursor = 'crosshair';
        if (toggle) {
            toggle.style.background = 'rgba(0,229,255,0.2)';
            toggle.style.borderColor = 'var(--neon-cyan)';
            toggle.style.color = 'var(--neon-cyan)';
            toggle.innerHTML = '<i class="fa-solid fa-hand"></i> Oyuncu Düzenle';
        }
        if (tools) tools.style.display = 'flex';
        // Canvas boyutunu saha ile eşleştir
        const pitch = document.getElementById('psn-pitch');
        if (pitch) {
            const r = pitch.getBoundingClientRect();
            canvas.width  = r.width;
            canvas.height = r.height;
            _tacticRedraw();
        }
    } else {
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '8';
        canvas.style.touchAction = 'auto';
        canvas.style.cursor = 'default';
        if (toggle) {
            toggle.style.background = '';
            toggle.style.borderColor = '';
            toggle.style.color = '';
            toggle.innerHTML = '<i class="fa-solid fa-pen-nib"></i> Taktik Çiz';
        }
        if (tools) tools.style.display = 'none';
    }
};

// ──────────────────────────────────────────────────────

// Yeni auto-fill (Supabase üyelerini destekler)
window.psn_autoFill = function() {
    const formation = FORMATIONS_7V7[pitchDragState.formation];
    if (!formation) return;

    const getMembers = () => {
        if (window._tmState && _tmState.members && _tmState.members.length) {
            return _tmState.members.map(m => {
                if (!m.player && m.guest_name) {
                    return {
                        id: 'guest_' + m.id,
                        _isGuest: true,
                        username: m.guest_name,
                        name: m.guest_name,
                        position: m.guest_position || 'OS',
                        ana_mevki: m.guest_position || 'OS',
                        gen_score: null,
                        details: { pos: m.guest_position || 'OS' }
                    };
                }
                return m.player || null;
            }).filter(Boolean);
        }
        return typeof getTeamPlayers === 'function' ? getTeamPlayers() : [];
    };

    const getGenFn = (p) => {
        if (!p) return 70;
        if (p.rating_teknik !== undefined) {
            const vals = [p.rating_teknik, p.rating_sut, p.rating_pas,
                          p.rating_hiz, p.rating_fizik, p.rating_kondisyon].map(v => v || 70);
            return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        }
        return typeof calcPlayerGEN === 'function' ? calcPlayerGEN(p) : 70;
    };

    const teamPlayers = getMembers();
    const sorted = [...teamPlayers].sort((a, b) => getGenFn(b) - getGenFn(a));
    pitchDragState.assignments = {};

    // Mevki eşleştirme — merkezi normalizer kullan
    const mapPos = (p) => {
        const pos = p.ana_mevki || p.position || (p.details && (p.details.anaMevki || p.details.pos)) || 'OS';
        return window._normalizePosKey(pos);
    };

    const byPos = { KL: [], DEF: [], OS: [], FV: [] };
    sorted.forEach(p => { byPos[mapPos(p)].push(p.id || p.supabase_id); });

    const newAssignments = {};

    // 1. Geçiş: Her oyuncuyu kendi mevkisine ata
    formation.positions.forEach(pos => {
        const group = byPos[pos.pos];
        if (!group || group.length === 0) return;
        const available = group.find(id => !Object.values(newAssignments).includes(id));
        if (available) newAssignments[pos.id] = available;
    });

    // 2. Geçiş: Eşleşemeyen oyuncuları kalan boş slotlara koy (GEN sırasına göre)
    const assignedIds = new Set(Object.values(newAssignments));
    const leftover = sorted.filter(p => !assignedIds.has(p.id || p.supabase_id));
    const emptySlots = formation.positions.filter(pos => !newAssignments[pos.id]);
    leftover.forEach((p, i) => {
        if (emptySlots[i]) newAssignments[emptySlots[i].id] = p.id || p.supabase_id;
    });

    pitchDragState.assignments = newAssignments;

    savePitchState();
    // window.refreshPitchUI: renderSahaTab tarafından set edilen yeni versiyonu çağır
    if (typeof window.refreshPitchUI === 'function') window.refreshPitchUI();
    else if (typeof renderSahaTab === 'function') renderSahaTab();
    if (typeof showToast === 'function') showToast('⚡ Formasyon otomatik dolduruldu!');
};

    // Eski Saha Renderı tamamen kaldırıldı
    // Yeni FIFA/PES tarzı Saha üst kısımda (renderSahaTab içinde) bulunmaktadır.

function renderBenchPlayers() {
    const assigned = Object.values(pitchDragState.assignments);
    const bench = getTeamPlayers().filter(p => !assigned.includes(p.id));
    if (bench.length === 0) return `<div class="empty-state-sm">Tüm oyuncular sahaya sürüklendi!</div>`;

    return bench.map(p => {
        const gen = calcPlayerGEN(p);
        const pInfo = _getPInfo(p);
        return `
        <div class="bench-player-chip" draggable="true"
             id="bench-${pInfo.id}"
             data-player-id="${pInfo.id}"
             ondragstart="startDragFromBench(event, '${pInfo.id}')">
            <img src="${pInfo.avatar}" class="bench-avatar">
            <div class="bench-info">
                <span class="bench-name">${pInfo.name}</span>
                <span class="bench-pos" style="color:${pInfo.col};">${pInfo.pos}</span>
            </div>
            <span class="bench-gen" style="color:${gen>=80?'var(--neon-green)':'orange'}">${gen != null ? gen : '—'}</span>
        </div>`;
    }).join('');
}

function setupPitchDragDrop() {
    // Setup is handled inline via HTML ondragstart/ondrop events
}

window.startDragFromBench = function(event, playerId) {
    event.dataTransfer.setData('playerId', playerId);
    event.dataTransfer.setData('source', 'bench');
};

window.startDragFromSlot = function(event, posId, playerId) {
    event.dataTransfer.setData('playerId', playerId);
    event.dataTransfer.setData('source', 'slot');
    event.dataTransfer.setData('sourcePosId', posId);
};

window.dropOnSlot = function(event, targetPosId) {
    event.preventDefault();
    const slot = document.querySelector(`[data-pos-id="${targetPosId}"]`);
    if (slot) slot.classList.remove('drag-over-new');

    const playerId = event.dataTransfer.getData('playerId');
    const source = event.dataTransfer.getData('source');
    const sourcePosId = event.dataTransfer.getData('sourcePosId');

    if (!playerId) return;

    // If slot already has a player, swap
    const currentInTarget = pitchDragState.assignments[targetPosId];
    if (source === 'slot' && sourcePosId) {
        // Swap
        pitchDragState.assignments[sourcePosId] = currentInTarget || null;
        if (!currentInTarget) delete pitchDragState.assignments[sourcePosId];
    }
    pitchDragState.assignments[targetPosId] = playerId;

    savePitchState();
    refreshPitchUI();
};

function refreshPitchUI() {
    const pitchField = document.getElementById('pitch-field');
    if (!pitchField) return;

    // Re-render positions only
    const markings = pitchField.querySelector('.pitch-markings');
    const formLabel = pitchField.querySelector('.formation-label-overlay');
    pitchField.innerHTML = '';
    if (markings) pitchField.appendChild(markings);
    if (formLabel) pitchField.appendChild(formLabel);
    else {
        const lbl = document.createElement('div');
        lbl.className = 'formation-label-overlay';
        lbl.textContent = pitchDragState.formation;
        pitchField.appendChild(lbl);
    }

    pitchField.insertAdjacentHTML('beforeend', renderPitchPositions());

    // Re-render bench
    const bench = document.getElementById('bench-players');
    if (bench) bench.innerHTML = renderBenchPlayers();
};

window.selectFormation = function(key) {
    pitchDragState.formation = key;
    pitchDragState.assignments = {};
    pitchDragState.customPositions = {};
    savePitchState();
    renderSahaTab();
};

window.autoFillFormation = function() {
    const formation = FORMATIONS_7V7[pitchDragState.formation];
    if (!formation) return;

    const teamPlayers = getTeamPlayers();
    const sorted = [...teamPlayers].sort((a, b) => calcPlayerGEN(b) - calcPlayerGEN(a));

    pitchDragState.assignments = {};

    // Smart fill: match positions
    const posGroups = { KL: [], DEF: [], OS: [], FV: [] };
    sorted.forEach(p => {
        const pos = (p.details && p.details.pos) || 'OS';
        if (posGroups[pos]) posGroups[pos].push(p.id);
    });

    formation.positions.forEach(pos => {
        const group = posGroups[pos.pos];
        if (group && group.length > 0) {
            // Find one that's not already assigned
            const available = group.find(id => !Object.values(pitchDragState.assignments).includes(id));
            if (available) {
                pitchDragState.assignments[pos.id] = available;
                return;
            }
        }
        // Fallback: use any unassigned player
        const anyPlayer = sorted.find(p => !Object.values(pitchDragState.assignments).includes(p.id));
        if (anyPlayer) pitchDragState.assignments[pos.id] = anyPlayer.id;
    });

    savePitchState();
    refreshPitchUI();
    showToast('⚡ Formasyon otomatik dolduruldu!');
};

window.clearPitchAssignments = function() {
    pitchDragState.assignments = {};
    savePitchState();
    refreshPitchUI();
};

window.savePitchAndShowToast = async function() {
    savePitchState();
    showToast('💾 Kaydediliyor…');
    await savePitchToSupabase();
    showToast(`✅ Düzen ${currentPitchSlot.replace('slot','')} kaydedildi!`);
    // Slot butonlarını güncelle
    document.querySelectorAll('.psn-slot-btn').forEach(b => {
        const s = b.dataset.slot;
        b.classList.toggle('active', s === currentPitchSlot);
        b.querySelector('.slot-saved-dot')?.classList.toggle('visible', !!pitchSlots[s]);
    });
};


// ──────────────────────────────────────────────────────
// FAZ 4: DENGELİ TAKIM OLUŞTURMA ALGORİTMASI
// ──────────────────────────────────────────────────────

window._externalPoolPlayers = window._externalPoolPlayers || [];
window._extSearchResults    = window._extSearchResults    || [];

window.renderTakimOlusturTab = function() {
    const c = document.getElementById('ttab-olustur-content');
    const t = window._tmState?.team;
    if (!c || !t) return;

    const teamPlayers  = getTeamPlayers();
    const teamIds      = new Set(teamPlayers.map(p => p.id));
    const externalOnly = (window._externalPoolPlayers || []).filter(p => !teamIds.has(p.id));
    window._allPoolPlayers = [...teamPlayers, ...externalOnly];

    const coreSquad  = JSON.parse(localStorage.getItem('ss_core_' + t.id) || '[]');
    const savedTeams = JSON.parse(localStorage.getItem('ss_balanced_teams') || 'null');

    const renderPoolItem = (p, isExternal) => {
        const pInfo     = _getPInfo(p);
        const gen       = calcPlayerGEN(p);
        const manAssign = (window._manualAssignments || {})[String(pInfo.id)] || 'auto';
        const teamColor = manAssign === 'A' ? 'rgba(0,255,136,0.15)' : manAssign === 'B' ? 'rgba(0,229,255,0.15)' : 'transparent';
        const teamBorder = manAssign === 'A' ? 'rgba(0,255,136,0.4)' : manAssign === 'B' ? 'rgba(0,229,255,0.4)' : 'rgba(255,255,255,0.07)';
        return `
        <div id="pool-item-${pInfo.id}"
             style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.6rem;
                    background:${teamColor};border:1px solid ${teamBorder};
                    border-radius:8px;transition:all 0.2s;">
            <img src="${pInfo.avatar}" style="width:30px;height:30px;border-radius:50%;flex-shrink:0;">
            <div style="flex:1;min-width:0;">
                <div style="font-size:0.82rem;font-weight:600;color:#e0e0e0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                    ${pInfo.name}${isExternal ? ' <span style="font-size:0.6rem;color:#ff6b35;border:1px solid rgba(255,107,53,0.4);border-radius:3px;padding:0 3px;">Dış</span>' : ''}
                </div>
                <div style="font-size:0.7rem;color:${pInfo.col};">${pInfo.pos} ${gen != null ? '· <span style="color:#ffd700;">'+gen+'</span>' : ''}</div>
            </div>
            <div style="display:flex;gap:3px;flex-shrink:0;">
                <button class="pab ${manAssign==='A'?'pab-a':''}" onclick="_setManualTeam('${pInfo.id}','A')" title="A Takımına Sabitle">A</button>
                <button class="pab ${manAssign==='B'?'pab-b':''}" onclick="_setManualTeam('${pInfo.id}','B')" title="B Takımına Sabitle">B</button>
                <button class="pab ${manAssign==='auto'?'pab-auto':''}" onclick="_setManualTeam('${pInfo.id}','auto')" title="Otomatik Dağıt">Oto</button>
            </div>
            ${isExternal ? `<button onclick="_tmRemoveExternal('${pInfo.id}')" title="Havuzdan Çıkar"
                style="background:rgba(255,0,127,0.15);border:none;color:#ff007f;border-radius:4px;width:20px;height:20px;font-size:0.6rem;cursor:pointer;flex-shrink:0;">
                <i class="fa-solid fa-xmark"></i></button>` : ''}
        </div>`;
    };

    // Anlık takım önizlemesi — manuel atamalar
    const manualA = window._allPoolPlayers.filter(p => (window._manualAssignments||{})[p.id||p.supabase_id] === 'A');
    const manualB = window._allPoolPlayers.filter(p => (window._manualAssignments||{})[p.id||p.supabase_id] === 'B');
    const autoPlayers = window._allPoolPlayers.filter(p => !['A','B'].includes((window._manualAssignments||{})[p.id||p.supabase_id]));

    const renderLivePreviewPlayer = (p) => {
        const pInfo = _getPInfo(p);
        const gen   = calcPlayerGEN(p);
        return `<div style="display:flex;align-items:center;gap:0.4rem;padding:0.3rem 0;border-bottom:1px solid rgba(255,255,255,0.04);">
            <img src="${pInfo.avatar}" style="width:22px;height:22px;border-radius:50%;">
            <span style="flex:1;font-size:0.8rem;color:#ddd;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${pInfo.name}</span>
            <span style="font-size:0.7rem;color:${pInfo.col};">${pInfo.pos}</span>
            <span style="font-size:0.72rem;color:#ffd700;min-width:20px;text-align:right;">${gen != null ? gen : '—'}</span>
        </div>`;
    };

    c.innerHTML = `
        <div class="olustur-tab-wrapper">
            <div class="glass-card olustur-config-card">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.2rem;">
                    <div class="section-label-pill" style="margin-bottom:0;">
                        <i class="fa-solid fa-scale-balanced" style="color:var(--neon-cyan);"></i>
                        ADİL DAĞITIM OLUŞTURUCU
                    </div>
                    <button onclick="resetBalancedTeams()" style="background:rgba(255,0,127,0.12);border:1px solid rgba(255,0,127,0.3);color:#ff007f;border-radius:8px;padding:0.3rem 0.8rem;font-size:0.78rem;cursor:pointer;">
                        <i class="fa-solid fa-rotate-left"></i> Sıfırla
                    </button>
                </div>
                <p style="color:#888; font-size:0.85rem; margin-bottom:1.2rem;">
                    A/B butonlarıyla oyuncuları sabit bir takıma sabitle. Oto olanlar "ADİL DAĞITIM" ile otomatik dağıtılır.
                </p>

                <!-- OYUNCU HAVUZU -->
                <div style="font-size:0.75rem;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.5rem;">
                    <i class="fa-solid fa-people-group" style="color:var(--neon-green);"></i>
                    OYUNCU HAVUZU (${window._allPoolPlayers.length} oyuncu)
                </div>
                <div style="display:flex;flex-direction:column;gap:0.4rem;margin-bottom:1rem;max-height:280px;overflow-y:auto;padding-right:0.2rem;">
                    ${teamPlayers.map(p => renderPoolItem(p, false)).join('')}
                    ${externalOnly.map(p => renderPoolItem(p, true)).join('')}
                    ${window._allPoolPlayers.length === 0 ? '<div style="color:#444;font-size:0.85rem;padding:1rem;text-align:center;"><i class="fa-solid fa-users-slash"></i> Takımda oyuncu yok.</div>' : ''}
                </div>

                <!-- ANLIK ÖNİZLEME -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;margin-bottom:1.2rem;">
                    <div style="background:rgba(0,255,136,0.06);border:1px solid rgba(0,255,136,0.2);border-radius:8px;padding:0.6rem;">
                        <div style="font-size:0.75rem;color:var(--neon-green);font-weight:700;margin-bottom:0.4rem;">🟢 Takım A (${manualA.length})</div>
                        ${manualA.length ? manualA.map(renderLivePreviewPlayer).join('') : '<div style="color:#444;font-size:0.75rem;text-align:center;padding:0.4rem;">Henüz atama yok</div>'}
                    </div>
                    <div style="background:rgba(0,229,255,0.06);border:1px solid rgba(0,229,255,0.2);border-radius:8px;padding:0.6rem;">
                        <div style="font-size:0.75rem;color:var(--neon-cyan);font-weight:700;margin-bottom:0.4rem;">🔵 Takım B (${manualB.length})</div>
                        ${manualB.length ? manualB.map(renderLivePreviewPlayer).join('') : '<div style="color:#444;font-size:0.75rem;text-align:center;padding:0.4rem;">Henüz atama yok</div>'}
                    </div>
                </div>
                ${autoPlayers.length ? `<div style="font-size:0.75rem;color:#666;margin-bottom:0.8rem;"><i class="fa-solid fa-shuffle" style="color:#888;"></i> Otomatik dağıtılacak: ${autoPlayers.map(p => _getPInfo(p).name).join(', ')}</div>` : ''}

                <!-- Dışarıdan Oyuncu Ekleme -->
                <div style="padding-top:0.8rem;border-top:1px solid rgba(255,255,255,0.07);margin-bottom:1rem;">
                    <div style="font-size:0.75rem;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.4rem;">
                        <i class="fa-solid fa-user-plus" style="color:var(--neon-cyan);"></i> Dışarıdan Oyuncu Ekle
                    </div>
                    <input id="pool-ext-search" class="profile-input" placeholder="Kullanıcı adı ara..."
                           style="width:100%;padding:0.45rem 0.7rem;border-radius:8px;font-size:0.85rem;"
                           oninput="_tmSearchExtForPool(this.value)">
                    <div id="pool-ext-results" style="margin-top:0.5rem;"></div>
                </div>

                <div style="display:flex;align-items:center;justify-content:flex-end;gap:0.8rem;">
                    <select id="algo-type" class="profile-select" style="max-width:200px;font-size:0.82rem;">
                        <option value="gen">GEN Dengesi (Adil)</option>
                        <option value="pos">Mevki Öncelikli</option>
                        <option value="snake">Snake Draft</option>
                    </select>
                    <button onclick="generateBalancedTeams()"
                            style="background:linear-gradient(135deg,var(--neon-green),var(--neon-cyan));color:#000;border:none;border-radius:10px;padding:0.55rem 1.4rem;font-weight:700;font-size:0.9rem;cursor:pointer;white-space:nowrap;">
                        <i class="fa-solid fa-scale-balanced"></i> ADİL DAĞITIM
                    </button>
                </div>
            </div>

            <div id="balanced-teams-result">
                ${savedTeams ? renderBalancedTeamsHTML(savedTeams.a, savedTeams.b, savedTeams.diff) : ''}
            </div>
        </div>
    `;
};

window._tmSearchExtForPool = async function(q) {
    const resultsEl = document.getElementById('pool-ext-results');
    if (!resultsEl) return;
    if (!q || q.length < 2) { resultsEl.innerHTML = ''; window._extSearchResults = []; return; }

    resultsEl.innerHTML = '<div style="color:#555;font-size:0.8rem;padding:0.3rem 0;"><i class="fa-solid fa-spinner fa-spin"></i> Aranıyor…</div>';

    try {
        const qNorm = typeof _tmNormalizeTR === 'function' ? _tmNormalizeTR(q) : q.toLowerCase();
        const orFilter = qNorm !== q.toLowerCase()
            ? `username.ilike.%${q}%,username.ilike.%${qNorm}%`
            : `username.ilike.%${q}%`;

        const { data } = await window.sbClient
            .from('profiles')
            .select('id, username, avatar_url, position, ana_mevki, gen_score, rating_teknik, rating_sut, rating_pas, rating_hiz, rating_fizik, rating_kondisyon')
            .or(orFilter)
            .limit(6);

        const existingIds = new Set((window._allPoolPlayers || []).map(p => p.id));
        window._extSearchResults = (data || []).filter(p => !existingIds.has(p.id));

        if (!window._extSearchResults.length) {
            resultsEl.innerHTML = '<div style="color:#555;font-size:0.8rem;padding:0.3rem 0;">Bulunamadı veya zaten havuzda.</div>';
            return;
        }

        resultsEl.innerHTML = window._extSearchResults.map((p, i) => {
            const gen = calcPlayerGEN(p);
            const pInfo = _getPInfo(p);
            return `<div style="display:flex;align-items:center;gap:0.5rem;padding:0.35rem 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                <img src="${pInfo.avatar}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">
                <span style="flex:1;font-size:0.85rem;">${pInfo.name}</span>
                <span style="font-size:0.75rem;color:#ffd700;">${gen} GEN</span>
                <button onclick="_tmAddExternal(${i})" class="btn-sm" style="padding:0.2rem 0.6rem;font-size:0.75rem;background:rgba(0,229,255,0.15);border:1px solid rgba(0,229,255,0.3);color:var(--neon-cyan);border-radius:6px;cursor:pointer;">
                    <i class="fa-solid fa-plus"></i> Ekle
                </button>
            </div>`;
        }).join('');
    } catch (e) {
        resultsEl.innerHTML = `<div style="color:#ff007f;font-size:0.8rem;">Hata: ${e.message}</div>`;
    }
};

window._tmAddExternal = function(idx) {
    const p = window._extSearchResults?.[idx];
    if (!p) return;
    window._externalPoolPlayers = window._externalPoolPlayers || [];
    if (!window._externalPoolPlayers.find(ep => ep.id === p.id)) {
        window._externalPoolPlayers.push(p);
    }
    renderTakimOlusturTab();
};

window._tmRemoveExternal = function(playerId) {
    window._externalPoolPlayers = (window._externalPoolPlayers || []).filter(p => p.id !== playerId);
    renderTakimOlusturTab();
};

window.selectAllPoolPlayers = function() {
    document.querySelectorAll('.pool-checkbox').forEach(cb => cb.checked = true);
};

window.resetBalancedTeams = function() {
    window._manualAssignments = {};
    localStorage.removeItem('ss_balanced_teams');
    renderTakimOlusturTab();
    showToast('Takımlar sıfırlandı.');
};

window._setManualTeam = function(playerId, team) {
    if (!window._manualAssignments) window._manualAssignments = {};
    window._manualAssignments[String(playerId)] = team;
    // Canlı önizleme için tab'ı yeniden render et
    renderTakimOlusturTab();
};

window.generateBalancedTeams = function() {
    const pool = window._allPoolPlayers || [];
    if (pool.length < 2) { showToast('En az 2 oyuncu gerekli!'); return; }

    const assigns = window._manualAssignments || {};
    const pid = (p) => String(p.id || p.supabase_id || '');

    // Kaptan elle atananlar ve otomatik havuz
    const manualA  = pool.filter(p => assigns[pid(p)] === 'A');
    const manualB  = pool.filter(p => assigns[pid(p)] === 'B');
    const autoPool = pool.filter(p => !['A','B'].includes(assigns[pid(p)]));

    let teamA = [...manualA];
    let teamB = [...manualB];

    // GEN null-safe getter — puan yoksa 0 kullan (dağıtım için)
    const safeGen = (p) => calcPlayerGEN(p) ?? 0;

    // Otomatik oyuncuları GEN dengesine göre dağıt
    const sorted = [...autoPool].sort((a, b) => safeGen(b) - safeGen(a));
    sorted.forEach(p => {
        const sumA = teamA.reduce((s, x) => s + safeGen(x), 0);
        const sumB = teamB.reduce((s, x) => s + safeGen(x), 0);
        // Eşit GEN'de: daha küçük takıma at (sıralı dağılım için)
        if (sumA < sumB) teamA.push(p);
        else if (sumB < sumA) teamB.push(p);
        else if (teamA.length <= teamB.length) teamA.push(p);
        else teamB.push(p);
    });

    // Greedy swap sadece otomatik oyuncular arasında
    const autoIds = new Set(autoPool.map(p => pid(p)));
    for (let iter = 0; iter < 20; iter++) {
        const sumA = teamA.reduce((s, p) => s + safeGen(p), 0);
        const sumB = teamB.reduce((s, p) => s + safeGen(p), 0);
        if (Math.abs(sumA - sumB) < 2) break;
        let bestSwap = null, bestDiff = Math.abs(sumA - sumB);
        teamA.forEach((pa, ia) => {
            if (!autoIds.has(pid(pa))) return;
            teamB.forEach((pb, ib) => {
                if (!autoIds.has(pid(pb))) return;
                const d = Math.abs((sumA - safeGen(pa) + safeGen(pb)) - (sumB - safeGen(pb) + safeGen(pa)));
                if (d < bestDiff) { bestDiff = d; bestSwap = { ia, ib }; }
            });
        });
        if (bestSwap) {
            const tmp = teamA[bestSwap.ia];
            teamA[bestSwap.ia] = teamB[bestSwap.ib];
            teamB[bestSwap.ib] = tmp;
        } else break;
    }

    const genA = teamA.length ? Math.round(teamA.reduce((s, p) => s + safeGen(p), 0) / teamA.length) : 0;
    const genB = teamB.length ? Math.round(teamB.reduce((s, p) => s + safeGen(p), 0) / teamB.length) : 0;
    const diff = Math.abs(genA - genB);

    localStorage.setItem('ss_balanced_teams', JSON.stringify({ a: teamA.map(p => p.id), b: teamB.map(p => p.id), diff }));
    document.getElementById('balanced-teams-result').innerHTML = renderBalancedTeamsHTML(teamA.map(p => p.id), teamB.map(p => p.id), diff);
    showToast('⚡ Dengeli takımlar oluşturuldu!');
};

function renderBalancedTeamsHTML(aIds, bIds, diff) {
    const allPool = window._allPoolPlayers || [];
    const teamA = allPool.filter(p => aIds.includes(p.id));
    const teamB = allPool.filter(p => bIds.includes(p.id));
    const _sg = (p) => calcPlayerGEN(p) ?? 0;
    const genA = teamA.length ? Math.round(teamA.reduce((s, p) => s + _sg(p), 0) / teamA.length) : 0;
    const genB = teamB.length ? Math.round(teamB.reduce((s, p) => s + _sg(p), 0) / teamB.length) : 0;

    const renderTeamCol = (team, name, genAvg, color) => `
        <div class="balanced-team-col glass-card" style="border-color:${color}33;">
            <div class="bal-team-header" style="border-bottom:1px solid ${color}44; margin-bottom:1rem;">
                <span class="bal-team-name" style="color:${color};">${name}</span>
                <span class="bal-gen-badge" style="border-color:${color}; color:${color};">${genAvg > 0 ? genAvg + ' GEN' : '— GEN'}</span>
            </div>
            ${team.map(p => {
                const pInfo = _getPInfo(p);
                const gen   = calcPlayerGEN(p);
                return `
                <div class="bal-player-row">
                    <img src="${pInfo.avatar}" class="bal-avatar">
                    <div class="bal-player-info">
                        <span class="bal-player-name">${pInfo.name}</span>
                        <span style="color:${pInfo.col}; font-size:0.75rem;">${pInfo.pos}</span>
                    </div>
                    <span class="bal-player-gen" style="color:${gen!=null&&gen>=80?'var(--neon-green)':'#ffd700'}">${gen != null ? gen : '—'}</span>
                </div>`;
            }).join('')}
        </div>`;

    return `
        <div class="glass-card balanced-result-card">
            <div class="bal-result-header">
                <i class="fa-solid fa-scale-balanced" style="color:var(--neon-green);"></i>
                <span>GEN FARKI: <b style="color:${diff<=3?'var(--neon-green)':diff<=8?'#ffd700':'#ff007f'}">${diff}</b> 
                    ${diff<=3?'— Mükemmel Denge!':diff<=8?'— Kabul Edilebilir':'— Dengesiz'}</span>
            </div>
            <div class="balanced-teams-grid">
                ${renderTeamCol(teamA, '🟢 Takım A', genA, '#00ff88')}
                <div class="vs-divider">VS</div>
                ${renderTeamCol(teamB, '🔵 Takım B', genB, '#00e5ff')}
            </div>
        </div>`;
}


// ──────────────────────────────────────────────────────
// FAZ 5: SİNERJİ MATRİSİ
// ──────────────────────────────────────────────────────

window.renderSinerjiTab = function() {
    const c = document.getElementById('ttab-sinerji-content');
    const t = window._tmState?.team;
    if (!c || !t) return;

    const teamPlayers = getTeamPlayers();
    const top = teamPlayers.slice(0, 8); // max 8 for readability

    // Sinerji skoru: benzer oyun tarzı, dakiklik uyumu, iletişim
    function sinerjiScore(p1, p2) {
        let score = 0;
        // Oyun tarzı benzerliği
        if (p1.details.oyunTarzi === p2.details.oyunTarzi) score += 20;
        // Dakiklik uyumu
        const dakikMap = { '15 dk Önce Sahada': 3, 'Son Dakika Yetişir': 2, 'Maç Başlarken Bağlar': 1 };
        if (Math.abs((dakikMap[p1.details.dakiklik]||2) - (dakikMap[p2.details.dakiklik]||2)) <= 1) score += 15;
        // Saha iletişimi uyumu
        if (p1.details.sahaIletisim === p2.details.sahaIletisim) score += 15;
        // Pas tercihi uyumu
        if (p1.details.pasTercihi === p2.details.pasTercihi) score += 10;
        // Mevki tamamlayıcılığı (farklı mevkiler daha iyi)
        if (p1.details.pos !== p2.details.pos) score += 15;
        // GEN yakınlığı (benzer güç = iyi sinerji)
        const genDiff = Math.abs(calcPlayerGEN(p1) - calcPlayerGEN(p2));
        if (genDiff <= 5) score += 20;
        else if (genDiff <= 10) score += 10;
        else if (genDiff <= 20) score += 5;
        // Maç sonu uyumu
        if (p1.details.macSonu === p2.details.macSonu) score += 5;
        return Math.min(score, 100);
    }

    function sinerjiColor(score) {
        if (score >= 75) return '#00ff88';
        if (score >= 55) return '#00e5ff';
        if (score >= 35) return '#ffd700';
        return '#ff007f';
    }

    // Best pairs
    const pairs = [];
    for (let i = 0; i < top.length; i++) {
        for (let j = i + 1; j < top.length; j++) {
            pairs.push({ p1: top[i], p2: top[j], score: sinerjiScore(top[i], top[j]) });
        }
    }
    pairs.sort((a, b) => b.score - a.score);
    const bestPairs = pairs.slice(0, 5);
    const worstPairs = pairs.slice(-3).reverse();

    c.innerHTML = `
        <div class="sinerji-tab-wrapper">

            <!-- Matrix -->
            <div class="glass-card sinerji-matrix-card">
                <div class="section-label-pill" style="margin-bottom:1.2rem;">
                    <i class="fa-solid fa-link" style="color:var(--neon-cyan);"></i>
                    SİNERJİ MATRİSİ
                </div>
                <p style="color:#888; font-size:0.85rem; margin-bottom:1rem;">
                    Oyuncu çiftleri arasındaki uyum skoru (oyun tarzı, dakiklik, mevki, GEN yakınlığı)
                </p>
                <div class="sinerji-matrix-scroll">
                    <table class="sinerji-table">
                        <thead>
                            <tr>
                                <th></th>
                                ${top.map(p => `<th class="sinerji-th"><span>${p.name.split(' ')[0]}</span></th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${top.map(p1 => `
                            <tr>
                                <td class="sinerji-row-label">${p1.name.split(' ')[0]}</td>
                                ${top.map(p2 => {
                                    if (p1.id === p2.id) return `<td class="sinerji-cell self-cell">—</td>`;
                                    const s = sinerjiScore(p1, p2);
                                    const col = sinerjiColor(s);
                                    return `<td class="sinerji-cell" style="color:${col}; background:${col}22;" title="${p1.name} ↔ ${p2.name}: ${s}/100">${s}</td>`;
                                }).join('')}
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="sinerji-legend">
                    <span style="color:#00ff88;">■ 75+ Mükemmel</span>
                    <span style="color:#00e5ff;">■ 55–74 İyi</span>
                    <span style="color:#ffd700;">■ 35–54 Orta</span>
                    <span style="color:#ff007f;">■ 0–34 Zayıf</span>
                </div>
            </div>

            <!-- Best Pairs -->
            <div class="sinerji-pairs-grid">
                <div class="glass-card sinerji-best-card">
                    <div class="section-label-pill" style="margin-bottom:1rem; background:rgba(0,255,136,0.1); border-color:rgba(0,255,136,0.3);">
                        <i class="fa-solid fa-handshake" style="color:var(--neon-green);"></i>
                        EN İYİ İKİLİLER
                    </div>
                    ${bestPairs.map(pair => `
                    <div class="pair-row">
                        <div class="pair-players">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${pair.p1.name}" class="pair-avatar">
                            <span class="pair-names">${pair.p1.name.split(' ')[0]} & ${pair.p2.name.split(' ')[0]}</span>
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${pair.p2.name}" class="pair-avatar">
                        </div>
                        <div class="pair-score-bar">
                            <div class="pair-bar-fill" style="width:${pair.score}%; background:${sinerjiColor(pair.score)};"></div>
                        </div>
                        <span class="pair-score-val" style="color:${sinerjiColor(pair.score)}">${pair.score}/100</span>
                    </div>`).join('')}
                </div>

                <div class="glass-card sinerji-worst-card">
                    <div class="section-label-pill" style="margin-bottom:1rem; background:rgba(255,0,127,0.1); border-color:rgba(255,0,127,0.3);">
                        <i class="fa-solid fa-user-slash" style="color:#ff007f;"></i>
                        GELİŞTİRİLMESİ GEREKEN
                    </div>
                    ${worstPairs.map(pair => `
                    <div class="pair-row">
                        <div class="pair-players">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${pair.p1.name}" class="pair-avatar">
                            <span class="pair-names">${pair.p1.name.split(' ')[0]} & ${pair.p2.name.split(' ')[0]}</span>
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${pair.p2.name}" class="pair-avatar">
                        </div>
                        <div class="pair-score-bar">
                            <div class="pair-bar-fill" style="width:${pair.score}%; background:${sinerjiColor(pair.score)};"></div>
                        </div>
                        <span class="pair-score-val" style="color:${sinerjiColor(pair.score)}">${pair.score}/100</span>
                    </div>`).join('')}
                </div>
            </div>

        </div>
    `;
};


// ──────────────────────────────────────────────────────
// FAZ 6: RAKİPLER
// ──────────────────────────────────────────────────────

window.renderRakiplerTab = async function(activeFilter) {
    const c = document.getElementById('ttab-rakipler-content');
    const t = window._tmState?.team;
    if (!c || !t) return;

    activeFilter = activeFilter || 'all';
    const myGen = calcTeamGEN();
    const stats = window._tmState?.computedStats;
    const favs = JSON.parse(localStorage.getItem('ss_fav_rivals') || '[]');
    const savedH2H = JSON.parse(localStorage.getItem('ss_h2h') || '{}');

    c.innerHTML = `<div style="color:#666;padding:2rem;text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i> Rakipler yükleniyor...</div>`;

    const allTeams = await DB.Teams.getAll(100);
    const rivals = allTeams.filter(r => r.id !== t.id);
    const displayed = activeFilter === 'favs' ? rivals.filter(r => favs.includes(r.id)) : rivals;

    const rivalCards = displayed.map(rival => {
        const rivalGen = rival.captain?.gen_score ?? rival.gen_score ?? '—';
        const memberCount = rival.team_members?.[0]?.count ?? 0;
        const color = rival.color || '#00e5ff';
        const isFav = favs.includes(rival.id);
        const h2h = savedH2H[rival.id] || { w: 0, d: 0, l: 0 };
        const totalH2H = h2h.w + h2h.d + h2h.l;
        const genDiff = typeof rivalGen === 'number' ? myGen - rivalGen : null;
        const logoHtml = rival.logo_url
            ? `<img src="${rival.logo_url}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" alt="${rival.name}">`
            : `<div style="width:40px;height:40px;border-radius:50%;background:${color}22;border:2px solid ${color};display:flex;align-items:center;justify-content:center;color:${color};font-size:1.2rem;"><i class="fa-solid fa-shield"></i></div>`;
        return `
        <div class="rival-card glass-card" style="border-color:${color}33;">
            <div class="rival-card-header" style="border-bottom:1px solid ${color}22;padding-bottom:0.75rem;margin-bottom:0.75rem;">
                <div style="display:flex;align-items:center;gap:0.75rem;flex:1;">
                    ${logoHtml}
                    <div class="rival-identity">
                        <h4 class="rival-name" style="color:${color};margin:0;">${rival.name}</h4>
                        <span style="color:#777;font-size:0.75rem;">
                            <i class="fa-solid fa-users"></i> ${memberCount} oyuncu
                            &nbsp;·&nbsp;
                            <i class="fa-solid fa-crown" style="color:#ffd700;"></i> ${rival.captain?.username || '—'}
                        </span>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:0.5rem;">
                    <div class="rival-gen-chip" style="border-color:${color};color:${color};">
                        ${rivalGen} <span style="font-size:0.65rem;">GEN</span>
                    </div>
                    <button onclick="toggleFavRival('${rival.id}')" title="${isFav ? 'Favoriden çıkar' : 'Favorilere ekle'}"
                        style="background:none;border:none;cursor:pointer;font-size:1.1rem;padding:2px 4px;line-height:1;">
                        ${isFav ? '⭐' : '☆'}
                    </button>
                </div>
            </div>
            ${genDiff !== null ? `
            <div class="rival-gen-compare" style="margin-bottom:0.5rem;">
                <span style="color:#888;font-size:0.8rem;">GEN Farkı:</span>
                <span style="color:${genDiff>=0?'var(--neon-green)':'var(--neon-pink)'};font-weight:700;">
                    ${genDiff >= 0 ? '+' : ''}${genDiff}
                </span>
            </div>` : ''}
            ${totalH2H > 0 ? `
            <div class="h2h-record" style="margin-bottom:0.5rem;">
                <span style="color:#888;font-size:0.8rem;">H2H:</span>
                <span style="color:var(--neon-green);">${h2h.w}G</span>
                <span style="color:#aaa;">${h2h.d}B</span>
                <span style="color:var(--neon-pink);">${h2h.l}M</span>
            </div>` : ''}
            <div class="rival-card-actions">
                <button class="btn-sm btn-outline-sm" onclick="openH2HModal('${rival.id}','${rival.name.replace(/'/g,"\\'")}')">
                    <i class="fa-solid fa-clipboard-list"></i> Sonuç Gir
                </button>
                <button class="btn-sm btn-accent" onclick="challengeRival('${rival.id}','${rival.name.replace(/'/g,"\\'")}')">
                    <i class="fa-solid fa-handshake"></i> Maç İste
                </button>
            </div>
        </div>`;
    }).join('');

    c.innerHTML = `
        <div class="rakipler-tab-wrapper">
            <!-- Özet Kart -->
            <div class="glass-card rival-summary-card">
                <div class="rival-summary-grid">
                    <div class="rival-stat-box">
                        <span class="rival-stat-val" style="color:var(--neon-green);">${stats?.wins ?? (t.total_wins||0)}</span>
                        <span class="rival-stat-lbl">Galibiyet</span>
                    </div>
                    <div class="rival-stat-box">
                        <span class="rival-stat-val" style="color:#aaa;">${stats?.draws ?? (t.total_draws||0)}</span>
                        <span class="rival-stat-lbl">Beraberlik</span>
                    </div>
                    <div class="rival-stat-box">
                        <span class="rival-stat-val" style="color:var(--neon-pink);">${stats?.losses ?? (t.total_losses||0)}</span>
                        <span class="rival-stat-lbl">Mağlubiyet</span>
                    </div>
                    <div class="rival-stat-box">
                        <span class="rival-stat-val" style="color:var(--neon-cyan);">${myGen}</span>
                        <span class="rival-stat-lbl">Takım GEN</span>
                    </div>
                </div>
            </div>

            <!-- Filtre Sekmeleri -->
            <div style="display:flex;gap:0.5rem;margin-bottom:1rem;">
                <button onclick="renderRakiplerTab('all')"
                    style="padding:0.4rem 1rem;border-radius:20px;border:1px solid ${activeFilter==='all'?'var(--neon-cyan)':'rgba(255,255,255,0.1)'};
                           background:${activeFilter==='all'?'rgba(0,229,255,0.1)':'transparent'};
                           color:${activeFilter==='all'?'var(--neon-cyan)':'#888'};cursor:pointer;font-size:0.85rem;">
                    <i class="fa-solid fa-users"></i> Tüm Rakipler (${rivals.length})
                </button>
                <button onclick="renderRakiplerTab('favs')"
                    style="padding:0.4rem 1rem;border-radius:20px;border:1px solid ${activeFilter==='favs'?'#ffd700':'rgba(255,255,255,0.1)'};
                           background:${activeFilter==='favs'?'rgba(255,215,0,0.1)':'transparent'};
                           color:${activeFilter==='favs'?'#ffd700':'#888'};cursor:pointer;font-size:0.85rem;">
                    ⭐ Favoriler (${favs.length})
                </button>
            </div>

            ${displayed.length === 0 ? `
            <div style="text-align:center;padding:3rem;color:#555;">
                ${activeFilter==='favs' ? 'Henüz favori rakip eklenmedi. Bir takımın ⭐ butonuna tıklayın.' : 'Henüz başka takım bulunmuyor.'}
            </div>` : `
            <div class="rival-cards-grid">${rivalCards}</div>`}
        </div>

        <!-- H2H Modal -->
        <div id="h2h-modal" class="modal-backdrop" onclick="closeH2HModal()" style="display:none;">
            <div class="modal-box" onclick="event.stopPropagation()" style="max-width:400px;">
                <div class="modal-header">
                    <h3><i class="fa-solid fa-clipboard-list" style="color:var(--neon-cyan);"></i> Maç Sonucu</h3>
                    <button class="modal-close" onclick="closeH2HModal()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="modal-body">
                    <p id="h2h-rival-name" style="color:#aaa;margin-bottom:1rem;"></p>
                    <div class="modal-field">
                        <label>Sonuç</label>
                        <div style="display:flex;gap:0.5rem;">
                            <button class="btn-sm btn-success-sm" onclick="saveH2H('w')" style="flex:1;padding:0.8rem;">✅ Galibiyet</button>
                            <button class="btn-sm" onclick="saveH2H('d')" style="flex:1;padding:0.8rem;background:#333;color:#aaa;border:1px solid #555;border-radius:8px;">🤝 Beraberlik</button>
                            <button class="btn-sm btn-danger-sm" onclick="saveH2H('l')" style="flex:1;padding:0.8rem;">❌ Mağlubiyet</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

window.toggleFavRival = function(teamId) {
    let favs = JSON.parse(localStorage.getItem('ss_fav_rivals') || '[]');
    if (favs.includes(teamId)) {
        favs = favs.filter(id => id !== teamId);
        showToast('Favorilerden çıkarıldı.');
    } else {
        favs.push(teamId);
        showToast('⭐ Favorilere eklendi!');
    }
    localStorage.setItem('ss_fav_rivals', JSON.stringify(favs));
    renderRakiplerTab();
};

let h2hCurrentRivalId = null;
window.openH2HModal = function(rivalId, rivalName) {
    h2hCurrentRivalId = rivalId;
    const modal = document.getElementById('h2h-modal');
    const nameEl = document.getElementById('h2h-rival-name');
    if (nameEl) nameEl.textContent = `Rakip: ${rivalName}`;
    if (modal) modal.style.display = 'flex';
};
window.closeH2HModal = function() {
    const modal = document.getElementById('h2h-modal');
    if (modal) modal.style.display = 'none';
};
window.saveH2H = function(result) {
    if (!h2hCurrentRivalId) return;
    const h2h = JSON.parse(localStorage.getItem('ss_h2h') || '{}');
    if (!h2h[h2hCurrentRivalId]) h2h[h2hCurrentRivalId] = { w: 0, d: 0, l: 0 };
    h2h[h2hCurrentRivalId][result]++;
    localStorage.setItem('ss_h2h', JSON.stringify(h2h));

    // Supabase update for season stats would go here
    // DB.Teams.update(...) if needed, for now we just persist H2H to localstorage
    
    closeH2HModal();
    renderRakiplerTab();
    renderTeamOverview();
    const labels = { w: 'Galibiyet kaydedildi! 🎉', d: 'Beraberlik kaydedildi.', l: 'Mağlubiyet kaydedildi.' };
    showToast(labels[result] || 'Kaydedildi');
};
window.challengeRival = function(rivalId, rivalName) {
    showToast(`📨 ${rivalName}'a maç daveti gönderildi!`);
};


// ──────────────────────────────────────────────────────
// FAZ 7: ÖDEMELER TAKİBİ
// ──────────────────────────────────────────────────────

window.renderOdemelerTab = function() {
    const c = document.getElementById('ttab-odemeler-content');
    const t = window._tmState?.team;
    if (!c || !t) return;

    const payments = JSON.parse(localStorage.getItem('ss_payments') || '[]');
    const teamPlayers = getTeamPlayers();

    // Per-player balance
    const balances = {};
    teamPlayers.forEach(p => { balances[p.id] = 0; });
    payments.forEach(pay => {
        if (pay.type === 'debt')    balances[pay.playerId] = (balances[pay.playerId] || 0) - pay.amount;
        if (pay.type === 'payment') balances[pay.playerId] = (balances[pay.playerId] || 0) + pay.amount;
    });

    const totalDebt = Object.values(balances).reduce((s, v) => v < 0 ? s + Math.abs(v) : s, 0);
    const totalPaid = Object.values(balances).reduce((s, v) => v > 0 ? s + v : s, 0);

    c.innerHTML = `
        <div class="odemeler-tab-wrapper">

            <!-- Summary -->
            <div class="glass-card odeme-summary-card">
                <div class="section-label-pill" style="margin-bottom:1rem;">
                    <i class="fa-solid fa-money-bill-wave" style="color:var(--neon-green);"></i>
                    SAHA ÜCRETİ TAKİBİ
                </div>
                <div class="odeme-summary-grid">
                    <div class="odeme-stat-box">
                        <span class="odeme-stat-val" style="color:var(--neon-pink);">₺${totalDebt.toLocaleString('tr-TR')}</span>
                        <span class="odeme-stat-lbl">Toplam Borç</span>
                    </div>
                    <div class="odeme-stat-box">
                        <span class="odeme-stat-val" style="color:var(--neon-green);">₺${totalPaid.toLocaleString('tr-TR')}</span>
                        <span class="odeme-stat-lbl">Ödenen</span>
                    </div>
                    <div class="odeme-stat-box">
                        <span class="odeme-stat-val" style="color:#ffd700;">${teamPlayers.length}</span>
                        <span class="odeme-stat-lbl">Oyuncu</span>
                    </div>
                </div>
            </div>

            <!-- Add Expense -->
            <div class="glass-card odeme-add-card" id="acc-add-pay">
                <button class="odeme-toggle-btn" onclick="toggleAddPaymentForm()">
                    <i class="fa-solid fa-plus"></i> Yeni Kayıt Ekle
                    <i class="fa-solid fa-chevron-down" id="add-pay-chevron"></i>
                </button>
                <div id="add-payment-form" style="display:none; margin-top:1rem;">
                    <div class="odeme-form-grid">
                        <div class="modal-field">
                            <label>Oyuncu</label>
                            <select id="pay-player" class="profile-select">
                                ${teamPlayers.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="modal-field">
                            <label>Tür</label>
                            <select id="pay-type" class="profile-select">
                                <option value="debt">Saha Borcu</option>
                                <option value="payment">Ödeme Yapıldı</option>
                            </select>
                        </div>
                        <div class="modal-field">
                            <label>Tutar (₺)</label>
                            <input type="number" id="pay-amount" class="profile-input" placeholder="500" min="1">
                        </div>
                        <div class="modal-field">
                            <label>Açıklama</label>
                            <input type="text" id="pay-desc" class="profile-input" placeholder="Hafta 43 saha ücreti">
                        </div>
                    </div>
                    <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
                        <button class="btn-primary" onclick="addPaymentRecord()" style="background:var(--neon-green); color:black;">
                            <i class="fa-solid fa-plus"></i> Ekle
                        </button>
                    </div>
                </div>
            </div>

            <!-- Player Balances -->
            <div class="glass-card odeme-players-card">
                <div class="section-label-pill" style="margin-bottom:1rem;">
                    <i class="fa-solid fa-users"></i> OYUNCU BAKİYELERİ
                </div>
                <div class="odeme-player-list">
                    ${teamPlayers.map(p => {
                        const bal = balances[p.id] || 0;
                        const isDebt = bal < 0;
                        const statusColor = isDebt ? 'var(--neon-pink)' : bal === 0 ? '#888' : 'var(--neon-green)';
                        return `
                        <div class="odeme-player-row">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}" class="odeme-avatar">
                            <div class="odeme-player-name">
                                ${p.name}
                                ${p.id === t.captain_id || p.supabase_id === t.captain_id ? '<i class="fa-solid fa-crown" style="color:#ffd700; font-size:0.7rem;"></i>' : ''}
                            </div>
                            <div class="odeme-bal-bar">
                                <div class="odeme-bal-fill" 
                                     style="width:${Math.min(Math.abs(bal)/20, 100)}%; background:${statusColor}; opacity:0.4;"></div>
                            </div>
                            <span class="odeme-bal-val" style="color:${statusColor};">
                                ${isDebt ? '-' : bal > 0 ? '+' : ''}₺${Math.abs(bal).toLocaleString('tr-TR')}
                            </span>
                            <span class="odeme-status-pill" style="background:${statusColor}33; color:${statusColor}; border:1px solid ${statusColor}44;">
                                ${isDebt ? 'Borçlu' : bal === 0 ? 'Temiz' : 'Alacaklı'}
                            </span>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <!-- Transaction History -->
            ${payments.length > 0 ? `
            <div class="glass-card odeme-history-card">
                <div class="section-label-pill" style="margin-bottom:1rem;">
                    <i class="fa-solid fa-clock-rotate-left"></i> İŞLEM GEÇMİŞİ
                    <button class="btn-sm btn-danger-sm" onclick="clearPayments()" 
                            style="margin-left:auto; font-size:0.75rem;">Temizle</button>
                </div>
                <div class="odeme-history-list">
                    ${[...payments].reverse().slice(0, 20).map(pay => {
                        const player = teamPlayers.find(p => p.id === pay.playerId);
                        const isDebt = pay.type === 'debt';
                        return `
                        <div class="odeme-history-row">
                            <span class="history-type-icon" style="color:${isDebt?'var(--neon-pink)':'var(--neon-green)'};">
                                <i class="fa-solid ${isDebt?'fa-arrow-down':'fa-arrow-up'}"></i>
                            </span>
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${player?.name||'x'}" class="odeme-history-avatar">
                            <div class="odeme-history-info">
                                <span class="odeme-history-name">${player?.name || 'Bilinmeyen'}</span>
                                <span class="odeme-history-desc">${pay.desc || (isDebt ? 'Borç' : 'Ödeme')}</span>
                            </div>
                            <span class="odeme-history-date">${new Date(pay.date).toLocaleDateString('tr-TR')}</span>
                            <span class="odeme-history-amount" style="color:${isDebt?'var(--neon-pink)':'var(--neon-green)'};">
                                ${isDebt ? '-' : '+'}₺${pay.amount.toLocaleString('tr-TR')}
                            </span>
                        </div>`;
                    }).join('')}
                </div>
            </div>` : ''}

        </div>
    `;
};

window.toggleAddPaymentForm = function() {
    const form = document.getElementById('add-payment-form');
    const chevron = document.getElementById('add-pay-chevron');
    if (!form) return;
    const isOpen = form.style.display !== 'none';
    form.style.display = isOpen ? 'none' : 'block';
    if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
};

window.addPaymentRecord = function() {
    const playerId = document.getElementById('pay-player')?.value;
    const type = document.getElementById('pay-type')?.value;
    const amount = parseFloat(document.getElementById('pay-amount')?.value);
    const desc = document.getElementById('pay-desc')?.value?.trim() || '';

    if (!playerId || !type || !amount || amount <= 0) {
        showToast('Tüm alanları doldurun!');
        return;
    }

    const payments = JSON.parse(localStorage.getItem('ss_payments') || '[]');
    payments.push({ id: 'pay_' + Date.now(), playerId, type, amount, desc, date: new Date().toISOString() });
    localStorage.setItem('ss_payments', JSON.stringify(payments));
    renderOdemelerTab();
    showToast('✅ Kayıt eklendi!');
};

window.clearPayments = function() {
    if (!confirm('Tüm ödeme geçmişini silmek istediğinizden emin misiniz?')) return;
    localStorage.removeItem('ss_payments');
    renderOdemelerTab();
    showToast('Ödeme geçmişi temizlendi.');
};

// ──────────────────────────────────────────────────────
// YARDIMCI FONKSİYONLAR
// ──────────────────────────────────────────────────────

// Takım sayfasından oyuncu profiline git — arkadaşlık kontrolü
window.viewPlayerFromTeam = async function(playerId) {
    const currentUserId = window.__AUTH_USER__?.id;
    const isMockId = /^p\d+$/.test(String(playerId));

    if (!currentUserId || isMockId || playerId === currentUserId) {
        // Mock veri veya kendi profili
        window.viewingAsFriend = null;
        if (typeof viewPlayerProfile === 'function') viewPlayerProfile(playerId);
        return;
    }

    // Gerçek kullanıcı — arkadaşlık kontrolü
    let isFriend = false;
    if (window.DB) {
        try {
            const fs = await window.DB.Friends.checkStatus(currentUserId, playerId);
            isFriend = fs?.status === 'accepted';
        } catch(e) {}
    }

    if (isFriend) {
        window.viewingAsFriend = true;
        if (typeof openUserProfile === 'function') {
            openUserProfile(playerId, playerId);
        } else if (typeof viewPlayerProfile === 'function') {
            viewPlayerProfile(playerId);
        }
    } else {
        window.viewingAsFriend = false;
        if (typeof showProfileModal === 'function') {
            showProfileModal(playerId, playerId, 'team');
        }
    }
};

// Takımdan ayrılma sekmesini başlat
window.initTeamSubTabContent = function(tabId) {
    switch(tabId) {
        case 'kadro':    if (typeof renderKadroTab       === 'function') renderKadroTab();       break;
        case 'saha':     if (typeof renderSahaTab        === 'function') renderSahaTab();        break;
        case 'olustur':  if (typeof renderTakimOlusturTab === 'function') renderTakimOlusturTab(); break;
        case 'sinerji':  if (typeof renderSinerjiTab     === 'function') renderSinerjiTab();     break;
        case 'rakipler': if (typeof renderRakiplerTab    === 'function') renderRakiplerTab();    break;
        case 'odemeler': if (typeof renderOdemelerTab    === 'function') renderOdemelerTab();    break;
    }
};

// ══════════════════════════════════════════════════════════════
// MAÇ SONU MODALİ — Puan + Onur (birleşik, step-by-step)
// ══════════════════════════════════════════════════════════════

const HONOR_MAX = 13;
let _pmrMatchId = null;
let _pmrParticipants = [];
let _pmrRatedSet = new Set();
let _pmrCurrentIdx = 0;
let _pmrCurrentUserSide = null;
let _honorSelections = {}; // { [rated_id]: honor_type } — modal boyunca toplanır

const _HONOR_BTNS = [
    // Saha İçi Performans
    { key: 'mvp',              icon: '👑', label: 'MVP',             group: 'Saha İçi' },
    { key: 'maestro',          icon: '🎯', label: 'Maestro',         group: 'Saha İçi' },
    { key: 'fuzeci',           icon: '🚀', label: 'Füzeci',          group: 'Saha İçi' },
    { key: 'duvar',            icon: '🧱', label: 'Duvar',           group: 'Saha İçi' },
    { key: 'cigersiz_honor',   icon: '🫁', label: 'Ciğersiz',        group: 'Saha İçi' },
    // Karakter & Vibe
    { key: 'beyefendi',        icon: '🎩', label: 'Beyefendi',       group: 'Karakter' },
    { key: 'sosyal',           icon: '🎉', label: 'Sosyal',          group: 'Karakter' },
    { key: 'gizli_cevher',     icon: '💎', label: 'Gizli Cevher',    group: 'Karakter' },
    { key: 'oyunbozan',        icon: '😤', label: 'Oyunbozan',       group: 'Karakter' },
    // Lojistik & Fedakarlık
    { key: 'organizator',      icon: '📋', label: 'Organizatör',     group: 'Lojistik' },
    { key: 'saha_komiseri',    icon: '🏟️', label: 'Saha Komiseri',   group: 'Lojistik' },
    { key: 'emanetci',         icon: '🎒', label: 'Emanetçi',        group: 'Lojistik' },
    { key: 'fedakar_eldiven',  icon: '🧤', label: 'Fedakar Eldiven', group: 'Lojistik' },
    { key: 'joker',            icon: '🃏', label: 'Joker',           group: 'Lojistik' },
];

const _RATING_KEYS = [
    { key: 'teknik',    label: 'Teknik'    },
    { key: 'sut',       label: 'Şut'       },
    { key: 'pas',       label: 'Pas'       },
    { key: 'hiz',       label: 'Hız'       },
    { key: 'fizik',     label: 'Fizik'     },
    { key: 'kondisyon', label: 'Kondisyon' }
];

// Güvenli inline-onclick string escape (IIFE dışından erişilebilir)
function _pmrEsc(str) {
    return String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

window.openPostMatchRatingModal = async function(matchId, currentUserSide) {
    const user = window.__AUTH_USER__;
    if (!user || !window.DB) return;

    try {
        const isParticipant = await window.DB.Ratings.isParticipantInMatch(user.id, matchId);
        if (!isParticipant && !window.TEST_MODE) {
            if (typeof showToast === 'function') showToast('⚠️ Bu maçta yer almadığın için puan veremezsin.');
            return;
        }
    } catch(e) { console.warn('Participation check failed:', e); }

    // 24 saatlik oylama penceresi kontrolü
    try {
        const votingOpen = await window.DB.Ratings.isVotingOpen(matchId);
        if (!votingOpen) {
            if (typeof showToast === 'function') showToast('⏱ Oylamanın süresi doldu. Oylar yalnızca maç bitişinden itibaren 24 saat içinde kullanılabilir.');
            return;
        }
    } catch(e) { console.warn('Voting window check failed:', e); }

    _pmrMatchId = matchId;
    _pmrCurrentUserSide = currentUserSide;
    _honorSelections = {};

    if (!document.getElementById('pmr-modal-overlay')) _pmrInjectModalDOM();

    const overlay = document.getElementById('pmr-modal-overlay');
    overlay.style.display = 'flex';
    setTimeout(() => overlay.classList.add('visible'), 10);

    document.getElementById('pmr-body').innerHTML =
        '<div style="text-align:center;padding:3rem;color:#555;">' +
        '<i class="fa-solid fa-spinner fa-spin" style="font-size:2rem;"></i></div>';

    try {
        [_pmrParticipants, _pmrRatedSet] = await Promise.all([
            window.DB.Ratings.getMatchParticipants(matchId, user.id),
            window.DB.Ratings.getMyMatchRatings(user.id, matchId)
        ]);
    } catch(e) {
        document.getElementById('pmr-body').innerHTML =
            '<p style="color:#ff007f;text-align:center;padding:2rem;">Oyuncular yüklenemedi.</p>';
        return;
    }

    if (_pmrParticipants.length === 0) {
        document.getElementById('pmr-body').innerHTML =
            '<p style="color:#555;text-align:center;padding:2rem;">Bu maçta puanlanacak oyuncu bulunamadı.</p>';
        return;
    }

    _pmrCurrentIdx = _pmrParticipants.findIndex(p => !_pmrRatedSet.has(p.player_id));
    if (_pmrCurrentIdx === -1) _pmrCurrentIdx = 0;

    _pmrRenderCurrentPlayer();
};

function _pmrInjectModalDOM() {
    const el = document.createElement('div');
    el.id = 'pmr-modal-overlay';
    el.className = 'pmr-overlay';
    el.style.display = 'none';
    el.onclick = function(e) { if (e.target === el) window.closePostMatchRatingModal(); };
    el.innerHTML = `
        <div class="pmr-box honor-modal-box">
            <div class="pmr-header">
                <div class="pmr-header-title">
                    <i class="fa-solid fa-star" style="color:var(--neon-green);"></i>
                    <span id="pmr-header-text">Maç Puanlaması</span>
                </div>
                <div class="pmr-progress-pills" id="pmr-pills"></div>
                <button class="tm-modal-close" onclick="closePostMatchRatingModal()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div id="pmr-body" class="pmr-body honor-modal-body"></div>
        </div>`;
    document.body.appendChild(el);
}

function _pmrStepRow(key, label) {
    return `<div class="pmr-step-row">
        <span class="pmr-step-label">${label}</span>
        <div class="pmr-stepper">
            <button class="pmr-step-btn pmr-step-minus" type="button" onclick="_pmrStep('${key}',-1)">−</button>
            <span class="pmr-step-val" id="pmr-val-${key}">5</span>
            <button class="pmr-step-btn pmr-step-plus" type="button" onclick="_pmrStep('${key}',1)">+</button>
        </div>
    </div>`;
}

window._pmrStep = function(key, delta) {
    const el = document.getElementById('pmr-val-' + key);
    if (!el) return;
    const next = Math.max(1, Math.min(10, parseInt(el.textContent) + delta));
    el.textContent = next;
    el.className = 'pmr-step-val' + (next >= 8 ? ' pmr-val-high' : next <= 3 ? ' pmr-val-low' : '');
};

function _pmrHonorRow(playerId) {
    const selected = _honorSelections[playerId];
    const selCount = Object.keys(_honorSelections).length;
    const atLimit = !selected && selCount >= HONOR_MAX;

    const groups = ['Saha İçi', 'Karakter', 'Lojistik'];
    const groupLabels = { 'Saha İçi': '⚽ Saha İçi', 'Karakter': '😄 Karakter', 'Lojistik': '🔧 Lojistik' };

    const groupedHtml = groups.map(g => {
        const btns = _HONOR_BTNS.filter(h => h.group === g).map(h => {
            const isSel = selected === h.key;
            return `<button class="honor-type-btn${isSel ? ' honor-type-selected' : ''}"
                        ${atLimit && !isSel ? 'disabled title="Onur limiti doldu"' : ''}
                        onclick="_pmrHonorToggle('${_pmrEsc(playerId)}','${h.key}')">
                    ${h.icon} ${h.label}
                </button>`;
        }).join('');
        return `<div class="honor-group">
            <div class="honor-group-label">${groupLabels[g]}</div>
            <div class="honor-type-btns">${btns}</div>
        </div>`;
    }).join('');

    return `
        <div class="pmr-honor-section">
            <div class="pmr-honor-label">
                <i class="fa-solid fa-shield-heart" style="color:var(--neon-cyan);font-size:0.75rem;"></i>
                Onur Ver (opsiyonel)
                <span class="honor-count-badge" style="font-size:0.65rem; padding:0.1rem 0.5rem;">${selCount}/${HONOR_MAX}</span>
            </div>
            ${groupedHtml}
        </div>`;
}

window._pmrHonorToggle = function(playerId, honorKey) {
    const current = _honorSelections[playerId];
    const selCount = Object.keys(_honorSelections).length;

    if (current === honorKey) {
        delete _honorSelections[playerId];
    } else if (current) {
        _honorSelections[playerId] = honorKey;
    } else {
        if (selCount >= HONOR_MAX) {
            if (typeof showToast === 'function') showToast(`En fazla ${HONOR_MAX} onur seçebilirsin.`);
            return;
        }
        _honorSelections[playerId] = honorKey;
    }
    // Sadece onur butonlarını yeniden render et (stepper değerleri sıfırlanmasın)
    const honorSection = document.querySelector('.pmr-honor-section');
    if (honorSection) honorSection.outerHTML = _pmrHonorRow(playerId);
    // outerHTML replace sonrası tekrar bul ve güncelle
    const newSection = document.querySelector('.pmr-honor-section');
    if (newSection) newSection.outerHTML = _pmrHonorRow(playerId);
};

function _pmrRenderCurrentPlayer() {
    const p = _pmrParticipants[_pmrCurrentIdx];
    if (!p) return;

    const info = p.player || {};
    const isOpponent = p.team_side !== _pmrCurrentUserSide;
    const alreadyRated = _pmrRatedSet.has(p.player_id);
    const total = _pmrParticipants.length;

    document.getElementById('pmr-header-text').textContent =
        `${_pmrCurrentIdx + 1} / ${total}`;

    document.getElementById('pmr-pills').innerHTML = _pmrParticipants.map((pt, i) => {
        const rated = _pmrRatedSet.has(pt.player_id);
        const active = i === _pmrCurrentIdx;
        return `<span class="pmr-pill${rated ? ' pmr-pill-done' : ''}${active ? ' pmr-pill-active' : ''}"></span>`;
    }).join('');

    const avatar = info.avatar_url ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(info.username || 'x')}`;

    document.getElementById('pmr-body').innerHTML = `
        <div class="pmr-player-header">
            <img src="${avatar}" class="pmr-avatar" alt="" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=default'">
            <div>
                <div class="pmr-player-name">${info.username || 'Oyuncu'}</div>
                <div class="pmr-player-meta" style="color:${isOpponent ? 'var(--neon-pink)' : 'var(--neon-cyan)'};">
                    ${isOpponent ? 'Rakip Takım' : 'Takım Arkadaşı'}${alreadyRated ? '&nbsp;<span class="pmr-badge-done">Puanlandı</span>' : ''}
                </div>
            </div>
        </div>
        <div class="pmr-ratings-scroll">
            ${_RATING_KEYS.map(r => _pmrStepRow(r.key, r.label)).join('')}
        </div>
        ${_pmrHonorRow(p.player_id)}
        <div class="pmr-footer">
            ${_pmrCurrentIdx > 0
                ? `<button class="btn-sm btn-outline-sm" onclick="_pmrGoTo(${_pmrCurrentIdx - 1})">
                       <i class="fa-solid fa-arrow-left"></i> Geri
                   </button>`
                : '<span></span>'}
            <button class="btn-sm btn-accent" onclick="_pmrSubmitCurrent()" id="pmr-submit-btn">
                ${alreadyRated ? 'Güncelle' : 'Puanla'}&nbsp;<i class="fa-solid fa-arrow-right"></i>
            </button>
        </div>`;
}

window._pmrGoTo = function(idx) {
    _pmrCurrentIdx = idx;
    _pmrRenderCurrentPlayer();
};

window._pmrSubmitCurrent = async function() {
    const user = window.__AUTH_USER__;
    if (!user) return;

    const p = _pmrParticipants[_pmrCurrentIdx];
    if (!p) return;

    const btn = document.getElementById('pmr-submit-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = 'Kaydediliyor...'; }

    const ratings = {};
    _RATING_KEYS.forEach(({ key }) => {
        const el = document.getElementById('pmr-val-' + key);
        ratings[key] = el ? parseInt(el.textContent) : 5;
    });

    try {
        // Submit anı pencere kontrolü
        const stillOpen = await window.DB.Ratings.isVotingOpen(_pmrMatchId).catch(() => true);
        if (!stillOpen) {
            if (typeof showToast === 'function') showToast('⏱ Oylama süresi doldu, puanlar kaydedilemedi.');
            if (typeof window.closePostMatchRatingModal === 'function') window.closePostMatchRatingModal();
            return;
        }

        await window.DB.Ratings.upsertRating(user.id, p.player_id, ratings, '', _pmrMatchId);
        _pmrRatedSet.add(p.player_id);

        if (window.DB.Notifications) {
            window.DB.Notifications.send(
                p.player_id, 'rating_received', 'Maç Puanı Aldın!',
                `${user.email?.split('@')[0] || 'Bir oyuncu'} seni maç sonrası puanladı.`,
                user.id
            ).catch(() => {});
        }

        if (typeof updateChart === 'function' && typeof players !== 'undefined') {
            const tp = players.find(pl => (pl.supabase_id || pl.id) === p.player_id);
            if (tp) {
                if (!tp.communityRatings) tp.communityRatings = [];
                const entry = { supabase_from: user.id, match_id: _pmrMatchId, ...ratings };
                const ei = tp.communityRatings.findIndex(r => r.supabase_from === user.id && r.match_id === _pmrMatchId);
                if (ei >= 0) tp.communityRatings[ei] = entry; else tp.communityRatings.push(entry);
                setTimeout(() => updateChart(tp), 150);
            }
        }

        if (typeof showToast === 'function') showToast('Puan kaydedildi!');

        // Sonraki puanlanmamış oyuncuya geç
        const nextUnrated = _pmrParticipants.findIndex((pt, i) =>
            i > _pmrCurrentIdx && !_pmrRatedSet.has(pt.player_id)
        );

        if (nextUnrated !== -1) {
            _pmrCurrentIdx = nextUnrated;
            _pmrRenderCurrentPlayer();
        } else {
            // Tüm oyuncular puanlandı — toplu onur gönder
            await _pmrFlushHonors();
        }

    } catch(e) {
        console.error('PMR submit error:', e);
        if (typeof showToast === 'function') showToast('Hata: ' + (e.message || 'Kaydedilemedi'));
        if (btn) { btn.disabled = false; btn.innerHTML = 'Tekrar Dene&nbsp;<i class="fa-solid fa-arrow-right"></i>'; }
    }
};

async function _pmrFlushHonors() {
    const user = window.__AUTH_USER__;
    const selections = Object.entries(_honorSelections).map(([rated_id, honor_type]) => ({ rated_id, honor_type }));

    if (selections.length > 0 && user && window.DB.Honors) {
        try {
            await window.DB.Honors.submitMatchHonors(user.id, _pmrMatchId, selections);
            selections.forEach(s => {
                window.DB.Notifications?.send(
                    s.rated_id, 'honor_received', 'Onur Aldın!',
                    `${user.email?.split('@')[0] || 'Bir oyuncu'} seni onurlandırdı.`,
                    user.id
                ).catch(() => {});
            });
        } catch(e) {
            console.warn('Honor flush error:', e);
        }
    }
    _pmrShowDoneScreen();
}

function _pmrShowDoneScreen() {
    const honorCount = Object.keys(_honorSelections).length;
    document.getElementById('pmr-body').innerHTML = `
        <div style="text-align:center;padding:3rem 1.5rem;">
            <i class="fa-solid fa-circle-check" style="font-size:3rem;color:var(--neon-green);margin-bottom:1rem;"></i>
            <h3 style="color:var(--neon-green);margin-bottom:0.5rem;">Tüm Oyuncular Puanlandı!</h3>
            ${honorCount > 0
                ? `<p style="color:var(--neon-cyan);font-size:0.9rem;margin-bottom:0.5rem;">
                       <i class="fa-solid fa-shield-heart"></i> ${honorCount} onur verildi
                   </p>`
                : ''}
            <p style="color:#666;font-size:0.85rem;margin-bottom:2rem;">Puanlar GEN ortalamasına yansıtıldı.</p>
            <button class="btn-sm btn-accent" onclick="closePostMatchRatingModal()" style="padding:0.7rem 2rem;">
                Kapat
            </button>
        </div>`;
    if (typeof loadMatchHistory === 'function') setTimeout(loadMatchHistory, 300);
}

window.closePostMatchRatingModal = function() {
    const overlay = document.getElementById('pmr-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('visible');
    setTimeout(() => { overlay.style.display = 'none'; }, 250);
};

// ======================================================
// MAÇ MERKEZİ — Phase 1 + 2
// ======================================================
(function () {

let _mcVenues = [];
let _mcMyTeams = [];
let _mcDropdownsLoaded = false;
let _mcSelectedAwayTeam = null;
let _mcSearchTimeout = null;
let _mcAllMatches = [];
let _mcRatingStatuses = {};
let _mcPlayerCounts = {};
let _mcCalCurrentDate = new Date();
let _mcCalSelectedDate = null;

function _mcEsc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Supabase auth > localStorage account > null
function _mcGetUserId() {
    const authId = window.__AUTH_USER__?.id;
    if (authId) return authId;
    const acc = typeof getActiveAccount === 'function' ? getActiveAccount() : null;
    return acc?.playerId || null;
}

window.initMatchCenter = async function () {
    if (!_mcDropdownsLoaded) {
        _mcDropdownsLoaded = true;
        const userId = _mcGetUserId();

        const myTeams = userId
            ? await DB.Teams.getMyTeams(userId).catch(() => [])
            : [];
        _mcMyTeams = myTeams;

        const homeSelect = document.getElementById('mc-home-team-select');
        if (homeSelect) {
            homeSelect.innerHTML = '<option value="">— Takım seçin —</option>' +
                myTeams.map(t =>
                    `<option value="${_mcEsc(t.id)}">${_mcEsc(t.name)}</option>`
                ).join('');
        }

        // Takım yoksa "Maç Oluştur" sekmesini pasif yap
        const createBtn = document.querySelector('.mc-tab-btn[onclick*="create-match"]');
        if (createBtn && myTeams.length === 0) createBtn.classList.add('mc-tab-disabled');
    }

    await _mcLoadMatches();
};

async function _mcLoadMatches() {
    const userId = _mcGetUserId();
    const listEl = document.getElementById('mc-matches-list');
    if (!listEl) return;

    if (!userId) {
        listEl.innerHTML = '<div class="empty-state-sm">Oturum açmanız gerekiyor.</div>';
        return;
    }

    listEl.innerHTML = '<div class="empty-state-sm"><i class="fa-solid fa-spinner fa-spin"></i> Yükleniyor…</div>';

    const teamIds = (_mcMyTeams || []).map(t => t.id).filter(Boolean);
    const rows = await DB.Matches.getMyMatches(userId, teamIds);

    if (!rows.length) {
        listEl.innerHTML = `
            <div class="mc-empty-state">
                <i class="fa-solid fa-calendar-xmark"></i>
                <p>Henüz hiç maçın yok.</p>
                <span>Yukarıdan yeni bir maç oluşturabilirsin.</span>
            </div>`;
        return;
    }

    const allIds      = rows.map(r => r.match.id).filter(Boolean);
    const finishedIds = rows.filter(r => r.match.status === 'finished').map(r => r.match.id).filter(Boolean);

    const [playerCounts, ratingStatuses] = await Promise.all([
        DB.Matches.getPlayerCounts(allIds).catch(() => ({})),
        finishedIds.length
            ? DB.Ratings.getMatchRatingStatuses(userId, finishedIds).catch(() => ({}))
            : Promise.resolve({})
    ]);

    _mcAllMatches = rows;
    _mcRatingStatuses = ratingStatuses;
    _mcPlayerCounts = playerCounts;
    _mcCalSelectedDate = null;

    _mcRenderCalendar();
}

function _mcRenderCalendar() {
    const listEl = document.getElementById('mc-matches-list');
    if (!listEl) return;
    listEl.innerHTML = `
        <div class="mc-cal-container glass-card">
            <div class="mc-cal-header">
                <button class="mc-cal-nav-btn" onclick="mcCalPrev()"><i class="fa-solid fa-chevron-left"></i></button>
                <span id="mc-cal-title" class="mc-cal-title"></span>
                <button class="mc-cal-nav-btn" onclick="mcCalNext()"><i class="fa-solid fa-chevron-right"></i></button>
            </div>
            <div class="mc-cal-weekdays">
                <span>Pzt</span><span>Sal</span><span>Çar</span><span>Per</span><span>Cum</span><span>Cmt</span><span>Paz</span>
            </div>
            <div id="mc-cal-grid" class="mc-cal-grid"></div>
        </div>
        <div id="mc-day-matches" class="mc-day-matches"></div>`;
    _mcRenderCalendarMonth();
}

function _mcRenderCalendarMonth() {
    const titleEl = document.getElementById('mc-cal-title');
    const gridEl  = document.getElementById('mc-cal-grid');
    if (!gridEl) return;

    const year  = _mcCalCurrentDate.getFullYear();
    const month = _mcCalCurrentDate.getMonth();
    const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    if (titleEl) titleEl.textContent = `${monthNames[month]} ${year}`;

    // Tarih → maçlar haritası
    const matchesByDate = {};
    for (const row of _mcAllMatches) {
        const m = row.match;
        if (!m.scheduled_at) continue;
        const d = new Date(m.scheduled_at);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        if (!matchesByDate[key]) matchesByDate[key] = [];
        matchesByDate[key].push(row);
    }

    const today    = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    const statusColor = {
        scheduled: '#00e5ff',
        confirmed:  '#adff2f',
        finished:   'rgba(255,255,255,0.45)',
        cancelled:  '#ff007f'
    };
    const statusLabel = {
        scheduled: 'Planlandı',
        confirmed:  'Onaylandı',
        finished:   'Tamamlandı',
        cancelled:  'İptal'
    };
    const myTeamIdSet = new Set((_mcMyTeams || []).map(t => t.id));

    // İlk gün (0=Paz) → Pzt bazlı (0=Pzt)
    const firstDayRaw = new Date(year, month, 1).getDay();
    const firstDayMon = (firstDayRaw === 0) ? 6 : firstDayRaw - 1;
    const daysInMonth  = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    let cells = '';

    // Önceki ay taşma günleri
    for (let i = 0; i < firstDayMon; i++) {
        cells += `<div class="mc-cal-day other-month"><span class="mc-cal-day-num">${prevMonthDays - firstDayMon + 1 + i}</span></div>`;
    }

    // Bu ayın günleri
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr    = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const dayMatches = matchesByDate[dateStr] || [];
        const isToday    = dateStr === todayStr;
        const isSelected = _mcCalSelectedDate === dateStr;
        const isPast     = dateStr < todayStr;

        // Hücre içeriği
        let cellContent = '';
        if (dayMatches.length === 1) {
            const m   = dayMatches[0].match;
            const col = statusColor[m.status] || 'rgba(255,255,255,0.3)';
            const lbl = statusLabel[m.status] || '';
            const time = m.scheduled_at
                ? new Date(m.scheduled_at).toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' })
                : '';
            // Rakip takım adı
            let opp = '';
            if (m.home_team && m.away_team) {
                opp = myTeamIdSet.has(m.home_team_id)
                    ? (m.away_team.name || '').split(' ').slice(0, 2).join(' ')
                    : (m.home_team.name || '').split(' ').slice(0, 2).join(' ');
            }
            cellContent = `
                <div class="mc-cal-match-pill" style="border-color:${col};color:${col};">${lbl}</div>
                ${time ? `<div class="mc-cal-match-time">${time}</div>` : ''}
                ${opp  ? `<div class="mc-cal-match-opp">vs ${_mcEsc(opp)}</div>` : ''}`;
        } else if (dayMatches.length > 1) {
            const dots = dayMatches.slice(0, 4).map(r => {
                const col = statusColor[r.match.status] || 'rgba(255,255,255,0.3)';
                return `<span class="mc-cal-dot" style="background:${col};box-shadow:0 0 4px ${col};"></span>`;
            }).join('');
            cellContent = `
                <div class="mc-cal-dots">${dots}</div>
                <div class="mc-cal-count">${dayMatches.length} maç</div>`;
        }

        const cls = ['mc-cal-day',
            dayMatches.length ? 'has-match' : 'no-match',
            isToday    ? 'today'    : '',
            isSelected ? 'selected' : '',
            isPast && !dayMatches.length ? 'past-empty' : ''
        ].filter(Boolean).join(' ');

        const clickAttr = `onclick="mcCalSelectDay('${dateStr}')"`;

        cells += `<div class="${cls}" data-date="${dateStr}" ${clickAttr}>
            <span class="mc-cal-day-num">${d}</span>
            ${cellContent}
        </div>`;
    }

    // Sonraki ay taşma günleri
    const totalCells = firstDayMon + daysInMonth;
    const remainder  = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remainder; i++) {
        cells += `<div class="mc-cal-day other-month"><span class="mc-cal-day-num">${i}</span></div>`;
    }

    gridEl.innerHTML = cells;

    // Otomatik seçim: bugün maç varsa bugün, yoksa bu aydaki ilk yaklaşan maç
    if (!_mcCalSelectedDate) {
        if (matchesByDate[todayStr]) {
            _mcCalSelectedDate = todayStr;
            gridEl.querySelector(`[data-date="${todayStr}"]`)?.classList.add('selected');
            _mcShowDayMatches(matchesByDate[todayStr], todayStr);
        } else {
            const upcoming = Object.keys(matchesByDate)
                .filter(k => {
                    const [ky, km] = k.split('-').map(Number);
                    return ky === year && km - 1 === month && k >= todayStr;
                }).sort();
            if (upcoming.length) {
                const key = upcoming[0];
                _mcCalSelectedDate = key;
                gridEl.querySelector(`[data-date="${key}"]`)?.classList.add('selected');
                _mcShowDayMatches(matchesByDate[key], key);
            } else {
                _mcShowDayMatches([], null);
            }
        }
    } else {
        const sel = gridEl.querySelector(`[data-date="${_mcCalSelectedDate}"]`);
        if (sel) {
            sel.classList.add('selected');
            const dayMatches = _mcAllMatches.filter(row => {
                if (!row.match.scheduled_at) return false;
                const d = new Date(row.match.scheduled_at);
                const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                return key === _mcCalSelectedDate;
            });
            _mcShowDayMatches(dayMatches, _mcCalSelectedDate);
        } else {
            _mcShowDayMatches([], null);
        }
    }
}

window.mcCalPrev = function () {
    _mcCalCurrentDate = new Date(_mcCalCurrentDate.getFullYear(), _mcCalCurrentDate.getMonth() - 1, 1);
    _mcCalSelectedDate = null;
    _mcRenderCalendarMonth();
};

window.mcCalNext = function () {
    _mcCalCurrentDate = new Date(_mcCalCurrentDate.getFullYear(), _mcCalCurrentDate.getMonth() + 1, 1);
    _mcCalSelectedDate = null;
    _mcRenderCalendarMonth();
};

window.mcCalSelectDay = function (dateStr) {
    _mcCalSelectedDate = dateStr;
    document.querySelectorAll('.mc-cal-day').forEach(el => {
        el.classList.toggle('selected', el.dataset.date === dateStr);
    });
    const dayMatches = _mcAllMatches.filter(row => {
        if (!row.match.scheduled_at) return false;
        const d = new Date(row.match.scheduled_at);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        return key === dateStr;
    });
    _mcShowDayMatches(dayMatches, dateStr);
};

function _mcShowDayMatches(dayMatches, dateStr) {
    const el = document.getElementById('mc-day-matches');
    if (!el) return;
    const userId = _mcGetUserId();
    if (!dayMatches || !dayMatches.length) {
        el.innerHTML = '<div class="mc-day-empty"><i class="fa-regular fa-calendar"></i> Bu gün maç yok</div>';
        return;
    }
    const formatted = dateStr
        ? new Date(dateStr + 'T12:00:00').toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })
        : '';
    el.innerHTML =
        `<div class="mc-day-header"><i class="fa-regular fa-calendar-check"></i> ${formatted}</div>` +
        dayMatches.map(r => _mcMatchCard(r, _mcRatingStatuses, userId, _mcPlayerCounts)).join('');
}

function _mcMatchCard(row, ratingStatuses, userId, playerCounts) {
    const m = row.match;
    const mid = m.id;
    const homeTeam = m.home_team?.name || 'Ev Sahibi';
    const awayTeam = m.away_team?.name || 'Deplasman';
    const venueName = m.venue
        ? (m.venue.name + (m.venue.district ? ', ' + m.venue.district : ''))
        : 'Saha bilinmiyor';
    const date = m.scheduled_at
        ? new Date(m.scheduled_at).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })
        : '—';
    const isCreator  = (userId && m.created_by === userId) || window.TEST_MODE;
    const isActive   = ['scheduled', 'confirmed'].includes(m.status) || window.TEST_MODE;
    const pCount     = playerCounts[mid] || 0;

    const statusMap = {
        scheduled: { label: 'Planlandı',   cls: 'mc-status-scheduled' },
        confirmed:  { label: 'Onaylandı',  cls: 'mc-status-confirmed'  },
        finished:   { label: 'Tamamlandı', cls: 'mc-status-finished'   },
        cancelled:  { label: 'İptal',      cls: 'mc-status-cancelled'  }
    };
    const st = statusMap[m.status] || { label: m.status, cls: '' };

    const scoreHtml = m.status === 'finished'
        ? `<div class="mc-score">
               <span class="mc-score-num ${(m.home_score ?? 0) > (m.away_score ?? 0) ? 'mc-score-win' : ''}">${m.home_score ?? 0}</span>
               <span class="mc-score-sep">—</span>
               <span class="mc-score-num ${(m.away_score ?? 0) > (m.home_score ?? 0) ? 'mc-score-win' : ''}">${m.away_score ?? 0}</span>
           </div>`
        : `<div class="mc-score mc-score-pending"><span class="mc-score-sep">vs</span></div>`;

    // Sağ üst aksiyon alanı: puan ver / puanlandı / skor gir
    let actionHtml = '';
    if (m.status === 'finished') {
        const rs = ratingStatuses[mid];
        if (rs === 'pending') {
            actionHtml = `<button class="pmr-badge-pending" onclick="openPostMatchRatingModal('${_mcEsc(mid)}', '${_mcEsc(row.team_side || 'home')}')">
                <i class="fa-solid fa-shield-heart"></i> Onur Ver
            </button>`;
        } else if (rs === 'done') {
            actionHtml = `<span class="pmr-badge-done-sm"><i class="fa-solid fa-shield-heart"></i> Onurlandırıldı</span>`;
        } else if (rs === 'expired') {
            actionHtml = `<span class="pmr-badge-expired-sm"><i class="fa-solid fa-clock"></i> Süre Doldu</span>`;
        }
    } else if (isCreator && isActive) {
        actionHtml = `<button class="btn-sm mc-score-entry-btn" onclick="mcOpenScoreEntry('${_mcEsc(mid)}')">
            <i class="fa-solid fa-pen-to-square"></i> Skoru Gir
        </button>`;
    }

    const matchType  = m.match_type ? `<span class="mc-match-type">${_mcEsc(m.match_type)}</span>` : '';
    const playerBadge = `<button class="mc-player-count mc-player-count-btn" onclick="mcToggleParticipants('${_mcEsc(mid)}')">
        <i class="fa-solid fa-user-group"></i> ${pCount} oyuncu
    </button>`;

    // İstatistik butonu (creator, tamamlanmış maç)
    const statsBtn = isCreator && m.status === 'finished'
        ? `<button class="btn-sm mc-stats-btn" onclick="openStatsModal('${_mcEsc(mid)}', ${m.home_score ?? 0}, ${m.away_score ?? 0}, '${_mcEsc(homeTeam)}', '${_mcEsc(awayTeam)}')">
               <i class="fa-solid fa-chart-bar"></i> İstatistik
           </button>`
        : '';

    // İptal butonu (creator, yalnızca gerçekten aktif maçlar — TEST_MODE bypass etmez)
    const isTrulyActive = ['scheduled', 'confirmed'].includes(m.status);
    const cancelBtn = isCreator && isTrulyActive
        ? `<button class="btn-sm mc-cancel-match-btn" onclick="mcCancelMatch('${_mcEsc(mid)}')">
               <i class="fa-solid fa-xmark"></i> İptal Et
           </button>`
        : '';

    // Ayrıl butonu (katılımcı ama yaratıcı değil, yalnızca gerçekten aktif maçlar)
    const leaveBtn = !isCreator && isTrulyActive
        ? `<button class="btn-sm mc-leave-btn" onclick="mcLeaveMatch('${_mcEsc(mid)}')">
               <i class="fa-solid fa-person-walking-arrow-right"></i> Ayrıl
           </button>`
        : '';

    // Inline skor form (gizli) — yalnızca gerçekten aktif maçlar
    const scoreForm = isCreator && isTrulyActive ? `
    <div id="mc-score-form-${_mcEsc(mid)}" class="mc-score-form" style="display:none;">
        <div class="mc-score-inputs-row">
            <div class="mc-score-team-col">
                <span class="mc-score-team-lbl">${_mcEsc(homeTeam)}</span>
                <input type="number" id="mc-hs-${_mcEsc(mid)}" class="form-input mc-score-inp" min="0" max="99" value="0">
            </div>
            <span class="mc-score-vs-lbl">—</span>
            <div class="mc-score-team-col">
                <span class="mc-score-team-lbl">${_mcEsc(awayTeam)}</span>
                <input type="number" id="mc-as-${_mcEsc(mid)}" class="form-input mc-score-inp" min="0" max="99" value="0">
            </div>
        </div>
        <div class="mc-score-form-btns">
            <button class="btn-sm btn-success-sm" onclick="mcSubmitScore('${_mcEsc(mid)}', '${_mcEsc(row.team_side || 'home')}')">
                <i class="fa-solid fa-check"></i> Onayla
            </button>
            <button class="btn-sm btn-outline-sm" onclick="mcCloseScoreEntry('${_mcEsc(mid)}')">İptal</button>
        </div>
    </div>` : '';

    const noRatingReason = m.status === 'finished' && !ratingStatuses[mid]
        ? `<span class="mc-no-peer-note"><i class="fa-solid fa-user-slash"></i> Puanlanacak oyuncu yok</span>`
        : '';

    return `
    <div class="mc-match-card glass-card" id="mc-card-${_mcEsc(mid)}">

        <!-- Üst meta satırı -->
        <div class="mc-card-top">
            <div class="mc-card-meta">
                <span class="mc-status-badge ${st.cls}">${st.label}</span>
                ${matchType}
                <span class="mc-card-date"><i class="fa-regular fa-calendar"></i> ${date}</span>
                ${venueName !== 'Saha bilinmiyor' ? `<span class="mc-card-venue-inline"><i class="fa-solid fa-location-dot"></i> ${_mcEsc(venueName)}</span>` : ''}
            </div>
            <div class="mc-card-actions-right">
                ${actionHtml}
                ${noRatingReason}
                ${statsBtn}
                ${leaveBtn}
                ${cancelBtn}
            </div>
        </div>

        <!-- Maç ana gövdesi: Ev — Skor — Deplasman -->
        <div class="mc-card-matchup">
            <div class="mc-matchup-side mc-matchup-home">
                <span class="mc-matchup-team">${_mcEsc(homeTeam)}</span>
                <span class="mc-matchup-role">Ev Sahibi</span>
            </div>
            ${scoreHtml}
            <div class="mc-matchup-side mc-matchup-away">
                <span class="mc-matchup-team">${_mcEsc(awayTeam)}</span>
                <span class="mc-matchup-role">Deplasman</span>
            </div>
        </div>

        <!-- Katılımcılar (toggle) -->
        <div class="mc-card-footer">
            <button class="mc-player-count mc-player-count-btn" onclick="mcToggleParticipants('${_mcEsc(mid)}')">
                <i class="fa-solid fa-user-group"></i> ${pCount} oyuncu
                <i class="fa-solid fa-chevron-down mc-chevron"></i>
            </button>
        </div>
        <div id="mc-participants-${_mcEsc(mid)}" class="mc-participants-panel" style="display:none;"></div>
        ${m.notes ? `<div class="mc-card-notes"><i class="fa-regular fa-note-sticky"></i> ${_mcEsc(m.notes)}</div>` : ''}
        ${scoreForm}
    </div>`;
}

// ── Skor Girişi ───────────────────────────────────────────────────
window.mcOpenScoreEntry = function (matchId) {
    document.querySelectorAll('.mc-score-form').forEach(f => { f.style.display = 'none'; });
    const card = document.getElementById('mc-card-' + matchId);
    if (card) card.querySelector('.mc-score-entry-btn')?.style.setProperty('display', 'none');
    const form = document.getElementById('mc-score-form-' + matchId);
    if (form) { form.style.display = 'block'; form.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
};

window.mcCloseScoreEntry = function (matchId) {
    const form = document.getElementById('mc-score-form-' + matchId);
    if (form) form.style.display = 'none';
    const card = document.getElementById('mc-card-' + matchId);
    if (card) {
        const btn = card.querySelector('.mc-score-entry-btn');
        if (btn) btn.style.removeProperty('display');
    }
};

window.mcSubmitScore = async function (matchId, teamSide) {
    const homeScore = parseInt(document.getElementById('mc-hs-' + matchId)?.value, 10) || 0;
    const awayScore = parseInt(document.getElementById('mc-as-' + matchId)?.value, 10) || 0;
    const btn = document.querySelector(`#mc-score-form-${matchId} .btn-success-sm`);

    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; }

    try {
        const userId = _mcGetUserId();
        if (!userId) throw new Error('Oturum açmanız gerekiyor.');

        // 1. Skoru kaydet (status → finished)
        const matchData = await DB.Matches.updateScore(matchId, homeScore, awayScore, userId);

        // 2. Her iki takımın tüm üyelerini match_players'a ekle
        await DB.Matches.autoPopulateTeamPlayers(matchId).catch(e => console.warn('autoPopulate:', e));

        // 3. Takım istatistiklerini güncelle (JS fallback — SQL trigger yoksa da çalışır)
        try {
            if (matchData?.home_team_id) {
                const homeWin  = homeScore > awayScore;
                const homeDraw = homeScore === awayScore;
                const homeLoss = homeScore < awayScore;
                await _mcUpdateTeamStats(matchData.home_team_id, homeWin, homeDraw, homeLoss, homeScore, awayScore);
            }
            if (matchData?.away_team_id) {
                const awayWin  = awayScore > homeScore;
                const awayDraw = awayScore === homeScore;
                const awayLoss = awayScore < homeScore;
                await _mcUpdateTeamStats(matchData.away_team_id, awayWin, awayDraw, awayLoss, awayScore, homeScore);
            }
        } catch(statsErr) {
            console.warn('Team stats update (JS fallback) failed:', statsErr);
        }

        // 4. Feed'e maç sonucu postu oluştur
        try {
            const card = document.getElementById('mc-card-' + matchId);
            const teamNames = card ? Array.from(card.querySelectorAll('.mc-matchup-team')).map(e => e.textContent) : [];
            const homeTeamName = teamNames[0] || 'Ev Sahibi';
            const awayTeamName = teamNames[1] || 'Deplasman';
            const winner = homeScore > awayScore ? homeTeamName : awayScore > homeScore ? awayTeamName : null;
            const resultText = winner
                ? `🏆 ${winner} kazandı! ${homeTeamName} ${homeScore} - ${awayScore} ${awayTeamName} #MaçSonucu`
                : `🤝 Berabere! ${homeTeamName} ${homeScore} - ${awayScore} ${awayTeamName} #MaçSonucu`;
            await DB.Feed.createPost(userId, resultText, 'match_result', { related_match_id: matchId })
                .catch(e => console.error('Feed post (match) error:', e));
        } catch(_) {}

        if (typeof showToast === 'function') showToast('Skor kaydedildi!');

        await _mcLoadMatches();

        // 5. Puanlanacak oyuncu varsa PMR modal'ı aç
        setTimeout(async () => {
            const statuses = await DB.Ratings.getMatchRatingStatuses(userId, [matchId]).catch(() => ({}));
            if (statuses[matchId] === 'pending') {
                if (typeof openPostMatchRatingModal === 'function') {
                    openPostMatchRatingModal(matchId, teamSide || 'home');
                }
            }
        }, 800);

    } catch (e) {
        console.error('mcSubmitScore error:', e);
        if (typeof showToast === 'function') showToast('Hata: ' + (e.message || 'Kaydedilemedi'));
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check"></i> Onayla'; }
    }
};

// Takım istatistiklerini JS tarafında güncelle (SQL trigger yoksa fallback)
async function _mcUpdateTeamStats(teamId, isWin, isDraw, isLoss, scored, conceded) {
    if (!teamId || !window.sbClient) return;
    try {
        const { data: team, error } = await window.sbClient
            .from('teams')
            .select('total_wins,total_draws,total_losses,total_goals_scored,total_goals_conceded')
            .eq('id', teamId)
            .single();
        if (error || !team) return; // SQL trigger bunu halleder

        await window.sbClient.from('teams').update({
            total_wins:           (team.total_wins   || 0) + (isWin  ? 1 : 0),
            total_draws:          (team.total_draws  || 0) + (isDraw ? 1 : 0),
            total_losses:         (team.total_losses || 0) + (isLoss ? 1 : 0),
            total_goals_scored:   (team.total_goals_scored   || 0) + scored,
            total_goals_conceded: (team.total_goals_conceded || 0) + conceded,
            updated_at: new Date().toISOString()
        }).eq('id', teamId);
    } catch(e) {
        console.warn('_mcUpdateTeamStats error:', e);
    }
}

// ── Maç İptali ────────────────────────────────────────

window.mcCancelMatch = async function (matchId) {
    if (!confirm('Bu maçı iptal etmek istediğinize emin misiniz?')) return;

    try {
        const userId = _mcGetUserId();
        if (!userId) throw new Error('Oturum açmanız gerekiyor.');

        await DB.Matches.cancelMatch(matchId, userId);
        if (typeof showToast === 'function') showToast('Maç iptal edildi.');
        await _mcLoadMatches();
    } catch (e) {
        console.error('mcCancelMatch error:', e);
        if (typeof showToast === 'function') showToast('Hata: ' + (e.message || 'İptal edilemedi'));
    }
};

// ── İstatistik Modalı ────────────────────────────────

let _statMatchId = null;

function _statInjectDOM() {
    if (document.getElementById('stats-modal-overlay')) return;
    const div = document.createElement('div');
    div.innerHTML = `
    <div id="stats-modal-overlay" class="stats-overlay" onclick="if(event.target===this)closeStatsModal()">
        <div class="stats-box">
            <div class="stats-header">
                <span id="stats-modal-title">İSTATİSTİK GİRİŞİ</span>
                <button class="stats-close-btn" onclick="closeStatsModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="stats-match-info" id="stats-match-info"></div>
            <div class="stats-body" id="stats-body">
                <div class="empty-state-sm"><i class="fa-solid fa-spinner fa-spin"></i> Yükleniyor…</div>
            </div>
            <div class="stats-footer">
                <button class="btn-sm btn-success-sm stats-save-btn" id="stats-save-btn" onclick="mcSubmitStats()">
                    <i class="fa-solid fa-floppy-disk"></i> Kaydet
                </button>
                <button class="btn-sm btn-outline-sm" onclick="closeStatsModal()">Kapat</button>
            </div>
        </div>
    </div>`;
    document.body.appendChild(div.firstElementChild);
}

window.openStatsModal = async function (matchId, homeScore, awayScore, homeTeam, awayTeam) {
    _statInjectDOM();
    _statMatchId = matchId;

    const overlay = document.getElementById('stats-modal-overlay');
    const body    = document.getElementById('stats-body');
    const info    = document.getElementById('stats-match-info');

    overlay.style.display = 'flex';
    setTimeout(() => overlay.classList.add('visible'), 10);

    info.innerHTML = `<span class="stats-team">${_mcEsc(homeTeam)}</span>
        <span class="stats-score-display">${homeScore} — ${awayScore}</span>
        <span class="stats-team">${_mcEsc(awayTeam)}</span>`;
    body.innerHTML = '<div class="empty-state-sm"><i class="fa-solid fa-spinner fa-spin"></i> Oyuncular yükleniyor…</div>';

    const players = await DB.Matches.getMatchPlayers(matchId);

    if (!players.length) {
        body.innerHTML = '<div class="empty-state-sm">Bu maçta kayıtlı oyuncu bulunamadı.</div>';
        return;
    }

    const home = players.filter(p => p.team_side === 'home');
    const away = players.filter(p => p.team_side !== 'home');

    let html = '';
    if (home.length) {
        html += `<div class="stats-group-label"><i class="fa-solid fa-house"></i> ${_mcEsc(homeTeam)}</div>`;
        html += home.map(p => _statPlayerRow(p)).join('');
    }
    if (away.length) {
        html += `<div class="stats-group-label" style="margin-top:1rem;"><i class="fa-solid fa-plane"></i> ${_mcEsc(awayTeam)}</div>`;
        html += away.map(p => _statPlayerRow(p)).join('');
    }
    body.innerHTML = html;
};

function _statPlayerRow(mp) {
    const p       = mp.player;
    const avatar  = p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.username || 'x')}`;
    const name    = _mcEsc(p.username || 'Oyuncu');
    const goals   = mp.goals ?? 0;
    const assists = mp.assists ?? 0;
    const og      = mp.own_goals ?? 0;
    const perf    = mp.performance_rating ?? '';

    return `
    <div class="stats-player-row" data-mp-id="${_mcEsc(mp.id)}">
        <img class="stats-avatar" src="${_mcEsc(avatar)}" alt="${name}">
        <span class="stats-name">${name}</span>
        <div class="stats-inputs">
            <label class="stats-inp-group">
                <span>Gol</span>
                <input type="number" class="stats-inp" name="goals" value="${goals}" min="0" max="30">
            </label>
            <label class="stats-inp-group">
                <span>Asist</span>
                <input type="number" class="stats-inp" name="assists" value="${assists}" min="0" max="30">
            </label>
            <label class="stats-inp-group">
                <span>KK</span>
                <input type="number" class="stats-inp" name="own_goals" value="${og}" min="0" max="10">
            </label>
            <label class="stats-inp-group">
                <span>Perf</span>
                <input type="number" class="stats-inp stats-inp-perf" name="performance_rating"
                    value="${perf}" min="1" max="10" step="0.1" placeholder="—">
            </label>
        </div>
    </div>`;
}

window.mcSubmitStats = async function () {
    const btn = document.getElementById('stats-save-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kaydediliyor…'; }

    try {
        const rows = document.querySelectorAll('#stats-body .stats-player-row');
        const updates = Array.from(rows).map(row => {
            const mpId = row.dataset.mpId;
            const get  = name => {
                const inp = row.querySelector(`input[name="${name}"]`);
                return inp ? (parseFloat(inp.value) || 0) : 0;
            };
            const perfVal = parseFloat(row.querySelector('input[name="performance_rating"]')?.value);
            return {
                matchPlayerId:      mpId,
                goals:              get('goals'),
                assists:            get('assists'),
                own_goals:          get('own_goals'),
                performance_rating: isNaN(perfVal) ? null : perfVal
            };
        });

        await Promise.all(
            updates.map(u => DB.Matches.updatePlayerStats(u.matchPlayerId, u))
        );

        if (typeof showToast === 'function') showToast('İstatistikler kaydedildi!');
        closeStatsModal();
        await _mcLoadMatches();

    } catch (e) {
        console.error('mcSubmitStats error:', e);
        if (typeof showToast === 'function') showToast('Hata: ' + (e.message || 'Kaydedilemedi'));
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Kaydet'; }
    }
};

window.closeStatsModal = function () {
    const overlay = document.getElementById('stats-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('visible');
    setTimeout(() => { overlay.style.display = 'none'; }, 220);
};

// ── Katılımcı Paneli ─────────────────────────────────

window.mcToggleParticipants = async function (matchId) {
    const panel = document.getElementById('mc-participants-' + matchId);
    if (!panel) return;

    if (panel.style.display !== 'none') {
        panel.style.display = 'none';
        return;
    }

    if (!panel.dataset.loaded) {
        panel.innerHTML = '<div style="padding:0.5rem;color:#555;font-size:0.8rem;"><i class="fa-solid fa-spinner fa-spin"></i> Yükleniyor…</div>';
        panel.style.display = 'block';
        const players = await DB.Matches.getMatchPlayers(matchId);
        panel.innerHTML = _mcRenderParticipants(players);
        panel.dataset.loaded = '1';
    } else {
        panel.style.display = 'block';
    }
};

function _mcRenderParticipants(players) {
    if (!players.length) {
        return '<div style="padding:0.5rem;color:#555;font-size:0.8rem;">Henüz katılımcı yok.</div>';
    }
    const home = players.filter(p => p.team_side === 'home');
    const away = players.filter(p => p.team_side !== 'home');

    function group(list, label) {
        if (!list.length) return '';
        const chips = list.map(mp => {
            const pl = mp.player;
            const avatar = pl.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(pl.username || 'x')}`;
            const goalBadge  = mp.goals   > 0 ? `<span class="mc-part-goal">⚽ ${mp.goals}</span>`  : '';
            const assistBadge = mp.assists > 0 ? `<span class="mc-part-assist">🎯 ${mp.assists}</span>` : '';
            return `<div class="mc-participant-chip">
                <img class="mc-participant-avatar" src="${_mcEsc(avatar)}" alt="${_mcEsc(pl.username || '')}">
                <span class="mc-participant-name">${_mcEsc(pl.username || 'Oyuncu')}</span>
                ${goalBadge}${assistBadge}
            </div>`;
        }).join('');
        return `<div class="mc-participants-group">
            <span class="mc-participants-side-label">${label}</span>
            <div class="mc-participants-chips">${chips}</div>
        </div>`;
    }

    return `<div class="mc-participants-inner">
        ${group(home, '<i class="fa-solid fa-house"></i> Ev Sahibi')}
        ${group(away, '<i class="fa-solid fa-plane"></i> Deplasman')}
    </div>`;
}

// ── Ayrıl ────────────────────────────────────────────

window.mcLeaveMatch = async function (matchId) {
    if (!confirm('Bu maçtan ayrılmak istediğinize emin misiniz?')) return;
    try {
        const userId = _mcGetUserId();
        if (!userId) throw new Error('Oturum açmanız gerekiyor.');
        await DB.Matches.leaveMatch(matchId, userId);
        if (typeof showToast === 'function') showToast('Maçtan ayrıldınız.');
        await _mcLoadMatches();
    } catch (e) {
        console.error('mcLeaveMatch error:', e);
        if (typeof showToast === 'function') showToast('Hata: ' + (e.message || 'Ayrılamadı'));
    }
};

// ── Açık Maçlar Sekmesi ──────────────────────────────

window.mcLoadOpenMatches = async function () {
    const listEl = document.getElementById('mc-open-list');
    if (!listEl) return;

    const userId = _mcGetUserId();
    if (!userId) {
        listEl.innerHTML = '<div class="empty-state-sm">Oturum açmanız gerekiyor.</div>';
        return;
    }

    listEl.innerHTML = '<div class="empty-state-sm"><i class="fa-solid fa-spinner fa-spin"></i> Yükleniyor…</div>';

    // Her zaman güncel userId ile takımları yeniden çek
    _mcMyTeams = await DB.Teams.getMyTeams(userId).catch(() => []);

    // Dropdown'u da güncelle (MPA sayfasında init erken çalışmış olabilir)
    const homeSelect = document.getElementById('mc-home-team-select');
    if (homeSelect && _mcMyTeams.length) {
        homeSelect.innerHTML = '<option value="">— Takım seçin —</option>' +
            _mcMyTeams.map(t => `<option value="${_mcEsc(t.id)}">${_mcEsc(t.name)}</option>`).join('');
    }

    if (!_mcMyTeams.length) {
        listEl.innerHTML = `<div class="mc-empty-state">
            <i class="fa-solid fa-users-slash"></i>
            <p>Herhangi bir takımda değilsin.</p>
            <span>Takımına katılarak maçları buradan görebilirsin.</span>
        </div>`;
        return;
    }

    listEl.innerHTML = '<div class="empty-state-sm"><i class="fa-solid fa-spinner fa-spin"></i> Yükleniyor…</div>';

    const teamIds = _mcMyTeams.map(t => t.id);
    const openMatches = await DB.Matches.getTeamOpenMatches(teamIds, userId).catch(() => []);

    if (!openMatches.length) {
        listEl.innerHTML = `<div class="mc-empty-state">
            <i class="fa-solid fa-calendar-check"></i>
            <p>Katılabileceğin açık maç yok.</p>
            <span>Takımından birisi maç oluşturunca burada görünür.</span>
        </div>`;
        return;
    }

    const matchIds = openMatches.map(m => m.id);
    const playerCounts = await DB.Matches.getPlayerCounts(matchIds).catch(() => ({}));

    listEl.innerHTML = openMatches.map(m => _mcOpenMatchCard(m, playerCounts)).join('');
};

function _mcOpenMatchCard(m, playerCounts) {
    const mid       = m.id;
    const homeTeam  = m.home_team?.name || 'Ev Sahibi';
    const awayTeam  = m.away_team?.name || 'Deplasman';
    const venueName = m.venue
        ? (m.venue.name + (m.venue.district ? ', ' + m.venue.district : ''))
        : 'Saha bilinmiyor';
    const date      = m.scheduled_at
        ? new Date(m.scheduled_at).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })
        : '—';
    const pCount    = playerCounts[mid] || 0;
    const matchType = m.match_type ? `<span class="mc-match-type">${_mcEsc(m.match_type)}</span>` : '';

    return `
    <div class="mc-match-card mc-open-card glass-card">
        <div class="mc-card-top">
            <div class="mc-card-meta">
                <span class="mc-status-badge mc-status-open">Açık</span>
                ${matchType}
                <button class="mc-player-count mc-player-count-btn" onclick="mcToggleOpenParticipants('${_mcEsc(mid)}')">
                    <i class="fa-solid fa-user-group"></i> ${pCount} oyuncu
                </button>
                <span class="mc-card-date"><i class="fa-regular fa-calendar"></i> ${date}</span>
            </div>
            <button class="btn-sm mc-join-btn" onclick="mcJoinOpen('${_mcEsc(mid)}')">
                <i class="fa-solid fa-right-to-bracket"></i> Katıl
            </button>
        </div>
        <div class="mc-card-teams">
            <span class="mc-team-name">${_mcEsc(homeTeam)}</span>
            <div class="mc-score mc-score-pending"><span class="mc-score-sep">vs</span></div>
            <span class="mc-team-name">${_mcEsc(awayTeam)}</span>
        </div>
        <div class="mc-card-venue"><i class="fa-solid fa-location-dot"></i> ${_mcEsc(venueName)}</div>
        ${m.notes ? `<div class="mc-card-notes"><i class="fa-regular fa-note-sticky"></i> ${_mcEsc(m.notes)}</div>` : ''}
        <div id="mc-open-participants-${_mcEsc(mid)}" class="mc-participants-panel" style="display:none;"></div>
    </div>`;
}

window.mcToggleOpenParticipants = async function (matchId) {
    const panel = document.getElementById('mc-open-participants-' + matchId);
    if (!panel) return;
    if (panel.style.display !== 'none') { panel.style.display = 'none'; return; }
    if (!panel.dataset.loaded) {
        panel.innerHTML = '<div style="padding:0.5rem;color:#555;font-size:0.8rem;"><i class="fa-solid fa-spinner fa-spin"></i></div>';
        panel.style.display = 'block';
        const players = await DB.Matches.getMatchPlayers(matchId);
        panel.innerHTML = _mcRenderParticipants(players);
        panel.dataset.loaded = '1';
    } else {
        panel.style.display = 'block';
    }
};

window.mcJoinOpen = async function (matchId) {
    const btn = document.querySelector(`[onclick="mcJoinOpen('${matchId}')"]`);
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; }
    try {
        const userId = _mcGetUserId();
        if (!userId) throw new Error('Oturum açmanız gerekiyor.');
        await DB.Matches.joinMatch(matchId, userId, 'home');
        if (typeof showToast === 'function') showToast('Maça katıldınız!');
        await Promise.all([_mcLoadMatches(), window.mcLoadOpenMatches()]);
        // Katıldıktan sonra "Maçlarım" sekmesine geç
        const firstBtn = document.querySelector('.mc-tab-btn');
        if (firstBtn) mcSwitchTab('my-matches', firstBtn);
    } catch (e) {
        console.error('mcJoinOpen error:', e);
        if (typeof showToast === 'function') showToast('Hata: ' + (e.message || 'Katılınamadı'));
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Katıl'; }
    }
};

// ── Sekme & Form ─────────────────────────────────────

window.mcSwitchTab = function (tab, btn) {
    if ((tab === 'create' || tab === 'create-match') && _mcMyTeams.length === 0) {
        if (typeof showToast === 'function') showToast('Maç oluşturmak için bir takıma üye olman gerekiyor.');
        return;
    }
    document.querySelectorAll('.mc-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.mc-tab-content').forEach(c => { c.style.display = 'none'; });
    if (btn) btn.classList.add('active');
    const el = document.getElementById('mc-tab-' + tab);
    if (el) el.style.display = 'block';
    if (tab === 'open-matches') window.mcLoadOpenMatches();
    if (tab === 'create' || tab === 'create-match') window._mcInitDateInput();
};

// Maç oluşturma formunda tarih input'unu bugün + 1 saat olarak ayarla
window._mcInitDateInput = function () {
    const el = document.getElementById('mc-date-input');
    if (!el) return;
    // Zaten dolu ise dokunma
    if (el.value) return;
    // Yerel saat: YYYY-MM-DDTHH:mm formatı
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0); // +1 saat, saniyeleri sıfırla
    const pad = n => String(n).padStart(2, '0');
    const localStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    el.value = localStr;
    // min değerini bugün olarak ayarla (geçmiş tarih seçimi engelle)
    const minNow = new Date();
    const minStr = `${minNow.getFullYear()}-${pad(minNow.getMonth()+1)}-${pad(minNow.getDate())}T${pad(minNow.getHours())}:${pad(minNow.getMinutes())}`;
    el.min = minStr;
    el.max = '2030-12-31T23:59';
};

window.mcSubmitCreate = async function () {
    const btn = document.getElementById('mc-submit-btn');
    const venueText  = (document.getElementById('mc-venue-input')?.value || '').trim();
    const dateVal    = document.getElementById('mc-date-input')?.value;
    const matchType  = document.getElementById('mc-type-select')?.value || '5v5';
    const homeTeamId = document.getElementById('mc-home-team-select')?.value || null;
    const notes      = (document.getElementById('mc-notes-input')?.value || '').trim();

    if (!dateVal) {
        if (typeof showToast === 'function') showToast('Lütfen tarih ve saat girin.');
        return;
    }

    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Oluşturuluyor…'; }

    try {
        const userId = _mcGetUserId();
        if (!userId) throw new Error('Oturum açmanız gerekiyor.');

        const awayTeamId   = _mcSelectedAwayTeam?.id || null;
        const awayCapId    = _mcSelectedAwayTeam?.captainId || null;
        const awayTeamName = _mcSelectedAwayTeam?.name || null;

        // Rakip takım seçilmediyse text input'tan al ve notes'a ekle
        const awayFallback = !awayTeamId
            ? (document.getElementById('mc-away-team-input')?.value || '').trim()
            : null;
        const fullNotes = [notes, awayFallback ? 'Rakip: ' + awayFallback : ''].filter(Boolean).join('\n') || null;

        // datetime-local değeri 'YYYY-MM-DDTHH:mm' formatında gelir.
        // new Date() doğrudan bu string'i UTC'den parse eder ama local timezone
        // farkı nedeniyle yanlış tarih üretebilir.
        // Güvenli parse: string'i direkt ISO formatına dönüştür.
        const safeDateStr = dateVal.includes('T') ? dateVal + ':00' : dateVal;
        const parsedDate = new Date(safeDateStr);
        if (isNaN(parsedDate.getTime())) {
            showToast?.('Geçersiz tarih formatı. Lütfen takvimden seçin.');
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check"></i> Maç Oluştur'; }
            return;
        }

        if (parsedDate < new Date()) {
            showToast?.('Geçmiş tarihe maç oluşturamazsın!');
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check"></i> Maç Oluştur'; }
            return;
        }
        const selectedYear = parsedDate.getFullYear();
        if (selectedYear < 2024 || selectedYear > 2030) {
            showToast?.('Lütfen geçerli bir yıl seçin (2024–2030).');
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check"></i> Maç Oluştur'; }
            return;
        }

        // Saha metni girilmişse yeni venue oluştur
        let venueId = null;
        if (venueText) {
            try {
                const newVenue = await DB.Venues.add(userId, { name: venueText });
                venueId = newVenue?.id || null;
            } catch (e) { /* venue oluşturulamadıysa devam et */ }
        }

        const matchPayload = {
            scheduled_at: parsedDate.toISOString(),
            match_type:   matchType,
            status:       'scheduled'
        };
        if (venueId)    matchPayload.venue_id     = venueId;
        if (homeTeamId) matchPayload.home_team_id = homeTeamId;
        if (awayTeamId) matchPayload.away_team_id = awayTeamId;
        if (fullNotes)  matchPayload.notes        = fullNotes;

        const created = await DB.Matches.create(userId, matchPayload);

        // Maç oluşturucuyu (ev sahibi) ekle
        await DB.Matches.joinMatch(created.id, userId, 'home').catch(() => {});

        // Rakip takım kaptanını otomatik olarak deplasman tarafına ekle
        if (awayCapId) {
            await DB.Matches.joinMatch(created.id, awayCapId, 'away').catch(() => {});
        }

        // Rakip takım kaptanına davet bildirimi gönder
        if (awayCapId && awayTeamName) {
            const matchDate = new Date(dateVal).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
            await DB.Notifications.send(
                awayCapId,
                'match_invite',
                'Maç Daveti',
                `${matchDate} tarihinde takımınıza maç daveti gönderildi.`,
                userId,
                created.id
            ).catch(() => {});
        }

        if (typeof showToast === 'function') {
            showToast(awayCapId ? 'Maç oluşturuldu, davet gönderildi!' : 'Maç oluşturuldu!');
        }

        // Formu sıfırla
        document.getElementById('mc-date-input').value = '';
        const venueInp = document.getElementById('mc-venue-input');
        if (venueInp) venueInp.value = '';
        document.getElementById('mc-away-team-input').value = '';
        document.getElementById('mc-notes-input').value = '';
        mcClearAwayTeam();

        const firstBtn = document.querySelector('.mc-tab-btn');
        mcSwitchTab('my-matches', firstBtn);
        await _mcLoadMatches();

    } catch (e) {
        console.error('mcSubmitCreate error:', e);
        if (typeof showToast === 'function') showToast('Hata: ' + (e.message || 'Oluşturulamadı'));
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check"></i> Maç Oluştur'; }
    }
};

// ── Rakip Takım Arama ────────────────────────────────

window.mcSearchAwayTeam = function (query) {
    _mcSelectedAwayTeam = null;
    const resultsEl = document.getElementById('mc-away-results');
    clearTimeout(_mcSearchTimeout);

    if (!query || query.trim().length < 1) {
        if (resultsEl) resultsEl.style.display = 'none';
        return;
    }

    _mcSearchTimeout = setTimeout(async () => {
        const ownIds = new Set(_mcMyTeams.map(t => t.id));
        const results = await DB.Teams.search(query.trim(), 8).catch(() => []);
        const filtered = results.filter(t => !ownIds.has(t.id));

        if (!resultsEl) return;
        if (!filtered.length) {
            resultsEl.innerHTML = '<div class="mc-away-no-results"><i class="fa-solid fa-magnifying-glass"></i> Takım bulunamadı</div>';
        } else {
            resultsEl.innerHTML = filtered.map(t => `
                <div class="mc-away-result-item" onclick="mcSelectAwayTeam('${_mcEsc(t.id)}','${_mcEsc(t.name)}','${_mcEsc(t.captain?.id || '')}','${_mcEsc(t.captain?.username || '')}')">
                    <i class="fa-solid fa-shield" style="color:var(--neon-cyan);font-size:0.8rem;"></i>
                    <span class="mc-away-result-name">${_mcEsc(t.name)}</span>
                    ${t.captain ? `<span class="mc-away-result-cap">Kpt: ${_mcEsc(t.captain.username)}</span>` : ''}
                </div>`).join('');
        }
        resultsEl.style.display = 'block';
    }, 280);
};

window.mcSelectAwayTeam = function (teamId, teamName, captainId, captainName) {
    _mcSelectedAwayTeam = { id: teamId, name: teamName, captainId: captainId || null };

    const input     = document.getElementById('mc-away-team-input');
    const resultsEl = document.getElementById('mc-away-results');
    const selectedEl = document.getElementById('mc-away-selected');

    if (input) input.value = teamName;
    if (resultsEl) resultsEl.style.display = 'none';
    if (selectedEl) {
        selectedEl.innerHTML = `
            <div class="mc-away-tag">
                <i class="fa-solid fa-shield"></i>
                <span>${_mcEsc(teamName)}</span>
                ${captainId ? `<span class="mc-away-tag-notif"><i class="fa-solid fa-bell"></i> Davet gönderilecek</span>` : ''}
                <button class="mc-away-clear-btn" onclick="mcClearAwayTeam()"><i class="fa-solid fa-xmark"></i></button>
            </div>`;
        selectedEl.style.display = 'block';
    }
};

window.mcClearAwayTeam = function () {
    _mcSelectedAwayTeam = null;
    const input = document.getElementById('mc-away-team-input');
    const selectedEl = document.getElementById('mc-away-selected');
    const resultsEl = document.getElementById('mc-away-results');
    if (input) input.value = '';
    if (selectedEl) { selectedEl.innerHTML = ''; selectedEl.style.display = 'none'; }
    if (resultsEl) resultsEl.style.display = 'none';
};

window._mcRefresh = async function () {
    _mcDropdownsLoaded = false;
    if (typeof initMatchCenter === 'function') await initMatchCenter();
};

})();


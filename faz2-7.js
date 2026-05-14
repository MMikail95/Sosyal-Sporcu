
// ======================================================
// FAZ 2-7: Takımım Kapsamlı Yönetim Modülü
// ======================================================

// Supabase Faz 2 Uyum Sağlayıcı
window.getTeamPlayers = window.getTeamPlayers || function() {
    if (window._tmState && _tmState.members && _tmState.members.length > 0) {
        return _tmState.members.map(m => {
            const p = m.player || {};
            // Geriye dönük uyumluluk için
            p.details = p.details || { pos: p.ana_mevki || p.position || 'OS', oyunTarzi: 'Dengeli', dakiklik: 'Vaktinde', sahaIletisim: 'Orta', pasTercihi: 'Kısa Pas', macSonu: 'Sohbet' };
            p.name = p.username || 'İsimsiz';
            return p;
        }).filter(Boolean);
    }
    return [];
};

window._getPInfo = function(p) {
    if (!p) return { id:'', name:'', pos:'OS', posKey:'OS', col:'#aaa', avatar:'', details:{} };
    const id = p.id || p.supabase_id;
    const name = p.username || p.name || 'Oyuncu';
    const rawPos = p.ana_mevki || p.position || p.details?.pos || 'OS';
    const posKey = rawPos.includes('Kaleci') || rawPos === 'KL' ? 'KL' : 
                   rawPos.includes('Stoper') || rawPos.includes('Bek') || rawPos === 'DEF' ? 'DEF' : 
                   rawPos.includes('Forvet') || rawPos === 'FV' ? 'FV' : 'OS';
    const posColors = { KL: '#ffd700', DEF: '#00e5ff', OS: '#00ff88', FV: '#ff007f' };
    return {
        id, name, pos: rawPos, posKey, col: posColors[posKey] || '#aaa',
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
                        const gen = calcPlayerGEN(p);
                        const pInfo = _getPInfo(p);
                        const isCore = coreSquad.includes(pInfo.id);
                        const isCap = pInfo.id === t.captain_id;
                        return `
                        <div class="kadro-table-row ${isCore ? 'is-core-row' : ''}" id="krow-${pInfo.id}">
                            <span class="krow-rank">${i + 1}</span>
                            <span class="krow-player" onclick="viewPlayerFromTeam('${pInfo.id}')">
                                <img src="${pInfo.avatar}" class="krow-avatar">
                                <span class="krow-name">
                                    ${pInfo.name}
                                    ${isCap ? '<i class="fa-solid fa-crown" style="color:#ffd700; font-size:0.7rem;" title="Kaptan"></i>' : ''}
                                </span>
                            </span>
                            <span class="krow-pos" style="color:${pInfo.col};">
                                ${posLabels[pInfo.posKey] || pInfo.pos}
                            </span>
                            <span class="krow-gen" style="color:${gen >= 80 ? 'var(--neon-green)' : gen >= 70 ? '#ffd700' : 'orange'};">
                                ${gen}
                            </span>
                            <span class="krow-core">
                                ${isCapOrAdmin ? `
                                <label class="core-toggle-switch" title="${isCore ? 'Kemik Kadroda' : 'Kemik Kadro Dışı'}">
                                    <input type="checkbox" ${isCore ? 'checked' : ''} 
                                           onchange="toggleCoreSquad('${p.id}', this.checked)">
                                    <span class="core-toggle-slider"></span>
                                </label>` : `
                                <span class="${isCore ? 'core-dot-on' : 'core-dot-off'}" 
                                      title="${isCore ? 'Kemik Kadro' : 'Yedek'}"></span>`}
                            </span>
                            ${isCapOrAdmin ? `
                            <span class="krow-actions">
                                <button class="btn-icon-sm btn-danger-ghost" 
                                        onclick="removeFromTeam('${p.id}')"
                                        title="Takımdan Çıkar" ${isCap ? 'disabled title="Kaptan çıkarılamaz"' : ''}>
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
};

let pitchDragState = {
    draggingId: null,
    formation: '3-2-1',
    assignments: {}, // posId -> playerId
    customPositions: {}, // posId -> {x, y}
};

function loadPitchState() {
    const saved = localStorage.getItem('ss_pitch_v2');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            pitchDragState.formation    = data.formation    || '3-2-1';
            pitchDragState.assignments  = data.assignments  || {};
            pitchDragState.customPositions = data.customPositions || {};
        } catch(e) {}
    }
}

function savePitchState() {
    localStorage.setItem('ss_pitch_v2', JSON.stringify({
        formation: pitchDragState.formation,
        assignments: pitchDragState.assignments,
        customPositions: pitchDragState.customPositions
    }));
}

window.renderSahaTab = function () {
    const c = document.getElementById('ttab-saha-content');
    if (!c) return;
    try {

    // FAZ 2: _tmState.members kullan (Supabase), eski getTeamPlayers() fallback
    const getMembers = () => {
        if (window._tmState && _tmState.members && _tmState.members.length) {
            return _tmState.members.map(m => m.player).filter(Boolean);
        }
        return typeof getTeamPlayers === 'function' ? getTeamPlayers() : [];
    };

    const getPlayerGenFromMember = (p) => {
        if (!p) return 70;
        if (p.rating_teknik !== undefined) {
            const vals = [p.rating_teknik, p.rating_sut, p.rating_pas,
                          p.rating_hiz, p.rating_fizik, p.rating_kondisyon].map(v => v || 70);
            return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        }
        return typeof calcPlayerGEN === 'function' ? calcPlayerGEN(p) : 70;
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
            const genColor = gen >= 80 ? '#00ff88' : gen >= 70 ? '#ffd700' : '#ff6b35';

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
                  <div class="psn-gen" style="background:${genColor}; color:#000">${gen}</div>
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
            const pos = p.ana_mevki || p.position || (p.details && p.details.pos) || 'OS';
            const posColors = { KL: '#ffd700', DEF: '#4fc3f7', OS: '#69f0ae', FV: '#ff5252' };
            const posKey = pos.includes('Kaleci') ? 'KL' : pos.includes('Stoper') || pos.includes('Bek') ? 'DEF' : pos.includes('Forvet') || pos.includes('Santrafor') ? 'FV' : 'OS';
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
              <span class="psn-bench-gen" style="color:${genColor}">${gen}</span>
            </div>`;
        }).join('');
    };

    c.innerHTML = `
    <div class="psn-wrapper">

      <!-- Formasyon Seçici -->
      <div class="glass-card psn-formation-card">
        <div class="psn-section-title">
          <i class="fa-solid fa-sliders" style="color:var(--neon-green)"></i> FORMASYON
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
            // Sadece slotları yeniden çiz
            document.querySelectorAll('.pitch-slot-new').forEach(el => el.remove());
            slotsContainer.insertAdjacentHTML('beforeend', renderSlots());
        }
        const bench = document.getElementById('psn-bench');
        if (bench) bench.innerHTML = renderBench();
        const lbl = slotsContainer?.querySelector('.psn-formation-label');
        if (lbl) lbl.textContent = pitchDragState.formation;
    };
    } catch(e) {
        c.innerHTML = `<div style="padding:2rem;color:#ff5555;background:#222;border-radius:10px;"><b>Saha Sekmesi Hatası:</b> ${e.message}<br>${e.stack}</div>`;
        console.error("renderSahaTab Error:", e);
    }
};

// Yeni auto-fill (Supabase üyelerini destekler)
window.psn_autoFill = function() {
    const formation = FORMATIONS_7V7[pitchDragState.formation];
    if (!formation) return;

    const getMembers = () => {
        if (window._tmState && _tmState.members && _tmState.members.length) {
            return _tmState.members.map(m => m.player).filter(Boolean);
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

    // Mevki eşleştirme
    const mapPos = (p) => {
        const pos = p.ana_mevki || p.position || (p.details && p.details.pos) || 'OS';
        if (pos.includes('Kaleci') || pos === 'KL') return 'KL';
        if (pos.includes('Stoper') || pos.includes('Bek') || pos.includes('Libero') || pos === 'DEF') return 'DEF';
        if (pos.includes('Forvet') || pos.includes('Santrafor') || pos === 'FV') return 'FV';
        return 'OS';
    };

    const byPos = { KL: [], DEF: [], OS: [], FV: [] };
    sorted.forEach(p => { byPos[mapPos(p)].push(p.id || p.supabase_id); });

    formation.positions.forEach(pos => {
        const group = byPos[pos.pos];
        const available = group?.find(id => !Object.values(pitchDragState.assignments).includes(id));
        if (available) { pitchDragState.assignments[pos.id] = available; return; }
        const any = sorted.find(p => !Object.values(pitchDragState.assignments).includes(p.id || p.supabase_id));
        if (any) pitchDragState.assignments[pos.id] = any.id || any.supabase_id;
    });

    savePitchState();
    if (typeof refreshPitchUI === 'function') refreshPitchUI();
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
            <span class="bench-gen" style="color:${gen>=80?'var(--neon-green)':'orange'}">${gen}</span>
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
    if (slot) slot.classList.remove('drag-over');

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

window.savePitchAndShowToast = function() {
    savePitchState();
    showToast('✅ Saha düzeni kaydedildi!');
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
        const pInfo  = _getPInfo(p);
        const gen    = calcPlayerGEN(p);
        const inCore = coreSquad.includes(pInfo.id);
        return `
        <label class="pool-player-item ${inCore ? 'in-core' : ''}" id="pool-item-${pInfo.id}" style="position:relative;">
            <input type="checkbox" class="pool-checkbox" value="${pInfo.id}" ${inCore ? 'checked' : ''}>
            <img src="${pInfo.avatar}" class="pool-avatar">
            <div class="pool-info">
                <span class="pool-name">${pInfo.name}${isExternal ? ' <span style="font-size:0.6rem;color:#ff6b35;border:1px solid rgba(255,107,53,0.4);border-radius:3px;padding:0 3px;vertical-align:middle;">Dış</span>' : ''}</span>
                <span class="pool-pos" style="color:${pInfo.col};">${pInfo.pos}</span>
            </div>
            <span class="pool-gen" style="color:${gen>=80?'var(--neon-green)':'#ffd700'}">${gen}</span>
            ${isExternal ? `<button onclick="event.preventDefault();_tmRemoveExternal('${pInfo.id}')" title="Havuzdan Çıkar"
                style="position:absolute;top:2px;right:2px;background:rgba(255,0,127,0.15);border:none;color:#ff007f;border-radius:4px;width:18px;height:18px;font-size:0.6rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">
                <i class="fa-solid fa-xmark"></i></button>` : ''}
        </label>`;
    };

    c.innerHTML = `
        <div class="olustur-tab-wrapper">
            <div class="glass-card olustur-config-card">
                <div class="section-label-pill" style="margin-bottom:1.2rem;">
                    <i class="fa-solid fa-scale-balanced" style="color:var(--neon-cyan);"></i>
                    7V7 ADİL DAĞITIM OLUŞTURUCU
                </div>
                <p style="color:#888; font-size:0.9rem; margin-bottom:1.5rem;">
                    Oyuncu havuzundan GEN değerlerine göre dengeli iki takım oluşturur.
                    Takım dışından oyuncu ekleyebilirsiniz.
                </p>

                <div class="olustur-pool-header">
                    <span class="section-label-pill" style="margin-bottom:0.5rem;">
                        <i class="fa-solid fa-people-group"></i>
                        OYUNCU HAVUZU (${window._allPoolPlayers.length} oyuncu)
                    </span>
                    <button class="btn-sm btn-accent" onclick="selectAllPoolPlayers()">Tümünü Seç</button>
                </div>
                <div class="pool-player-grid" id="pool-player-grid">
                    ${teamPlayers.map(p => renderPoolItem(p, false)).join('')}
                    ${externalOnly.map(p => renderPoolItem(p, true)).join('')}
                    ${window._allPoolPlayers.length === 0 ? '<div style="color:#444;font-size:0.85rem;padding:1rem;text-align:center;"><i class="fa-solid fa-users-slash"></i> Takımda oyuncu yok. Aşağıdan dışarıdan ekleyin.</div>' : ''}
                </div>

                <!-- Dışarıdan Oyuncu Ekleme -->
                <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.07);">
                    <div style="font-size:0.75rem;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.5rem;">
                        <i class="fa-solid fa-user-plus" style="color:var(--neon-cyan);"></i> Dışarıdan Oyuncu Ekle
                    </div>
                    <input id="pool-ext-search" class="profile-input" placeholder="Kullanıcı adı ara..."
                           style="width:100%;padding:0.45rem 0.7rem;border-radius:8px;font-size:0.85rem;"
                           oninput="_tmSearchExtForPool(this.value)">
                    <div id="pool-ext-results" style="margin-top:0.5rem;"></div>
                </div>

                <div class="olustur-algo-row" style="margin-top:1.2rem;">
                    <div class="algo-option">
                        <label>Algoritma</label>
                        <select id="algo-type" class="profile-select" style="max-width:220px;">
                            <option value="gen">GEN Dengesi (Adil Dağıtım)</option>
                            <option value="pos">Mevki Öncelikli</option>
                            <option value="snake">Snake Draft (Serpme)</option>
                        </select>
                    </div>
                    <button class="btn-primary" onclick="generateBalancedTeams()"
                            style="background:linear-gradient(135deg,var(--neon-green),var(--neon-cyan));color:black;">
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

window.generateBalancedTeams = function() {
    const checked = [...document.querySelectorAll('.pool-checkbox:checked')].map(cb => cb.value);
    if (checked.length < 4) {
        showToast('En az 4 oyuncu seçin!');
        return;
    }

    const algo = document.getElementById('algo-type')?.value || 'gen';
    const pool = (window._allPoolPlayers || []).filter(p => checked.includes(p.id));
    const sorted = [...pool].sort((a, b) => calcPlayerGEN(b) - calcPlayerGEN(a));

    let teamA = [], teamB = [];

    if (algo === 'snake') {
        // Snake draft: 1→A, 2→B, 3→B, 4→A, 5→A, 6→B...
        sorted.forEach((p, i) => {
            const round = Math.floor(i / 2);
            const isEvenRound = round % 2 === 0;
            if (isEvenRound ? i % 2 === 0 : i % 2 !== 0) teamA.push(p);
            else teamB.push(p);
        });
    } else if (algo === 'pos') {
        // Position-first: alternate by position group
        const byPos = { KL: [], DEF: [], OS: [], FV: [] };
        sorted.forEach(p => {
            const posKey = _getPInfo(p).posKey || 'OS';
            if (byPos[posKey]) byPos[posKey].push(p);
        });
        let toggle = 0;
        ['KL','DEF','OS','FV'].forEach(pos => {
            byPos[pos].forEach(p => {
                (toggle++ % 2 === 0 ? teamA : teamB).push(p);
            });
        });
    } else {
        // GEN balance: greedy swap
        sorted.forEach((p, i) => (i % 2 === 0 ? teamA : teamB).push(p));
        // Greedy improve balance
        for (let iter = 0; iter < 20; iter++) {
            const genA = teamA.reduce((s, p) => s + calcPlayerGEN(p), 0);
            const genB = teamB.reduce((s, p) => s + calcPlayerGEN(p), 0);
            if (Math.abs(genA - genB) < 2) break;
            // Try swapping best mismatch pair
            let bestSwap = null, bestDiff = Math.abs(genA - genB);
            teamA.forEach((pa, ia) => {
                teamB.forEach((pb, ib) => {
                    const newA = genA - calcPlayerGEN(pa) + calcPlayerGEN(pb);
                    const newB = genB - calcPlayerGEN(pb) + calcPlayerGEN(pa);
                    const d = Math.abs(newA - newB);
                    if (d < bestDiff) { bestDiff = d; bestSwap = { ia, ib }; }
                });
            });
            if (bestSwap) {
                const tmp = teamA[bestSwap.ia];
                teamA[bestSwap.ia] = teamB[bestSwap.ib];
                teamB[bestSwap.ib] = tmp;
            } else break;
        }
    }

    const genA = Math.round(teamA.reduce((s, p) => s + calcPlayerGEN(p), 0) / (teamA.length || 1));
    const genB = Math.round(teamB.reduce((s, p) => s + calcPlayerGEN(p), 0) / (teamB.length || 1));
    const diff = Math.abs(genA - genB);

    localStorage.setItem('ss_balanced_teams', JSON.stringify({
        a: teamA.map(p => p.id), b: teamB.map(p => p.id), diff
    }));

    document.getElementById('balanced-teams-result').innerHTML = renderBalancedTeamsHTML(
        teamA.map(p => p.id), teamB.map(p => p.id), diff
    );
    showToast('⚡ Dengeli takımlar oluşturuldu!');
};

function renderBalancedTeamsHTML(aIds, bIds, diff) {
    const allPool = window._allPoolPlayers || [];
    const teamA = allPool.filter(p => aIds.includes(p.id));
    const teamB = allPool.filter(p => bIds.includes(p.id));
    const genA = Math.round(teamA.reduce((s, p) => s + calcPlayerGEN(p), 0) / (teamA.length || 1));
    const genB = Math.round(teamB.reduce((s, p) => s + calcPlayerGEN(p), 0) / (teamB.length || 1));

    const renderTeamCol = (team, name, genAvg, color) => `
        <div class="balanced-team-col glass-card" style="border-color:${color}33;">
            <div class="bal-team-header" style="border-bottom:1px solid ${color}44; margin-bottom:1rem;">
                <span class="bal-team-name" style="color:${color};">${name}</span>
                <span class="bal-gen-badge" style="border-color:${color}; color:${color};">${genAvg} GEN</span>
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
                    <span class="bal-player-gen" style="color:${gen>=80?'var(--neon-green)':'#ffd700'}">${gen}</span>
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

const MOCK_RIVALS = [
    { id: 'r1', name: 'Kuzey Kaplanları', icon: 'fa-dragon', color: '#ff007f',  gen: 78, wins: 3, losses: 5, draws: 2, city: 'İstanbul', desc: 'Agresif hücum tarzı, hızlı kanatlar.' },
    { id: 'r2', name: 'Güney Aslanları',  icon: 'fa-crown',  color: '#ffd700',  gen: 82, wins: 5, losses: 3, draws: 1, city: 'Ankara',   desc: 'Disiplinli defans, set topları güçlü.' },
    { id: 'r3', name: 'Batı Kartalları',  icon: 'fa-feather-pointed', color: '#00e5ff', gen: 75, wins: 4, losses: 4, draws: 2, city: 'İzmir', desc: 'Pas oyunu öne çıkıyor, organize saldırı.' },
    { id: 'r4', name: 'Doğu Fırtınası',  icon: 'fa-bolt',   color: '#a855f7',  gen: 71, wins: 2, losses: 6, draws: 1, city: 'Bursa',   desc: 'Genç kadro, tempo yüksek, kondisyon iyi.' },
    { id: 'r5', name: 'Merkez Çakırlar', icon: 'fa-crow',   color: '#ff6b35',  gen: 80, wins: 4, losses: 3, draws: 3, city: 'İstanbul', desc: 'Tecrübeli oyuncular, taktik maç oynar.' },
];

window.renderRakiplerTab = function() {
    const c = document.getElementById('ttab-rakipler-content');
    const t = window._tmState?.team;
    if (!c || !t) return;

    const savedH2H = JSON.parse(localStorage.getItem('ss_h2h') || '{}');
    const myGen = calcTeamGEN();

    c.innerHTML = `
        <div class="rakipler-tab-wrapper">

            <!-- Özet Kart -->
            <div class="glass-card rival-summary-card">
                <div class="rival-summary-grid">
                    <div class="rival-stat-box">
                        <span class="rival-stat-val" style="color:var(--neon-green);">${t.total_wins||0}</span>
                        <span class="rival-stat-lbl">Galibiyet</span>
                    </div>
                    <div class="rival-stat-box">
                        <span class="rival-stat-val" style="color:#aaa;">${t.total_draws||0}</span>
                        <span class="rival-stat-lbl">Beraberlik</span>
                    </div>
                    <div class="rival-stat-box">
                        <span class="rival-stat-val" style="color:var(--neon-pink);">${t.total_losses||0}</span>
                        <span class="rival-stat-lbl">Mağlubiyet</span>
                    </div>
                    <div class="rival-stat-box">
                        <span class="rival-stat-val" style="color:var(--neon-cyan);">${myGen}</span>
                        <span class="rival-stat-lbl">Takım GEN</span>
                    </div>
                </div>
            </div>

            <!-- Rival Cards -->
            <div class="section-label-pill" style="margin-bottom:1rem;">
                <i class="fa-solid fa-swords" style="color:var(--neon-pink);"></i>
                LİG RAKİPLERİ
            </div>
            <div class="rival-cards-grid">
                ${MOCK_RIVALS.map(rival => {
                    const genDiff = myGen - rival.gen;
                    const h2h = savedH2H[rival.id] || { w: 0, d: 0, l: 0 };
                    const totalH2H = h2h.w + h2h.d + h2h.l;
                    return `
                    <div class="rival-card glass-card" style="border-color:${rival.color}33;">
                        <div class="rival-card-header" style="border-bottom:1px solid ${rival.color}44; padding-bottom:1rem; margin-bottom:1rem;">
                            <div class="rival-crest" style="color:${rival.color};">
                                <i class="fa-solid ${rival.icon} fa-2x"></i>
                            </div>
                            <div class="rival-identity">
                                <h4 class="rival-name" style="color:${rival.color};">${rival.name}</h4>
                                <span style="color:#888; font-size:0.8rem;"><i class="fa-solid fa-location-dot"></i> ${rival.city}</span>
                            </div>
                            <div class="rival-gen-chip" style="border-color:${rival.color}; color:${rival.color};">
                                ${rival.gen} <span style="font-size:0.7rem;">GEN</span>
                            </div>
                        </div>
                        <p style="color:#666; font-size:0.85rem; margin-bottom:1rem;">${rival.desc}</p>
                        <div class="rival-gen-compare">
                            <span style="color:#888; font-size:0.8rem;">GEN Farkı:</span>
                            <span style="color:${genDiff>=0?'var(--neon-green)':'var(--neon-pink)'}; font-weight:700;">
                                ${genDiff >= 0 ? '+' : ''}${genDiff}
                            </span>
                        </div>
                        ${totalH2H > 0 ? `
                        <div class="h2h-record">
                            <span style="color:#888; font-size:0.8rem;">H2H:</span>
                            <span style="color:var(--neon-green);">${h2h.w}G</span>
                            <span style="color:#aaa;">${h2h.d}B</span>
                            <span style="color:var(--neon-pink);">${h2h.l}M</span>
                        </div>` : ''}
                        <div class="rival-card-actions">
                            <button class="btn-sm btn-outline-sm" onclick="openH2HModal('${rival.id}', '${rival.name}')">
                                <i class="fa-solid fa-clipboard-list"></i> Sonuç Gir
                            </button>
                            <button class="btn-sm btn-accent" onclick="challengeRival('${rival.id}', '${rival.name}')">
                                <i class="fa-solid fa-handshake"></i> Maç İste
                            </button>
                        </div>
                    </div>`;
                }).join('')}
            </div>

        </div>

        <!-- H2H Modal -->
        <div id="h2h-modal" class="modal-backdrop" onclick="closeH2HModal()" style="display:none;">
            <div class="modal-box" onclick="event.stopPropagation()" style="max-width:400px;">
                <div class="modal-header">
                    <h3><i class="fa-solid fa-clipboard-list" style="color:var(--neon-cyan);"></i> Maç Sonucu</h3>
                    <button class="modal-close" onclick="closeH2HModal()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="modal-body">
                    <p id="h2h-rival-name" style="color:#aaa; margin-bottom:1rem;"></p>
                    <div class="modal-field">
                        <label>Sonuç</label>
                        <div style="display:flex; gap:0.5rem;">
                            <button class="btn-sm btn-success-sm" onclick="saveH2H('w')" style="flex:1; padding:0.8rem;">✅ Galibiyet</button>
                            <button class="btn-sm" onclick="saveH2H('d')" style="flex:1; padding:0.8rem; background:#333; color:#aaa; border:1px solid #555; border-radius:8px;">🤝 Beraberlik</button>
                            <button class="btn-sm btn-danger-sm" onclick="saveH2H('l')" style="flex:1; padding:0.8rem;">❌ Mağlubiyet</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
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

const HONOR_MAX = 5;
let _pmrMatchId = null;
let _pmrParticipants = [];
let _pmrRatedSet = new Set();
let _pmrCurrentIdx = 0;
let _pmrCurrentUserSide = null;
let _honorSelections = {}; // { [rated_id]: honor_type } — modal boyunca toplanır

const _HONOR_BTNS = [
    { key: 'calm',     icon: '🕊️', label: 'Sakin'   },
    { key: 'maestro',  icon: '🎯', label: 'Maestro' },
    { key: 'punctual', icon: '⏱️', label: 'Dakik'   },
    { key: 'joker',    icon: '😄', label: 'Joker'   },
    { key: 'dynamo',   icon: '⚡', label: 'Dinamo'  }
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

    const btns = _HONOR_BTNS.map(h => {
        const isSel = selected === h.key;
        return `<button class="honor-type-btn${isSel ? ' honor-type-selected' : ''}"
                        ${atLimit ? 'disabled title="Onur limiti doldu"' : ''}
                        onclick="_pmrHonorToggle('${_pmrEsc(playerId)}','${h.key}')">
                    ${h.icon} ${h.label}
                </button>`;
    }).join('');

    return `
        <div class="pmr-honor-section">
            <div class="pmr-honor-label">
                <i class="fa-solid fa-shield-heart" style="color:var(--neon-cyan);font-size:0.75rem;"></i>
                Onur Ver (opsiyonel)
                <span class="honor-count-badge" style="font-size:0.65rem; padding:0.1rem 0.5rem;">${selCount}/${HONOR_MAX}</span>
            </div>
            <div class="honor-type-btns">${btns}</div>
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

        const [venues, myTeams] = await Promise.all([
            DB.Venues.getAll().catch(() => []),
            userId ? DB.Teams.getMyTeams(userId).catch(() => []) : Promise.resolve([])
        ]);
        _mcVenues = venues;
        _mcMyTeams = myTeams;

        const venueSelect = document.getElementById('mc-venue-select');
        if (venueSelect) {
            venueSelect.innerHTML = '<option value="">— Saha seçin —</option>' +
                venues.map(v =>
                    `<option value="${_mcEsc(v.id)}">${_mcEsc(v.name)}${v.district ? ' — ' + _mcEsc(v.district) : ''}</option>`
                ).join('');
        }

        const homeSelect = document.getElementById('mc-home-team-select');
        if (homeSelect) {
            homeSelect.innerHTML = '<option value="">— Takım seçin —</option>' +
                myTeams.map(t =>
                    `<option value="${_mcEsc(t.id)}">${_mcEsc(t.name)}</option>`
                ).join('');
        }
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

    const upcoming = rows.filter(r => ['scheduled', 'confirmed'].includes(r.match.status));
    const past     = rows.filter(r => ['finished', 'cancelled'].includes(r.match.status));

    // Tüm maç ID'leri için oyuncu sayısı + rating durumu
    const allIds      = rows.map(r => r.match.id).filter(Boolean);
    const finishedIds = past.map(r => r.match.id).filter(Boolean);

    const [playerCounts, ratingStatuses] = await Promise.all([
        DB.Matches.getPlayerCounts(allIds).catch(() => ({})),
        finishedIds.length
            ? DB.Ratings.getMatchRatingStatuses(userId, finishedIds).catch(() => ({}))
            : Promise.resolve({})
    ]);

    let html = '';
    if (upcoming.length) {
        html += '<div class="mc-group-label"><i class="fa-solid fa-clock"></i> Yaklaşan Maçlar</div>';
        html += upcoming.map(r => _mcMatchCard(r, ratingStatuses, userId, playerCounts)).join('');
    }
    if (past.length) {
        html += `<div class="mc-group-label" style="${upcoming.length ? 'margin-top:1.5rem;' : ''}"><i class="fa-solid fa-rotate-left"></i> Geçmiş Maçlar</div>`;
        html += past.map(r => _mcMatchCard(r, ratingStatuses, userId, playerCounts)).join('');
    }

    listEl.innerHTML = html;
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
};

window.mcSubmitCreate = async function () {
    const btn = document.getElementById('mc-submit-btn');
    const venueId    = document.getElementById('mc-venue-select')?.value || null;
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
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-plus"></i> Maç Oluştur'; }
            return;
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



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
    if (!p) return 70;
    if (p.gen_score) return p.gen_score;
    if (p.rating_teknik !== undefined) {
        const vals = [p.rating_teknik, p.rating_sut, p.rating_pas, p.rating_hiz, p.rating_fizik, p.rating_kondisyon].map(v => v || 70);
        return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    }
    return 70;
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

            <!-- SECTION: Bekleyen Davetler -->
            <div class="kadro-section glass-card" id="pending-invites-card">
                <div class="kadro-section-header">
                    <div class="section-label-pill">
                        <i class="fa-solid fa-envelope-open-text" style="color:var(--neon-cyan);"></i>
                        DAVETLER
                    </div>
                </div>
                <div id="team-invites-list">
                    ${renderTeamInvitesList()}
                </div>
            </div>

        </div>

        <!-- Davet Modal (inline) -->
        <div id="team-davet-modal" class="modal-backdrop" onclick="closeDavetModal()" style="display:none;">
            <div class="modal-box" onclick="event.stopPropagation()" style="max-width:480px;">
                <div class="modal-header">
                    <h3><i class="fa-solid fa-user-plus" style="color:var(--neon-cyan);"></i> Oyuncu Davet Et</h3>
                    <button class="modal-close" onclick="closeDavetModal()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="modal-body">
                    <div class="modal-field">
                        <label>Davet Edilecek Oyuncu</label>
                        <select id="davet-player-select" class="profile-select">
                            <option value="">(Geçersiz. Yeni 'Oyuncu Davet Et' sekmesini kullanın)</option>
                        </select>
                    </div>
                    <div class="modal-field">
                        <label>Mesaj (opsiyonel)</label>
                        <textarea id="davet-message" class="profile-input" rows="2" 
                                  placeholder="Takımımıza katılmaya davet ediyoruz..." style="resize:vertical;"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-outline" onclick="closeDavetModal()">İptal</button>
                    <button class="btn-primary" onclick="sendTeamInvite()" 
                            style="background:var(--neon-cyan); color:black;">
                        <i class="fa-solid fa-paper-plane"></i> Daveti Gönder
                    </button>
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

window.renderTakimOlusturTab = function() {
    const c = document.getElementById('ttab-olustur-content');
    const t = window._tmState?.team;
    if (!c || !t) return;

    const teamPlayers = getTeamPlayers();
    const savedTeams = JSON.parse(localStorage.getItem('ss_balanced_teams') || 'null');

    c.innerHTML = `
        <div class="olustur-tab-wrapper">

            <!-- Algorithm Config Card -->
            <div class="glass-card olustur-config-card">
                <div class="section-label-pill" style="margin-bottom:1.2rem;">
                    <i class="fa-solid fa-shuffle" style="color:var(--neon-cyan);"></i>
                    7V7 DENGELİ TAKIM OLUŞTURUCU
                </div>
                <p style="color:#888; font-size:0.9rem; margin-bottom:1.5rem;">
                    Oyuncu havuzundan GEN değerlerine göre dengeli iki takım oluşturur. 
                    Mevki dengesini de göz önüne alır.
                </p>

                <div class="olustur-pool-header">
                    <span class="section-label-pill" style="margin-bottom:0.5rem;">
                        <i class="fa-solid fa-people-group"></i>
                        OYUNCU HAVUZU (${teamPlayers.length} oyuncu)
                    </span>
                    <button class="btn-sm btn-accent" onclick="selectAllPoolPlayers()">Tümünü Seç</button>
                </div>
                <div class="pool-player-grid" id="pool-player-grid">
                    ${teamPlayers.map(p => {
                        const gen = calcPlayerGEN(p);
                        const pInfo = _getPInfo(p);
                        const coreSquad = JSON.parse(localStorage.getItem('ss_core_' + t.id) || '[]');
                        const isInCore = coreSquad.includes(pInfo.id);
                        return `
                        <label class="pool-player-item ${isInCore ? 'in-core' : ''}" id="pool-item-${pInfo.id}">
                            <input type="checkbox" class="pool-checkbox" value="${pInfo.id}" ${isInCore ? 'checked' : ''}>
                            <img src="${pInfo.avatar}" class="pool-avatar">
                            <div class="pool-info">
                                <span class="pool-name">${pInfo.name}</span>
                                <span class="pool-pos" style="color:${pInfo.col};">${pInfo.pos}</span>
                            </div>
                            <span class="pool-gen" style="color:${gen>=80?'var(--neon-green)':'#ffd700'}">${gen}</span>
                        </label>`;
                    }).join('')}
                </div>

                <div class="olustur-algo-row">
                    <div class="algo-option">
                        <label>Algoritma</label>
                        <select id="algo-type" class="profile-select" style="max-width:220px;">
                            <option value="gen">GEN Dengesi (Sürpriz)</option>
                            <option value="pos">Mevki Öncelikli</option>
                            <option value="snake">Snake Draft (Serpme)</option>
                        </select>
                    </div>
                    <button class="btn-primary" onclick="generateBalancedTeams()" 
                            style="background:linear-gradient(135deg,var(--neon-green),var(--neon-cyan));color:black;">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> TAKIM OLUŞTUR
                    </button>
                </div>
            </div>

            <!-- Result -->
            <div id="balanced-teams-result">
                ${savedTeams ? renderBalancedTeamsHTML(savedTeams.a, savedTeams.b, savedTeams.diff) : ''}
            </div>
        </div>
    `;
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
    const pool = (window.players||[]).filter(p => checked.includes(p.id));
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
            const pos = (p.details && p.details.pos) || 'OS';
            if (byPos[pos]) byPos[pos].push(p); 
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
    const teamA = (window.players||[]).filter(p => aIds.includes(p.id));
    const teamB = (window.players||[]).filter(p => bIds.includes(p.id));
    const genA = Math.round(teamA.reduce((s, p) => s + calcPlayerGEN(p), 0) / (teamA.length || 1));
    const genB = Math.round(teamB.reduce((s, p) => s + calcPlayerGEN(p), 0) / (teamB.length || 1));

    const posColors = { KL: '#ffd700', DEF: '#00e5ff', OS: '#00ff88', FV: '#ff007f' };

    const renderTeamCol = (team, name, genAvg, color) => `
        <div class="balanced-team-col glass-card" style="border-color:${color}33;">
            <div class="bal-team-header" style="border-bottom:1px solid ${color}44; margin-bottom:1rem;">
                <span class="bal-team-name" style="color:${color};">${name}</span>
                <span class="bal-gen-badge" style="border-color:${color}; color:${color};">${genAvg} GEN</span>
            </div>
            ${team.map(p => {
                const gen = calcPlayerGEN(p);
                const pos = (p.details && p.details.pos) || 'OS';
                const col = posColors[pos] || '#aaa';
                return `
                <div class="bal-player-row">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}" class="bal-avatar">
                    <div class="bal-player-info">
                        <span class="bal-player-name">${p.name}</span>
                        <span style="color:${col}; font-size:0.75rem;">${pos}</span>
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


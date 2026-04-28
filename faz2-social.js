// =====================================================
// FAZ2-SOCIAL.JS — Sosyal Katman
// Arkadaşlar, Gerçek Feed, Yorum & Beğeni, Keşfet
// =====================================================

'use strict';

// =====================================================
// BÖLÜM 1: KEŞFET — Oyuncu & Takım Arama
// =====================================================

let explorePlayers = [];
let exploreTeams   = [];
let exploreFilter  = { search: '', position: '', city: '' };

// ── Sekme geçişi ──
window.switchExploreTab = function(tab) {
    // Tab içeriklerini gizle/göster
    ['players','teams','friends'].forEach(t => {
        const content = document.getElementById(`etab-${t}`);
        const btn     = document.getElementById(`etab-btn-${t}`);
        if (content) content.style.display = t === tab ? 'block' : 'none';
        if (btn)     btn.classList.toggle('active', t === tab);
    });

    // Her sekme ilk açılışında veri yükle
    if (tab === 'players' && explorePlayers.length === 0) {
        window.initExplore();
    } else if (tab === 'teams') {
        initExploreTeams();
    } else if (tab === 'friends') {
        renderFriendsList();
    }
};

// ── Takımlar sekmesi ──
async function initExploreTeams() {
    const grid = document.getElementById('explore-team-grid');
    if (!grid) return;
    grid.innerHTML = `<div style="text-align:center; padding:3rem; color:#444;">
        <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
        <p style="margin-top:1rem; font-size:0.85rem;">Takımlar yükleniyor…</p>
    </div>`;
    try {
        if (window.DB) {
            exploreTeams = await window.DB.Teams.getAll(50);
        } else {
            exploreTeams = [];
        }
        renderExploreTeams(exploreTeams);
    } catch(e) {
        console.error('Explore teams failed:', e);
        grid.innerHTML = `<div style="text-align:center; padding:3rem; color:#ff5555;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size:2rem; margin-bottom:1rem; display:block;"></i>
            Takımlar yüklenirken hata oluştu.<br>
            <small style="color:#666; font-size:0.75rem;">${e.message || 'Bilinmeyen hata'}</small>
        </div>`;
    }
}

function renderExploreTeams(teams) {
    const grid = document.getElementById('explore-team-grid');
    if (!grid) return;

    if (!teams || teams.length === 0) {
        grid.innerHTML = `<div style="text-align:center; padding:3rem; color:#555;">
            <i class="fa-solid fa-shield-slash" style="font-size:2.5rem; margin-bottom:1rem; display:block;"></i>
            Henüz kayıtlı takım yok.
        </div>`;
        return;
    }

    const myUserId = window.__AUTH_USER__?.id;

    grid.innerHTML = teams.map(t => {
        const cap     = t.captain || {};
        const capAv   = cap.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cap.username||'cap')}`;
        const color   = t.color || '#00ff88';
        const isOwn   = cap.id === myUserId;
        // Takım adı ve slug HTML-escape (inline onclick güvenliği)
        const safeName = (t.name || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
        const safeSlug = (t.slug || '').replace(/'/g, '');

        return `
        <div class="explore-team-card glass-card" id="etc-${t.id}"
             data-team-id="${t.id}"
             data-team-name="${safeName}"
             data-team-slug="${safeSlug}"
             style="cursor:pointer;"
             onclick="_openTeamDetail(this)">
            <div class="etc-header">
                <div class="etc-crest" style="color:${color};">
                    <i class="fa-solid fa-shield-cat"></i>
                </div>
                <div class="etc-info">
                    <h4 class="etc-name">${t.name || 'Takım'}</h4>
                    <div class="etc-meta">
                        <span><i class="fa-solid fa-users"></i> ${t.player_count || 0} oyuncu</span>
                        ${t.city ? `<span><i class="fa-solid fa-location-dot"></i> ${t.city}</span>` : ''}
                    </div>
                    <div class="etc-captain">
                        <img src="${capAv}" class="etc-cap-avatar" alt="${cap.username || 'Kaptan'}"
                             onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=cap'">
                        <span style="font-size:0.75rem; color:#666;">
                            <i class="fa-solid fa-crown" style="color:#ffd700;"></i> ${cap.username || 'Kaptan'}
                        </span>
                    </div>
                </div>
                <div class="etc-code-badge">
                    <span style="font-size:0.65rem; color:#555;">KOD</span>
                    <span style="font-weight:800; color:var(--neon-cyan); font-size:0.9rem;">${t.slug || '—'}</span>
                </div>
            </div>
            ${t.description ? `<p class="etc-desc">${t.description}</p>` : ''}
            <div class="etc-actions" onclick="event.stopPropagation()">
                ${isOwn
                    ? `<span class="etc-badge-own"><i class="fa-solid fa-crown"></i> Kendi Takımın</span>`
                    : `<button class="epc-btn epc-btn-friend"
                               onclick="_openTeamDetail(this.closest('[data-team-id]'))">
                           <i class="fa-solid fa-eye"></i> Görüntüle
                       </button>`
                }
                <button class="epc-btn epc-btn-profile" onclick="_copyTeamCode(this)" data-slug="${safeSlug}">
                    <i class="fa-solid fa-copy"></i> Kodu Kopyala
                </button>
            </div>
        </div>`;
    }).join('');
}

// ── Takım Detay Modalı ──────────────────────────────────

window._openTeamDetail = async function(cardEl) {
    const card = cardEl?.closest ? cardEl.closest('[data-team-id]') : cardEl;
    if (!card) return;
    const teamId   = card.dataset.teamId;
    const teamName = card.dataset.teamName;

    // Var olan modalı kapat
    document.getElementById('team-detail-modal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'team-detail-modal';
    modal.className = 'modal-backdrop';
    modal.style.cssText = 'display:flex; z-index:9999;';
    modal.innerHTML = `
    <div class="modal-box" style="max-width:520px; width:95%;" onclick="event.stopPropagation()">
        <div class="modal-header">
            <h3><i class="fa-solid fa-shield-cat" style="color:var(--neon-green);"></i> Takım Detayı</h3>
            <button class="modal-close" onclick="document.getElementById('team-detail-modal').remove()">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        <div id="tdm-body" style="padding:1.5rem; text-align:center;">
            <i class="fa-solid fa-spinner fa-spin fa-2x" style="color:#555;"></i>
            <p style="color:#555; margin-top:1rem;">Yükleniyor...</p>
        </div>
    </div>`;
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);

    try {
        const myId = window.__AUTH_USER__?.id;
        const [team, myRequest, myMemberships] = await Promise.all([
            window.DB.Teams.get(teamId),
            myId ? window.DB.TeamRequests.getMyRequest(teamId, myId) : Promise.resolve(null),
            myId ? window.DB.Teams.getMyTeams(myId) : Promise.resolve([])
        ]);

        if (!team) {
            document.getElementById('tdm-body').innerHTML =
                `<p style="color:#f55;">Takım bulunamadı.</p>`;
            return;
        }

        const isMember   = (team.team_members || []).some(m => m.player_id === myId);
        const isCapOrOwn = team.captain_id === myId;
        const color      = team.color || '#00ff88';
        const cap        = team.captain || {};
        const capAv      = cap.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cap.username || 'cap')}`;
        const members    = (team.team_members || []).slice(0, 12);

        // Katılma isteği durumu
        let joinBtnHtml = '';
        if (!myId) {
            joinBtnHtml = `<button class="epc-btn epc-btn-friend" onclick="showToast('⚠️ Giriş yapmanız gerekiyor.')">
                <i class="fa-solid fa-right-to-bracket"></i> Katılma İsteği Gönder
            </button>`;
        } else if (isCapOrOwn) {
            joinBtnHtml = `<span class="etc-badge-own"><i class="fa-solid fa-crown"></i> Kendi Takımın</span>`;
        } else if (isMember) {
            joinBtnHtml = `<span class="epc-btn epc-btn-friend accepted" style="cursor:default;">
                <i class="fa-solid fa-check"></i> Zaten Üyesin
            </span>`;
        } else if (myRequest?.status === 'pending') {
            joinBtnHtml = `<button class="epc-btn" style="background:#333; color:#ffd700; border:1px solid #ffd700;"
                id="tdm-join-btn" onclick="_cancelJoinRequest('${teamId}', '${myId}')">
                <i class="fa-solid fa-clock"></i> İstek Bekliyor — İptal Et
            </button>`;
        } else if (myRequest?.status === 'accepted') {
            joinBtnHtml = `<span class="epc-btn epc-btn-friend accepted" style="cursor:default;">
                <i class="fa-solid fa-check"></i> İsteğin Kabul Edildi
            </span>`;
        } else if (myRequest?.status === 'rejected') {
            joinBtnHtml = `<span class="epc-btn" style="background:#1a0000; color:#f55; border:1px solid #f55; cursor:default;">
                <i class="fa-solid fa-xmark"></i> İsteğin Reddedildi
            </span>`;
        } else {
            joinBtnHtml = `<button class="epc-btn epc-btn-friend" id="tdm-join-btn"
                onclick="_sendJoinRequest('${teamId}', '${myId}', '${(team.name||'').replace(/'/g,"\\'")}')">
                <i class="fa-solid fa-paper-plane"></i> Katılma İsteği Gönder
            </button>`;
        }

        const membersHtml = members.length === 0
            ? `<p style="color:#555; font-size:0.85rem;">Henüz üye yok.</p>`
            : members.map(m => {
                const p   = m.player || {};
                const av  = p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.username||'u')}`;
                const gen = p.gen_score ? Math.round(p.gen_score) : null;
                const isCap = m.player_id === team.captain_id;
                return `
                <div style="display:flex; align-items:center; gap:0.6rem; padding:0.5rem 0; border-bottom:1px solid #1a1a1a;">
                    <img src="${av}" style="width:32px; height:32px; border-radius:50%; object-fit:cover; border:1px solid #333;"
                         onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=u'">
                    <div style="flex:1; min-width:0;">
                        <span style="font-size:0.85rem; font-weight:600; color:#ddd;">
                            ${p.username || 'Oyuncu'}
                            ${isCap ? '<i class="fa-solid fa-crown" style="color:#ffd700; font-size:0.65rem; margin-left:4px;"></i>' : ''}
                        </span>
                        <div style="font-size:0.7rem; color:#555;">
                            ${p.ana_mevki || p.position || 'Oyuncu'}
                        </div>
                    </div>
                    ${gen ? `<span style="font-size:0.75rem; font-weight:800; color:var(--neon-green);">${gen} GEN</span>` : ''}
                </div>`;
            }).join('');

        document.getElementById('tdm-body').innerHTML = `
        <div style="text-align:left;">
            <!-- Başlık -->
            <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1.2rem;">
                <div style="font-size:2.5rem; color:${color};"><i class="fa-solid fa-shield-cat"></i></div>
                <div>
                    <h2 style="margin:0; color:#fff; font-size:1.3rem;">${team.name || 'Takım'}</h2>
                    <div style="font-size:0.75rem; color:#555; margin-top:2px;">
                        ${team.city ? `<span><i class="fa-solid fa-location-dot"></i> ${team.city}</span>` : ''}
                        <span style="margin-left:8px;"><i class="fa-solid fa-users"></i> ${members.length} oyuncu</span>
                        <span style="margin-left:8px; color:var(--neon-cyan); font-weight:700;">${team.slug || ''}</span>
                    </div>
                </div>
            </div>

            <!-- Kaptan -->
            <div style="display:flex; align-items:center; gap:0.6rem; padding:0.7rem; background:#0d0d0d; border-radius:8px; margin-bottom:1rem;">
                <img src="${capAv}" style="width:36px; height:36px; border-radius:50%; border:2px solid #ffd700;"
                     onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=cap'">
                <div>
                    <div style="font-size:0.7rem; color:#666;">Kaptan</div>
                    <div style="font-size:0.9rem; font-weight:700; color:#ffd700;">
                        <i class="fa-solid fa-crown"></i> ${cap.username || 'Kaptan'}
                    </div>
                </div>
            </div>

            <!-- Açıklama -->
            ${team.description ? `<p style="color:#888; font-size:0.85rem; margin-bottom:1rem; padding:0.7rem; background:#0d0d0d; border-radius:8px;">${team.description}</p>` : ''}

            <!-- Üyeler -->
            <div style="margin-bottom:1.2rem;">
                <div style="font-size:0.7rem; color:#555; text-transform:uppercase; letter-spacing:1px; margin-bottom:0.5rem;">
                    <i class="fa-solid fa-users" style="color:var(--neon-green);"></i> Kadro
                </div>
                <div style="max-height:240px; overflow-y:auto;">${membersHtml}</div>
            </div>

            <!-- Aksiyon -->
            <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
                ${joinBtnHtml}
                <button class="epc-btn epc-btn-profile" onclick="navigator.clipboard?.writeText('${team.slug||''}').then(()=>showToast('📋 Kod kopyalandı: ${team.slug||''}')).catch(()=>showToast('Kod: ${team.slug||''}'))">
                    <i class="fa-solid fa-copy"></i> Kodu Kopyala
                </button>
            </div>
        </div>`;
    } catch(e) {
        console.error('Team detail error:', e);
        document.getElementById('tdm-body').innerHTML =
            `<p style="color:#f55;">Yüklenirken hata: ${e.message}</p>`;
    }
};

// Katılma isteği gönder
window._sendJoinRequest = async function(teamId, playerId, teamName) {
    const btn = document.getElementById('tdm-join-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gönderiliyor...'; }
    try {
        await window.DB.TeamRequests.send(teamId, playerId);
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-clock"></i> İstek Bekliyor — İptal Et';
            btn.style.cssText = 'background:#333; color:#ffd700; border:1px solid #ffd700;';
            btn.onclick = () => _cancelJoinRequest(teamId, playerId);
            btn.disabled = false;
        }
        showToast(`✅ "${teamName}" takımına katılma isteği gönderildi!`);
    } catch(e) {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Katılma İsteği Gönder'; }
        if (e.message?.includes('duplicate') || e.message?.includes('unique')) {
            showToast('⚠️ Bu takıma zaten istek göndermişsin.');
        } else {
            showToast('❌ İstek gönderilemedi: ' + e.message);
        }
    }
};

// Bekleyen isteği iptal et
window._cancelJoinRequest = async function(teamId, playerId) {
    const btn = document.getElementById('tdm-join-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> İptal ediliyor...'; }
    try {
        await window.DB.TeamRequests.cancel(teamId, playerId);
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Katılma İsteği Gönder';
            btn.style.cssText = '';
            btn.className = 'epc-btn epc-btn-friend';
            btn.onclick = () => _sendJoinRequest(teamId, playerId, '');
            btn.disabled = false;
        }
        showToast('İstek iptal edildi.');
    } catch(e) {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-clock"></i> İstek Bekliyor — İptal Et'; }
        showToast('❌ İptal hatası: ' + e.message);
    }
};

// onclick için güvenli yardımcılar (data attribute'dan alır)
window._joinTeamCard = function(btn) {
    const card = btn.closest('[data-team-id]');
    if (!card) return;
    const teamId   = card.dataset.teamId;
    const teamName = card.dataset.teamName;
    const slug     = card.dataset.teamSlug;
    joinExploreTeam(teamId, teamName, slug, btn);
};
window._copyTeamCode = function(btn) {
    const slug = btn.dataset.slug || '';
    if (!slug) { showToast('⚠️ Bu takımın kodu yok.'); return; }
    if (navigator.clipboard) {
        navigator.clipboard.writeText(slug)
            .then(() => showToast(`📋 Davet kodu kopyalandı: ${slug}`))
            .catch(() => showToast('⚠️ Kopyalama başarısız.'));
    } else {
        showToast(`📋 Kod: ${slug}`);
    }
};

window.filterExploreTeams = function() {
    const q = (document.getElementById('explore-team-search')?.value || '').toLowerCase().trim();
    if (!q) {
        renderExploreTeams(exploreTeams);
        return;
    }
    const filtered = exploreTeams.filter(t =>
        t.name?.toLowerCase().includes(q) ||
        t.city?.toLowerCase().includes(q) ||
        t.slug?.toLowerCase().includes(q)
    );
    renderExploreTeams(filtered);
};

window.joinExploreTeam = async function(teamId, teamName, slug, btn) {
    const user = window.__AUTH_USER__;
    if (!user) { showToast('⚠️ Giriş yapmanız gerekiyor.'); return; }
    if (!window.DB) return;

    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Katılıyor...'; }

    try {
        await window.DB.Teams.addMember(teamId, user.id, 'player');
        await window.sbClient.from('profiles')
            .update({ current_team_id: teamId })
            .eq('id', user.id);

        if (btn) { btn.innerHTML = '<i class="fa-solid fa-check"></i> Katıldın!'; btn.className = 'epc-btn epc-btn-friend accepted'; }
        showToast(`✅ "${teamName}" takımına katıldın!`);

        // Takımım state'ini güncelle
        if (window._tmState) {
            window._tmState.team = { id: teamId, name: teamName, slug };
        }
    } catch(e) {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Katıl'; }
        if (e.message?.includes('duplicate') || e.message?.includes('zaten')) {
            showToast('⚠️ Zaten bu takımın üyesisin.');
        } else {
            showToast('❌ Katılım hatası: ' + e.message);
        }
    }
};

// ── Arkadaşlarım sekmesi ──
async function renderFriendsList() {
    const container = document.getElementById('friends-list-container');
    if (!container) return;

    const user = window.__AUTH_USER__;
    if (!user || !window.DB) {
        container.innerHTML = `<div style="text-align:center; padding:3rem; color:#555;">
            Giriş yapmanız gerekiyor.
        </div>`;
        return;
    }

    container.innerHTML = `<div style="text-align:center; padding:3rem; color:#444;">
        <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
    </div>`;

    try {
        const friends = await window.DB.Friends.getMyFriends(user.id);

        if (!friends || friends.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:3rem; color:#555;">
                <i class="fa-solid fa-user-group" style="font-size:2.5rem; margin-bottom:1rem; display:block; color:#333;"></i>
                Henüz arkadaşın yok. Oyuncu keşfet ve arkadaş ekle!
            </div>`;
            return;
        }

        container.innerHTML = friends.map(f => {
            const other = f.requester_id === user.id ? f.addressee : f.requester;
            if (!other) return '';
            const avatar = other.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(other.username||'u')}`;
            const gen    = other.gen_score || null;
            return `
            <div class="friend-list-row glass-card">
                <img src="${avatar}" class="friend-avatar" alt="${other.username}"
                     onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'">
                <div class="friend-info">
                    <span class="friend-name">${other.username || 'Oyuncu'}</span>
                    <span class="friend-meta">
                        ${other.ana_mevki || other.position || 'Oyuncu'}
                        ${other.city ? ` · ${other.city}` : ''}
                        ${gen ? ` · <span style="color:var(--neon-green)">${Math.round(gen)} GEN</span>` : ''}
                    </span>
                </div>
                <button class="epc-btn epc-btn-profile" onclick="openUserProfile('${other.id}', '${other.username}')">
                    <i class="fa-solid fa-user-circle"></i> Profil
                </button>
            </div>`;
        }).join('');
    } catch(e) {
        container.innerHTML = `<div style="text-align:center; padding:2rem; color:#ff5555;">
            Arkadaşlar yüklenemedi: ${e.message}
        </div>`;
    }
}

window.initExplore = async function() {
    renderExploreSkeleton();
    try {
        if (window.DB) {
            // Supabase'den oyuncuları çek
            explorePlayers = await window.DB.Profiles.getAll({ limit: 50 });
        } else {
            // Fallback: localStorage mock
            explorePlayers = (typeof players !== 'undefined') ? players.map(p => ({
                id: p.id, username: p.name, gen_score: p.ratings
                    ? Math.round(Object.values(p.ratings).reduce((a,b)=>a+b,0)/6) : 70,
                position: p.details?.pos || 'OS',
                city: 'İstanbul', avatar_url: null
            })) : [];
        }
    } catch(e) {
        console.warn('Explore load failed:', e);
        explorePlayers = [];
    }
    renderExploreGrid();
};

function renderExploreSkeleton() {
    const grid = document.getElementById('explore-player-grid');
    if (!grid) return;
    grid.innerHTML = Array(6).fill(0).map(() => `
        <div class="explore-player-card skeleton-card">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
        </div>
    `).join('');
}

window.renderExploreGrid = function() {
    const grid = document.getElementById('explore-player-grid');
    if (!grid) return;

    const currentUserId = window.__AUTH_USER__?.id;
    const search   = exploreFilter.search.toLowerCase();
    const position = exploreFilter.position;

    let filtered = explorePlayers.filter(p => {
        const name = (p.username || p.full_name || '').toLowerCase();
        const city = (p.city || '').toLowerCase();
        if (search && !name.includes(search) && !city.includes(search)) return false;
        if (position && p.position !== position) return false;
        return true;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="explore-empty" style="grid-column:1/-1; text-align:center; padding:3rem; color:#555;">
            <i class="fa-solid fa-user-slash" style="font-size:2.5rem; margin-bottom:1rem; display:block;"></i>
            Oyuncu bulunamadı. Filtreleri değiştirin.
        </div>`;
        return;
    }

    grid.innerHTML = filtered.map(p => {
        const avatarSeed = p.username || p.id;
        const avatarUrl  = p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}`;
        const gen        = p.gen_score || p.community_gen || 70;
        const genColor   = gen >= 85 ? 'var(--neon-green)' : gen >= 75 ? 'var(--neon-cyan)' : 'orange';
        const posIcon    = { KL:'🧤', DEF:'🛡️', OS:'⚡', FV:'⚽' }[p.position] || '⚽';
        const isMe       = currentUserId && p.id === currentUserId;

        return `
        <div class="explore-player-card" id="epc-${p.id}">
            <div class="epc-header">
                <div class="epc-avatar-wrap">
                    <img src="${avatarUrl}" class="epc-avatar" alt="${p.username}" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'">
                    <div class="epc-gen-badge" style="color:${genColor}; border-color:${genColor};">${Math.round(gen)}</div>
                </div>
                <div class="epc-info">
                    <h4 class="epc-name">${p.username || 'Oyuncu'}</h4>
                    <span class="epc-position">${posIcon} ${getPosLabel(p.position)}</span>
                    ${p.city ? `<span class="epc-city"><i class="fa-solid fa-location-dot"></i> ${p.city}</span>` : ''}
                </div>
            </div>
            <div class="epc-stats">
                ${p.total_matches !== undefined ? `<div class="epc-stat"><span>${p.total_matches || 0}</span><small>Maç</small></div>` : ''}
                ${p.total_goals !== undefined ? `<div class="epc-stat"><span style="color:var(--neon-green)">${p.total_goals || 0}</span><small>Gol</small></div>` : ''}
                ${p.total_assists !== undefined ? `<div class="epc-stat"><span style="color:var(--neon-cyan)">${p.total_assists || 0}</span><small>Asist</small></div>` : ''}
            </div>
            <div class="epc-actions">
                ${isMe
                    ? `<button class="epc-btn epc-btn-self" disabled>Sen</button>`
                    : `<button class="epc-btn epc-btn-friend" id="friend-btn-${p.id}"
                        onclick="handleFriendAction('${p.id}', '${p.username}')">
                        <i class="fa-solid fa-user-plus"></i> Arkadaş Ekle
                      </button>`}
                <button class="epc-btn epc-btn-profile"
                    onclick="openUserProfile('${p.id}', '${p.username}')">
                    <i class="fa-solid fa-user-circle"></i> Profil
                </button>
            </div>
        </div>`;
    }).join('');

    // Arkadaşlık durumlarını async güncelle
    if (currentUserId) {
        updateFriendshipStatuses(filtered, currentUserId);
    }
};

async function updateFriendshipStatuses(players, myId) {
    if (!window.DB) return;
    try {
        const myFriendships = await window.DB.Friends.getMyFriends(myId);
        const pendingReqs   = await window.DB.Friends.getPendingRequests(myId);

        const acceptedIds = new Set();
        myFriendships.forEach(f => {
            const otherId = f.requester_id === myId ? f.addressee_id : f.requester_id;
            acceptedIds.add(otherId);
        });

        const sentIds = new Set();
        // Gönderilen bekleyen istekler için Supabase'den sorgula
        try {
            const { data } = await window.sbClient
                .from('friendships')
                .select('addressee_id')
                .eq('requester_id', myId)
                .eq('status', 'pending');
            (data || []).forEach(f => sentIds.add(f.addressee_id));
        } catch(e) {}

        players.forEach(p => {
            if (p.id === myId) return;
            const btn = document.getElementById(`friend-btn-${p.id}`);
            if (!btn) return;

            if (acceptedIds.has(p.id)) {
                btn.innerHTML = '<i class="fa-solid fa-user-check"></i> Arkadaş';
                btn.className = 'epc-btn epc-btn-friend accepted';
                btn.disabled = true;
            } else if (sentIds.has(p.id)) {
                btn.innerHTML = '<i class="fa-solid fa-clock"></i> İstek Gönderildi';
                btn.className = 'epc-btn epc-btn-friend pending';
                btn.disabled = true;
            }
        });
    } catch(e) {
        console.warn('Friendship status update failed:', e);
    }
}

function getPosLabel(pos) {
    const map = { KL:'Kaleci', DEF:'Defans', OS:'Orta Saha', FV:'Forvet' };
    return map[pos] || pos || 'Oyuncu';
}

window.handleFriendAction = async function(targetId, targetName) {
    const btn = document.getElementById(`friend-btn-${targetId}`);
    if (!btn || !window.DB) return;

    const user = window.__AUTH_USER__;
    if (!user) { showToast('⚠️ Giriş yapmalısınız.'); return; }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gönderiliyor...';

    try {
        await window.DB.Friends.sendRequest(user.id, targetId);

        btn.innerHTML = '<i class="fa-solid fa-clock"></i> İstek Gönderildi';
        btn.className = 'epc-btn epc-btn-friend pending';

        // Bildirim gönder
        await window.DB.Notifications.send(
            targetId,
            'friend_request',
            'Yeni Arkadaşlık İsteği',
            `${user.email?.split('@')[0] || 'Biri'} sana arkadaşlık isteği gönderdi.`,
            user.id
        );

        showToast(`✅ ${targetName}'e arkadaşlık isteği gönderildi!`);
    } catch(e) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Arkadaş Ekle';
        if (e.message?.includes('duplicate')) {
            showToast('⚠️ Zaten istek gönderilmiş.');
        } else {
            showToast('❌ Hata: ' + e.message);
        }
    }
};

window.viewExploreProfile = async function(playerId, username) {
    const currentUserId = window.__AUTH_USER__?.id;

    // Kendi profiliyse → mevcut profil sayfasına git
    if (currentUserId && playerId === currentUserId) {
        showSection('profile');
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelector('.nav-item[data-target="profile"]')?.classList.add('active');
        return;
    }

    // Arkadaşlık durumunu önce kontrol et, sonra modalı aç
    showProfileModal(playerId, username, 'explore');
};

// ── Kullanıcı profil modalı — FAZ 5 Gizlilik Katmanı ──
async function showProfileModal(playerId, username, context = 'explore') {
    // Varsa temizle
    document.getElementById('user-profile-modal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'user-profile-modal';
    modal.className = 'modal-backdrop';
    modal.style.display = 'flex';
    modal.innerHTML = `
    <div class="modal-box" style="max-width:480px;" onclick="event.stopPropagation()">
        <div class="modal-header">
            <h3><i class="fa-solid fa-user" style="color:var(--neon-cyan);"></i> Oyuncu Profili</h3>
            <button class="modal-close" onclick="document.getElementById('user-profile-modal').remove()">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        <div id="upm-body" style="padding:1.5rem; text-align:center;">
            <i class="fa-solid fa-spinner fa-spin fa-2x" style="color:#555;"></i>
            <p style="color:#555; margin-top:1rem;">Profil yükleniyor...</p>
        </div>
    </div>`;
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);

    try {
        const myId = window.__AUTH_USER__?.id;

        // Arkadaşlık durumunu kontrol et
        let friendStatus = null;
        let friendshipId = null;
        if (myId && window.DB) {
            try {
                friendStatus = await window.DB.Friends.checkStatus(myId, playerId);
                friendshipId = friendStatus?.id;
            } catch(e) {}
        }

        const isAccepted   = friendStatus?.status === 'accepted';
        const isPending    = friendStatus?.status === 'pending';
        const iRequested   = isPending && friendStatus?.requester_id === myId;
        const theyRequested = isPending && friendStatus?.addressee_id === myId;
        const isFriendOrSelf = myId === playerId || isAccepted;

        // Profil verisini çek
        // Arkadaş değilse → sadece public_profiles view'ından çek (RLS koruması)
        // Arkadaşsa → tam profil
        let profile = null;
        if (window.DB) {
            if (isFriendOrSelf) {
                profile = await window.DB.Profiles.get(playerId);
            } else {
                // Yabancı → public_profiles view'ından çek
                const { data } = await window.sbClient
                    .from('public_profiles')
                    .select('*')
                    .eq('id', playerId)
                    .single();
                profile = data;
            }
        }
        // Fallback: explorePlayers cache
        if (!profile) {
            profile = (typeof explorePlayers !== 'undefined' ? explorePlayers : []).find(p => p.id === playerId);
        }

        if (!profile) {
            document.getElementById('upm-body').innerHTML =
                `<p style="color:#ff4d4d;">Profil bulunamadı.</p>`;
            return;
        }

        const avatarSeed = profile.username || profile.id;
        const avatarUrl  = profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}`;
        const gen        = Math.round(profile.gen_score || profile.community_gen || 70);
        const genColor   = gen >= 85 ? 'var(--neon-green)' : gen >= 75 ? 'var(--neon-cyan)' : 'orange';
        const posIcon    = { KL:'\uD83E\uDDE4', DEF:'\uD83D\uDEE1\uFE0F', OS:'\u26A1', FV:'\u26BD' }[profile.position] || '\u26BD';

        // ─── GİZLİLİK KONT ROLÜ ───
        if (!isFriendOrSelf) {
            // SİNİRLI PROFIL — Yabancı görünümü
            document.getElementById('upm-body').dataset.profileId   = playerId;
            document.getElementById('upm-body').dataset.profileName = profile.username || username;
            document.getElementById('upm-body').innerHTML = `
            <!-- Kilitli Profil Bannerı -->
            <div style="background:rgba(255,200,0,0.07); border:1px solid rgba(255,200,0,0.2);
                        border-radius:12px; padding:0.6rem 1rem; margin-bottom:1.2rem;
                        display:flex; align-items:center; gap:0.5rem; font-size:0.8rem; color:#ffc800;">
                <i class="fa-solid fa-lock"></i>
                Bu profil sadece arkadaşlara tam görünür. Arkadaş ol!
            </div>

            <!-- Avatar & İsim -->
            <div style="display:flex; flex-direction:column; align-items:center; gap:0.75rem; margin-bottom:1.5rem;">
                <div style="position:relative; display:inline-block;">
                    <img src="${avatarUrl}" style="width:80px; height:80px; border-radius:50%;
                                                  border:3px solid ${genColor}; filter:brightness(0.9);"
                         onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=fb'">
                    <div style="position:absolute; bottom:-4px; right:-4px; background:#0a0a0f;
                                border:1px solid ${genColor}; border-radius:8px; font-size:0.7rem;
                                font-weight:800; color:${genColor}; padding:2px 6px;">
                        ${gen} GEN
                    </div>
                </div>
                <div>
                    <h3 style="margin:0; font-size:1.2rem; font-weight:800;">${profile.username || profile.full_name || 'Oyuncu'}</h3>
                    <span style="font-size:0.8rem; color:var(--neon-cyan);">${posIcon} ${profile.ana_mevki || profile.position || 'Oyuncu'}</span>
                    ${profile.city ? `<span style="display:block; font-size:0.75rem; color:#555; margin-top:2px;"><i class="fa-solid fa-location-dot"></i> ${profile.city}</span>` : ''}
                </div>
            </div>

            <!-- Kilitli İstatistikler -->
            <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:0.5rem; margin-bottom:1.25rem;">
                ${['Maç','Gol','Asist'].map((l,i) => {
                    const vals = [profile.total_matches, profile.total_goals, profile.total_assists];
                    return `<div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07);
                                        border-radius:10px; padding:0.5rem; text-align:center;">
                        <div style="font-size:1rem; font-weight:800; color:#f0f0f0;">${vals[i] ?? '?'}</div>
                        <div style="font-size:0.65rem; color:#555; text-transform:uppercase;">${l}</div>
                    </div>`;
                }).join('')}
            </div>

            <!-- Kilitli Stat Kartları -->
            <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:0.5rem; margin-bottom:1.5rem;">
                ${['Teknik','\u015eut','Pas','Hız','Fizik','Kondisyon'].map(l => `
                <div style="background:rgba(255,255,255,0.03); border:1px dashed rgba(255,255,255,0.07);
                            border-radius:10px; padding:0.5rem; text-align:center; filter:blur(3px);">
                    <div style="font-size:1rem; font-weight:800; color:#555;">??</div>
                    <div style="font-size:0.65rem; color:#444; text-transform:uppercase;">${l}</div>
                </div>`).join('')}
            </div>

            <!-- Aksiyon -->
            <div style="display:flex; gap:0.75rem; justify-content:center;">
                ${iRequested
                    ? `<button class="btn-outline" disabled style="opacity:0.5;">
                            <i class="fa-solid fa-clock"></i> İstek Gönderildi
                        </button>`
                    : theyRequested
                    ? `<button class="btn-primary" onclick="acceptFriendFromModal('${friendshipId}', this)"
                            style="background:linear-gradient(135deg,var(--neon-green),#6fff00); color:#0a0a0f;">
                            <i class="fa-solid fa-check"></i> İsteği Kabul Et
                        </button>`
                    : myId
                    ? `<button class="btn-primary" id="upm-friend-btn"
                            onclick="sendFriendFromModal('${playerId}', '${profile.username || username}', this)"
                            style="background:linear-gradient(135deg,var(--neon-green),#6fff00); color:#0a0a0f;">
                            <i class="fa-solid fa-user-plus"></i> Arkadaş Ekle
                        </button>`
                    : ''}
            </div>`;
            return;
        }

        // ─── TAM PROFIL — Arkadaş veya Kendisi ───
        const ratingStats = [
            { label:'Teknik',    val: profile.rating_teknik    || profile.community_teknik    || 70 },
            { label:'\u015eut',       val: profile.rating_sut       || profile.community_sut       || 70 },
            { label:'Pas',       val: profile.rating_pas       || profile.community_pas       || 70 },
            { label:'Hız',       val: profile.rating_hiz       || profile.community_hiz       || 70 },
            { label:'Fizik',     val: profile.rating_fizik     || profile.community_fizik     || 70 },
            { label:'Kondisyon', val: profile.rating_kondisyon || profile.community_kondisyon || 70 },
        ];

        document.getElementById('upm-body').dataset.profileId   = playerId;
        document.getElementById('upm-body').dataset.profileName = profile.username || username;
        document.getElementById('upm-body').innerHTML = `
        <!-- Avatar & İsim -->
        <div style="display:flex; flex-direction:column; align-items:center; gap:0.75rem; margin-bottom:1.5rem;">
            <div style="position:relative; display:inline-block;">
                <img src="${avatarUrl}" style="width:80px; height:80px; border-radius:50%; border:3px solid ${genColor};"
                     onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=fb'">
                <div style="position:absolute; bottom:-4px; right:-4px; background:#0a0a0f; border:1px solid ${genColor};
                            border-radius:8px; font-size:0.7rem; font-weight:800; color:${genColor}; padding:2px 6px;">
                    ${gen} GEN
                </div>
            </div>
            <div>
                <h3 style="margin:0; font-size:1.2rem; font-weight:800;">${profile.username || profile.full_name || 'Oyuncu'}</h3>
                <span style="font-size:0.8rem; color:var(--neon-cyan);">${posIcon} ${profile.ana_mevki || profile.position || 'Oyuncu'}</span>
                ${profile.city ? `<span style="display:block; font-size:0.75rem; color:#555; margin-top:2px;"><i class="fa-solid fa-location-dot"></i> ${profile.city}</span>` : ''}
            </div>
        </div>

        <!-- İstatistikler -->
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:0.5rem; margin-bottom:1.25rem;">
            ${ratingStats.map(r => `
            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:10px; padding:0.5rem; text-align:center;">
                <div style="font-size:1rem; font-weight:800; color:#f0f0f0;">${Math.round(r.val)}</div>
                <div style="font-size:0.65rem; color:#555; text-transform:uppercase; letter-spacing:0.5px;">${r.label}</div>
            </div>`).join('')}
        </div>

        <!-- Maç / Gol / Asist -->
        <div style="display:flex; gap:0.75rem; justify-content:center; margin-bottom:1.5rem;">
            <div style="text-align:center;">
                <div style="font-size:1.2rem; font-weight:800;">${profile.total_matches || 0}</div>
                <div style="font-size:0.7rem; color:#555;">Maç</div>
            </div>
            <div style="width:1px; background:rgba(255,255,255,0.08);"></div>
            <div style="text-align:center;">
                <div style="font-size:1.2rem; font-weight:800; color:var(--neon-green);">${profile.total_goals || 0}</div>
                <div style="font-size:0.7rem; color:#555;">Gol</div>
            </div>
            <div style="width:1px; background:rgba(255,255,255,0.08);"></div>
            <div style="text-align:center;">
                <div style="font-size:1.2rem; font-weight:800; color:var(--neon-cyan);">${profile.total_assists || 0}</div>
                <div style="font-size:0.7rem; color:#555;">Asist</div>
            </div>
        </div>

        <!-- Aksiyonlar -->
        <div style="display:flex; gap:0.75rem; justify-content:center;">
            ${isAccepted
                ? `<button class="btn-outline" disabled style="opacity:0.5;">
                       <i class="fa-solid fa-user-check"></i> Arkadaş
                   </button>`
                : iRequested
                ? `<button class="btn-outline" disabled style="opacity:0.5;">
                       <i class="fa-solid fa-clock"></i> İstek Gönderildi
                   </button>`
                : theyRequested
                ? `<button class="btn-primary" onclick="acceptFriendFromModal('${friendshipId}', this)"
                       style="background:linear-gradient(135deg,var(--neon-green),#6fff00); color:#0a0a0f;">
                       <i class="fa-solid fa-check"></i> İsteği Kabul Et
                   </button>`
                : myId
                ? `<button class="btn-primary" id="upm-friend-btn"
                       onclick="sendFriendFromModal('${playerId}', '${profile.username || username}', this)"
                       style="background:linear-gradient(135deg,var(--neon-green),#6fff00); color:#0a0a0f;">
                       <i class="fa-solid fa-user-plus"></i> Arkadaş Ekle
                   </button>`
                : ''}
            <button class="btn-outline" onclick="openMatchInviteModal()">
                <i class="fa-solid fa-paper-plane"></i> Davet Et
            </button>
        </div>`;
    } catch(e) {
        console.error('Profile modal error:', e);
        document.getElementById('upm-body').innerHTML =
            `<p style="color:#ff4d4d;">Profil yüklenirken hata oluştu.</p>`;
    }
}

window.sendFriendFromModal = async function(targetId, targetName, btn) {
    const user = window.__AUTH_USER__;
    if (!user || !window.DB) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gönderiliyor...';
    try {
        await window.DB.Friends.sendRequest(user.id, targetId);
        btn.innerHTML = '<i class="fa-solid fa-clock"></i> İstek Gönderildi';
        await window.DB.Notifications.send(
            targetId, 'friend_request',
            'Yeni Arkadaşlık İsteği',
            `${user.email?.split('@')[0] || 'Biri'} sana arkadaşlık isteği gönderdi.`,
            user.id
        );
        showToast(`✅ ${targetName}'e arkadaşlık isteği gönderildi!`);
        // Explore grid'deki butonu da güncelle
        const exploreBtn = document.getElementById(`friend-btn-${targetId}`);
        if (exploreBtn) {
            exploreBtn.innerHTML = '<i class="fa-solid fa-clock"></i> İstek Gönderildi';
            exploreBtn.className = 'epc-btn epc-btn-friend pending';
            exploreBtn.disabled = true;
        }
    } catch(e) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Arkadaş Ekle';
        showToast('❌ ' + (e.message?.includes('duplicate') ? 'Zaten istek gönderilmiş.' : e.message));
    }
};

window.acceptFriendFromModal = async function(friendshipId, btn) {
    if (!window.DB) return;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    try {
        await window.DB.Friends.acceptRequest(friendshipId);
        btn.innerHTML = '<i class="fa-solid fa-user-check"></i> Arkadaş oldunuz!';
        showToast('✅ Arkadaşlık isteği kabul edildi!');
    } catch(e) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> İsteği Kabul Et';
        showToast('❌ Hata: ' + e.message);
    }
};


window.filterExplore = function() {
    exploreFilter.search   = document.getElementById('explore-search')?.value || '';
    exploreFilter.position = document.getElementById('explore-pos-filter')?.value || '';
    renderExploreGrid();
};


// =====================================================
// BÖLÜM 2: GERÇEK FEED — Supabase Posts
// =====================================================

let feedPosts = [];
let feedRealtimeChannel = null;
let feedLoading = false;

window.initRealFeed = async function() {
    if (feedLoading) return;
    feedLoading = true;

    renderFeedLoading();

    try {
        if (window.DB) {
            const user = window.__AUTH_USER__;
            feedPosts = await window.DB.Feed.getPosts(user?.id, 40);
        }
    } catch(e) {
        console.warn('Feed load error:', e);
        feedPosts = [];
    }

    feedLoading = false;
    renderRealFeed();
    subscribeToRealFeed();
};

function renderFeedLoading() {
    const c = document.getElementById('feed-stream');
    if (!c) return;
    c.innerHTML = Array(3).fill(0).map(() => `
        <div class="feed-card skeleton-feed-card">
            <div class="feed-card-left">
                <div class="skeleton-avatar-sm"></div>
            </div>
            <div class="feed-card-body">
                <div class="skeleton-text" style="width:60%; height:12px; margin-bottom:8px;"></div>
                <div class="skeleton-text" style="width:90%; height:10px; margin-bottom:6px;"></div>
                <div class="skeleton-text" style="width:40%; height:10px;"></div>
            </div>
        </div>`).join('');
}

window.renderRealFeed = function() {
    const c = document.getElementById('feed-stream');
    if (!c) return;

    const filter = window._feedFilter || 'all';
    let posts = feedPosts;

    if (filter !== 'all') {
        const typeMap = { match: 'match_result', rating: 'rating', invite: 'invitation' };
        posts = posts.filter(p => p.post_type === (typeMap[filter] || filter));
    }

    if (posts.length === 0) {
        c.innerHTML = `<div class="feed-empty">
            <i class="fa-regular fa-face-smile" style="font-size:2.5rem; color:#333; display:block; margin-bottom:1rem;"></i>
            <p style="color:#555;">Henüz paylaşım yok. İlk paylaşımı sen yap!</p>
        </div>`;
        return;
    }

    c.innerHTML = posts.map(buildRealFeedCard).join('');
    // Like butonlarını kontrol et
    checkMyLikes(posts);
};

function buildRealFeedCard(post) {
    const author     = post.author || {};
    const authorName = author.username || 'Oyuncu';
    const avatarUrl  = author.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authorName)}`;
    const time       = timeAgoSocial(post.created_at);
    const posIcon    = { KL:'🧤', DEF:'🛡️', OS:'⚡', FV:'⚽' }[author.position] || '⚽';

    const typeConfig = {
        status:       { icon:'fa-comment-dots',   color:'var(--text-muted)' },
        match_result: { icon:'fa-futbol',          color:'var(--neon-green)' },
        rating:       { icon:'fa-star',            color:'#ffc800' },
        invitation:   { icon:'fa-paper-plane',     color:'var(--neon-cyan)' },
        achievement:  { icon:'fa-trophy',          color:'#ffc800' },
        team_news:    { icon:'fa-users',            color:'var(--neon-pink)' },
        venue_review: { icon:'fa-location-pin',    color:'var(--neon-cyan)' },
    };
    const cfg = typeConfig[post.post_type] || typeConfig.status;

    const likedClass  = post._isLiked ? 'liked' : '';
    const likeCount   = post.likes_count || 0;
    const commentCount= post.comments_count || 0;

    return `
    <div class="feed-card real-feed-card" data-post-id="${post.id}">
        <div class="feed-card-left">
            <img src="${avatarUrl}" class="feed-avatar" alt="${authorName}"
                 onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'">
            <div class="feed-timeline-line"></div>
        </div>
        <div class="feed-card-body">
            <div class="feed-card-header">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <div class="feed-type-icon" style="color:${cfg.color}">
                        <i class="fa-solid ${cfg.icon}"></i>
                    </div>
                    <div>
                        <span class="feed-actor">${authorName}</span>
                        <span style="font-size:0.72rem; color:#555; margin-left:0.3rem;">${posIcon}</span>
                    </div>
                </div>
                <span class="feed-time">${time}</span>
            </div>
            <div class="feed-text">${escapeHtml(post.content)}</div>
            ${post.related_team ? `<div class="feed-detail-row"><span class="feed-badge match">🏆 ${post.related_team.name}</span></div>` : ''}
            ${post.related_venue ? `<div class="feed-detail-row"><span class="feed-badge venue">🏟️ ${post.related_venue.name}</span></div>` : ''}
            <div class="feed-actions">
                <button class="feed-action-btn like-btn ${likedClass}" onclick="toggleFeedLike('${post.id}', this)">
                    <i class="fa-${likedClass ? 'solid' : 'regular'} fa-heart"></i>
                    <span class="like-count">${likeCount}</span>
                </button>
                <button class="feed-action-btn comment-btn" onclick="toggleFeedComments('${post.id}', this)">
                    <i class="fa-regular fa-comment"></i>
                    <span>${commentCount}</span>
                </button>
                <button class="feed-action-btn share-btn" onclick="shareFeedPost('${post.id}')">
                    <i class="fa-solid fa-share-nodes"></i>
                </button>
            </div>
            <div class="feed-comments-area" id="comments-${post.id}" style="display:none;"></div>
        </div>
    </div>`;
}

async function checkMyLikes(posts) {
    const user = window.__AUTH_USER__;
    if (!user || !window.sbClient || posts.length === 0) return;
    try {
        const postIds = posts.map(p => p.id);
        const { data } = await window.sbClient
            .from('post_likes')
            .select('post_id')
            .eq('user_id', user.id)
            .in('post_id', postIds);

        const likedSet = new Set((data || []).map(l => l.post_id));
        document.querySelectorAll('.like-btn').forEach(btn => {
            const card   = btn.closest('.real-feed-card');
            const postId = card?.dataset.postId;
            if (likedSet.has(postId)) {
                btn.classList.add('liked');
                btn.querySelector('i').className = 'fa-solid fa-heart';
            }
        });
    } catch(e) {}
}

window.toggleFeedLike = async function(postId, btn) {
    const user = window.__AUTH_USER__;
    if (!user) { showToast('⚠️ Beğenmek için giriş yapın.'); return; }
    if (!window.DB) return;

    const isLiked = btn.classList.contains('liked');
    const countEl = btn.querySelector('.like-count');
    const icon    = btn.querySelector('i');

    // Optimistic update
    btn.classList.toggle('liked', !isLiked);
    icon.className = isLiked ? 'fa-regular fa-heart' : 'fa-solid fa-heart';
    if (countEl) {
        let newCount = parseInt(countEl.textContent || '0', 10) + (isLiked ? -1 : 1);
        countEl.textContent = Math.max(0, newCount);
    }

    try {
        await window.DB.Feed.toggleLike(postId, user.id);
    } catch(e) {
        // Rollback
        btn.classList.toggle('liked', isLiked);
        icon.className = isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        if (countEl) {
            let rollCount = parseInt(countEl.textContent || '0', 10) + (isLiked ? 1 : -1);
            countEl.textContent = Math.max(0, rollCount);
        }
        showToast('❌ Beğeni kaydedilemedi.');
    }
};

window.toggleFeedComments = async function(postId, btn) {
    const area = document.getElementById(`comments-${postId}`);
    if (!area) return;

    if (area.style.display !== 'none') {
        area.style.display = 'none';
        return;
    }

    area.style.display = 'block';
    area.innerHTML = `<div style="text-align:center; padding:1rem; color:#555;">
        <i class="fa-solid fa-spinner fa-spin"></i>
    </div>`;

    let comments = [];
    if (window.DB) {
        try { comments = await window.DB.Feed.getComments(postId); } catch(e) {}
    }

    const user   = window.__AUTH_USER__;
    const userId = user?.id;

    area.innerHTML = `
    <div class="comments-list" id="clist-${postId}">
        ${comments.length === 0
            ? '<p style="color:#555; font-size:0.82rem; padding:0.5rem 0;">Henüz yorum yok.</p>'
            : comments.map(c => buildCommentHtml(c)).join('')}
    </div>
    ${userId ? `
    <div class="comment-input-row">
        <img src="${user ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email || 'user')}` : ''}"
             class="comment-avatar" alt="sen">
        <input type="text" class="comment-input" id="ci-${postId}"
               placeholder="Yorum yaz..." maxlength="300"
               onkeydown="if(event.key==='Enter') submitComment('${postId}')">
        <button class="comment-send-btn" onclick="submitComment('${postId}')">
            <i class="fa-solid fa-paper-plane"></i>
        </button>
    </div>` : '<p style="color:#555; font-size:0.82rem;">Yorum yapmak için giriş yapın.</p>'}`;
};

function buildCommentHtml(c) {
    const author  = c.author || {};
    const name    = author.username || 'Oyuncu';
    const avatar  = author.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
    return `
    <div class="comment-item">
        <img src="${avatar}" class="comment-avatar" alt="${name}"
             onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=fb'">
        <div class="comment-body">
            <span class="comment-author">${name}</span>
            <span class="comment-text">${escapeHtml(c.content)}</span>
            <span class="comment-time">${timeAgoSocial(c.created_at)}</span>
        </div>
    </div>`;
}

window.submitComment = async function(postId) {
    const input  = document.getElementById(`ci-${postId}`);
    const content = input?.value?.trim();
    if (!content) return;

    const user = window.__AUTH_USER__;
    if (!user || !window.DB) return;

    input.disabled = true;

    try {
        const comment = await window.DB.Feed.addComment(postId, user.id, content);
        input.value = '';

        const listEl = document.getElementById(`clist-${postId}`);
        if (listEl) {
            // Boş mesajı kaldır
            const empty = listEl.querySelector('p');
            if (empty) empty.remove();
            listEl.insertAdjacentHTML('beforeend', buildCommentHtml(comment));
        }

        // Yorum sayacını güncelle
        const card     = document.querySelector(`[data-post-id="${postId}"]`);
        const countEl  = card?.querySelector('.comment-btn span');
        if (countEl) countEl.textContent = parseInt(countEl.textContent || 0) + 1;

    } catch(e) {
        showToast('❌ Yorum gönderilemedi.');
    } finally {
        if (input) input.disabled = false;
    }
};

window.shareFeedPost = function(postId) {
    if (navigator.share) {
        navigator.share({ title: 'Sosyal Sporcu', url: window.location.href });
    } else {
        navigator.clipboard?.writeText(window.location.href);
        showToast('🔗 Bağlantı kopyalandı!');
    }
};

function subscribeToRealFeed() {
    if (!window.DB || feedRealtimeChannel) return;
    feedRealtimeChannel = window.DB.Feed.subscribeToFeed(newPost => {
        feedPosts.unshift(newPost);
        renderRealFeed();
        showToast('🆕 Yeni paylaşım!');
    });
}


// =====================================================
// BÖLÜM 3: PAYLAŞIM OLUŞTURMA MODALI
// =====================================================

window.openPostModal = function() {
    let modal = document.getElementById('post-modal-backdrop');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'post-modal-backdrop';
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
        <div class="modal-box post-modal-box" onclick="event.stopPropagation()" style="max-width:520px;">
            <div class="modal-header">
                <h3><i class="fa-solid fa-pen-to-square" style="color:var(--neon-green);"></i> Paylaşım Oluştur</h3>
                <button class="modal-close" onclick="closePostModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div style="padding:1.5rem;">
                <div class="post-type-select" style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1rem;" id="post-type-btns">
                    <button class="post-type-btn active" data-type="status" onclick="selectPostType('status', this)">💬 Durum</button>
                    <button class="post-type-btn" data-type="match_result" onclick="selectPostType('match_result', this)">⚽ Maç</button>
                    <button class="post-type-btn" data-type="team_news" onclick="selectPostType('team_news', this)">🏆 Takım</button>
                    <button class="post-type-btn" data-type="venue_review" onclick="selectPostType('venue_review', this)">🏟️ Saha</button>
                </div>
                <textarea id="post-content" class="profile-input"
                    rows="4" maxlength="500"
                    placeholder="Ne düşünüyorsun? (max. 500 karakter)"
                    style="resize:none; width:100%; margin-bottom:0.5rem;"
                    oninput="updatePostCharCount(this)"></textarea>
                <div style="text-align:right; font-size:0.75rem; color:#555;" id="post-char-count">0 / 500</div>
            </div>
            <div class="modal-footer">
                <button class="btn-outline" onclick="closePostModal()">İptal</button>
                <button class="btn-primary" onclick="submitPost()"
                    style="background:linear-gradient(135deg,var(--neon-green),#6fff00); color:#0a0a0f;">
                    <i class="fa-solid fa-paper-plane"></i> Paylaş
                </button>
            </div>
        </div>`;
        modal.onclick = (e) => { if (e.target === modal) closePostModal(); };
        document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.getElementById('post-content')?.focus();
};

window.closePostModal = function() {
    const modal = document.getElementById('post-modal-backdrop');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
};

let currentPostType = 'status';
window.selectPostType = function(type, btn) {
    currentPostType = type;
    document.querySelectorAll('.post-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
};

window.updatePostCharCount = function(textarea) {
    const count = document.getElementById('post-char-count');
    if (count) count.textContent = `${textarea.value.length} / 500`;
};

window.submitPost = async function() {
    const content = document.getElementById('post-content')?.value?.trim();
    if (!content) { showToast('⚠️ Paylaşım içeriği boş olamaz.'); return; }

    const user = window.__AUTH_USER__;
    if (!user) { showToast('⚠️ Giriş yapmalısınız.'); return; }

    if (!window.DB) {
        // Fallback: localStorage (FAZ 1 uyumluluğu)
        if (typeof addFeedEvent === 'function') {
            addFeedEvent('status', { content, text: content });
        }
        closePostModal();
        showToast('✅ Paylaşıldı!');
        return;
    }

    try {
        const post = await window.DB.Feed.createPost(user.id, content, currentPostType);
        closePostModal();
        document.getElementById('post-content').value = '';
        currentPostType = 'status';

        // Feed'e ekle (realtime bunu zaten yapıyor ama hız için önceden de ekleyelim)
        if (!feedPosts.find(p => p.id === post.id)) {
            feedPosts.unshift({ ...post, author: { id: user.id, username: user.email?.split('@')[0] || 'sen' }, likes_count: 0, comments_count: 0 });
            renderRealFeed();
        }
        showToast('✅ Paylaşım yapıldı!');
    } catch(e) {
        showToast('❌ Paylaşım gönderilemedi: ' + e.message);
    }
};


// =====================================================
// BÖLÜM 4: BİLDİRİM SİSTEMİ (Supabase Realtime)
// =====================================================

let notifRealtimeChannel = null;

window.initRealNotifications = async function() {
    const user = window.__AUTH_USER__;
    if (!user || !window.DB) return;

    // Bildirimleri Supabase'den çek
    try {
        const notifs = await window.DB.Notifications.getMyNotifications(user.id, 30);
        
        // Geçmişten kalan eksik arkadaşlık isteklerini notifs içine yama (polyfill)
        const pending = await window.DB.Friends.getPendingRequests(user.id);
        const pendingForMe = pending.filter(f => f.addressee_id === user.id);
        
        for (const p of pendingForMe) {
            const exists = notifs.find(n => n.type === 'friend_request' && n.actor_id === p.requester_id);
            if (!exists) {
                notifs.unshift({
                    id: 'virtual_fr_' + p.id,
                    type: 'friend_request',
                    actor_id: p.requester_id,
                    title: 'Yeni Arkadaşlık İsteği',
                    body: `${p.requester?.username || 'Bir oyuncu'} sana arkadaşlık isteği gönderdi.`,
                    is_read: false,
                    created_at: p.created_at || new Date().toISOString()
                });
            }
        }
        
        // Takım davetlerini polyfill yap
        try {
            const invites = await window.DB.Teams.getMyInvites(user.id);
            for (const inv of invites) {
                const exists = notifs.find(n => n.type === 'team_invite' && n.related_id === inv.team_id);
                if (!exists) {
                    notifs.unshift({
                        id: 'virtual_ti_' + inv.id,
                        type: 'team_invite',
                        actor_id: inv.team?.captain_id,
                        related_id: inv.team_id,
                        title: 'Takım Daveti',
                        body: `<b>${inv.team?.name || 'Bir takım'}</b> seni kadrosuna davet etti!`,
                        is_read: false,
                        created_at: inv.created_at || new Date().toISOString()
                    });
                }
            }
        } catch(err) {
            console.warn("Team invite polyfill failed", err);
        }
        
        notifs.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

        renderRealNotifications(notifs);
    } catch(e) {
        console.warn('Notifications load failed:', e);
    }

    // Realtime aboneliği — sadece bir kez oluştur
    if (!notifRealtimeChannel && window.sbClient) {
        notifRealtimeChannel = window.sbClient
            .channel(`user-notifs-${user.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, payload => {
                const notif = payload.new;
                // Toast göster
                showToast(`🔔 ${notif.title}`);
                // Sayacı artır
                const countEl = document.getElementById('notif-count');
                if (countEl) {
                    const current = parseInt(countEl.textContent || '0');
                    const newCount = current + 1;
                    countEl.textContent = newCount;
                    countEl.style.display = 'flex';
                }
                const profileBadge = document.getElementById('profile-notif-badge');
                if (profileBadge) {
                    profileBadge.textContent = parseInt(profileBadge.textContent || '0') + 1;
                    profileBadge.style.display = 'flex';
                }
                // Panel açıksa yenile
                if (document.getElementById('notif-panel')?.classList.contains('open')) {
                    window.initRealNotifications();
                }
            })
            .subscribe((status) => {
                console.log('Notification realtime:', status);
            });
    }
};

function renderRealNotifications(notifs) {
    const unread = notifs.filter(n => !n.is_read).length;
    const countEl = document.getElementById('notif-count');
    if (countEl) {
        countEl.textContent = unread;
        countEl.style.display = unread > 0 ? 'flex' : 'none';
    }
    
    const profileBadge = document.getElementById('profile-notif-badge');
    if (profileBadge) {
        profileBadge.textContent = unread;
        profileBadge.style.display = unread > 0 ? 'flex' : 'none';
    }

    const list = document.getElementById('notif-list');
    if (!list) return;

    const typeIcons = {
        friend_request:    '👥',
        friend_accepted:   '✅',
        match_invite:      '📩',
        match_result:      '⚽',
        team_invite:       '🏆',
        team_join:         '🎉',
        rating_received:   '⭐',
        comment_received:  '💬',
        like_received:     '❤️',
        achievement_unlocked: '🏅'
    };

    list.innerHTML = notifs.length === 0
        ? '<div class="notif-empty"><i class="fa-regular fa-bell-slash"></i><br>Bildirim yok</div>'
        : notifs.slice(0, 20).map(n => {
            let actionsHtml = '';
            if (!n.is_read) {
                if (n.type === 'friend_request') {
                    actionsHtml = `
                    <div class="notif-actions" style="margin-top:0.5rem; display:flex; gap:0.5rem;">
                        <button onclick="event.stopPropagation(); handleNotifFriendAction('${n.id}', '${n.actor_id}', true)" style="flex:1; background:var(--neon-green); color:#000; border:none; padding:4px; border-radius:4px; font-weight:bold; cursor:pointer;">Kabul Et</button>
                        <button onclick="event.stopPropagation(); handleNotifFriendAction('${n.id}', '${n.actor_id}', false)" style="flex:1; background:transparent; border:1px solid #ff4d4d; color:#ff4d4d; padding:4px; border-radius:4px; cursor:pointer;">Reddet</button>
                    </div>`;
                } else if (n.type === 'team_invite') {
                    const match = n.body?.match(/Davet kodu:\s*([A-Z0-9]+)/i);
                    const slug = match ? match[1] : '';
                    if (slug) {
                        actionsHtml = `
                        <div class="notif-actions" style="margin-top:0.5rem; display:flex; gap:0.5rem;">
                            <button onclick="event.stopPropagation(); handleNotifTeamAction('${n.id}', '${slug}')" style="flex:1; background:var(--neon-cyan); color:#000; border:none; padding:4px; border-radius:4px; font-weight:bold; cursor:pointer;">Katıl</button>
                            <button onclick="event.stopPropagation(); window.DB.Notifications.markRead('${n.id}'); window.initRealNotifications();" style="flex:1; background:transparent; border:1px solid #ff4d4d; color:#ff4d4d; padding:4px; border-radius:4px; cursor:pointer;">Reddet</button>
                        </div>`;
                    }
                }
            }
            return `
            <div class="notif-item ${n.is_read ? 'read' : 'unread'}"
                 onclick="markRealNotifRead('${n.id}', this)">
                <div class="notif-icon">${typeIcons[n.type] || '🔔'}</div>
                <div class="notif-body">
                    <div class="notif-msg">${escapeHtml(n.title)}</div>
                    ${n.body ? `<div class="notif-msg" style="font-size:0.78rem; color:#666; margin-top:2px;">${escapeHtml(n.body)}</div>` : ''}
                    ${actionsHtml}
                    <div class="notif-time">${timeAgoSocial(n.created_at)}</div>
                </div>
                ${!n.is_read ? '<div class="notif-dot"></div>' : ''}
            </div>`;
        }).join('');
}

window.handleNotifFriendAction = async function(notifId, actorId, isAccept) {
    const user = window.__AUTH_USER__;
    if (!user || !window.DB) return;
    try {
        if (isAccept) {
            const status = await window.DB.Friends.checkStatus(user.id, actorId);
            if (status && status.status === 'pending' && status.id) {
                await window.DB.Friends.acceptRequest(status.id);
                if (typeof showToast === 'function') showToast('✅ Arkadaşlık isteği kabul edildi!');
            }
        }
        await window.DB.Notifications.markRead(notifId);
        window.initRealNotifications();
    } catch(e) {
        if (typeof showToast === 'function') showToast('❌ İşlem başarısız: ' + e.message, 'error');
    }
};

window.handleNotifTeamAction = async function(notifId, slug) {
    const user = window.__AUTH_USER__;
    if (!user || !window.DB) return;
    try {
        await window.DB.Teams.joinByCode(user.id, slug);
        if (typeof showToast === 'function') showToast('🏆 Takıma başarıyla katıldın!');
        await window.DB.Notifications.markRead(notifId);
        window.initRealNotifications();
        if (typeof window.initTakimim === 'function') window.initTakimim();
    } catch(e) {
        if (typeof showToast === 'function') showToast('❌ Takıma katılamadın: ' + e.message, 'error');
    }
};

window.markRealNotifRead = async function(notifId, el) {
    if (!window.DB) return;
    el?.classList.replace('unread', 'read');
    el?.querySelector('.notif-dot')?.remove();
    try { await window.DB.Notifications.markRead(notifId); } catch(e) {}

    const countEl = document.getElementById('notif-count');
    if (countEl) {
        const current = parseInt(countEl.textContent || '0');
        const newCount = Math.max(0, current - 1);
        countEl.textContent = newCount;
        countEl.style.display = newCount > 0 ? 'flex' : 'none';
    }
};

// Tümünü oku override (Supabase versiyonu)
const _origMarkAllRead = window.markAllRead;
window.markAllRead = async function() {
    const user = window.__AUTH_USER__;
    if (user && window.DB) {
        try {
            await window.DB.Notifications.markAllRead(user.id);
            document.querySelectorAll('.notif-item').forEach(el => {
                el.classList.replace('unread', 'read');
                el.querySelector('.notif-dot')?.remove();
            });
            const countEl = document.getElementById('notif-count');
            if (countEl) { countEl.textContent = '0'; countEl.style.display = 'none'; }
            return;
        } catch(e) {}
    }
    // Fallback
    if (typeof _origMarkAllRead === 'function') _origMarkAllRead();
};

// Bildirim paneli açıldığında Supabase'den çek
const _origToggleNotifPanel = window.toggleNotifPanel;
window.toggleNotifPanel = function() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    panel.classList.toggle('open');
    document.getElementById('account-panel')?.classList.remove('open');
    if (panel.classList.contains('open')) {
        window.initRealNotifications();
    }
};

window.renderNotifications = function() {
    window.initRealNotifications();
};


// =====================================================
// BÖLÜM 5: PROFİL GÜNCELLEME → SUPABASE
// =====================================================

// saveProfileDetails override — Supabase'e kapsamlı kayıt
const _origSaveProfileDetails = window.saveProfileDetails;
window.saveProfileDetails = async function() {
    // Önce mevcut localStorage kaydı
    if (typeof _origSaveProfileDetails === 'function') _origSaveProfileDetails();

    // Supabase güncelle
    const user = window.__AUTH_USER__;
    if (!user || !window.DB) return;

    // Tüm form alanlarını oku
    const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : null; };

    const updates = {
        // Kimlik bilgileri (Detaylı Veriler sekmesindeki alanlar)
        age:           parseInt(getVal('inp-age'))    || null,
        height:        parseInt(getVal('inp-height')) || null,
        weight:        parseInt(getVal('inp-weight')) || null,
        // Mevki & Oyun Tarzı
        ana_mevki:     getVal('sel-ana-mevki')        || null,
        alt_pos:       getVal('inp-alt-pos')          || null,
        oyun_tarzi:    getVal('sel-oyun-tarzi')       || null,
        // Karakteristik (şemada olan alanlar)
        ekol:          getVal('sel-ekol')             || null,
        sakatlik:      getVal('sel-sakatlik')         || null,
        macsatma:      getVal('sel-macsatma')         || null,
        mizac:         getVal('sel-mizac')            || null,
        lojistik:      getVal('sel-lojistik')         || null,
        ayak:          getVal('sel-ayak')             || null,  // add-ayak-column.sql sonrası aktif
        // Kişisel istatistikler
        total_matches: parseInt(getVal('inp-total-matches')) || null,
        total_goals:   parseInt(getVal('inp-total-goals'))   || null,
        total_assists: parseInt(getVal('inp-total-assists'))  || null,
    };

    // undefined/null temizle
    Object.keys(updates).forEach(k => (updates[k] === undefined || updates[k] === null) && delete updates[k]);

    // Yerel player.stats güncelle (herkese görünsün diye)
    const _localPlayer = typeof players !== 'undefined' ? players.find(p => p.id === activePlayerId) : null;
    if (_localPlayer) {
        if (!_localPlayer.stats) _localPlayer.stats = {};
        if (updates.total_matches !== undefined) _localPlayer.stats.totalMatches = updates.total_matches;
        if (updates.total_goals   !== undefined) _localPlayer.stats.totalGoals   = updates.total_goals;
        if (updates.total_assists !== undefined) _localPlayer.stats.totalAssists  = updates.total_assists;
        if (updates.ana_mevki     !== undefined) _localPlayer.details.anaMevki   = updates.ana_mevki;
        if (updates.ayak          !== undefined) _localPlayer.details.ayak        = updates.ayak;
        if (typeof savePlayers === 'function') savePlayers();
    }

    try {
        await window.DB.Profiles.update(user.id, updates);

        // Username değiştiyse sidebar'ı da güncelle
        if (updates.username) {
            const nameEl = document.getElementById('current-account-name');
            if (nameEl) nameEl.textContent = updates.username;
            const playerNameEl = document.getElementById('player-name');
            if (playerNameEl) playerNameEl.textContent = updates.username;
        }

        console.log('✅ Profil Supabase\'e kaydedildi', updates);
    } catch(e) {
        console.warn('Supabase profile update failed:', e);
        showToast('❌ Profil kaydedilemedi: ' + (e.message || ''));
    }
};

// community rating submit override — Supabase
const _origSubmitRating = window.submitCommunityRating;
window.submitCommunityRating = async function() {
    const user = window.__AUTH_USER__;

    if (user && window.DB && typeof activePlayerId !== 'undefined') {
        const targetPlayer = typeof players !== 'undefined'
            ? players.find(p => p.id === activePlayerId)
            : null;
        const targetSupabaseId = targetPlayer?.supabase_id;

        if (targetSupabaseId && targetSupabaseId !== user.id) {
            // Slider değerlerini oku
            const ratings = {
                teknik:    parseInt(document.getElementById('cr-teknik')?.value || 70),
                sut:       parseInt(document.getElementById('cr-sut')?.value || 70),
                pas:       parseInt(document.getElementById('cr-pas')?.value || 70),
                hiz:       parseInt(document.getElementById('cr-hiz')?.value || 70),
                fizik:     parseInt(document.getElementById('cr-fizik')?.value || 70),
                kondisyon: parseInt(document.getElementById('cr-kondisyon')?.value || 70),
            };
            const comment = document.getElementById('cr-comment')?.value?.trim() || '';

            try {
                await window.DB.Ratings.upsertRating(user.id, targetSupabaseId, ratings, comment);

                // Bildirim gönder
                await window.DB.Notifications.send(
                    targetSupabaseId,
                    'rating_received',
                    'Birisi Seni Puanladı!',
                    `${user.email?.split('@')[0] || 'Biri'} seni puanladı ve yorum yaptı.`,
                    user.id
                );

                // Feed'e post ekle
                const avg = Math.round(Object.values(ratings).reduce((a,b)=>a+b,0)/6);
                await window.DB.Feed.createPost(user.id,
                    `${targetPlayer?.name || 'Bir oyuncu'}'ı puanladım! GEN: ${avg} ⭐${comment ? ` — "${comment}"` : ''}`,
                    'rating',
                    { related_player_id: targetSupabaseId }
                );

                console.log('✅ Community rating Supabase\'e kaydedildi');

                // Yerel player objesine de ekle → chart hemen güncellensin
                if (targetPlayer) {
                    if (!targetPlayer.communityRatings) targetPlayer.communityRatings = [];
                    const fromId = user.id;
                    const existIdx = targetPlayer.communityRatings.findIndex(r => r.fromAccountId === fromId || r.supabase_from === fromId);
                    const newEntry = {
                        fromAccountId: fromId,
                        supabase_from: fromId,
                        date: new Date().toISOString(),
                        ...ratings,
                        comment
                    };
                    if (existIdx >= 0) {
                        targetPlayer.communityRatings[existIdx] = newEntry;
                    } else {
                        targetPlayer.communityRatings.push(newEntry);
                    }
                    // Chart'ı hemen güncelle
                    if (typeof updateChart === 'function') {
                        setTimeout(() => updateChart(targetPlayer), 200);
                    }
                    if (typeof updateUI === 'function') setTimeout(() => updateUI(), 300);
                }
            } catch(e) {
                console.warn('Rating Supabase save failed:', e);
            }
        }
    }

    // Orijinal fonksiyon (localStorage)
    if (typeof _origSubmitRating === 'function') _origSubmitRating();
};


// =====================================================
// BÖLÜM 6: YARDIMCI FONKSİYONLAR
// =====================================================

function timeAgoSocial(isoDate) {
    if (!isoDate) return '';
    const diff = Math.floor((Date.now() - new Date(isoDate)) / 1000);
    if (diff < 60)    return 'Az önce';
    if (diff < 3600)  return `${Math.floor(diff/60)} dk önce`;
    if (diff < 86400) return `${Math.floor(diff/3600)} saat önce`;
    if (diff < 604800)return `${Math.floor(diff/86400)} gün önce`;
    return new Date(isoDate).toLocaleDateString('tr-TR', { day:'numeric', month:'short' });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
              .replace(/"/g,'&quot;').replace(/'/g,'&#039;')
              .replace(/\n/g, '<br>');
}


// =====================================================
// BÖLÜM 7: SECTION GEÇİŞLERİNE HOOK EKLE
// =====================================================

// showSection override — explore ve feed için Supabase yüklemesi
const _origShowSection = window.showSection;
window.showSection = function(id) {
    if (typeof _origShowSection === 'function') _origShowSection(id);

    if (id === 'explore') {
        setTimeout(() => window.initExplore(), 100);
    }
    if (id === 'feed') {
        setTimeout(() => window.initRealFeed(), 100);
    }
};

// Feed filter override
window.filterFeed = function(filter, btn) {
    window._feedFilter = filter;
    document.querySelectorAll('.feed-filter').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderRealFeed();
};


// =====================================================
// INIT — Sayfa yüklenince
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    // Bildirim sistemi başlat
    setTimeout(() => window.initRealNotifications(), 800);
});


// =====================================================
// BÖLÜM 8: DİĞER KULLANICININ PROFİLİNE GİTME
// Puan verebilmek için tam profil sayfası yükleme
// =====================================================

let _savedMyPlayerId = null;

// Modal'daki "Profil Sayfasına Git" butonu / herhangi bir yerden çağrılabilir
window.openUserProfile = async function(supabaseId, username) {
    const user = window.__AUTH_USER__;

    // Kendi profili → direkt profil sekmesi
    if (user && supabaseId === user.id) {
        // Kendi profili gösteriyorsa banner'ı kaldır
        document.getElementById('profile-view-banner')?.remove();
        if (_savedMyPlayerId && typeof window.activePlayerId !== 'undefined') {
            window.activePlayerId = _savedMyPlayerId;
            _savedMyPlayerId = null;
        }
        if (typeof updateUI === 'function') updateUI();
        showSection('profile');
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelector('.nav-item[data-target="profile"]')?.classList.add('active');
        document.getElementById('user-profile-modal')?.remove();
        return;
    }

    // Aktif (kendi) player ID'yi sakla — sadece bir kez
    if (!_savedMyPlayerId) {
        _savedMyPlayerId = window.activePlayerId || activePlayerId;
        console.log(`💾 Kendi player ID saklandı: ${_savedMyPlayerId}`);
    }

    showToast('⏳ Profil yükleniyor...');

    // Supabase'den profil çek
    let profile = null;
    try {
        if (window.DB) profile = await window.DB.Profiles.get(supabaseId);
    } catch(e) {}
    if (!profile) profile = explorePlayers.find(p => p.id === supabaseId);
    if (!profile) {
        // Friendships'ten çekmeyi dene
        try {
            const { data } = await window.sbClient.from('profiles').select('*').eq('id', supabaseId).single();
            profile = data;
        } catch(e) {}
    }

    if (!profile) {
        showToast('❌ Profil bulunamadı.');
        return;
    }

    const tempId = `sb_view_${supabaseId}`;

    // Geçici player objesi oluştur
    const tempPlayer = {
        id: tempId,
        name: profile.username || profile.full_name || username || 'Oyuncu',
        supabase_id: supabaseId,
        _isViewProfile: true,
        details: {
            pos:           profile.position      || 'OS',
            age:           profile.age           || 24,
            height:        profile.height        || 180,
            weight:        profile.weight        || 75,
            ekol:          profile.ekol          || 'Halısaha Gazisi',
            anaMevki:      profile.ana_mevki     || profile.position || 'Orta Saha',
            altPos:        profile.alt_pos       || '',
            oyunTarzi:     profile.oyun_tarzi    || 'Box-to-Box',
            dakiklik:      profile.dakiklik      || 'Son Dakika Yetişir',
            sahaIletisim:  profile.saha_iletisim || 'Sessiz Oynar',
            macSonu:       profile.mac_sonu      || 'Bir Çay İçip Gider',
            mevkiSadakat:  profile.mevki_sadakat || 'Bazen Gezer',
            presGucu:      profile.pres_gucu     || 'Yorgunsa Yavaş',
            pasTercihi:    profile.pas_tercihi   || 'Dengeli',
            markaj:        profile.markaj        || 'Yakın Takip',
            sakatlik:      profile.sakatlik      || 'Maç Seçer',
            macsatma:      profile.macsatma      || 'Keyfine Bağlı',
            mizac:         profile.mizac         || 'Makara Yapıcı',
            lojistik:      profile.lojistik      || 'Kendi Gelir',
            ayak:          profile.ayak          || 'Sağ',
            city:          profile.city          || 'istanbul',
        },
        ratings: {
            teknik:    profile.rating_teknik    || 70,
            sut:       profile.rating_sut       || 70,
            pas:       profile.rating_pas       || 70,
            hiz:       profile.rating_hiz       || 70,
            fizik:     profile.rating_fizik     || 70,
            kondisyon: profile.rating_kondisyon || 70,
        },
        stats: {
            totalMatches: profile.total_matches  || 0,
            totalGoals:   profile.total_goals    || 0,
            totalAssists: profile.total_assists  || 0,
        },
        communityRatings: [],
        genScore: profile.gen_score || 70,
    };

    // window.players'a ekle / güncelle (global erişim için window. prefix zorunlu)
    if (window.players) {
        const idx = window.players.findIndex(p => p.id === tempId);
        if (idx >= 0) window.players.splice(idx, 1);
        window.players.push(tempPlayer);
        console.log(`✅ Temp player eklendi: ${tempId}, toplam: ${window.players.length}`);
    }

    // window.activePlayerId değiştir
    window.activePlayerId = tempId;
    console.log(`✅ activePlayerId → ${tempId}`);

    // Modal kapat
    document.getElementById('user-profile-modal')?.remove();

    // Profile sekmesine git — _fromViewPlayer flag'i set et
    if (typeof showSection === 'function') {
        showSection._fromViewPlayer = true;
        showSection('profile');
    }
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('.nav-item[data-target="profile"]')?.classList.add('active');
    // Önceki sekme = explore
    window.previousSection = 'explore';

    // UI güncelle — activePlayerId değiştikten sonra
    if (typeof updateUI === 'function') updateUI();

    // Çift banner sorunu: addProfileViewBanner() yerine mevcut view-only-banner kullan
    // applyProfileViewMode() zaten view-only-banner'ı gösteriyor
    // previousSection'ı ayarla ki "Geri Dön" butonu çalışsın
    window.previousSection = 'explore';
    if (typeof applyProfileViewMode === 'function') {
        setTimeout(() => applyProfileViewMode(), 60);
    }

    showToast(`👤 ${profile.username || username}'in profili açıldı — puan verebilirsin!`);

};

// Profil görüntüleme banner'ı — artık view-only-banner kullanıldığı için devre dışı
// (eski kod bırakıldı uyumluluk için, hiçbir şey yapmaz)
function addProfileViewBanner(name, supabaseId) {
    // Artık view-only-banner (index.html) + applyProfileViewMode() kullanılıyor
    // Çift banner oluşmaması için bu fonksiyon kasıtlı olarak boş bırakıldı
}

// Kendi profiline dön — script.js'deki goBackFromProfile'ı kullan
window.returnToMyProfile = function() {
    document.getElementById('profile-view-banner')?.remove();
    if (_savedMyPlayerId) {
        window.activePlayerId = _savedMyPlayerId;
        activePlayerId = _savedMyPlayerId;
        _savedMyPlayerId = null;
    }
    // Mevcut geri dönüş sistemini kullan
    if (typeof window.goBackFromProfile === 'function') {
        window.goBackFromProfile();
    } else {
        if (typeof updateUI === 'function') updateUI();
        showToast('↩️ Kendi profiline döndün');
    }
};

// Modal'a "Profil Sayfasına Git" butonunu ekle (showProfileModal override)
const _origShowProfileModal = window.showProfileModal || function(){};
// Profil modalı içine "Tam Profil Aç" butonu ekliyoruz
// buildProfileModalActionButtons fonksiyonu orijinaline ek buton ekler
function buildProfileExtraAction(playerId, username) {
    return `
        <button class="btn-outline" onclick="openUserProfile('${playerId}','${username}')"
                style="border-color:rgba(0,229,255,0.3); color:var(--neon-cyan);">
            <i class="fa-solid fa-user-circle"></i> Tam Profil & Puan Ver
        </button>`;
}

// showProfileModal'daki aksiyonları genişletmek için küçük patch:
// Modalın DOM'una ekleme yapıyoruz — body içrinde "upm-body" dolunca çağrılır
const _origAcceptFriend = window.acceptFriendFromModal;
function patchProfileModalWithFullProfileBtn() {
    const body = document.getElementById('upm-body');
    if (!body) return;
    const actionsDiv = body.querySelector('div[style*="justify-content:center"]');
    if (!actionsDiv) return;
    const playerId  = body.dataset.profileId;
    const username  = body.dataset.profileName;
    if (!playerId || actionsDiv.querySelector('.full-profile-btn')) return;
    actionsDiv.insertAdjacentHTML('beforeend', `
        <button class="btn-outline full-profile-btn"
                onclick="openUserProfile('${playerId}','${username}')"
                style="border-color:rgba(0,229,255,0.3); color:var(--neon-cyan);">
            <i class="fa-solid fa-user-circle"></i> Profil & Puan Ver
        </button>`);
}

// upm-body mutations izle
const upmObserver = new MutationObserver(() => {
    patchProfileModalWithFullProfileBtn();
});

// Modal açıldığında observer başlat
const origViewExplore = window.viewExploreProfile;
window.viewExploreProfile = async function(playerId, username) {
    await origViewExplore(playerId, username);
    // body datasını set et ki patch doğru çalışsın
    const body = document.getElementById('upm-body');
    if (body) {
        body.dataset.profileId   = playerId;
        body.dataset.profileName = username;
        upmObserver.observe(body, { childList: true, subtree: false });
    }
};


// =====================================================
// BÖLÜM 9: ARKADAŞLAR LİSTESİ
// =====================================================

let myFriendsList = [];

window.loadFriendsList = async function() {
    const user = window.__AUTH_USER__;
    const grid = document.getElementById('friends-list-grid');
    if (!grid) return;

    grid.innerHTML = `<div style="text-align:center; padding:2rem; color:#555; grid-column:1/-1;">
        <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
        <p style="margin-top:1rem;">Arkadaşlar yükleniyor...</p>
    </div>`;

    if (!user || !window.DB) {
        grid.innerHTML = `<div style="text-align:center;padding:2rem;color:#555;grid-column:1/-1;">
            <i class="fa-solid fa-user-slash fa-2x"></i>
            <p style="margin-top:1rem;">Giriş yapmanız gerekiyor.</p></div>`;
        return;
    }

    try {
        const friendships = await window.DB.Friends.getMyFriends(user.id);
        // Pending gelen istekler
        const pending = await window.DB.Friends.getPendingRequests(user.id);

        myFriendsList = friendships;

        // Pending istekleri göster
        const pendingHtml = pending.filter(f => f.addressee_id === user.id).map(f => {
            const actor = f.requester || {};
            const name  = actor.username || 'Oyuncu';
            const seed  = actor.username || f.requester_id;
            const avatar= actor.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
            return `
            <div class="explore-player-card" style="border-color:rgba(173,255,47,0.2);">
                <div class="epc-header">
                    <div class="epc-avatar-wrap">
                        <img src="${avatar}" class="epc-avatar" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=fb'">
                    </div>
                    <div class="epc-info">
                        <h4 class="epc-name">${name}</h4>
                        <span class="epc-position" style="color:var(--neon-green);">⏳ Arkadaşlık İsteği Gönderdi</span>
                    </div>
                </div>
                <div class="epc-actions">
                    <button class="epc-btn epc-btn-friend"
                            onclick="acceptFriendReq('${f.id}', this, '${name}')">
                        <i class="fa-solid fa-check"></i> Kabul Et
                    </button>
                    <button class="epc-btn epc-btn-profile"
                            onclick="openUserProfile('${f.requester_id}', '${name}')">
                        <i class="fa-solid fa-eye"></i> Profil
                    </button>
                </div>
            </div>`;
        }).join('');

        // Kabul edilmiş arkadaşlar
        const friendsHtml = friendships.length === 0 ? '' : friendships.map(f => {
            const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
            const friend   = f.requester_id === user.id ? (f.addressee || {}) : (f.requester || {});
            const name     = friend.username || 'Oyuncu';
            const seed     = friend.username || friendId;
            const avatar   = friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
            const gen      = friend.gen_score || 70;
            const genColor = gen >= 85 ? 'var(--neon-green)' : gen >= 75 ? 'var(--neon-cyan)' : 'orange';
            const posIcon  = { KL:'🧤', DEF:'🛡️', OS:'⚡', FV:'⚽' }[friend.position] || '⚽';
            return `
            <div class="explore-player-card">
                <div class="epc-header">
                    <div class="epc-avatar-wrap">
                        <img src="${avatar}" class="epc-avatar" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=fb'">
                        <div class="epc-gen-badge" style="color:${genColor}; border-color:${genColor};">${Math.round(gen)}</div>
                    </div>
                    <div class="epc-info">
                        <h4 class="epc-name">${name}</h4>
                        <span class="epc-position">${posIcon} ${getPosLabel(friend.position)}</span>
                        ${friend.city ? `<span class="epc-city"><i class="fa-solid fa-location-dot"></i> ${friend.city}</span>` : ''}
                    </div>
                </div>
                <div class="epc-stats">
                    <div class="epc-stat"><span>${friend.total_matches||0}</span><small>Maç</small></div>
                    <div class="epc-stat"><span style="color:var(--neon-green)">${friend.total_goals||0}</span><small>Gol</small></div>
                    <div class="epc-stat"><span style="color:var(--neon-cyan)">${friend.total_assists||0}</span><small>Asist</small></div>
                </div>
                <div class="epc-actions">
                    <button class="epc-btn epc-btn-profile"
                            onclick="openUserProfile('${friendId}', '${name}')">
                        <i class="fa-solid fa-user-circle"></i> Profil & Puan Ver
                    </button>
                    <button class="epc-btn" style="color:#ff4d4d; border-color:rgba(255,77,77,0.2);"
                            onclick="removeFriend('${f.id}', this)">
                        <i class="fa-solid fa-user-minus"></i>
                    </button>
                </div>
            </div>`;
        }).join('');

        if (pendingHtml === '' && friendsHtml === '') {
            grid.innerHTML = `<div style="text-align:center; padding:3rem; color:#555; grid-column:1/-1;">
                <i class="fa-solid fa-user-group fa-2x" style="margin-bottom:1rem; display:block;"></i>
                Henüz arkadaşın yok. Keşfet'ten oyuncu ekle!
            </div>`;
        } else {
            const pendingSection = pendingHtml ? `
                <div style="grid-column:1/-1; margin-bottom:0.5rem;">
                    <h4 style="color:var(--neon-green); font-size:0.85rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin:0 0 0.75rem;">
                        ⏳ Bekleyen Arkadaşlık İstekleri
                    </h4>
                </div>
                ${pendingHtml}
                <div style="grid-column:1/-1; margin-bottom:0.5rem; margin-top:1rem;">
                    <h4 style="color:#888; font-size:0.85rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin:0 0 0.75rem;">
                        ✅ Arkadaşlarım (${friendships.length})
                    </h4>
                </div>` : `
                <div style="grid-column:1/-1; margin-bottom:0.75rem;">
                    <h4 style="color:#888; font-size:0.85rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin:0 0 0.75rem;">
                        ✅ Arkadaşlarım (${friendships.length})
                    </h4>
                </div>`;
            grid.innerHTML = pendingSection + friendsHtml;
        }
    } catch(e) {
        console.error('Friends load error:', e);
        grid.innerHTML = `<div style="text-align:center;padding:2rem;color:#ff4d4d;grid-column:1/-1;">
            Arkadaş listesi yüklenirken hata oluştu.</div>`;
    }
};

window.acceptFriendReq = async function(friendshipId, btn, name) {
    if (!window.DB) return;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    try {
        await window.DB.Friends.acceptRequest(friendshipId);
        btn.innerHTML = '<i class="fa-solid fa-user-check"></i> Arkadaş!';
        showToast(`✅ ${name} ile arkadaş oldunuz!`);
        setTimeout(() => window.loadFriendsList(), 1000);
    } catch(e) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Kabul Et';
        showToast('❌ Hata: ' + e.message);
    }
};

window.removeFriend = async function(friendshipId, btn) {
    if (!confirm('Bu arkadaşlığı silmek istiyor musun?')) return;
    if (!window.DB) return;
    btn.disabled = true;
    try {
        await window.sbClient.from('friendships').delete().eq('id', friendshipId);
        btn.closest('.explore-player-card')?.remove();
        showToast('✅ Arkadaşlık silindi.');
    } catch(e) {
        btn.disabled = false;
        showToast('❌ Silinemedi: ' + e.message);
    }
};

// Explore sekme switcher
window.switchExploreTab = function(tab, btn) {
    document.querySelectorAll('.explore-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const playersSection = document.getElementById('explore-players-section');
    const teamsSection   = document.getElementById('explore-teams-section');
    const friendsSection = document.getElementById('explore-friends-section');
    const inviteSection  = document.getElementById('explore-invite-section');

    if (playersSection) playersSection.style.display = 'none';
    if (teamsSection)   teamsSection.style.display   = 'none';
    if (friendsSection) friendsSection.style.display = 'none';
    if (inviteSection)  inviteSection.style.display  = 'none';

    if (tab === 'players') {
        if (playersSection) playersSection.style.display = '';
    } else if (tab === 'teams') {
        if (teamsSection) teamsSection.style.display = '';
        window.loadExploreTeams();
    } else if (tab === 'friends') {
        if (friendsSection) friendsSection.style.display = '';
        window.loadFriendsList();
    } else if (tab === 'invite') {
        if (inviteSection) inviteSection.style.display  = '';
        // Invite link preview'i doldur
        const preview = document.getElementById('invite-link-preview');
        if (preview) {
            const base = window.location.href.replace(/\/[^\/]*(\?.*)?$/, '/auth.html');
            preview.textContent = base;
        }
    }
};

// loadExploreTeams → initExploreTeams'e yönlendir (geriye uyumluluk)
window.loadExploreTeams = function() { initExploreTeams(); };



// =====================================================
// BÖLÜM 10: DAVET LİNKİ PAYLAŞIMI
// =====================================================

window.copyInviteLink = function() {
    // Mevcut URL'den auth.html linkini üret
    let base = window.location.href;
    // file:// protokolü mü?
    if (base.startsWith('file://')) {
        base = base.replace(/\/[^\/]*$/, '/auth.html');
        navigator.clipboard?.writeText(base).then(() => {
            showToast('📋 Bağlantı kopyalandı! (Lokal — arkadaşın aynı bilgisayarda olmalı)');
        }).catch(() => {
            prompt('Şu adresi kopyalay ve paylaş:', base);
        });
    } else {
        // HTTP(S) hosted
        const authUrl = base.replace(/\/[^\/]*$/, '/auth.html');
        navigator.clipboard?.writeText(authUrl).then(() => {
            showToast('✅ Kayıt linki kopyalandı! Arkadaşlarına gönder.');
        }).catch(() => {
            prompt('Şu linki arkadaşlarına gönder:', authUrl);
        });
    }
};


// =====================================================
// BÖLÜM 11: AVATAR YÜKLEME — Supabase Storage
// =====================================================

/**
 * Resmi maksimum boyuta indirgeyen ve base64'e çeviren yardımcı fonksiyon
 */
function resizeImage(file, maxWidth = 400, maxHeight = 400, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                // Oranı koru
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width  = Math.round(width  * ratio);
                    height = Math.round(height * ratio);
                }

                canvas.width  = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => resolve(blob),
                    'image/webp',
                    quality
                );
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Avatar upload işlemini yönetir.
 * Trigger: <input id="avatar-upload" onchange="handleAvatarUpload(this)">
 */
window.handleAvatarUpload = async function(input) {
    const file = input.files?.[0];
    if (!file) return;

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
        showToast('❌ Lütfen bir resim dosyası seçin.');
        input.value = '';
        return;
    }

    // 10 MB limit
    if (file.size > 10 * 1024 * 1024) {
        showToast('❌ Dosya boyutu 10 MB\'dan büyük olamaz.');
        input.value = '';
        return;
    }

    const user = window.__AUTH_USER__;
    if (!user) {
        showToast('❌ Fotoğraf yüklemek için giriş yapmalısınız.');
        return;
    }

    // UI: yükleniyor göster
    const avatarImg = document.getElementById('profile-avatar');
    const cameraOverlay = document.querySelector('.camera-overlay');
    if (cameraOverlay) {
        cameraOverlay.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        cameraOverlay.style.background = 'rgba(0,0,0,0.7)';
    }

    try {
        // 1. Resmi yeniden boyutlandır (400x400 max, WebP)
        const resizedBlob = await resizeImage(file, 400, 400, 0.85);

        // 2. Supabase Storage'a yükle
        if (!window.sbClient) throw new Error('Supabase bağlantısı yok');

        const fileName = `${user.id}/avatar.webp`;
        const { data: uploadData, error: uploadError } = await window.sbClient
            .storage
            .from('avatars')
            .upload(fileName, resizedBlob, {
                contentType: 'image/webp',
                upsert: true   // Üzerine yaz
            });

        if (uploadError) throw uploadError;

        // 3. Public URL al
        const { data: urlData } = window.sbClient
            .storage
            .from('avatars')
            .getPublicUrl(fileName);

        const publicUrl = urlData?.publicUrl;
        if (!publicUrl) throw new Error('URL alınamadı');

        // Cache buster ekle (tarayıcı eski resmi göstermesin)
        const avatarUrl = `${publicUrl}?t=${Date.now()}`;

        // 4. Supabase profiles tablosunu güncelle
        if (window.DB) {
            await window.DB.Profiles.update(user.id, { avatar_url: avatarUrl });
        } else {
            await window.sbClient
                .from('profiles')
                .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
                .eq('id', user.id);
        }

        // 5. UI güncelle — tüm avatar elementleri
        if (avatarImg) {
            avatarImg.src = avatarUrl;
            avatarImg.onerror = () => {
                avatarImg.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email || 'user')}`;
            };
        }

        // Sidebar'daki hesap avatarını da güncelle
        const sidebarAvatar = document.getElementById('current-account-avatar');
        if (sidebarAvatar) sidebarAvatar.src = avatarUrl;

        // Explore'daki kendi kartını güncelle (varsa)
        const myExploreAvatar = document.querySelector(`#epc-${user.id} .epc-avatar`);
        if (myExploreAvatar) myExploreAvatar.src = avatarUrl;

        showToast('✅ Profil fotoğrafı başarıyla güncellendi!');
        console.log('✅ Avatar yüklendi:', avatarUrl);

    } catch (err) {
        console.error('Avatar yükleme hatası:', err);

        let msg = '❌ Fotoğraf yüklenirken hata oluştu.';
        if (err.message?.includes('Bucket not found') || err.message?.includes('bucket')) {
            msg = '❌ Storage bucket bulunamadı. Supabase\'de "avatars" bucket\'ını oluşturun.';
        } else if (err.message?.includes('not authorized') || err.message?.includes('policy')) {
            msg = '❌ Yükleme yetkisi yok. Storage politikalarını kontrol edin.';
        } else if (err.message?.includes('413') || err.message?.includes('too large')) {
            msg = '❌ Dosya çok büyük.';
        }

        showToast(msg);
    } finally {
        // UI: yükleniyor göstergesini kaldır
        if (cameraOverlay) {
            cameraOverlay.innerHTML = '<i class="fa-solid fa-camera"></i>';
            cameraOverlay.style.background = '';
        }
        // Input'u sıfırla (aynı dosyayı tekrar seçmeye izin ver)
        input.value = '';
    }
};

/**
 * Sayfa yüklenince avatar-upload input'una handler bağla
 * ve mevcut kullanıcı avatarını Supabase'den yükle
 */
async function initAvatarUpload() {
    const input = document.getElementById('avatar-upload');
    if (input) {
        input.addEventListener('change', function() {
            window.handleAvatarUpload(this);
        });
    }

    // Kullanıcının mevcut avatar'ını yükle
    const user = window.__AUTH_USER__;
    if (!user) return;

    try {
        let profile = null;
        if (window.DB) {
            profile = await window.DB.Profiles.get(user.id);
        } else if (window.sbClient) {
            const { data } = await window.sbClient
                .from('profiles')
                .select('avatar_url, username')
                .eq('id', user.id)
                .single();
            profile = data;
        }

        if (profile?.avatar_url) {
            const avatarImg = document.getElementById('profile-avatar');
            if (avatarImg) {
                avatarImg.src = profile.avatar_url;
                avatarImg.onerror = () => {
                    avatarImg.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.username || user.email || 'user')}`;
                };
            }
            // Sidebar avatar
            const sidebarAvatar = document.getElementById('current-account-avatar');
            if (sidebarAvatar) sidebarAvatar.src = profile.avatar_url;
        }
    } catch(e) {
        console.warn('Avatar yükleme başlangıç hatası:', e);
    }
}

// DOMContentLoaded hook'una ekle
document.addEventListener('DOMContentLoaded', () => {
    // Kısa gecikme ile — auth user yüklenmesini bekle
    setTimeout(() => initAvatarUpload(), 1200);
});


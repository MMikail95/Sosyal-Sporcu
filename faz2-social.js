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

    // Başka kullanıcı → Supabase'den çek + modal göster
    showProfileModal(playerId, username);
};

// ── Kullanıcı profil modalı ──
async function showProfileModal(playerId, username) {
    // Modal varsa kaldır
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
        // Supabase'den profil çek
        let profile = null;
        if (window.DB) {
            profile = await window.DB.Profiles.get(playerId);
        }
        if (!profile) {
            // explorePlayers'dan fallback
            profile = explorePlayers.find(p => p.id === playerId);
        }

        if (!profile) {
            document.getElementById('upm-body').innerHTML =
                `<p style="color:#ff4d4d;">Profil bulunamadı.</p>`;
            return;
        }

        // Arkadaşlık durumu
        let friendStatus = null;
        let friendshipId = null;
        const myId = window.__AUTH_USER__?.id;
        if (myId && window.DB) {
            try {
                friendStatus = await window.DB.Friends.checkStatus(myId, playerId);
                friendshipId = friendStatus?.id;
            } catch(e) {}
        }

        const avatarSeed = profile.username || profile.id;
        const avatarUrl  = profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}`;
        const gen        = Math.round(profile.gen_score || profile.community_gen || 70);
        const genColor   = gen >= 85 ? 'var(--neon-green)' : gen >= 75 ? 'var(--neon-cyan)' : 'orange';
        const posIcon    = { KL:'🧤', DEF:'🛡️', OS:'⚡', FV:'⚽' }[profile.position] || '⚽';

        const isAccepted  = friendStatus?.status === 'accepted';
        const isPending   = friendStatus?.status === 'pending';
        const iRequested  = isPending && friendStatus?.requester_id === myId;
        const theyRequested = isPending && friendStatus?.addressee_id === myId;

        const ratingStats = [
            { label:'Teknik',    val: profile.rating_teknik    || profile.community_teknik    || 70 },
            { label:'Şut',       val: profile.rating_sut       || profile.community_sut       || 70 },
            { label:'Pas',       val: profile.rating_pas       || profile.community_pas       || 70 },
            { label:'Hız',       val: profile.rating_hiz       || profile.community_hiz       || 70 },
            { label:'Fizik',     val: profile.rating_fizik     || profile.community_fizik     || 70 },
            { label:'Kondisyon', val: profile.rating_kondisyon || profile.community_kondisyon || 70 },
        ];

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
    if (countEl) countEl.textContent = parseInt(countEl.textContent || 0) + (isLiked ? -1 : 1);

    try {
        await window.DB.Feed.toggleLike(postId, user.id);
    } catch(e) {
        // Rollback
        btn.classList.toggle('liked', isLiked);
        icon.className = isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        if (countEl) countEl.textContent = parseInt(countEl.textContent || 0) + (isLiked ? 1 : -1);
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
        : notifs.slice(0, 20).map(n => `
            <div class="notif-item ${n.is_read ? 'read' : 'unread'}"
                 onclick="markRealNotifRead('${n.id}', this)">
                <div class="notif-icon">${typeIcons[n.type] || '🔔'}</div>
                <div class="notif-body">
                    <div class="notif-msg">${escapeHtml(n.title)}</div>
                    ${n.body ? `<div class="notif-msg" style="font-size:0.78rem; color:#666; margin-top:2px;">${escapeHtml(n.body)}</div>` : ''}
                    <div class="notif-time">${timeAgoSocial(n.created_at)}</div>
                </div>
                ${!n.is_read ? '<div class="notif-dot"></div>' : ''}
            </div>`).join('');
}

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


// =====================================================
// BÖLÜM 5: PROFİL GÜNCELLEME → SUPABASE
// =====================================================

// saveProfileDetails override — localStorage + Supabase
const _origSaveProfileDetails = window.saveProfileDetails;
window.saveProfileDetails = async function() {
    // Önce mevcut localStorage kaydı
    if (typeof _origSaveProfileDetails === 'function') _origSaveProfileDetails();

    // Supabase güncelle
    const user = window.__AUTH_USER__;
    if (!user || !window.DB) return;

    const player = typeof players !== 'undefined'
        ? players.find(p => p.supabase_id === user.id || p.id === `sb_${user.id}`)
        : null;
    if (!player) return;

    try {
        await window.DB.Profiles.update(user.id, {
            age:           parseInt(document.getElementById('inp-age')?.value) || player.details.age,
            height:        parseInt(document.getElementById('inp-height')?.value) || player.details.height,
            weight:        parseInt(document.getElementById('inp-weight')?.value) || player.details.weight,
            ekol:          document.getElementById('sel-ekol')?.value || player.details.ekol,
            sakatlik:      document.getElementById('sel-sakatlik')?.value || player.details.sakatlik,
            macsatma:      document.getElementById('sel-macsatma')?.value || player.details.macsatma,
            mizac:         document.getElementById('sel-mizac')?.value || player.details.mizac,
            lojistik:      document.getElementById('sel-lojistik')?.value || player.details.lojistik,
            ana_mevki:     document.getElementById('sel-ana-mevki')?.value || player.details.anaMevki,
            alt_pos:       document.getElementById('inp-alt-pos')?.value || player.details.altPos,
            oyun_tarzi:    document.getElementById('sel-oyun-tarzi')?.value || player.details.oyunTarzi,
        });
        console.log('✅ Profil Supabase\'e kaydedildi');
    } catch(e) {
        console.warn('Supabase profile update failed:', e);
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
            maclar:   profile.total_matches  || 0,
            goller:   profile.total_goals    || 0,
            asistler: profile.total_assists  || 0,
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

    // Profile sekmesine git
    if (typeof showSection === 'function') showSection('profile');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('.nav-item[data-target="profile"]')?.classList.add('active');

    // UI güncelle — activePlayerId değiştikten sonra
    if (typeof updateUI === 'function') updateUI();

    // Görüntüleme banner'ı ekle (updateUI'dan sonra ki yerinden silinmesin)
    setTimeout(() => addProfileViewBanner(profile.username || username, supabaseId), 50);
    showToast(`👤 ${profile.username || username}'in profili açıldı — puan verebilirsin!`);

};

// Profil görüntüleme banner'ı
function addProfileViewBanner(name, supabaseId) {
    document.getElementById('profile-view-banner')?.remove();
    const banner = document.createElement('div');
    banner.id = 'profile-view-banner';
    banner.style.cssText = `
        position: sticky; top: 0; z-index: 100;
        background: linear-gradient(135deg, rgba(0,229,255,0.12), rgba(0,229,255,0.04));
        border: 1px solid rgba(0,229,255,0.3); border-radius: 14px;
        padding: 0.8rem 1.25rem; display: flex; align-items: center;
        justify-content: space-between; margin-bottom: 1rem;
        backdrop-filter: blur(12px); gap: 0.75rem; flex-wrap: wrap;
    `;
    banner.innerHTML = `
        <span style="color:var(--neon-cyan); font-weight:700; font-size:0.9rem;">
            <i class="fa-solid fa-eye"></i> <strong>${name}</strong>'in profilini görüntülüyorsun
        </span>
        <div style="display:flex; gap:0.5rem;">
            <button onclick="window.returnToMyProfile()" style="
                background: rgba(0,229,255,0.12); border: 1px solid rgba(0,229,255,0.3);
                border-radius: 8px; color: var(--neon-cyan); padding: 0.4rem 0.8rem;
                font-family: inherit; font-size: 0.78rem; font-weight: 700; cursor: pointer;">
                <i class="fa-solid fa-arrow-left"></i> Kendi Profilime Dön
            </button>
        </div>`;

    const profileSection = document.getElementById('profile');
    if (profileSection) {
        profileSection.insertBefore(banner, profileSection.firstChild);
        profileSection.scrollTo(0,0);
        document.querySelector('.main-content')?.scrollTo(0, 0);
    }
}

// Kendi profiline dön
window.returnToMyProfile = function() {
    document.getElementById('profile-view-banner')?.remove();
    if (_savedMyPlayerId) {
        window.activePlayerId = _savedMyPlayerId;
        activePlayerId = _savedMyPlayerId; // local ref güncelle
        _savedMyPlayerId = null;
    }
    if (typeof updateUI === 'function') updateUI();
    showToast('↩️ Kendi profiline döndün');
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
    const friendsSection = document.getElementById('explore-friends-section');
    const inviteSection  = document.getElementById('explore-invite-section');

    if (playersSection) playersSection.style.display = 'none';
    if (friendsSection) friendsSection.style.display = 'none';
    if (inviteSection)  inviteSection.style.display  = 'none';

    if (tab === 'players') {
        if (playersSection) playersSection.style.display = '';
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

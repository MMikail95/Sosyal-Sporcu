// ======================================================
// FAZ 1 — SOSYAL AKI?, B?LD?R?M, MA? DAV ET?, TOAST
// ======================================================

// ---- 1. FEED ----
let feedEvents = [];
let currentFeedFilter = 'all';

function loadFeedEvents() {
    try { feedEvents = JSON.parse(localStorage.getItem('ss_feed_events') || '[]'); }
    catch(e) { feedEvents = []; }
    if (feedEvents.length === 0) seedMockFeed();
}
function saveFeedEvents() {
    localStorage.setItem('ss_feed_events', JSON.stringify(feedEvents));
}

window.addFeedEvent = function(type, data) {
    const acc = getActiveAccount();
    const ev = {
        id: Date.now() + Math.random(), type,
        actorId: acc ? acc.id : null,
        actorName: acc ? acc.name : '?',
        timestamp: new Date().toISOString(), ...data
    };
    feedEvents.unshift(ev);
    if (feedEvents.length > 100) feedEvents.pop();
    saveFeedEvents();
    if (document.getElementById('feed')?.classList.contains('active')) renderFeed();
};

function seedMockFeed() {
    const n = Date.now();
    feedEvents = [
        { id:n-9, type:'rating', actorId:'acc_2',     actorName:'Barış',   targetName:'Mikimon', targetId:'p1', avgScore:85, comment:'Sahanın en iyi 10 numarası 🔥', timestamp:new Date(n-7200000).toISOString() },
        { id:n-8, type:'match',  actorId:'acc_3',     actorName:'Kerem',   teamName:'Yıldızlar FC', score:'5-3', venue:'Mecidiyeköy Arena', goals:1, assists:2, timestamp:new Date(n-18000000).toISOString() },
        { id:n-7, type:'invite', actorId:'acc_admin', actorName:'Mikimon', targetName:'Tarık', targetId:'p4', venue:'Kadıköy Spor Tesisleri', date:'Bu Cumartesi 20:00', status:'pending', timestamp:new Date(n-28800000).toISOString() },
        { id:n-6, type:'rating', actorId:'acc_4',     actorName:'Tarık',   targetName:'Barış', targetId:'p2', avgScore:88, comment:null, timestamp:new Date(n-43200000).toISOString() },
        { id:n-5, type:'match',  actorId:'acc_5',     actorName:'Emre',    teamName:'Yıldızlar FC', score:'3-3', venue:'Ataşehir Halısaha', goals:2, assists:0, timestamp:new Date(n-86400000).toISOString() },
        { id:n-4, type:'join',   actorId:'acc_8',     actorName:'Serhat',  teamName:'Yıldızlar FC', timestamp:new Date(n-108000000).toISOString() },
        { id:n-3, type:'rating', actorId:'acc_6',     actorName:'Oğuz',    targetName:'Kerem', targetId:'p3', avgScore:72, comment:'Savunmada çok sağlam 💪', timestamp:new Date(n-129600000).toISOString() }
    ];
    saveFeedEvents();
}

function timeAgo(isoDate) {
    const diff = Math.floor((Date.now() - new Date(isoDate)) / 1000);
    if (diff < 60) return 'Az önce';
    if (diff < 3600) return `${Math.floor(diff/60)} dk önce`;
    if (diff < 86400) return `${Math.floor(diff/3600)} saat önce`;
    return `${Math.floor(diff/86400)} gün önce`;
}

function buildFeedCard(ev) {
    const time = timeAgo(ev.timestamp);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(ev.actorName)}`;
    let icon = 'fa-circle', iconColor = 'var(--neon-green)', body = '';

    if (ev.type === 'match') {
        icon = 'fa-futbol'; iconColor = 'var(--neon-green)';
        body = `<span class="feed-actor">${ev.actorName}</span> maç oynadı
            <div class="feed-detail-row">
                <span class="feed-badge match">⚽ ${ev.score}</span>
                <span class="feed-badge venue">🏟️ ${ev.venue}</span>
                ${ev.goals > 0 ? `<span class="feed-badge goal">🎯 ${ev.goals} Gol</span>` : ''}
                ${ev.assists > 0 ? `<span class="feed-badge assist">🤝 ${ev.assists} Asist</span>` : ''}
            </div>`;
    } else if (ev.type === 'rating') {
        icon = 'fa-star'; iconColor = '#ffc800';
        const stars = '⭐'.repeat(Math.max(1, Math.min(Math.round(ev.avgScore/20), 5)));
        body = `<span class="feed-actor">${ev.actorName}</span>
            <a class="feed-link" onclick="viewPlayerProfile('${ev.targetId}')">${ev.targetName}</a>'ı puanladı
            <div class="feed-detail-row"><span class="feed-badge rating">${stars} ${ev.avgScore} GEN</span></div>
            ${ev.comment ? `<div class="feed-comment">"${ev.comment}"</div>` : ''}`;
    } else if (ev.type === 'invite') {
        icon = 'fa-paper-plane'; iconColor = 'var(--neon-cyan)';
        const acc = typeof getActiveAccount === 'function' ? getActiveAccount() : null;
        const isTarget = acc && acc.playerId === ev.targetId;
        let statusHtml = '';
        if (isTarget && ev.status === 'pending') {
            statusHtml = `<div class="feed-invite-actions"><button class="btn-accept" onclick="respondInvite('${ev.id}','accepted',this)">✅ Kabul Et</button><button class="btn-decline" onclick="respondInvite('${ev.id}','declined',this)">❌ Reddet</button></div>`;
        } else if (ev.status === 'accepted') {
            statusHtml = `<span class="feed-status accepted">✅ Kabul edildi</span>`;
        } else if (ev.status === 'declined') {
            statusHtml = `<span class="feed-status declined">❌ Reddedildi</span>`;
        }
        body = `<span class="feed-actor">${ev.actorName}</span>
            <a class="feed-link" onclick="viewPlayerProfile('${ev.targetId}')">${ev.targetName}</a>'ı maça davet etti
            <div class="feed-detail-row">
                <span class="feed-badge venue">🏟️ ${ev.venue}</span>
                <span class="feed-badge invite">📅 ${ev.date}</span>
            </div>${statusHtml}`;
    } else if (ev.type === 'join') {
        icon = 'fa-user-plus'; iconColor = 'var(--neon-pink)';
        body = `<span class="feed-actor">${ev.actorName}</span> <strong>${ev.teamName}</strong> takımına katıldı 🎉`;
    }

    return `<div class="feed-card" data-type="${ev.type}">
        <div class="feed-card-left">
            <img src="${avatarUrl}" class="feed-avatar" alt="${ev.actorName}">
            <div class="feed-timeline-line"></div>
        </div>
        <div class="feed-card-body">
            <div class="feed-card-header">
                <div class="feed-type-icon" style="color:${iconColor}"><i class="fa-solid ${icon}"></i></div>
                <span class="feed-time">${time}</span>
            </div>
            <div class="feed-text">${body}</div>
        </div>
    </div>`;
}

window.renderFeed = function() {
    loadFeedEvents();
    const container = document.getElementById('feed-stream');
    if (!container) return;
    const filtered = currentFeedFilter === 'all' ? feedEvents : feedEvents.filter(e => e.type === currentFeedFilter);
    container.innerHTML = filtered.length === 0
        ? `<div class="feed-empty"><i class="fa-regular fa-face-smile" style="font-size:2rem;color:#333;"></i><p style="margin-top:1rem;color:#555;">Henüz etkinlik yok!</p></div>`
        : filtered.map(buildFeedCard).join('');
};

window.filterFeed = function(filter, btn) {
    currentFeedFilter = filter;
    document.querySelectorAll('.feed-filter').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderFeed();
};

window.viewPlayerProfile = function(playerId) {
    if (typeof activePlayerId !== 'undefined') window.activePlayerId = playerId;
    localStorage.setItem('activePlayerId', playerId);
    if (typeof updateUI === 'function') updateUI();
    if (typeof renderPlayerList === 'function') renderPlayerList();
    showSection('profile');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('.nav-item[data-target="profile"]')?.classList.add('active');
};

window.respondInvite = function(inviteId, status, btn) {
    loadFeedEvents();
    const ev = feedEvents.find(e => String(e.id) === String(inviteId));
    if (!ev) return;
    ev.status = status;
    saveFeedEvents();
    const acc = typeof getActiveAccount === 'function' ? getActiveAccount() : null;
    if (acc) {
        addNotification({
            type: status === 'accepted' ? 'invite_accepted' : 'invite_declined',
            message: `${acc.name} davetini ${status === 'accepted' ? 'kabul etti ✅' : 'reddetti ❌'}`,
            targetAccountId: ev.actorId
        });
    }
    renderFeed(); renderNotifications();
};


// ---- 2. BİLDİRİM SİSTEMİ ----
let notifications = [];

function loadNotifications() {
    try { notifications = JSON.parse(localStorage.getItem('ss_notifications') || '[]'); }
    catch(e) { notifications = []; }
}
function saveNotifications() {
    localStorage.setItem('ss_notifications', JSON.stringify(notifications));
}

window.addNotification = function({ type, message, targetAccountId }) {
    loadNotifications();
    notifications.unshift({
        id: Date.now() + Math.random(), type, message,
        targetAccountId: targetAccountId || (typeof activeAccountId !== 'undefined' ? activeAccountId : null),
        read: false, timestamp: new Date().toISOString()
    });
    if (notifications.length > 50) notifications.pop();
    saveNotifications();
    renderNotifications();
};

window.renderNotifications = function() {
    loadNotifications();
    const curId = typeof activeAccountId !== 'undefined' ? activeAccountId : null;
    const mine = notifications.filter(n => n.targetAccountId === curId);
    const unread = mine.filter(n => !n.read).length;

    const countEl = document.getElementById('notif-count');
    if (countEl) { countEl.textContent = unread; countEl.style.display = unread > 0 ? 'flex' : 'none'; }
    const bell = document.getElementById('notif-bell-btn');
    if (bell) bell.classList.toggle('has-notif', unread > 0);

    const list = document.getElementById('notif-list');
    if (!list) return;
    const icons = { rating:'⭐', invite:'📩', invite_accepted:'✅', invite_declined:'❌', match:'⚽', join:'🎉', comment:'💬' };
    list.innerHTML = mine.length === 0
        ? '<div class="notif-empty"><i class="fa-regular fa-bell-slash"></i><br>Bildirim yok</div>'
        : mine.slice(0, 20).map(n => `<div class="notif-item ${n.read?'read':'unread'}" onclick="markNotifRead('${n.id}')">
            <div class="notif-icon">${icons[n.type]||'🔔'}</div>
            <div class="notif-body"><div class="notif-msg">${n.message}</div><div class="notif-time">${timeAgo(n.timestamp)}</div></div>
            ${!n.read ? '<div class="notif-dot"></div>' : ''}
          </div>`).join('');
};

window.toggleNotifPanel = function() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    panel.classList.toggle('open');
    document.getElementById('account-panel')?.classList.remove('open');
    if (panel.classList.contains('open')) renderNotifications();
};
window.markNotifRead = function(id) {
    loadNotifications();
    const n = notifications.find(x => String(x.id) === String(id));
    if (n) { n.read = true; saveNotifications(); renderNotifications(); }
};
window.markAllRead = function() {
    loadNotifications();
    const curId = typeof activeAccountId !== 'undefined' ? activeAccountId : null;
    notifications.forEach(n => { if (n.targetAccountId === curId) n.read = true; });
    saveNotifications(); renderNotifications();
};

document.addEventListener('click', e => {
    if (!e.target.closest('#notif-bell-btn') && !e.target.closest('#notif-panel'))
        document.getElementById('notif-panel')?.classList.remove('open');
    if (!e.target.closest('.account-switcher') && typeof closeAccountPanel === 'function')
        closeAccountPanel();
});


// ---- 3. MAÇ DAVETİ ----
window.openMatchInviteModal = function(preSelect) {
    const modal = document.getElementById('invite-modal-backdrop');
    if (!modal) return;
    const sel = document.getElementById('invite-player-select');
    const acc = typeof getActiveAccount === 'function' ? getActiveAccount() : null;
    const pls = typeof players !== 'undefined' ? players : [];
    if (sel) {
        sel.innerHTML = pls.filter(p => !(acc && p.id === acc.playerId))
            .map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        if (preSelect) sel.value = preSelect;
    }
    const di = document.getElementById('invite-date');
    if (di) {
        const d = new Date();
        d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
        di.value = d.toISOString().split('T')[0];
    }
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.closeMatchInviteModal = function() {
    const modal = document.getElementById('invite-modal-backdrop');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
};

window.sendMatchInvite = async function() {
    const targetId = document.getElementById('invite-player-select')?.value;
    const date    = document.getElementById('invite-date')?.value;
    const time    = document.getElementById('invite-time')?.value || '20:00';
    const venue   = document.getElementById('invite-venue')?.value?.trim();
    const note    = document.getElementById('invite-note')?.value?.trim();

    if (!targetId) { showToast('⚠️ Oyuncu seçin.'); return; }
    if (!date)     { showToast('⚠️ Tarih seçin.'); return; }
    if (!venue)    { showToast('⚠️ Saha / Yer girin.'); return; }

    // ÖNCE MODAL KAPAT
    closeMatchInviteModal();

    const pls  = typeof players !== 'undefined' ? players : [];
    const accs = typeof accounts !== 'undefined' ? accounts : [];
    const targetPlayer = pls.find(p => p.id === targetId);
    const acc = typeof getActiveAccount === 'function' ? getActiveAccount() : null;
    const dateStr = new Date(date + 'T12:00:00').toLocaleDateString('tr-TR', { weekday:'long', day:'numeric', month:'long' });

    // localStorage feed'e kaydet
    addFeedEvent('invite', { targetId, targetName: targetPlayer?.name || '?', venue, date:`${dateStr} ${time}`, note:note||null, status:'pending' });

    // Yerel bildirim
    const targetAcc = accs.find(a => a.playerId === targetId);
    if (targetAcc) {
        addNotification({ type:'invite', message:`${acc?.name||'Biri'} seni ${dateStr} ${time}'de ${venue}'a maça davet etti`, targetAccountId: targetAcc.id });
    }

    // Supabase bildirim (Supabase kullanıcısıysa)
    const user = window.__AUTH_USER__;
    const targetSupabaseId = targetPlayer?.supabase_id;
    if (user && targetSupabaseId && window.DB) {
        try {
            await window.DB.Notifications.send(
                targetSupabaseId, 'match_invite',
                'Maç Daveti!',
                `${user.email?.split('@')[0] || 'Biri'} seni ${venue}'a ${dateStr} ${time}'de maça davet etti.`,
                user.id
            );
            await window.DB.Feed.createPost(user.id,
                `${targetPlayer.name}'ı maça davet ettim! 📅 ${dateStr} ${time} — 🏟️ ${venue}${note ? ` — "${note}"` : ''}`,
                'invitation'
            );
        } catch(e) { console.warn('Supabase invite notify failed:', e); }
    }

    // Feed'e git
    showSection('feed');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('.nav-item[data-target="feed"]')?.classList.add('active');
    renderFeed();
    showToast(`✅ ${targetPlayer?.name || 'Oyuncu'} davet edildi!`);
};


// ---- 4. TOAST ----
window.showToast = function(msg, duration = 3000) {
    let t = document.getElementById('ss-toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'ss-toast'; t.className = 'ss-toast';
        document.body.appendChild(t);
    }
    t.textContent = msg; t.classList.add('visible');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('visible'), duration);
};



// ---- INIT ----
(function initFaz1() {
    const ready = () => {
        loadFeedEvents();
        renderNotifications();
    };
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(ready, 350);
    } else {
        document.addEventListener('DOMContentLoaded', () => setTimeout(ready, 350));
    }
})();

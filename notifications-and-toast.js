// ======================================================
// NOTIFICATIONS-AND-TOAST.JS
// Bu dosya ne işe yarar:
//  - Zil ikonundaki bildirim listesini yönetir (localStorage'da saklanır)
//  - "Maça davet et" penceresini açar/kapatır ve daveti gönderir
//  - Ekranın altında beliren kısa "toast" mesajlarını gösterir (showToast)
// ======================================================

function timeAgo(isoDate) {
    const diff = Math.floor((Date.now() - new Date(isoDate)) / 1000);
    if (diff < 60) return 'Az önce';
    if (diff < 3600) return `${Math.floor(diff/60)} dk önce`;
    if (diff < 86400) return `${Math.floor(diff/3600)} saat önce`;
    return `${Math.floor(diff/86400)} gün önce`;
}


// ---- 1. BİLDİRİM SİSTEMİ ----
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


// ---- 2. MAÇ DAVETİ ----
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

    closeMatchInviteModal();

    const pls = typeof players !== 'undefined' ? players : [];
    const targetPlayer = pls.find(p => p.id === targetId);
    const dateStr = new Date(date + 'T12:00:00').toLocaleDateString('tr-TR', { weekday:'long', day:'numeric', month:'long' });

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

    showSection('feed');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('.nav-item[data-target="feed"]')?.classList.add('active');
    window.initRealFeed?.();
    showToast(`✅ ${targetPlayer?.name || 'Oyuncu'} davet edildi!`);
};


// ---- 3. TOAST ----
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
    const ready = () => renderNotifications();
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(ready, 350);
    } else {
        document.addEventListener('DOMContentLoaded', () => setTimeout(ready, 350));
    }
})();

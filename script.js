
// ======================================================
// SIDEBAR TOGGLE
// ======================================================
let sidebarOpen = true;

function updateTogglePosition(isOpen) {
    const btn = document.getElementById('sidebar-toggle-btn');
    if (!btn) return;
    if (window.innerWidth > 768) {
        btn.style.left = isOpen ? 'calc(var(--sidebar-width, 260px) - 58px)' : '1rem';
    } else {
        btn.style.left = '1rem';
    }
}

window.toggleSidebar = function () {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    const overlay = document.getElementById('sidebar-overlay');
    const icon = document.getElementById('sidebar-toggle-icon');
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        const isHidden = sidebar.classList.contains('collapsed');
        if (isHidden) {
            sidebar.classList.remove('collapsed');
            overlay.classList.add('active');
            icon.className = 'fa-solid fa-xmark';
        } else {
            sidebar.classList.add('collapsed');
            overlay.classList.remove('active');
            icon.className = 'fa-solid fa-bars';
        }
        updateTogglePosition(false);
    } else {
        sidebarOpen = !sidebarOpen;
        if (sidebarOpen) {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('expanded');
        } else {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
        }
        icon.className = 'fa-solid fa-bars';
        updateTogglePosition(sidebarOpen);
    }
};

window.addEventListener('resize', () => {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    const overlay = document.getElementById('sidebar-overlay');
    const icon = document.getElementById('sidebar-toggle-icon');

    if (window.innerWidth > 768) {
        overlay.classList.remove('active');
        if (sidebarOpen) {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('expanded');
        } else {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
        }
        icon.className = 'fa-solid fa-bars';
        updateTogglePosition(sidebarOpen);
    } else {
        sidebar.classList.add('collapsed');
        mainContent.classList.remove('expanded');
        overlay.classList.remove('active');
        icon.className = 'fa-solid fa-bars';
        updateTogglePosition(false);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.add('collapsed');
        updateTogglePosition(false);
    } else {
        updateTogglePosition(true);
    }
});


// ======================================================
// 1. MOCK DATA DEFINITIONS
// ======================================================

const MOCK_PLAYERS = [
    {
        id: 'p1', name: 'Mikimon',
        details: {
            pos: 'OS', age: 28, height: 182, weight: 76,
            ekol: 'Halısaha Gazisi', sakatlik: 'Maç Seçer',
            macsatma: 'Keyfine Bağlı', mizac: 'Makara Yapıcı', lojistik: 'Kendi Gelir',
            anaMevki: 'Ofansif OS (10 Numara)', altPos: 'FV, Sağ Kanat', oyunTarzi: 'Klasik 10 Numara',
            dakiklik: '15 dk Önce Sahada', sahaIletisim: 'Sakin & Yapıcı',
            macSonu: 'Çay & Muhabbet\'te', mevkiSadakat: 'Görevine Bağlı',
            presGucu: 'Yorgunsa Yavaş', pasTercihi: 'Dengeli', markaj: 'Yakın Takip'
        },
        ratings: { teknik: 85, sut: 80, pas: 90, hiz: 78, fizik: 65, kondisyon: 75 },
        communityRatings: []
    },
    {
        id: 'p2', name: 'Barış',
        details: {
            pos: 'FV', age: 26, height: 185, weight: 82,
            ekol: 'Eski Lisanslı', sakatlik: 'Beton Gibi',
            macsatma: 'Asla Satmaz', mizac: 'Sessiz Katil', lojistik: 'Yolcu',
            anaMevki: 'Santrafor (9 Numara)', altPos: 'İkinci Forvet', oyunTarzi: 'Goalgetter',
            dakiklik: 'Son Dakika Yetişir', sahaIletisim: 'Sessiz Oynar',
            macSonu: 'Bir Çay İçip Gider', mevkiSadakat: 'Görevine Bağlı',
            presGucu: 'Elleri Belinde Bekler', pasTercihi: 'Garanti Oynar', markaj: '5 Metreden İzler'
        },
        ratings: { teknik: 75, sut: 88, pas: 70, hiz: 84, fizik: 85, kondisyon: 80 },
        communityRatings: []
    },
    {
        id: 'p3', name: 'Kerem',
        details: {
            pos: 'DEF', age: 30, height: 180, weight: 85,
            ekol: 'Halısaha Gazisi', sakatlik: 'Maç Seçer',
            macsatma: 'Asla Satmaz', mizac: 'Sessiz Katil', lojistik: 'Kendi Gelir',
            anaMevki: 'Stoper', altPos: 'Sol Bek', oyunTarzi: 'Sweeper',
            dakiklik: '15 dk Önce Sahada', sahaIletisim: 'Sakin & Yapıcı',
            macSonu: 'Çay & Muhabbet\'te', mevkiSadakat: 'Görevine Bağlı',
            presGucu: 'Geri Koşar', pasTercihi: 'Garanti Oynar', markaj: 'Gölge Gibi Yapışır'
        },
        ratings: { teknik: 70, sut: 60, pas: 72, hiz: 68, fizik: 88, kondisyon: 78 },
        communityRatings: []
    },
    {
        id: 'p4', name: 'Tarık',
        details: {
            pos: 'OS', age: 24, height: 175, weight: 72,
            ekol: 'Sokak Futbolu', sakatlik: 'Kronik Sakat',
            macsatma: 'Riskli', mizac: 'Hakemle Kavgalı', lojistik: 'Yolcu',
            anaMevki: 'Sol Kanat', altPos: 'Sağ Kanat, Ofansif OS (10 Numara)', oyunTarzi: 'Kanat Oyuncusu',
            dakiklik: 'Maç Başlarken Bağlar', sahaIletisim: 'Fırça Atar',
            macSonu: 'Maç Biter Uçar', mevkiSadakat: 'Saha Boyunca Dolaşır',
            presGucu: 'Geri Koşar', pasTercihi: 'İmkansızı Dener', markaj: '5 Metreden İzler'
        },
        ratings: { teknik: 83, sut: 77, pas: 80, hiz: 91, fizik: 70, kondisyon: 72 },
        communityRatings: []
    },
    {
        id: 'p5', name: 'Emre',
        details: {
            pos: 'FV', age: 29, height: 178, weight: 79,
            ekol: 'Halısaha Gazisi', sakatlik: 'Beton Gibi',
            macsatma: 'Keyfine Bağlı', mizac: 'Makara Yapıcı', lojistik: 'Servis Şoförü',
            anaMevki: 'İkinci Forvet', altPos: 'Santrafor (9 Numara)', oyunTarzi: 'İkinci Forvet',
            dakiklik: 'Son Dakika Yetişir', sahaIletisim: 'Sessiz Oynar',
            macSonu: 'Bir Çay İçip Gider', mevkiSadakat: 'Bazen Gezer',
            presGucu: 'Yorgunsa Yavaş', pasTercihi: 'Dengeli', markaj: 'Yakın Takip'
        },
        ratings: { teknik: 78, sut: 85, pas: 65, hiz: 80, fizik: 82, kondisyon: 76 },
        communityRatings: []
    },
    {
        id: 'p6', name: 'Oğuz',
        details: {
            pos: 'DEF', age: 33, height: 183, weight: 88,
            ekol: 'Eski Lisanslı', sakatlik: 'Beton Gibi',
            macsatma: 'Asla Satmaz', mizac: 'Sessiz Katil', lojistik: 'Kendi Gelir',
            anaMevki: 'Stoper', altPos: 'Sağ Bek', oyunTarzi: 'Libero',
            dakiklik: '15 dk Önce Sahada', sahaIletisim: 'Sakin & Yapıcı',
            macSonu: 'Çay & Muhabbet\'te', mevkiSadakat: 'Görevine Bağlı',
            presGucu: 'Geri Koşar', pasTercihi: 'Garanti Oynar', markaj: 'Gölge Gibi Yapışır'
        },
        ratings: { teknik: 65, sut: 55, pas: 68, hiz: 62, fizik: 90, kondisyon: 82 },
        communityRatings: []
    },
    {
        id: 'p7', name: 'Can',
        details: {
            pos: 'KL', age: 27, height: 188, weight: 84,
            ekol: 'Halısaha Gazisi', sakatlik: 'Maç Seçer',
            macsatma: 'Asla Satmaz', mizac: 'Sessiz Katil', lojistik: 'Yolcu',
            anaMevki: 'Kaleci', altPos: '—', oyunTarzi: 'Sweeper Keeper',
            dakiklik: '15 dk Önce Sahada', sahaIletisim: 'Sakin & Yapıcı',
            macSonu: 'Çay & Muhabbet\'te', mevkiSadakat: 'Görevine Bağlı',
            presGucu: 'Yorgunsa Yavaş', pasTercihi: 'Garanti Oynar', markaj: 'Gölge Gibi Yapışır'
        },
        ratings: { teknik: 72, sut: 60, pas: 70, hiz: 65, fizik: 80, kondisyon: 78 },
        communityRatings: []
    },
    {
        id: 'p8', name: 'Serhat',
        details: {
            pos: 'OS', age: 22, height: 173, weight: 68,
            ekol: 'Sokak Futbolu', sakatlik: 'Maç Seçer',
            macsatma: 'Keyfine Bağlı', mizac: 'Makara Yapıcı', lojistik: 'Kendi Gelir',
            anaMevki: 'Ofansif OS (10 Numara)', altPos: 'Sol Kanat', oyunTarzi: 'Klasik 10 Numara',
            dakiklik: '15 dk Önce Sahada', sahaIletisim: 'Sakin & Yapıcı',
            macSonu: 'Çay & Muhabbet\'te', mevkiSadakat: 'Görevine Bağlı',
            presGucu: 'Geri Koşar', pasTercihi: 'İmkansızı Dener', markaj: 'Yakın Takip'
        },
        ratings: { teknik: 88, sut: 72, pas: 85, hiz: 90, fizik: 65, kondisyon: 70 },
        communityRatings: []
    },
    {
        id: 'p9', name: 'Mert',
        details: {
            pos: 'FV', age: 25, height: 181, weight: 78,
            ekol: 'Eski Lisanslı', sakatlik: 'Beton Gibi',
            macsatma: 'Asla Satmaz', mizac: 'Sessiz Katil', lojistik: 'Servis Şoförü',
            anaMevki: 'Santrafor (9 Numara)', altPos: 'İkinci Forvet', oyunTarzi: 'Goalgetter',
            dakiklik: 'Son Dakika Yetişir', sahaIletisim: 'Sessiz Oynar',
            macSonu: 'Bir Çay İçip Gider', mevkiSadakat: 'Bazen Gezer',
            presGucu: 'Elleri Belinde Bekler', pasTercihi: 'Garanti Oynar', markaj: 'Yakın Takip'
        },
        ratings: { teknik: 76, sut: 89, pas: 68, hiz: 82, fizik: 78, kondisyon: 74 },
        communityRatings: []
    },
    {
        id: 'p10', name: 'Ali',
        details: {
            pos: 'DEF', age: 31, height: 186, weight: 86,
            ekol: 'Halısaha Gazisi', sakatlik: 'Beton Gibi',
            macsatma: 'Asla Satmaz', mizac: 'Sessiz Katil', lojistik: 'Kendi Gelir',
            anaMevki: 'Sağ Bek', altPos: 'Stoper', oyunTarzi: 'Organizatör',
            dakiklik: '15 dk Önce Sahada', sahaIletisim: 'Sakin & Yapıcı',
            macSonu: 'Çay & Muhabbet\'te', mevkiSadakat: 'Görevine Bağlı',
            presGucu: 'Geri Koşar', pasTercihi: 'Garanti Oynar', markaj: 'Gölge Gibi Yapışır'
        },
        ratings: { teknik: 67, sut: 58, pas: 65, hiz: 70, fizik: 87, kondisyon: 83 },
        communityRatings: []
    },
    {
        id: 'p11', name: 'Hasan',
        details: {
            pos: 'OS', age: 23, height: 177, weight: 73,
            ekol: 'Halısaha Gazisi', sakatlik: 'Maç Seçer',
            macsatma: 'Keyfine Bağlı', mizac: 'Makara Yapıcı', lojistik: 'Yolcu',
            anaMevki: 'Box-to-Box OS', altPos: 'Defansif OS', oyunTarzi: 'Box-to-Box',
            dakiklik: 'Son Dakika Yetişir', sahaIletisim: 'Sessiz Oynar',
            macSonu: 'Bir Çay İçip Gider', mevkiSadakat: 'Bazen Gezer',
            presGucu: 'Geri Koşar', pasTercihi: 'Dengeli', markaj: 'Yakın Takip'
        },
        ratings: { teknik: 80, sut: 74, pas: 78, hiz: 85, fizik: 68, kondisyon: 73 },
        communityRatings: []
    }
];

const MOCK_ACCOUNTS = [
    { id: 'acc_admin', name: 'Mikimon', role: 'admin', playerId: 'p1' },
    { id: 'acc_2',     name: 'Barış',   role: 'player', playerId: 'p2' },
    { id: 'acc_3',     name: 'Kerem',   role: 'player', playerId: 'p3' },
    { id: 'acc_4',     name: 'Tarık',   role: 'player', playerId: 'p4' },
    { id: 'acc_5',     name: 'Emre',    role: 'player', playerId: 'p5' },
    { id: 'acc_6',     name: 'Oğuz',    role: 'player', playerId: 'p6' },
    { id: 'acc_7',     name: 'Can',     role: 'player', playerId: 'p7' },
    { id: 'acc_8',     name: 'Serhat',  role: 'player', playerId: 'p8' },
    { id: 'acc_9',     name: 'Mert',    role: 'player', playerId: 'p9' },
    { id: 'acc_10',    name: 'Ali',     role: 'player', playerId: 'p10' },
    { id: 'acc_11',    name: 'Hasan',   role: 'player', playerId: 'p11' }
];

const DEFAULT_PLAYER = {
    id: 'new', name: 'Yeni Oyuncu',
    details: {
        pos: 'OS', age: 24, height: 180, weight: 75,
        ekol: 'Halısaha Gazisi', sakatlik: 'Maç Seçer',
        macsatma: 'Keyfine Bağlı', mizac: 'Makara Yapıcı', lojistik: 'Kendi Gelir',
        anaMevki: 'Ofansif OS (10 Numara)', altPos: '', oyunTarzi: 'Box-to-Box',
        dakiklik: 'Son Dakika Yetişir', sahaIletisim: 'Sessiz Oynar',
        macSonu: 'Bir Çay İçip Gider', mevkiSadakat: 'Bazen Gezer',
        presGucu: 'Yorgunsa Yavaş', pasTercihi: 'Dengeli', markaj: 'Yakın Takip'
    },
    ratings: { teknik: 70, sut: 70, pas: 70, hiz: 70, fizik: 70, kondisyon: 70 },
    communityRatings: []
};

// Migrates old player data to add new fields if missing
function migratePlayerData(player) {
    const d = player.details;
    if (!d) return player;
    if (!d.anaMevki)      d.anaMevki      = 'Ofansif OS (10 Numara)';
    if (!d.altPos)        d.altPos        = '';
    if (!d.oyunTarzi)     d.oyunTarzi     = 'Box-to-Box';
    if (!d.dakiklik)      d.dakiklik      = 'Son Dakika Yetişir';
    if (!d.sahaIletisim)  d.sahaIletisim  = 'Sessiz Oynar';
    if (!d.macSonu)       d.macSonu       = 'Bir Çay İçip Gider';
    if (!d.mevkiSadakat)  d.mevkiSadakat  = 'Bazen Gezer';
    if (!d.presGucu)      d.presGucu      = 'Yorgunsa Yavaş';
    if (!d.pasTercihi)    d.pasTercihi    = 'Dengeli';
    if (!d.markaj)        d.markaj        = 'Yakın Takip';
    if (!player.communityRatings) player.communityRatings = [];
    return player;
}


// ======================================================
// 2. DATA LOADING & PERSISTENCE
// ======================================================

let players = [];
let accounts = [];
let activeAccountId = 'acc_admin';
let activePlayerId = 'p1';

function loadData() {
    // --- Players ---
    let rawPlayers = localStorage.getItem('ss_players_v2');
    if (rawPlayers && rawPlayers !== 'undefined') {
        try {
            players = JSON.parse(rawPlayers);
            players.forEach(p => migratePlayerData(p));
            console.log('📂 Players loaded:', players.length);
        } catch (e) {
            console.error('Corruption in ss_players_v2, resetting:', e);
            players = JSON.parse(JSON.stringify(MOCK_PLAYERS));
        }
    } else {
        players = JSON.parse(JSON.stringify(MOCK_PLAYERS));
        console.log('⚠️ Initializing mock players');
    }

    // --- Accounts ---
    let rawAccounts = localStorage.getItem('ss_accounts');
    if (rawAccounts && rawAccounts !== 'undefined') {
        try {
            accounts = JSON.parse(rawAccounts);
        } catch (e) {
            accounts = JSON.parse(JSON.stringify(MOCK_ACCOUNTS));
        }
    } else {
        accounts = JSON.parse(JSON.stringify(MOCK_ACCOUNTS));
        console.log('⚠️ Initializing mock accounts');
    }

    // --- Active Account ---
    const savedAccount = localStorage.getItem('ss_active_account');
    if (savedAccount && accounts.find(a => a.id === savedAccount)) {
        activeAccountId = savedAccount;
    } else {
        activeAccountId = 'acc_admin';
    }

    // Set active player from account
    const acc = getActiveAccount();
    if (acc) activePlayerId = acc.playerId;

    savePlayers();
    saveAccounts();
}

function savePlayers() {
    localStorage.setItem('ss_players_v2', JSON.stringify(players));
}

function saveAccounts() {
    localStorage.setItem('ss_accounts', JSON.stringify(accounts));
    localStorage.setItem('ss_active_account', activeAccountId);
}


// ======================================================
// 3. ACCOUNT SYSTEM
// ======================================================

function getActiveAccount() {
    return accounts.find(a => a.id === activeAccountId) || accounts[0];
}

function getAccountForPlayer(playerId) {
    return accounts.find(a => a.playerId === playerId);
}

function canEditPlayer(playerId) {
    const acc = getActiveAccount();
    if (!acc) return false;
    if (acc.role === 'admin') return true;
    return acc.playerId === playerId;
}

window.switchAccount = function (accountId) {
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return;

    activeAccountId = accountId;
    activePlayerId = acc.playerId;
    saveAccounts();
    localStorage.setItem('activePlayerId', activePlayerId);

    // Close account panel
    closeAccountPanel();

    // Refresh UI
    updateAccountUI();
    updateUI();
    renderPlayerList();

    // Go to profile
    showSection('profile');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const profileNav = document.querySelector('.nav-item[data-target="profile"]');
    if (profileNav) profileNav.classList.add('active');

    console.log(`✅ Switched to account: ${acc.name} (${acc.role})`);
};

function updateAccountUI() {
    const acc = getActiveAccount();
    if (!acc) return;

    const nameEl = document.getElementById('current-account-name');
    const roleEl = document.getElementById('current-account-role');
    const avatarEl = document.getElementById('current-account-avatar');

    if (nameEl) nameEl.textContent = acc.name;
    if (roleEl) {
        roleEl.textContent = acc.role === 'admin' ? '⚡ Admin' : '🎮 Oyuncu';
        roleEl.style.color = acc.role === 'admin' ? 'var(--neon-cyan)' : 'var(--neon-green)';
    }
    if (avatarEl) avatarEl.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${acc.name}`;

    // Render account list
    renderAccountList();
}

function renderAccountList() {
    const container = document.getElementById('account-list-container');
    if (!container) return;

    container.innerHTML = '';
    accounts.forEach(acc => {
        const isActive = acc.id === activeAccountId;
        const player = players.find(p => p.id === acc.playerId);
        const vals = player ? Object.values(player.ratings) : [70,70,70,70,70,70];
        const gen = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);

        const item = document.createElement('div');
        item.className = `account-list-item ${isActive ? 'active' : ''}`;
        item.onclick = () => window.switchAccount(acc.id);
        item.innerHTML = `
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${acc.name}" class="acc-list-avatar">
            <div class="acc-list-info">
                <span class="acc-list-name">${acc.name}</span>
                <span class="acc-list-role">${acc.role === 'admin' ? '⚡ Admin' : acc.playerId === getActiveAccount()?.playerId && isActive ? '🎮 Sen' : '🎮 Oyuncu'}</span>
            </div>
            <span class="acc-list-gen" style="color:${gen >= 80 ? 'var(--neon-green)' : 'orange'}">${gen}</span>
            ${isActive ? '<i class="fa-solid fa-check" style="color:var(--neon-green); margin-left:4px;"></i>' : ''}
        `;
        container.appendChild(item);
    });
}

window.toggleAccountPanel = function () {
    const panel = document.getElementById('account-panel');
    if (!panel) return;
    panel.classList.toggle('open');
    renderAccountList();
};

window.closeAccountPanel = function () {
    const panel = document.getElementById('account-panel');
    if (panel) panel.classList.remove('open');
};


// ======================================================
// 4. INITIALIZATION & NAVIGATION
// ======================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 App Initializing...');

    loadData();
    setupNavigation();
    updateAccountUI();
    updateUI();
    renderPlayerList();
    // Chart resize fix
    setTimeout(restorePitchState, 300);
    setTimeout(restorePitchState, 1000);
});

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            showSection(targetId);
            // Close account panel on nav
            closeAccountPanel();
        });
    });
}

function showSection(id) {
    document.querySelectorAll('.section').forEach(sec => {
        sec.style.display = 'none';
        sec.classList.remove('active');
    });
    const targetSec = document.getElementById(id);
    if (targetSec) {
        targetSec.style.display = 'block';
        void targetSec.offsetWidth;
        targetSec.classList.add('active');
    } else {
        console.error(`❌ Section not found: #${id}`);
        return;
    }

    if (id === 'takimim') {
        renderPlayerList();
        setTimeout(() => restorePitchState(), 50);
    }
    if (id === 'profile') {
        setTimeout(() => {
            const player = players.find(p => p.id === activePlayerId) || players[0];
            updateChart(player);
        }, 100);
    }
}


// ======================================================
// 5. PROFILE VIEW MODE
// ======================================================

/**
 * Returns true if we're viewing someone else's profile (not ours)
 */
function isViewingOtherProfile() {
    const acc = getActiveAccount();
    return acc && acc.playerId !== activePlayerId;
}

/**
 * Sets profile to view-only or edit mode based on permissions
 */
function applyProfileViewMode() {
    const viewingOther = isViewingOtherProfile();
    const acc = getActiveAccount();
    const isAdmin = acc && acc.role === 'admin';

    // If admin, always can edit. If viewing own profile, can edit.
    const canEdit = !viewingOther || isAdmin;

    // Show/hide the view banner
    const banner = document.getElementById('view-only-banner');
    if (banner) {
        if (viewingOther && !isAdmin) {
            const viewedPlayer = players.find(p => p.id === activePlayerId);
            banner.style.display = 'flex';
            banner.querySelector('.view-banner-text').textContent =
                `👁️ ${viewedPlayer ? viewedPlayer.name : 'Oyuncu'}'nın profilini görüntülüyorsunuz`;
        } else if (viewingOther && isAdmin) {
            const viewedPlayer = players.find(p => p.id === activePlayerId);
            banner.style.display = 'flex';
            banner.querySelector('.view-banner-text').textContent =
                `⚡ Admin olarak ${viewedPlayer ? viewedPlayer.name : 'Oyuncu'}'nın profilini düzenliyorsunuz`;
            banner.style.borderColor = 'var(--neon-cyan)';
        } else {
            banner.style.display = 'none';
        }
    }

    // Disable/enable inputs in detail tab
    const inputs = document.querySelectorAll('.profile-input, .profile-select, .profile-select-mini, .detail-inp');
    inputs.forEach(el => {
        el.disabled = !canEdit;
        el.style.opacity = canEdit ? '1' : '0.5';
        el.style.cursor = canEdit ? '' : 'not-allowed';
    });

    // Disable/enable segmented control buttons
    document.querySelectorAll('.seg-opt').forEach(btn => {
        btn.disabled = !canEdit;
    });

    // Save button
    const btnSaveDetails = document.getElementById('btn-save-details');
    if (btnSaveDetails) {
        btnSaveDetails.disabled = !canEdit;
        btnSaveDetails.style.opacity = canEdit ? '1' : '0.5';
        btnSaveDetails.style.cursor = canEdit ? 'pointer' : 'not-allowed';
    }

    // Maça davet butonu
    const davetBtn = document.getElementById('btn-mac-davet');
    if (davetBtn) {
        if (viewingOther) {
            davetBtn.style.display = 'block';
        } else {
            davetBtn.style.display = 'block';
        }
    }

    // Puanla tab - hide/disable if viewing own profile
    updatePuanlaTab();
}

function updatePuanlaTab() {
    const acc = getActiveAccount();
    const viewingOther = isViewingOtherProfile();

    const puanlaTabBtn = document.querySelector('.tab-btn[data-tab="tab-puanla"]');
    const puanlaContent = document.getElementById('tab-puanla');

    if (!viewingOther) {
        // Own profile: show "Puanla" but disable with message
        if (puanlaContent) {
            puanlaContent.innerHTML = `
                <div class="glass-card" style="text-align:center; padding: 3rem;">
                    <i class="fa-solid fa-ban" style="font-size:3rem; color:#555; margin-bottom:1rem;"></i>
                    <h3 style="color:#888; margin-bottom:0.5rem;">Kendinizi Puanlayamazsınız</h3>
                    <p style="color:#555; font-size:0.9rem;">Başka bir kullanıcı hesabına geçerek bu profili puanlayabilirsiniz.</p>
                </div>
            `;
        }
    } else {
        // Viewing other: render rating form
        if (puanlaContent) {
            renderCommunityRatingForm(puanlaContent);
        }
    }
}


// ======================================================
// 6. PROFILE LOGIC (RICH FEATURES)
// ======================================================

window.switchProfileTab = function (tabId) {
    document.querySelectorAll('.profile-subtab').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    const target = document.getElementById(tabId);
    if (target) target.style.display = 'block';

    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(b => {
        if (b.getAttribute('onclick') && b.getAttribute('onclick').includes(tabId)) b.classList.add('active');
    });

    if (tabId === 'tab-genel') {
        setTimeout(() => {
            if (window.updateChart && activePlayerId) {
                const player = players.find(p => p.id === activePlayerId);
                if (player) updateChart(player);
            }
        }, 50);
    }

    if (tabId === 'tab-puanla') {
        updatePuanlaTab();
    }
};

window.updateUI = function () {
    const player = players.find(p => p.id === activePlayerId) || players[0];
    if (!player) return;

    // --- Header ---
    const nameEl = document.getElementById('player-name');
    if (nameEl) nameEl.textContent = player.name;
    const avatarEl = document.getElementById('profile-avatar');
    if (avatarEl) avatarEl.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`;
    const ageEl = document.getElementById('disp-age-header');
    if (ageEl) ageEl.innerHTML = `<i class="fa-solid fa-cake-candles"></i> ${player.details.age} Yaş`;

    // --- Value Calculation (own ratings) ---
    const totalRating = Object.values(player.ratings).reduce((a, b) => a + b, 0);
    const avg = Math.round(totalRating / 6);
    const value = (totalRating * 200000) * (avg > 80 ? 1.5 : 1);
    const mvEl = document.getElementById('market-value');
    if (mvEl) mvEl.textContent = `€${(value / 1000000).toFixed(1)}M`;
    const orEl = document.getElementById('overall-rating-disp');
    if (orEl) orEl.textContent = avg;

    // --- Community avg score for ORT. PUAN ---
    const communityAvg = calcCommunityAvg(player);
    const statAvgEl = document.getElementById('stat-avg-score');
    if (statAvgEl) {
        if (communityAvg > 0) {
            statAvgEl.textContent = communityAvg.toFixed(1);
            statAvgEl.title = `${player.communityRatings.length} kullanıcı puanı`;
        } else {
            statAvgEl.textContent = '—';
            statAvgEl.title = 'Henüz community puanı yok';
        }
    }

    // --- Stat boxes ---
    const hEl = document.getElementById('disp-height-gb');
    if (hEl) hEl.textContent = `${player.details.height} cm`;
    const wEl = document.getElementById('disp-weight-gb');
    if (wEl) wEl.textContent = `${player.details.weight} kg`;

    // Fill Inputs
    setVal('inp-age', player.details.age);
    setVal('inp-height', player.details.height);
    setVal('inp-weight', player.details.weight);
    setVal('sel-ekol', player.details.ekol);
    setVal('sel-sakatlik', player.details.sakatlik);
    setVal('sel-macsatma', player.details.macsatma);
    setVal('sel-mizac', player.details.mizac);
    setVal('sel-lojistik', player.details.lojistik);
    // Mevki & oyun tarzı
    setVal('sel-ana-mevki', player.details.anaMevki);
    setVal('inp-alt-pos', player.details.altPos);
    setVal('sel-oyun-tarzi', player.details.oyunTarzi);
    // Segment controls (character traits)
    const segFields = ['dakiklik','sahaIletisim','macSonu','mevkiSadakat','presGucu','pasTercihi','markaj'];
    segFields.forEach(field => {
        const val = player.details[field];
        if (!val) return;
        const container = document.getElementById(`seg-${field}`);
        if (!container) return;
        container.querySelectorAll('.seg-opt').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.val === val);
        });
    });

    // Update Sliders
    for (const [key, val] of Object.entries(player.ratings)) {
        setVal(`rate-${key}`, val);
        setText(`disp-rate-${key}`, val);
    }

    // --- Chart ---
    try { updateChart(player); } catch (e) { console.error('Chart Update Failed:', e); }

    // --- Skills ---
    try { checkSkillUnlocks(player, avg); } catch (e) { console.error('Skill Unlock Check Failed:', e); }

    // Reset Save Button
    const btnSave = document.getElementById('btn-save-ratings');
    if (btnSave && btnSave.innerHTML.includes('KAYDET')) {
        btnSave.disabled = true;
        btnSave.style.background = '#333';
        btnSave.style.color = '#777';
        btnSave.style.cursor = 'not-allowed';
        btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> KAYDET';
    }

    // --- Profile view mode ---
    applyProfileViewMode();

    // Update community rating count badge
    updateCommunityBadge(player);
};

function updateCommunityBadge(player) {
    const badge = document.getElementById('community-count-badge');
    if (!badge) return;
    const count = player.communityRatings ? player.communityRatings.length : 0;
    badge.textContent = count > 0 ? count : '';
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}
function setText(id, txt) {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
}


// ======================================================
// 7. CHART
// ======================================================

function updateChart(player) {
    const ctx = document.getElementById('profileChart');
    if (!ctx) return;
    if (typeof Chart === 'undefined') { console.error('Chart.js not loaded!'); return; }

    const dataValues = [
        player.ratings.teknik, player.ratings.sut, player.ratings.pas,
        player.ratings.hiz, player.ratings.fizik, player.ratings.kondisyon
    ];

    // Community avg overlay
    const communityR = calcCommunityRatingsAvg(player);
    const communityValues = communityR ? [
        communityR.teknik, communityR.sut, communityR.pas,
        communityR.hiz, communityR.fizik, communityR.kondisyon
    ] : null;

    const datasets = [{
        label: 'Kendi Puanı',
        data: dataValues,
        backgroundColor: 'rgba(173, 255, 47, 0.15)',
        borderColor: '#adff2f',
        borderWidth: 2,
        pointBackgroundColor: '#adff2f'
    }];

    if (communityValues) {
        datasets.push({
            label: 'Community Puanı',
            data: communityValues,
            backgroundColor: 'rgba(0, 229, 255, 0.1)',
            borderColor: 'var(--neon-cyan)',
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: 'var(--neon-cyan)',
            pointRadius: 4
        });
    }

    if (window.profileChartInstance) {
        window.profileChartInstance.data.datasets = datasets;
        window.profileChartInstance.update();
        window.profileChartInstance.resize();
    } else {
        window.profileChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Teknik', 'Şut', 'Pas', 'Hız', 'Fizik', 'Kondisyon'],
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.2)' },
                        grid: { color: 'rgba(255, 255, 255, 0.2)' },
                        pointLabels: { color: '#fff', font: { size: 12 } },
                        suggestedMin: 0,
                        suggestedMax: 100,
                        ticks: { display: false, beginAtZero: true }
                    }
                },
                plugins: {
                    legend: {
                        display: communityValues !== null,
                        labels: { color: '#aaa', font: { size: 11 } }
                    }
                }
            }
        });
    }
}


// ======================================================
// 8. COMMUNITY RATING SYSTEM
// ======================================================

/**
 * Calculate average of all numeric ratings categories (for ORT. PUAN display)
 * Returns a single number (e.g. 7.8) or 0 if no ratings
 */
function calcCommunityAvg(player) {
    if (!player.communityRatings || player.communityRatings.length === 0) return 0;
    const keys = ['teknik', 'sut', 'pas', 'hiz', 'fizik', 'kondisyon'];
    let total = 0;
    let count = 0;
    player.communityRatings.forEach(r => {
        keys.forEach(k => {
            if (r[k] !== undefined) { total += r[k]; count++; }
        });
    });
    if (count === 0) return 0;
    // Scale 1-99 to 1-10
    return ((total / count) / 99 * 10);
}

/**
 * Returns per-stat community averages (for chart overlay)
 */
function calcCommunityRatingsAvg(player) {
    if (!player.communityRatings || player.communityRatings.length === 0) return null;
    const keys = ['teknik', 'sut', 'pas', 'hiz', 'fizik', 'kondisyon'];
    const result = {};
    keys.forEach(k => {
        const vals = player.communityRatings.map(r => r[k]).filter(v => v !== undefined);
        result[k] = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    });
    return result;
}

/**
 * Renders the community rating form in the Puanla tab (for other users)
 */
function renderCommunityRatingForm(container) {
    const targetPlayer = players.find(p => p.id === activePlayerId);
    if (!targetPlayer) return;

    const acc = getActiveAccount();
    // Find existing rating from this account
    const existing = targetPlayer.communityRatings
        ? targetPlayer.communityRatings.find(r => r.fromAccountId === activeAccountId)
        : null;

    const keys = ['teknik', 'sut', 'pas', 'hiz', 'fizik', 'kondisyon'];
    const labels = { teknik: 'Teknik', sut: 'Şut', pas: 'Pas', hiz: 'Hız', fizik: 'Fizik', kondisyon: 'Kondisyon' };
    const defaults = existing || { teknik: 70, sut: 70, pas: 70, hiz: 70, fizik: 70, kondisyon: 70 };

    container.innerHTML = `
        <div class="glass-card community-rating-card" style="max-width:600px; margin:0 auto;">
            <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem;">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${targetPlayer.name}"
                     style="width:50px; height:50px; border-radius:50%; border:2px solid var(--neon-cyan);">
                <div>
                    <h3 style="color:var(--neon-cyan); margin-bottom:0.2rem;">
                        <i class="fa-solid fa-star"></i> ${targetPlayer.name}'ı Puanla
                    </h3>
                    <span style="color:#888; font-size:0.85rem;">
                        ${existing ? '✅ Daha önce puan verdiniz — güncelleyebilirsiniz' : '📝 İlk puanınızı verin'}
                    </span>
                </div>
                <div id="community-count-badge" style="margin-left:auto; background:var(--neon-cyan); color:#000; border-radius:20px; padding:4px 12px; font-weight:800; font-size:0.85rem; display:${(targetPlayer.communityRatings?.length || 0) > 0 ? 'inline-flex' : 'none'}; align-items:center; gap:4px;">
                    <i class="fa-solid fa-users"></i> ${targetPlayer.communityRatings?.length || 0}
                </div>
            </div>

            <div class="rating-form" id="community-rating-form">
                ${keys.map(k => `
                <div class="rating-row">
                    <span class="rating-label">${labels[k]}</span>
                    <input type="range" class="rating-slider" id="cr-${k}"
                        min="1" max="99" step="1" value="${defaults[k]}"
                        oninput="updateCRDisp('${k}', this.value)">
                    <span class="rating-val" id="cr-disp-${k}">${defaults[k]}</span>
                </div>`).join('')}

                <button id="btn-submit-community" class="btn-primary"
                    onclick="submitCommunityRating()"
                    style="width:100%; margin-top:2rem; background:var(--neon-cyan); color:black; font-weight:800; padding:1rem; border:none; border-radius:8px; cursor:pointer; font-size:1rem;">
                    <i class="fa-solid fa-paper-plane"></i>
                    ${existing ? 'PUANI GÜNCELLE' : 'PUANI GÖNDER'}
                </button>
                <div style="margin-top:1rem; text-align:center; font-size:0.85rem; color:#666;">
                    Puanlar ${targetPlayer.name}'nın Genel Bakış → ORT. PUAN bölümüne yansır
                </div>
            </div>

            ${targetPlayer.communityRatings && targetPlayer.communityRatings.length > 0 ? `
            <div style="margin-top:2rem; border-top:1px solid #333; padding-top:1.5rem;">
                <h4 style="color:#888; font-size:0.9rem; margin-bottom:1rem; text-transform:uppercase; letter-spacing:1px;">
                    Verilen Puanlar (${targetPlayer.communityRatings.length})
                </h4>
                <div id="community-ratings-log">
                    ${renderCommunityLog(targetPlayer)}
                </div>
            </div>` : ''}
        </div>
    `;
}

function renderCommunityLog(player) {
    if (!player.communityRatings || player.communityRatings.length === 0) return '';
    return player.communityRatings.map(r => {
        const fromAcc = accounts.find(a => a.id === r.fromAccountId);
        const fromName = fromAcc ? fromAcc.name : 'Bilinmeyen';
        const vals = ['teknik', 'sut', 'pas', 'hiz', 'fizik', 'kondisyon'];
        const avg = Math.round(vals.reduce((s, k) => s + (r[k] || 0), 0) / vals.length);
        const isMe = r.fromAccountId === activeAccountId;
        return `
            <div style="display:flex; align-items:center; gap:1rem; padding:0.8rem; border-radius:8px;
                background:${isMe ? 'rgba(0,229,255,0.05)' : 'rgba(255,255,255,0.02)'};
                border:1px solid ${isMe ? 'rgba(0,229,255,0.2)' : '#2a2a2a'};
                margin-bottom:0.5rem;">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${fromName}"
                     style="width:30px;height:30px;border-radius:50%;">
                <span style="font-weight:600; color:${isMe ? 'var(--neon-cyan)' : '#ddd'}">
                    ${fromName}${isMe ? ' (Sen)' : ''}
                </span>
                <span style="margin-left:auto; font-weight:800; color:var(--neon-green);">${avg} GEN</span>
            </div>
        `;
    }).join('');
}

window.updateCRDisp = function (key, val) {
    const el = document.getElementById(`cr-disp-${key}`);
    if (el) el.textContent = val;
};

window.submitCommunityRating = function () {
    const targetPlayer = players.find(p => p.id === activePlayerId);
    if (!targetPlayer) return;

    const acc = getActiveAccount();
    if (!acc) return;

    // Self-rating guard
    if (acc.playerId === activePlayerId) {
        alert('Kendinizi puanlayamazsınız!');
        return;
    }

    const keys = ['teknik', 'sut', 'pas', 'hiz', 'fizik', 'kondisyon'];
    const newRating = { fromAccountId: activeAccountId, date: new Date().toISOString() };
    keys.forEach(k => {
        const el = document.getElementById(`cr-${k}`);
        newRating[k] = el ? parseInt(el.value) : 70;
    });

    if (!targetPlayer.communityRatings) targetPlayer.communityRatings = [];

    // Update or insert
    const existingIdx = targetPlayer.communityRatings.findIndex(r => r.fromAccountId === activeAccountId);
    if (existingIdx >= 0) {
        targetPlayer.communityRatings[existingIdx] = newRating;
    } else {
        targetPlayer.communityRatings.push(newRating);
    }

    savePlayers();

    // Visual feedback
    const btn = document.getElementById('btn-submit-community');
    if (btn) {
        btn.innerHTML = '✅ PUAN KAYDEDİLDİ';
        btn.style.background = 'var(--neon-green)';
        setTimeout(() => {
            // Re-render the puanla tab
            const puanlaContent = document.getElementById('tab-puanla');
            if (puanlaContent) renderCommunityRatingForm(puanlaContent);
            // Update ORT. PUAN on overview
            updateUI();
        }, 1200);
    }

    // Update the chart overlay
    setTimeout(() => {
        const player = players.find(p => p.id === activePlayerId);
        if (player) updateChart(player);
    }, 1300);

    console.log(`✅ Community rating submitted for ${targetPlayer.name}`);
};


// ======================================================
// 9. SKILL UNLOCKING
// ======================================================

function checkSkillUnlocks(player, avg) {
    const skills = [
        { id: 'sc-maestro', check: player.ratings.pas > 85 },
        { id: 'sc-tank',    check: player.ratings.fizik > 85 },
        { id: 'sc-makina',  check: avg > 88 },
        { id: 'sc-flash',   check: player.ratings.hiz > 85 }
    ];
    skills.forEach(s => {
        const el = document.getElementById(s.id);
        if (!el) return;
        const lock = el.querySelector('.lock-overlay');
        if (s.check) {
            el.classList.remove('locked');
            if (lock) lock.style.display = 'none';
        } else {
            el.classList.add('locked');
            if (lock) lock.style.display = 'flex';
        }
    });
}


// ======================================================
// 10. DATA SYNC & SAVE
// ======================================================

window.syncProfileData = function () {
    const player = players.find(p => p.id === activePlayerId);
    if (!player) return;
    if (!canEditPlayer(activePlayerId)) return;

    const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : null; };
    player.details.age        = getVal('inp-age')        || player.details.age;
    player.details.height     = getVal('inp-height')     || player.details.height;
    player.details.weight     = getVal('inp-weight')     || player.details.weight;
    player.details.ekol       = getVal('sel-ekol')       || player.details.ekol;
    player.details.sakatlik   = getVal('sel-sakatlik')   || player.details.sakatlik;
    player.details.macsatma   = getVal('sel-macsatma')   || player.details.macsatma;
    player.details.mizac      = getVal('sel-mizac')      || player.details.mizac;
    player.details.lojistik   = getVal('sel-lojistik')   || player.details.lojistik;
    player.details.anaMevki   = getVal('sel-ana-mevki')  || player.details.anaMevki;
    player.details.altPos     = getVal('inp-alt-pos')    !== null ? getVal('inp-alt-pos') : player.details.altPos;
    player.details.oyunTarzi  = getVal('sel-oyun-tarzi') || player.details.oyunTarzi;

    savePlayers();
    const ageEl = document.getElementById('disp-age-header');
    if (ageEl) ageEl.innerHTML = `<i class="fa-solid fa-cake-candles"></i> ${player.details.age} Yaş`;
};

// Segmented control trait setter
window.setSegTrait = function(field, val, btnEl) {
    const player = players.find(p => p.id === activePlayerId);
    if (!player) return;
    if (!canEditPlayer(activePlayerId)) return;
    player.details[field] = val;
    savePlayers();
    const container = btnEl.closest('.seg-control');
    if (container) container.querySelectorAll('.seg-opt').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
};

window.updateRateDisp = function (type, val) {
    const el = document.getElementById(`disp-rate-${type}`);
    if (el) el.innerText = val;
    const btn = document.getElementById('btn-save-ratings');
    if (btn && canEditPlayer(activePlayerId)) {
        btn.disabled = false;
        btn.style.background = 'var(--neon-green)';
        btn.style.color = 'black';
        btn.style.cursor = 'pointer';
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> KAYDET';
    }
};

window.saveRatings = function () {
    if (!canEditPlayer(activePlayerId)) return alert('Bu profili düzenleme yetkiniz yok.');
    const player = players.find(p => p.id === activePlayerId);
    if (!player) return;

    const types = ['teknik', 'sut', 'pas', 'hiz', 'fizik', 'kondisyon'];
    types.forEach(t => {
        const input = document.getElementById(`rate-${t}`);
        if (input) player.ratings[t] = parseInt(input.value);
    });
    savePlayers();

    const btn = document.getElementById('btn-save-ratings');
    if (btn) {
        btn.innerHTML = '✅ KAYDEDİLDİ';
        btn.disabled = true;
        btn.style.setProperty('background-color', 'var(--neon-green)', 'important');
        btn.style.color = 'black';
        btn.style.cursor = 'default';
        setTimeout(() => {
            btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> KAYDET';
            btn.disabled = true;
            btn.style.background = '#333';
            btn.style.color = '#777';
            btn.style.cursor = 'not-allowed';
        }, 1500);
    }
    try { updateUI(); renderPlayerList(); } catch (e) { console.error('UI Refresh Error:', e); }
};

window.saveProfileDetails = function () {
    if (!canEditPlayer(activePlayerId)) return alert('Bu profili düzenleme yetkiniz yok.');
    const player = players.find(p => p.id === activePlayerId);
    if (!player) return alert('Oyuncu bulunamadı!');

    const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : null; };
    player.details.age        = getVal('inp-age')        || player.details.age;
    player.details.height     = getVal('inp-height')     || player.details.height;
    player.details.weight     = getVal('inp-weight')     || player.details.weight;
    player.details.ekol       = getVal('sel-ekol')       || player.details.ekol;
    player.details.sakatlik   = getVal('sel-sakatlik')   || player.details.sakatlik;
    player.details.macsatma   = getVal('sel-macsatma')   || player.details.macsatma;
    player.details.mizac      = getVal('sel-mizac')      || player.details.mizac;
    player.details.lojistik   = getVal('sel-lojistik')   || player.details.lojistik;
    player.details.anaMevki   = getVal('sel-ana-mevki')  || player.details.anaMevki;
    player.details.altPos     = getVal('inp-alt-pos')    !== null ? getVal('inp-alt-pos') : player.details.altPos;
    player.details.oyunTarzi  = getVal('sel-oyun-tarzi') || player.details.oyunTarzi;
    // Segment fields are saved in real-time via setSegTrait, no need to re-read here

    savePlayers();

    const btn = document.getElementById('btn-save-details');
    if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ KAYDEDİLDİ';
        btn.style.setProperty('background-color', '#fff', 'important');
        btn.style.color = '#000';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = 'var(--neon-green)';
            btn.style.color = 'black';
        }, 1500);
    }
    updateUI();
};


// ======================================================
// 11. TEAM MANAGEMENT
// ======================================================

function renderPlayerList() {
    const tbody = document.getElementById('player-list-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const acc = getActiveAccount();

    players.forEach(p => {
        const vals = Object.values(p.ratings);
        const gen = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        const communityAvg = calcCommunityAvg(p);

        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #333';
        tr.style.cursor = 'pointer';
        if (p.id === activePlayerId) tr.style.background = 'rgba(173, 255, 47, 0.1)';

        tr.onclick = () => {
            activePlayerId = p.id;
            localStorage.setItem('activePlayerId', p.id);
            updateUI();
            renderPlayerList();
            showSection('profile');
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            const profileNav = document.querySelector('.nav-item[data-target="profile"]');
            if (profileNav) profileNav.classList.add('active');
        };

        tr.draggable = true;
        tr.ondragstart = (e) => {
            e.dataTransfer.setData('text/plain', p.id);
            e.dataTransfer.effectAllowed = 'copy';
        };

        const isEditable = acc && (acc.role === 'admin' || acc.playerId === p.id);
        const communityStr = communityAvg > 0
            ? `<span style="color:var(--neon-cyan); font-size:0.8rem;" title="Community puanı">⭐${communityAvg.toFixed(1)}</span>`
            : '';

        tr.innerHTML = `
            <td style="padding:10px; display:flex; align-items:center; gap:10px;">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}"
                     style="width:32px; height:32px; border-radius:50%; background:#222;">
                <span style="font-weight:600; color:#eee;">${p.name}</span>
                ${communityStr}
            </td>
            <td>
                <select class="pos-select" onclick="event.stopPropagation()"
                    onchange="updatePlayerPos('${p.id}', this.value)"
                    ${!isEditable ? 'disabled' : ''}>
                    <option value="KL"  ${p.details.pos === 'KL'  ? 'selected' : ''}>KL</option>
                    <option value="DEF" ${p.details.pos === 'DEF' ? 'selected' : ''}>DEF</option>
                    <option value="OS"  ${p.details.pos === 'OS'  ? 'selected' : ''}>OS</option>
                    <option value="FV"  ${p.details.pos === 'FV'  ? 'selected' : ''}>FV</option>
                </select>
            </td>
            <td>
                <span style="color:${gen >= 80 ? 'var(--neon-green)' : 'orange'}">
                ${gen >= 80 ? '🔥' : '⚡'}</span>
            </td>
            <td>
                <span style="font-weight:800; color:var(--neon-green); font-size:1.1rem;">${gen}</span>
            </td>
            <td style="text-align:center;">
                ${acc && acc.role === 'admin' ? `
                <i class="fa-solid fa-circle-xmark"
                   style="color:#ff4444; cursor:pointer; font-size:1.2rem; transition: transform 0.2s;"
                   onmouseover="this.style.transform='scale(1.2)'"
                   onmouseout="this.style.transform='scale(1)'"
                   onclick="event.stopPropagation(); deletePlayer('${p.id}')"></i>
                ` : '—'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.allowDrop = function (e) { e.preventDefault(); };

window.handleDrop = function (e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    const pitch = document.querySelector('.pitch-container');
    const rect = pitch.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
    addToPitch(id, x, y);
    const player = players.find(p => p.id === id);
    if (player) { player.pitchPos = { left: x, top: y }; savePlayers(); }
};

window.addToPitch = function (id, x, y) {
    const player = players.find(p => p.id === id);
    if (!player) return;
    const pitch = document.querySelector('.pitch-container');
    const token = document.createElement('div');
    token.className = 'pitch-player-token';
    token.style.left = (x !== undefined ? x : 50) + 'px';
    token.style.top  = (y !== undefined ? y : 50) + 'px';
    if (x === undefined) { token.style.top = '50%'; token.style.left = '50%'; token.style.transform = 'translate(-50%, -50%)'; }
    token.innerHTML = `
        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}" class="token-avatar">
        <span class="token-name">${player.name} (${player.details.pos})</span>
    `;
    let isDragging = false, startX, startY, initialLeft, initialTop;
    token.onmousedown = function (e) {
        e.preventDefault(); e.stopPropagation();
        isDragging = true; startX = e.clientX; startY = e.clientY;
        initialLeft = token.offsetLeft; initialTop = token.offsetTop;
        token.style.cursor = 'grabbing'; token.style.zIndex = 1000; token.style.transform = 'scale(1.1)';
    };
    const mmH = function (e) {
        if (!isDragging) return;
        token.style.left = `${initialLeft + e.clientX - startX}px`;
        token.style.top  = `${initialTop  + e.clientY - startY}px`;
    };
    const muH = function () {
        if (isDragging) {
            isDragging = false; token.style.cursor = 'grab'; token.style.zIndex = 10; token.style.transform = 'scale(1)';
            const pR = pitch.getBoundingClientRect(), tR = token.getBoundingClientRect();
            const cx = tR.left + tR.width/2, cy = tR.top + tR.height/2;
            if (cx < pR.left || cx > pR.right || cy < pR.top || cy > pR.bottom) {
                token.remove();
                const p = players.find(pl => pl.id === id);
                if (p) { delete p.pitchPos; savePlayers(); }
                document.removeEventListener('mousemove', mmH); document.removeEventListener('mouseup', muH);
            } else {
                const nl = parseFloat(token.style.left), nt = parseFloat(token.style.top);
                const p = players.find(pl => pl.id === id);
                if (p && !isNaN(nl) && !isNaN(nt)) { p.pitchPos = { left: nl, top: nt }; savePlayers(); }
            }
        }
    };
    document.addEventListener('mousemove', mmH); document.addEventListener('mouseup', muH);
    token.ondblclick = function () {
        token.remove();
        const p = players.find(pl => pl.id === id);
        if (p) { delete p.pitchPos; savePlayers(); }
        document.removeEventListener('mousemove', mmH); document.removeEventListener('mouseup', muH);
    };
    pitch.appendChild(token);
};

window.deletePlayer = function (id) {
    const acc = getActiveAccount();
    if (!acc || acc.role !== 'admin') return alert('Oyuncu silmek için admin yetkisi gereklidir.');
    if (id === 'p1') return alert('Ana karakteri (Mikimon) takımdan kovamazsın!');
    if (confirm('Bu oyuncuyu takımdan silmek istediğine emin misiniz?')) {
        players = players.filter(p => p.id !== id);
        // Also remove account if exists
        accounts = accounts.filter(a => a.playerId !== id);
        if (activePlayerId === id) {
            activePlayerId = players[0] ? players[0].id : null;
            const activeAcc = accounts.find(a => a.playerId === activePlayerId);
            if (activeAcc) activeAccountId = activeAcc.id;
        }
        savePlayers(); saveAccounts();
        renderPlayerList(); renderAccountList(); updateUI();
    }
};

window.updatePlayerPos = function (id, newPos) {
    const player = players.find(p => p.id === id);
    if (player) {
        player.details.pos = newPos;
        savePlayers();
        if (activePlayerId === id) updateUI();
    }
};

window.addNewPlayer = function () {
    const acc = getActiveAccount();
    if (!acc || acc.role !== 'admin') return alert('Oyuncu eklemek için admin yetkisi gereklidir.');
    const name = document.getElementById('new-player-name').value.trim();
    if (!name) return alert('İsim giriniz');

    const newP = JSON.parse(JSON.stringify(DEFAULT_PLAYER));
    newP.id = 'p_' + Date.now();
    newP.name = name;
    newP.details.pos = document.getElementById('new-player-pos').value;
    Object.keys(newP.ratings).forEach(k => newP.ratings[k] = 50 + Math.floor(Math.random() * 40));

    // Create account for new player
    const newAcc = { id: 'acc_' + Date.now(), name, role: 'player', playerId: newP.id };
    players.push(newP);
    accounts.push(newAcc);

    savePlayers(); saveAccounts();
    renderPlayerList(); renderAccountList();
    document.getElementById('new-player-name').value = '';
    alert(`${name} eklendi! Hesap da oluşturuldu.`);
};

window.restorePitchState = function () {
    const pitch = document.querySelector('.pitch-container');
    if (!pitch) return;
    document.querySelectorAll('.pitch-player-token').forEach(t => t.remove());
    let restoredCount = 0;
    const MAX_W = 1200, MAX_H = 1200;
    players.forEach(p => {
        if (p.pitchPos && p.pitchPos.left !== undefined) {
            let x = parseFloat(p.pitchPos.left), y = parseFloat(p.pitchPos.top);
            if (isNaN(x) || isNaN(y) || x < -20 || y < -20 || x > MAX_W || y > MAX_H) {
                delete p.pitchPos;
            } else {
                addToPitch(p.id, x, y); restoredCount++;
            }
        }
    });
    savePlayers();
    console.log(`✅ Restored ${restoredCount} players.`);
};

window.toggleMatchVerification = function (btn) {
    btn.classList.toggle('verified');
    btn.textContent = btn.classList.contains('verified') ? '✅ Onaylandı' : 'Ben de Vardım';
};

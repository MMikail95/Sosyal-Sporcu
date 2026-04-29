
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

    // Apply saved theme on load
    applyTheme(localStorage.getItem('ss_theme') || 'dark');
});


// ======================================================
// TEMA YÖNETİMİ (Dark / Light Mode)
// ======================================================

function applyTheme(theme) {
    const html   = document.documentElement;
    const icon   = document.getElementById('theme-icon');
    const label  = document.getElementById('theme-label');

    if (theme === 'light') {
        html.setAttribute('data-theme', 'light');
        if (icon)  icon.className  = 'fa-solid fa-sun theme-icon';
        if (label) label.textContent = 'Aydınlık Mod';
    } else {
        html.removeAttribute('data-theme');
        if (icon)  icon.className  = 'fa-solid fa-moon theme-icon';
        if (label) label.textContent = 'Karanlık Mod';
    }
    localStorage.setItem('ss_theme', theme);
}

window.toggleTheme = function() {
    const current = localStorage.getItem('ss_theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
};

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

var players = [];
var accounts = [];
var activeAccountId = 'acc_admin';
var activePlayerId = 'p1';


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

// ── FAZ 1: Supabase oturum entegrasyonu ──
// Oturum açmış kullanıcının profilini Supabase'den yükler
// ve mevcut activePlayerId ile senkronize eder.
async function initSupabaseUser() {
    if (!window.sbClient || !window.DB) return;

    try {
        const session = await window.DB.Auth.getSession();
        if (!session) {
            // Oturum yok → auth.html'e yönlendir (index.html guard'ı zaten yapar)
            return;
        }

        const userId = session.user.id;
        const profile = await window.DB.Profiles.get(userId);

        if (profile) {
            // Supabase profilini localStorage mock sistemiyle köprüle:
            let existingPlayer = players.find(p =>
                p.name.toLowerCase() === (profile.username || '').toLowerCase()
            );

            if (!existingPlayer) {
                // Yeni kullanıcı — geçici player objesi oluştur
                const newPlayer = {
                    id:   `sb_${userId}`,
                    name: profile.username || profile.full_name || 'Oyuncu',
                    supabase_id: userId,
                    avatar_url: profile.avatar_url || null, // #4: boş avatar
                    details: {
                        pos:           profile.position    || 'OS',
                        age:           profile.age         || null, // #6: boş başlar
                        height:        profile.height      || null,
                        weight:        profile.weight      || null,
                        city:          profile.city        || null, // #6: boş başlar
                        ekol:          profile.ekol        || 'Halısaha Gazisi',
                        sakatlik:      profile.sakatlik    || 'Maç Seçer',
                        macsatma:      profile.macsatma    || 'Keyfine Bağlı',
                        mizac:         profile.mizac       || 'Makara Yapıcı',
                        lojistik:      profile.lojistik    || 'Kendi Gelir',
                        anaMevki:      profile.ana_mevki   || 'Ofansif OS (10 Numara)',
                        altPos:        profile.alt_pos     || '',
                        oyunTarzi:     profile.oyun_tarzi  || 'Box-to-Box',
                        formStatus:    profile.form_status || 'Orta',
                        dakiklik:      profile.dakiklik       || 'Son Dakika Yetişir',
                        sahaIletisim:  profile.saha_iletisim  || 'Sessiz Oynar',
                        macSonu:       profile.mac_sonu       || 'Bir Çay İçip Gider',
                        mevkiSadakat:  profile.mevki_sadakat  || 'Bazen Gezer',
                        presGucu:      profile.pres_gucu      || 'Yorgunsa Yavaş',
                        pasTercihi:    profile.pas_tercihi    || 'Dengeli',
                        markaj:        profile.markaj         || 'Yakın Takip'
                    },
                    ratings: {
                        teknik:    profile.rating_teknik    ?? null,
                        sut:       profile.rating_sut       ?? null,
                        pas:       profile.rating_pas       ?? null,
                        hiz:       profile.rating_hiz       ?? null,
                        fizik:     profile.rating_fizik     ?? null,
                        kondisyon: profile.rating_kondisyon ?? null
                    },
                    stats: {
                        totalMatches: profile.total_matches || 0,
                        totalGoals:   profile.total_goals   || 0,
                        totalAssists: profile.total_assists || 0,
                    },
                    communityRatings: []
                };

                players.unshift(newPlayer);
                existingPlayer = newPlayer;

                // Hesabı da oluştur
                const newAccount = {
                    id:       `acc_${userId}`,
                    name:     profile.username || profile.full_name || 'Oyuncu',
                    role:     profile.is_admin ? 'admin' : 'player',
                    playerId: newPlayer.id,
                    supabase_id: userId
                };
                accounts.unshift(newAccount);
                activeAccountId = newAccount.id;
                activePlayerId  = newPlayer.id;
            } else {
                // Mevcut mock oyuncu bulundu → aktif hesaba geç
                const acc = accounts.find(a => a.playerId === existingPlayer.id);
                if (acc) {
                    activeAccountId = acc.id;
                    activePlayerId  = existingPlayer.id;
                }
                // Supabase'den gelen TÜM verileri override et (localStorage'da eski değerler kalıyor)
                if (profile.avatar_url) existingPlayer.avatar_url = profile.avatar_url;
                if (!existingPlayer.details) existingPlayer.details = {};
                if (profile.form_status) existingPlayer.details.formStatus = profile.form_status;
                if (profile.city)        { existingPlayer.city = profile.city; existingPlayer.details.city = profile.city; }
                if (profile.age)         existingPlayer.details.age = profile.age;
                if (profile.height)      existingPlayer.details.height = profile.height;
                if (profile.weight)      existingPlayer.details.weight = profile.weight;
                if (profile.ana_mevki)   existingPlayer.details.anaMevki = profile.ana_mevki;
                if (profile.ayak)        existingPlayer.details.ayak = profile.ayak;
                // Rating'leri Supabase'den al — null ise null kalacak (artık 70 default yok)
                existingPlayer.ratings = {
                    teknik:    profile.rating_teknik    ?? null,
                    sut:       profile.rating_sut       ?? null,
                    pas:       profile.rating_pas       ?? null,
                    hiz:       profile.rating_hiz       ?? null,
                    fizik:     profile.rating_fizik     ?? null,
                    kondisyon: profile.rating_kondisyon ?? null
                };
            }

            // Takım adını çek ve header'a yansıt (#2 - Aktif Takım)
            try {
                const myTeam = await window.DB.Teams.getMyTeam(userId);
                if (myTeam && existingPlayer) {
                    existingPlayer._sbTeamName     = myTeam.name;
                    existingPlayer.current_team_id = myTeam.id;
                }
            } catch(e) { /* takım yoksa sessizce geç */ }

            // Sidebar'daki hesap bilgisini güncelle
            addLogoutButton(profile);

            savePlayers();
            saveAccounts();
            console.log(`✅ Supabase kullanıcısı yüklendi: ${profile.username}`);
        }

    } catch (err) {
        console.warn('Supabase user init failed (offline mode):', err.message);
    }
}

// Sidebar'a oturum kapatma butonu ekle + mock hesap panelini gizle
function addLogoutButton(profile) {
    if (document.getElementById('btn-logout')) return;

    // ── Gerçek kullanıcı bilgilerini güncelle ──
    const nameEl = document.getElementById('current-account-name');
    if (nameEl) nameEl.textContent = profile.username || profile.full_name || 'Oyuncu';

    const roleEl = document.getElementById('current-account-role');
    if (roleEl) {
        roleEl.textContent = profile.is_admin ? '⚡ Admin' : '🎮 Oyuncu';
    }

    const avatarEl = document.getElementById('current-account-avatar');
    if (avatarEl) {
        const seed = profile.username || profile.full_name || 'user';
        avatarEl.src = profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
    }

    // ── Mock hesap listesini/panelıni gizle (gerçek auth varken kullanılmaz) ──
    const accountPanel = document.getElementById('account-panel');
    if (accountPanel) accountPanel.style.display = 'none';

    // Chevron ikonunu gizle
    const chevron = document.getElementById('acc-chevron-icon');
    if (chevron) chevron.style.display = 'none';

    // Account current butonunun tıklama/hover efektini kaldır
    const accountCurrentBtn = document.getElementById('account-current-btn');
    if (accountCurrentBtn) {
        accountCurrentBtn.onclick = null;
        accountCurrentBtn.style.cursor = 'default';
        accountCurrentBtn.style.pointerEvents = 'none';
    }

    // ── Çıkış butonu ekle ──
    const switcherEl = document.querySelector('.account-switcher');
    if (!switcherEl) return;

    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'btn-logout';
    logoutBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Çıkış Yap';
    logoutBtn.style.cssText = `
        width: 100%; margin-top: 0.5rem; padding: 0.6rem 1rem;
        background: rgba(255,0,127,0.1); border: 1px solid rgba(255,0,127,0.2);
        border-radius: 8px; color: #ff007f; font-family: inherit; font-size: 0.78rem;
        font-weight: 700; cursor: pointer; transition: all 0.2s ease; letter-spacing: 0.5px;
    `;
    logoutBtn.onmouseenter = () => { logoutBtn.style.background = 'rgba(255,0,127,0.2)'; };
    logoutBtn.onmouseleave = () => { logoutBtn.style.background = 'rgba(255,0,127,0.1)'; };
    logoutBtn.onclick = handleLogout;
    switcherEl.appendChild(logoutBtn);
}

// Oturumu kapat
window.handleLogout = async function() {
    if (!confirm('Oturumu kapatmak istediğinize emin misiniz?')) return;

    try {
        if (window.DB) await window.DB.Auth.signOut();
        // localStorage temizle
        localStorage.removeItem('ss_active_account');
        window.location.replace('auth.html');
    } catch (err) {
        console.error('Logout error:', err);
        window.location.replace('auth.html');
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 App Initializing...');

    loadData();
    setupNavigation();

    // FAZ 1: Supabase kullanıcısını yükle
    await initSupabaseUser();

    updateAccountUI();
    updateUI();
    renderPlayerList();

    // Load team data after players are ready
    if (typeof loadTeamData === 'function') {
        loadTeamData();
    }

    // Chart resize fix
    setTimeout(restorePitchState, 300);
    setTimeout(restorePitchState, 1000);
});

/**
 * Takımım sayfasından bir oyuncunun profiline geç
 */
window.viewPlayerFromTeam = async function(playerId) {
    const currentUserId = window.__AUTH_USER__?.id;

    // Kendi profiliyse → tam profil aç
    if (currentUserId && playerId === currentUserId) {
        window.previousSection = 'takimim';
        activePlayerId = playerId;
        showSection._fromViewPlayer = true;
        showSection('profile');
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelector('.nav-item[data-target="profile"]')?.classList.add('active');
        setTimeout(() => applyProfileViewMode(), 150);
        return;
    }

    // FAZ 5D — Arkadaşlık kontrolü
    let isFriend = false;
    if (currentUserId && window.DB) {
        try {
            const fs = await window.DB.Friends.checkStatus(currentUserId, playerId);
            isFriend = fs?.status === 'accepted';
        } catch(e) {}
    }

    if (isFriend) {
        // Arkadaş → tam profil görünümü (view-only)
        window.previousSection = 'takimim';
        activePlayerId = playerId;
        showSection._fromViewPlayer = true;
        showSection('profile');
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelector('.nav-item[data-target="profile"]')?.classList.add('active');
        setTimeout(() => applyProfileViewMode(), 150);
    } else {
        // Arkadaş değil → Sınırlı profil modalı
        const members = window._tmState?.members || [];
        const member  = members.find(m => m.player_id === playerId || m.player?.id === playerId);
        const pName   = member?.player?.username || 'Oyuncu';
        if (typeof showProfileModal === 'function') {
            showProfileModal(playerId, pName, 'team');
        }
    }
};


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
        // Faz 1: render new team overview
        if (typeof renderTeamOverview === 'function') {
            setTimeout(() => {
                renderTeamOverview();
                // Trigger placeholder renders for other tabs
                if (typeof renderKadroTab      === 'function') renderKadroTab();
                if (typeof renderSahaTab       === 'function') renderSahaTab();
                if (typeof renderTakimOlusturTab === 'function') renderTakimOlusturTab();
                if (typeof renderRakiplerTab   === 'function') renderRakiplerTab();
                if (typeof renderOdemelerTab   === 'function') renderOdemelerTab();
                if (typeof renderSinerjiTab    === 'function') renderSinerjiTab();
            }, 80);
        } else {
            // Legacy fallback
            renderPlayerList();
            setTimeout(() => restorePitchState(), 50);
        }
    }
    if (id === 'profile') {
        // Doğrudan nav click mi yoksa viewPlayerFromTeam'den mi gelindi?
        // _fromViewPlayer flag'i yoksa nav'dan gelindi = kendi profiline dön
        if (!showSection._fromViewPlayer) {
            const acc = getActiveAccount();
            if (acc && acc.playerId && activePlayerId !== acc.playerId) {
                activePlayerId = acc.playerId;
                window.previousSection = null;
            }
        }
        delete showSection._fromViewPlayer;

        setTimeout(() => {
            const player = players.find(p => p.id === activePlayerId) || players[0];
            updateUI();
            updateChart(player);
        }, 100);
    }
    if (id === 'feed') {
        if (typeof window.renderFeed === 'function') window.renderFeed();
    }
    if (id === 'explore') {
        if (typeof window.initExplore === 'function' && explorePlayers.length === 0) {
            window.initExplore();
        }
    }
    // Close panels on nav change
    closeAccountPanel();
    document.getElementById('notif-panel')?.classList.remove('open');
}



// ======================================================
// 5. PROFILE VIEW MODE
// ======================================================

/**
 * Geri dönüş için önceki sekme izleyicisi
 */
window.previousSection = null;

/**
 * Profil görüntülemede geri dön — hangi sekmeden geldiyse oraya döner
 */
window.goBackFromProfile = function() {
    const acc = getActiveAccount();
    if (acc) {
        activePlayerId = acc.playerId;
        updateUI();
    }
    window.viewingAsFriend = null;
    const target = window.previousSection || 'takimim';
    window.previousSection = null;
    showSection(target);
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const nav = document.querySelector(`.nav-item[data-target="${target}"]`);
    if (nav) nav.classList.add('active');
};

/**
 * Returns true if we're viewing someone else's profile (not ours)
 */
function isViewingOtherProfile() {
    const acc = getActiveAccount();
    return acc && acc.playerId !== activePlayerId;
}

/**
 * Genel Bakış sekmesinde düzenleme panelini aç/kapat
 */
window.toggleProfileEditPanel = function() {
    const viewPanel  = document.getElementById('profile-view-mode');
    const editPanel  = document.getElementById('profile-edit-panel');
    const editBtn    = document.getElementById('btn-edit-profile-toggle');
    if (!viewPanel || !editPanel) return;

    const isEditing = editPanel.style.display !== 'none';

    if (isEditing) {
        // Kapat
        editPanel.style.display  = 'none';
        viewPanel.style.display  = '';
        if (editBtn) editBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Düzenle';
    } else {
        // Aç — mevcut değerleri doldur
        const player = players.find(p => p.id === activePlayerId);
        if (player) {
            const unEl    = document.getElementById('inp-username');
            const cityEl   = document.getElementById('inp-city');
            const ayakEl   = document.getElementById('sel-ayak');
            const mevkiEl  = document.getElementById('sel-ana-mevki-gb');
            const ageGbEl  = document.getElementById('inp-age-gb');
            const heightEl = document.getElementById('inp-height-gb');
            const weightEl = document.getElementById('inp-weight-gb');
            if (unEl)    unEl.value    = player.name || '';
            if (cityEl)  cityEl.value  = player.details?.city || player.city || '';
            if (ayakEl)  ayakEl.value  = player.details?.ayak || 'Sağ';
            if (mevkiEl) mevkiEl.value = player.details?.anaMevki || '';
            if (ageGbEl) ageGbEl.value = player.details?.age  || '';
            if (heightEl) heightEl.value = player.details?.height || '';
            if (weightEl) weightEl.value = player.details?.weight || '';

            // Takım dropdown'u doldur
            const teamSel = document.getElementById('sel-team-gb');
            if (teamSel && window.DB && window.__AUTH_USER__) {
                window.DB.Teams.getMyTeams(window.__AUTH_USER__.id).then(teams => {
                    teamSel.innerHTML = '<option value="">— Takım Seçilmedi —</option>';
                    teams.forEach(t => {
                        const opt = document.createElement('option');
                        opt.value = t.id;
                        opt.textContent = `${t.name}${t.role === 'captain' ? ' ★' : ''}`;
                        if (t.id === player.current_team_id) opt.selected = true;
                        teamSel.appendChild(opt);
                    });
                }).catch(() => {});
            }
        }
        editPanel.style.display  = '';
        viewPanel.style.display  = 'none';
        if (editBtn) editBtn.innerHTML = '<i class="fa-solid fa-xmark"></i> Kapat';
    }
};

/**
 * Genel Bakış düzenleme panelinden hızlı kayıt
 */
window.saveQuickProfile = async function() {
    const player = players.find(p => p.id === activePlayerId);
    if (!player) return;

    const getV = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const username = getV('inp-username');
    const city     = getV('inp-city');
    const ayak     = getV('sel-ayak');
    const anaMevki = getV('sel-ana-mevki-gb');
    const age      = parseInt(getV('inp-age-gb'))  || null;
    const height   = parseInt(getV('inp-height-gb')) || null;
    const weight   = parseInt(getV('inp-weight-gb')) || null;
    const teamIdRaw = getV('sel-team-gb'); // '' (boş seçim) veya UUID
    const teamId    = teamIdRaw || null;
    // Seçili takım adını option text'ten al
    const teamSelEl = document.getElementById('sel-team-gb');
    const teamName  = teamId && teamSelEl
        ? (teamSelEl.options[teamSelEl.selectedIndex]?.text || '').replace(' ★', '').trim()
        : null;

    // Yerel player objesini güncelle
    if (username) player.name = username;
    if (!player.details) player.details = {};
    if (city)      { player.city = city;  player.details.city = city; }
    if (ayak)      { player.details.ayak = ayak; }
    if (anaMevki)  { player.details.anaMevki = anaMevki; }
    if (age)       { player.details.age    = age; }
    if (height)    { player.details.height = height; }
    if (weight)    { player.details.weight = weight; }
    if (teamId)    {
        player.current_team_id = teamId;
        player._sbTeamName     = teamName || null;
    } else if (teamIdRaw === '') {
        // Kullanıcı "— Takım Seçilmedi —" seçti → takımı sıfırla
        player.current_team_id = null;
        player._sbTeamName     = null;
    }

    savePlayers();
    updateUI();

    // Supabase — sadece şemada olan alanlar
    const user = window.__AUTH_USER__;
    if (user && window.DB) {
        const updates = {};
        if (username)  updates.username       = username;
        if (city)      updates.city           = city;
        if (age)       updates.age            = age;
        if (height)    updates.height         = height;
        if (weight)    updates.weight         = weight;
        if (ayak)      updates.ayak           = ayak;
        if (anaMevki)  updates.ana_mevki      = anaMevki;
        if (teamId)    updates.current_team_id = teamId;

        try {
            await window.DB.Profiles.update(user.id, updates);
            showToast('✅ Profil bilgileri kaydedildi!');
        } catch(e) {
            showToast('❌ Kayıt hatası: ' + e.message);
            console.error('Profile save error:', e);
        }
    } else {
        showToast('✅ Değişiklikler yerel olarak kaydedildi.');
    }

    // Paneli kapat
    toggleProfileEditPanel();
};

/**
 * Sets profile to view-only or edit mode based on permissions
 */
function applyProfileViewMode() {
    const viewingOther = isViewingOtherProfile();
    const acc = getActiveAccount();
    const isAdmin = acc && acc.role === 'admin';

    // If admin, always can edit. If viewing own profile, can edit.
    const canEdit = !viewingOther || isAdmin;

    // Show/hide the view banner + geri dön butonu
    const banner = document.getElementById('view-only-banner');
    const backBtn = document.getElementById('view-back-btn');
    if (banner) {
        if (viewingOther && !isAdmin) {
            const viewedPlayer = players.find(p => p.id === activePlayerId);
            banner.style.display = 'flex';
            banner.querySelector('.view-banner-text').textContent =
                `👁️ ${viewedPlayer ? viewedPlayer.name : 'Oyuncu'}'nın profilini görüntülüyorsunuz`;
            if (backBtn) {
                backBtn.style.display = window.previousSection ? 'inline-flex' : 'none';
                if (window.previousSection === 'takimim') backBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Takıma Dön';
                else if (window.previousSection === 'explore') backBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Keşfete Dön';
                else backBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Geri Dön';
            }
        } else if (viewingOther && isAdmin) {
            const viewedPlayer = players.find(p => p.id === activePlayerId);
            banner.style.display = 'flex';
            banner.querySelector('.view-banner-text').textContent =
                `⚡ Admin olarak ${viewedPlayer ? viewedPlayer.name : 'Oyuncu'}'nın profilini düzenliyorsunuz`;
            banner.style.borderColor = 'var(--neon-cyan)';
            if (backBtn) {
                backBtn.style.display = window.previousSection ? 'inline-flex' : 'none';
                if (window.previousSection === 'takimim') backBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Takıma Dön';
                else if (window.previousSection === 'explore') backBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Keşfete Dön';
                else backBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Geri Dön';
            }
        } else {
            banner.style.display = 'none';
            if (backBtn) backBtn.style.display = 'none';
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

    // "Düzenle" butonu — sadece kendi profilinde görünsün
    const editToggleBtn = document.getElementById('btn-edit-profile-toggle');
    if (editToggleBtn) {
        editToggleBtn.style.display = (!viewingOther || isAdmin) ? 'inline-flex' : 'none';
    }

    // Başkasının profilindeyken düzenleme panelini kapat
    if (viewingOther && !isAdmin) {
        const editPanel = document.getElementById('profile-edit-panel');
        const viewPanel = document.getElementById('profile-view-mode');
        if (editPanel) editPanel.style.display = 'none';
        if (viewPanel) viewPanel.style.display = '';
    }

    // Maça davet butonu — sadece başkasının profilindeyken görünsün
    const davetBtn = document.getElementById('btn-mac-davet');
    if (davetBtn) {
        davetBtn.style.display = viewingOther ? 'block' : 'none';
    }

    // Puanla tab - hide/disable if viewing own profile
    updatePuanlaTab();

    // Arkadaş değilse kısıtlı tab görünümü uygula
    applyFriendshipTabRestriction(viewingOther);
}

function applyFriendshipTabRestriction(viewingOther) {
    const restrictedTabs = ['tab-detay', 'tab-yetenekler', 'tab-puanla', 'tab-maclar'];
    const allTabBtns = document.querySelectorAll('.tab-btn[data-tab]');

    // window.viewingAsFriend === false → kesinlikle arkadaş değil
    const isNonFriend = viewingOther && window.viewingAsFriend === false;

    if (isNonFriend) {
        // Sadece Genel Bakış görünsün
        allTabBtns.forEach(btn => {
            const tabId = btn.getAttribute('data-tab');
            btn.style.display = (tabId === 'tab-genel') ? '' : 'none';
        });
        // Diğer sekme içeriklerine kilitli mesaj koy
        restrictedTabs.forEach(tabId => {
            const el = document.getElementById(tabId);
            if (el) {
                el.style.display = 'none';
                el.innerHTML = `<div class="glass-card tab-locked-msg">
                    <i class="fa-solid fa-lock"></i>
                    <h3>Bu sekme sadece arkadaşlara açık</h3>
                    <p>Arkadaş ekle ve tüm profil bilgilerine eriş.</p>
                </div>`;
            }
        });
        // Genel Bakış aktif yap
        switchProfileTab('tab-genel');
    } else {
        // Tüm tab butonlarını göster
        allTabBtns.forEach(btn => { btn.style.display = ''; });
    }
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

    if (tabId === 'tab-maclar') {
        loadMatchHistory();
    }
    if (tabId === 'tab-yetenekler') {
        const player = players.find(p => p.id === activePlayerId);
        if (player) {
            const vals = Object.values(player.ratings);
            const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
            checkSkillUnlocks(player, avg);
        }
    }
};

window.updateUI = function () {
    // Cross-script erişim için window.activePlayerId öncelikli
    const _activeId = window.activePlayerId || activePlayerId;
    const _players  = window.players || players;
    const player = _players.find(p => p.id === _activeId) || _players[0];
    if (!player) return;

    // --- Header ---
    const nameEl = document.getElementById('player-name');
    if (nameEl) nameEl.textContent = player.name;

    // Avatar — önce Supabase URL, yoksa boş (Dicebear kaldırıldı #4)
    const avatarEl = document.getElementById('profile-avatar');
    if (avatarEl) {
        const avatarUrl = player.avatar_url || player.details?.avatar_url || '';
        avatarEl.src = avatarUrl;
        // Hata durumunda boş bırak
        avatarEl.onerror = () => { avatarEl.src = ''; };
    }

    // Header: Yaş, Şehir, Takım — sadece dolu ise göster (#6)
    const ageHeaderSpan = document.getElementById('disp-age-header');
    const ageHeaderVal  = document.getElementById('disp-age-header-val');
    const cityHeaderSpan = document.getElementById('disp-city-header');
    const cityHeaderVal  = document.getElementById('disp-city-header-val');
    const teamHeaderSpan = document.getElementById('disp-team-header');
    const teamHeaderName = document.getElementById('disp-team-header-name');

    const age  = player.details?.age  || player.age;
    const city = player.details?.city || player.city;
    if (ageHeaderSpan)  ageHeaderSpan.style.display  = age  ? '' : 'none';
    if (ageHeaderVal)   ageHeaderVal.textContent  = age  || '';
    if (cityHeaderSpan) cityHeaderSpan.style.display = city ? '' : 'none';
    if (cityHeaderVal)  cityHeaderVal.textContent = city || '';

    // Takım header’a al— mevcut_team veya _sbTeamName
    const teamName = player._sbTeamName || player.current_team_name || null;
    if (teamHeaderSpan) teamHeaderSpan.style.display = teamName ? '' : 'none';
    if (teamHeaderName) teamHeaderName.textContent = teamName || '';

    // --- GEN skoru: kendi puanı yoksa community ortalamasına düş ---
    const ratingVals = Object.values(player.ratings || {}).filter(v => v !== null && v !== undefined);
    const hasRatings = ratingVals.length > 0;
    const avg = hasRatings ? Math.round(ratingVals.reduce((a, b) => a + b, 0) / ratingVals.length) : null;

    // Community fallback GEN (1-99 scale)
    const communityRaw = calcCommunityRatingsAvg(player);
    const communityGen = communityRaw
        ? Math.round(Object.values(communityRaw).reduce((a, b) => a + b, 0) / 6)
        : null;
    // Supabase'den gelen community_gen de kullanılabilir
    const sbCommunityGen = player.genScore || player.community_gen || null;
    const displayGen = avg ?? communityGen ?? sbCommunityGen;
    const isCommunityGen = !hasRatings && (communityGen !== null || sbCommunityGen !== null);

    const orEl = document.getElementById('overall-rating-disp');
    if (orEl) {
        orEl.textContent = displayGen ?? '—';
        orEl.style.color = isCommunityGen ? 'var(--neon-cyan)' : 'var(--neon-green)';
        orEl.title = isCommunityGen
            ? `Topluluk puanı (${player.communityRatings?.length || 0} kişi)`
            : 'GEN Skoru';
    }
    const genHeaderEl = document.getElementById('overall-rating-display');
    if (genHeaderEl) {
        genHeaderEl.textContent = displayGen ?? '—';
        genHeaderEl.style.color = isCommunityGen ? 'var(--neon-cyan)' : 'var(--neon-green)';
        genHeaderEl.style.textShadow = isCommunityGen
            ? '0 0 20px rgba(0,229,255,0.6)'
            : '0 0 20px rgba(173,255,47,0.6)';
    }

    // --- Community avg score ---
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

    // --- Genel Bakış kimlik alanları ---
    const mevkiGbEl = document.getElementById('disp-mevki-gb');
    if (mevkiGbEl) mevkiGbEl.textContent = player.details.anaMevki || player.details.pos || '—';
    const ayakGbEl = document.getElementById('disp-ayak-gb');
    if (ayakGbEl) ayakGbEl.textContent = player.details.ayak || '—';
    const ageGbEl = document.getElementById('disp-age-gb');
    if (ageGbEl) ageGbEl.textContent = age ? `${age}` : '—';
    const cityGbEl = document.getElementById('disp-city-gb');
    if (cityGbEl) cityGbEl.textContent = city || '—';
    // Boy/Kilo
    const hEl = document.getElementById('disp-height-gb');
    if (hEl) hEl.textContent = `${player.details.height} cm`;
    const wEl = document.getElementById('disp-weight-gb');
    if (wEl) wEl.textContent = `${player.details.weight} kg`;
    // Boy/Kilo birleşimi (#2)
    const hwEl = document.getElementById('disp-height-weight-gb');
    if (hwEl) {
        const h = player.details?.height;
        const w = player.details?.weight;
        hwEl.textContent = (h || w) ? `${h || '?'} cm / ${w || '?'} kg` : '—';
    }
    // Takım (#2)
    const teamGbEl = document.getElementById('disp-team-gb');
    if (teamGbEl) teamGbEl.textContent = teamName || '—';

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
    // Form (#11)
    setVal('sel-form', player.details.formStatus || 'Orta');
    // Kişisel istatistikler — yeni ID'ler (#12)
    const pStats = player.stats || {};
    setVal('inp-total-matches-detail', pStats.totalMatches ?? '');
    setVal('inp-total-goals-detail',   pStats.totalGoals   ?? '');
    setVal('inp-total-assists-detail', pStats.totalAssists  ?? '');

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

    // --- Skills & Badge Strip ---
    try {
        checkSkillUnlocks(player, avg || 0);
        // checkSkillUnlocks içinde renderBadgeStrip de çağrılıyor (SYNC-14)
    } catch (e) { console.error('Skill Unlock Check Failed:', e); }

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

    const r = player.ratings || {};
    const rawValues = [r.teknik, r.sut, r.pas, r.hiz, r.fizik, r.kondisyon];
    const hasOwnRatings = rawValues.some(v => v !== null && v !== undefined);
    // null → 0 for chart rendering (shows empty hex)
    const dataValues = rawValues.map(v => (v !== null && v !== undefined) ? v : 0);

    // Community avg overlay
    const communityR = calcCommunityRatingsAvg(player);
    const communityValues = communityR ? [
        communityR.teknik, communityR.sut, communityR.pas,
        communityR.hiz, communityR.fizik, communityR.kondisyon
    ] : null;

    // Boş overlay mesajını göster/gizle
    const canvasParent = ctx.parentElement;
    let emptyOverlay = canvasParent?.querySelector('.chart-empty-overlay');
    const showEmpty = !hasOwnRatings && !communityValues;
    if (showEmpty) {
        if (!emptyOverlay) {
            emptyOverlay = document.createElement('div');
            emptyOverlay.className = 'chart-empty-overlay';
            emptyOverlay.style.cssText = `
                position:absolute; inset:0; display:flex; flex-direction:column;
                align-items:center; justify-content:center; pointer-events:none;
                z-index:2;
            `;
            emptyOverlay.innerHTML = `
                <i class="fa-solid fa-chart-simple" style="font-size:2rem; color:#333; margin-bottom:0.5rem;"></i>
                <span style="font-size:0.82rem; color:#444; text-align:center; line-height:1.4;">
                    Henüz puan<br>girilmedi
                </span>
            `;
            canvasParent.style.position = 'relative';
            canvasParent.appendChild(emptyOverlay);
        }
        emptyOverlay.style.display = 'flex';
    } else if (emptyOverlay) {
        emptyOverlay.style.display = 'none';
    }

    const datasets = [];

    if (hasOwnRatings) {
        datasets.push({
            label: 'Kendi Puanı',
            data: dataValues,
            backgroundColor: 'rgba(173, 255, 47, 0.15)',
            borderColor: '#adff2f',
            borderWidth: 2,
            pointBackgroundColor: '#adff2f',
            pointRadius: 3
        });
    }

    if (communityValues) {
        datasets.push({
            label: 'Topluluk Puanı',
            data: communityValues,
            backgroundColor: hasOwnRatings ? 'rgba(0, 229, 255, 0.1)' : 'rgba(0, 229, 255, 0.18)',
            borderColor: '#00e5ff',
            borderWidth: 2,
            borderDash: hasOwnRatings ? [5, 5] : [],
            pointBackgroundColor: '#00e5ff',
            pointRadius: 4
        });
    }

    const showLegend = datasets.length > 1;

    if (window.profileChartInstance) {
        window.profileChartInstance.data.datasets = datasets;
        window.profileChartInstance.options.plugins.legend.display = showLegend;
        window.profileChartInstance.update();
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
                        angleLines: { color: 'rgba(255, 255, 255, 0.15)' },
                        grid:       { color: 'rgba(255, 255, 255, 0.1)'  },
                        pointLabels:{ color: '#888', font: { size: 12 } },
                        suggestedMin: 0,
                        suggestedMax: 100,
                        ticks: { display: false, beginAtZero: true }
                    }
                },
                plugins: {
                    legend: {
                        display: showLegend,
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

                <div style="margin-top:1rem;">
                    <label style="font-size:0.75rem; font-weight:700; color:#555; text-transform:uppercase; letter-spacing:0.8px; display:block; margin-bottom:0.4rem;">
                        <i class="fa-solid fa-comment" style="color:var(--neon-cyan);"></i> Yorum (opsiyonel, max 120 karakter)
                    </label>
                    <input type="text" id="cr-comment-input" class="profile-input"
                        maxlength="120" placeholder="Sahadaki en iyi 10 numara..."
                        value="${existing ? (existing.comment || '') : ''}"
                        style="width:100%; padding:0.6rem 0.8rem; border-radius:8px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#ddd; font-size:0.88rem;">
                </div>

                <button id="btn-submit-community" class="btn-primary cr-submit-btn"
                    onclick="submitCommunityRating()"
                    style="width:100%; margin-top:1.25rem; background:var(--neon-cyan); color:black; font-weight:800; padding:1rem; border:none; border-radius:8px; cursor:pointer; font-size:1rem;">
                    <i class="fa-solid fa-paper-plane"></i>
                    ${existing ? 'PUANI GÜNCELLE' : 'PUANI GÖNDER'}
                </button>
                <div style="margin-top:0.5rem; text-align:center; font-size:0.82rem; color:#555;">
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
            <div style="padding:0.8rem; border-radius:10px;
                background:${isMe ? 'rgba(0,229,255,0.05)' : 'rgba(255,255,255,0.02)'};
                border:1px solid ${isMe ? 'rgba(0,229,255,0.2)' : '#2a2a2a'};
                margin-bottom:0.6rem;">
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${fromName}"
                         style="width:30px;height:30px;border-radius:50%;">
                    <span style="font-weight:600; color:${isMe ? 'var(--neon-cyan)' : '#ddd'}">
                        ${fromName}${isMe ? ' <span style="color:#555;font-size:0.75rem;">(Sen)</span>' : ''}
                    </span>
                    <span style="margin-left:auto; font-weight:800; color:var(--neon-green); font-size:1rem;">${avg} GEN</span>
                </div>
                ${r.comment ? `<div style="margin-top:0.5rem; font-size:0.82rem; color:#888; font-style:italic; padding-left:0.4rem; border-left:2px solid #333;">
                    "${r.comment}"
                </div>` : ''}
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

    // Read comment
    const commentEl = document.getElementById('cr-comment-input');
    newRating.comment = commentEl ? commentEl.value.trim().slice(0, 120) : '';

    // Update or insert
    const existingIdx = targetPlayer.communityRatings.findIndex(r => r.fromAccountId === activeAccountId);
    if (existingIdx >= 0) {
        targetPlayer.communityRatings[existingIdx] = newRating;
    } else {
        targetPlayer.communityRatings.push(newRating);
    }

    savePlayers();

    // Feed event & notification
    const keys2 = ['teknik', 'sut', 'pas', 'hiz', 'fizik', 'kondisyon'];
    const avg2 = Math.round(keys2.reduce((s, k) => s + (newRating[k] || 0), 0) / keys2.length);
    if (typeof window.addFeedEvent === 'function') {
        window.addFeedEvent('rating', {
            targetId: activePlayerId,
            targetName: targetPlayer.name,
            avgScore: avg2,
            comment: newRating.comment || null
        });
    }
    const targetAcc = accounts.find(a => a.playerId === activePlayerId);
    if (targetAcc && typeof window.addNotification === 'function') {
        window.addNotification({
            type: 'rating',
            message: `${acc.name} sana ${avg2} GEN puan verdi${newRating.comment ? ` — "${newRating.comment}"` : ''}`,
            targetAccountId: targetAcc.id
        });
    }

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
// 9. BAŞARIM (ACHIEVEMENT) SİSTEMİ
// ======================================================

/**
 * Başarım tanımları.
 * check(player, avg) → true ise açılmış demektir.
 */
const ACHIEVEMENT_DEFS = [
    // ── KATILIM & SADAKAT ──────────────────────────────
    {
        id: 'ach-demirperde',
        title: 'Demirbaş',
        emoji: '🛡️',
        icon: 'fa-shield-halved',
        category: 'Katılım',
        tier: 'bronz',
        color: '#cd7f32',
        desc: 'Toplam 10 maça katıldın.',
        criteria: 'Toplamda en az 10 maça katıl.',
        check: (p) => (p.stats?.totalMatches || 0) >= 10
    },
    {
        id: 'ach-veteran',
        title: 'Veteran',
        emoji: '🎖️',
        icon: 'fa-medal',
        category: 'Katılım',
        tier: 'gumus',
        color: '#aaa',
        desc: 'Toplam 50 maça katıldın.',
        criteria: 'Toplamda en az 50 maça katıl.',
        check: (p) => (p.stats?.totalMatches || 0) >= 50
    },
    {
        id: 'ach-efsane',
        title: 'Efsane Kaptan',
        emoji: '👑',
        icon: 'fa-crown',
        category: 'Katılım',
        tier: 'altin',
        color: 'gold',
        desc: 'Toplam 100 maça katıldın.',
        criteria: 'Toplamda en az 100 maça katıl.',
        check: (p) => (p.stats?.totalMatches || 0) >= 100
    },
    {
        id: 'ach-beton',
        title: 'Beton Gibi',
        emoji: '🪨',
        icon: 'fa-person-military-pointing',
        category: 'Katılım',
        tier: 'gumus',
        color: '#aaa',
        desc: 'Son 10 maçın hepsine sakatlık bildirmeden katıldın.',
        criteria: 'Sakatlık riski "Beton Gibi" ve en az 10 maça katıl.',
        check: (p) => {
            const s = p.details?.sakatlik;
            const m = p.stats?.totalMatches || 0;
            return s === 'Beton Gibi' && m >= 10;
        }
    },
    // ── KARAKTER & LOJİSTİK ────────────────────────────
    {
        id: 'ach-saat',
        title: 'Saat Gibi',
        emoji: '⚡',
        icon: 'fa-clock',
        category: 'Karakter',
        tier: 'gumus',
        color: 'var(--neon-cyan)',
        desc: 'Her maçtan 15 dk önce sahada bekliyorsun.',
        criteria: 'Dakiklik özelliğini "15 dk Önce Sahada" olarak ayarla.',
        check: (p) => p.details?.dakiklik === '15 dk Önce Sahada'
    },
    {
        id: 'ach-vefall',
        title: 'Vefalı Yolcu',
        emoji: '🧳',
        icon: 'fa-person-walking-luggage',
        category: 'Karakter',
        tier: 'bronz',
        color: '#cd7f32',
        desc: 'Arabası olmasa da her maça gelirsin.',
        criteria: 'Lojistik "Yolcu" olsun ve toplamda 5+ maça katıl.',
        check: (p) => p.details?.lojistik === 'Yolcu' && (p.stats?.totalMatches || 0) >= 5
    },
    {
        id: 'ach-cay',
        title: 'Çay Filozofu',
        emoji: '☕',
        icon: 'fa-mug-hot',
        category: 'Karakter',
        tier: 'bronz',
        color: '#cd7f32',
        desc: 'Maç sonu sohbeti asla bırakmıyorsun.',
        criteria: 'Maç sonu özelliğini "Çay & Muhabbet\'te" olarak ayarla.',
        check: (p) => p.details?.macSonu === "Çay & Muhabbet'te"
    },
    {
        id: 'ach-ekol',
        title: 'Eski Tüfek',
        emoji: '🎩',
        icon: 'fa-user-graduate',
        category: 'Karakter',
        tier: 'bronz',
        color: '#cd7f32',
        desc: 'Lisanslı futbol geçmişiyle gelen ekol sahibi oyuncu.',
        criteria: 'Ekol "Eski Lisanslı" olsun.',
        check: (p) => p.details?.ekol === 'Eski Lisanslı'
    },
    // ── GOL & ŞÜT ──────────────────────────────────────
    {
        id: 'ach-golcu',
        title: 'Golcü',
        emoji: '⚽',
        icon: 'fa-futbol',
        category: 'Goller',
        tier: 'bronz',
        color: '#cd7f32',
        desc: 'Toplamda 10 gol attın.',
        criteria: 'Toplamda en az 10 gol at.',
        check: (p) => (p.stats?.totalGoals || 0) >= 10
    },
    {
        id: 'ach-goatify',
        title: 'Makineli Tüfek',
        emoji: '🔫',
        icon: 'fa-crosshairs',
        category: 'Goller',
        tier: 'altin',
        color: 'gold',
        desc: 'Toplam 50 gol barajını aştın.',
        criteria: 'Toplamda en az 50 gol at.',
        check: (p) => (p.stats?.totalGoals || 0) >= 50
    },
    {
        id: 'ach-sniper',
        title: 'Füze Atıcı',
        emoji: '🚀',
        icon: 'fa-rocket',
        category: 'Goller',
        tier: 'altin',
        color: 'gold',
        desc: 'Şut puanı 90+ keskin nişancı — ceza sahası dışından vuruyor.',
        criteria: 'Şut puanın 90\'ın üzerinde olsun ve oyun tarzın Goalgetter olsun.',
        check: (p) => (p.ratings?.sut || 0) >= 90 && p.details?.oyunTarzi === 'Goalgetter'
    },
    {
        id: 'ach-asist',
        title: 'Asist Makinası',
        emoji: '🎯',
        icon: 'fa-arrows-to-dot',
        category: 'Goller',
        tier: 'gumus',
        color: '#aaa',
        desc: 'Toplamda 20 asist yapan son pas ustası.',
        criteria: 'Toplamda en az 20 asist yap.',
        check: (p) => (p.stats?.totalAssists || 0) >= 20
    },
    // ── TEKNİK ─────────────────────────────────────────
    {
        id: 'ach-xavi',
        title: "Xavi'nin İzinde",
        emoji: '🧠',
        icon: 'fa-wand-magic-sparkles',
        category: 'Teknik',
        tier: 'altin',
        color: 'var(--neon-green)',
        desc: 'Pas radar grafiğindeki puan 85+.',
        criteria: 'Pas puanını 85\'in üzerine çıkar.',
        check: (p) => (p.ratings?.pas || 0) >= 85
    },
    {
        id: 'ach-teknik',
        title: 'Maestro',
        emoji: '🎨',
        icon: 'fa-palette',
        category: 'Teknik',
        tier: 'gumus',
        color: '#aaa',
        desc: 'Teknik puanın 85 üzerinde.',
        criteria: 'Teknik puanını 85\'in üzerine çıkar.',
        check: (p) => (p.ratings?.teknik || 0) >= 85
    },
    {
        id: 'ach-fisek',
        title: 'Fişek',
        emoji: '💨',
        icon: 'fa-bolt',
        category: 'Teknik',
        tier: 'gumus',
        color: 'var(--neon-cyan)',
        desc: 'Hız puanın 90 üzerinde.',
        criteria: 'Hız puanını 90\'ın üzerine çıkar.',
        check: (p) => (p.ratings?.hiz || 0) >= 90
    },
    {
        id: 'ach-kondikral',
        title: 'Enerji Kaynağı',
        emoji: '🔋',
        icon: 'fa-battery-full',
        category: 'Teknik',
        tier: 'bronz',
        color: '#cd7f32',
        desc: 'Kondisyon puanın 85 üzerinde.',
        criteria: 'Kondisyon puanını 85\'in üzerine çıkar.',
        check: (p) => (p.ratings?.kondisyon || 0) >= 85
    },
    // ── SAVUNMA ────────────────────────────────────────
    {
        id: 'ach-hava',
        title: 'Hava Savunma Sanayii',
        emoji: '🛩️',
        icon: 'fa-shield',
        category: 'Savunma',
        tier: 'altin',
        color: 'var(--neon-pink)',
        desc: 'Defans mevkisinde oynayan üst düzey duvar.',
        criteria: 'Mevki DEF/Stoper/Bek olsun ve Fizik puanın 85+ olsun.',
        check: (p) => {
            const pos = p.details?.pos || '';
            const mevki = p.details?.anaMevki || '';
            const isDefans = pos === 'DEF' || mevki.includes('Stoper') || mevki.includes('Bek') || mevki.includes('Libero');
            return isDefans && (p.ratings?.fizik || 0) >= 85;
        }
    },
    {
        id: 'ach-golge',
        title: 'Gölge',
        emoji: '👻',
        icon: 'fa-user-ninja',
        category: 'Savunma',
        tier: 'gumus',
        color: '#aaa',
        desc: 'Rakiplerini gölge gibi markaj altına alıyorsun.',
        criteria: 'Markaj özelliğini "Gölge Gibi Yapışır" olarak ayarla.',
        check: (p) => p.details?.markaj === 'Gölge Gibi Yapışır'
    },
    {
        id: 'ach-disiplin',
        title: 'Disiplinli',
        emoji: '📌',
        icon: 'fa-map-pin',
        category: 'Savunma',
        tier: 'bronz',
        color: '#cd7f32',
        desc: 'Mevki sadakatiyle oyunun kuralını koruyan oyuncu.',
        criteria: 'Mevki sadakati "Görevine Bağlı" olsun.',
        check: (p) => p.details?.mevkiSadakat === 'Görevine Bağlı'
    },
    // ── GENEL ─────────────────────────────────────────
    {
        id: 'ach-gen85',
        title: 'Elit Oyuncu',
        emoji: '⭐',
        icon: 'fa-star',
        category: 'Genel',
        tier: 'altin',
        color: 'gold',
        desc: 'GEN puanın 85 ve üzeri.',
        criteria: 'Genel puanını (GEN) 85\'in üzerine çıkar.',
        check: (p, avg) => avg >= 85
    },
    {
        id: 'ach-komunite',
        title: 'Popüler',
        emoji: '🌟',
        icon: 'fa-users-rays',
        category: 'Genel',
        tier: 'gumus',
        color: '#a78bfa',
        desc: 'En az 3 takım arkadaşından community puanı aldın.',
        criteria: 'En az 3 farklı kişiden community puanı al.',
        check: (p) => (p.communityRatings?.length || 0) >= 3
    }
];

/**
 * Player istatistikleri — artık player.stats'tan okunuyor (mock kaldırıldı)
 * Kullanıcılar kendi istatistiklerini Detaylı Veriler sekmesinden girebilir.
 */
function getPlayerStats(player) {
    // Kullanıcının girdiği gerçek veriler (saveProfileDetails ile kaydedildi)
    if (player.stats && (player.stats.totalMatches || player.stats.totalGoals || player.stats.totalAssists)) {
        return {
            totalMatches: player.stats.totalMatches || 0,
            totalGoals:   player.stats.totalGoals   || 0,
            totalAssists: player.stats.totalAssists  || 0,
        };
    }
    // Supabase'den yüklendiyse (faz2-social.js tempPlayer)
    if (player.supabase_matches !== undefined) {
        return {
            totalMatches: player.supabase_matches || 0,
            totalGoals:   player.supabase_goals   || 0,
            totalAssists: player.supabase_assists  || 0,
        };
    }
    // Henüz veri girilmemiş
    return { totalMatches: 0, totalGoals: 0, totalAssists: 0 };
}

/**
 * Başarımları değerlendirip render eder
 */
function checkSkillUnlocks(player, avg) {
    player.stats = getPlayerStats(player);
    renderAchievements(player, avg);
    renderBadgeStrip(player, avg); // SYNC-14: Genel Bakış rozet şeridini güncelle
}

/**
 * UI-07 + SYNC-14: Kazanılan rozetleri Genel Bakış'taki #badge-strip'e yansıt
 */
function renderBadgeStrip(player, avg) {
    const strip = document.getElementById('badge-strip');
    if (!strip) return;

    const unlocked = ACHIEVEMENT_DEFS.filter(def => {
        try { return def.check(player, avg); } catch(e) { return false; }
    });

    if (unlocked.length === 0) {
        strip.innerHTML = '<span style="color:#444; font-size:0.82rem;">— henüz rozet yok —</span>';
        return;
    }

    const tierColors = { bronz: '#cd7f32', gumus: '#aaa', altin: 'gold' };
    strip.innerHTML = unlocked.map(ach => `
        <span title="${ach.title}: ${ach.desc}"
              style="display:inline-flex; align-items:center; gap:4px;
                     padding:4px 10px; border-radius:20px;
                     border:1px solid ${ach.color || tierColors[ach.tier] || '#555'};
                     color:${ach.color || tierColors[ach.tier] || '#aaa'};
                     font-size:0.78rem; font-weight:700;
                     background:${ach.color ? ach.color + '15' : 'rgba(255,255,255,0.04)'};
                     cursor:default; white-space:nowrap;">
            <i class="fa-solid ${ach.icon}" style="font-size:0.7rem;"></i>
            ${ach.emoji} ${ach.title}
        </span>
    `).join('');
}

function renderAchievements(player, avg) {
    const container = document.getElementById('achievements-container');
    if (!container) return;

    const stats = player.stats;
    const results = ACHIEVEMENT_DEFS.map(def => ({
        ...def,
        unlocked: def.check(player, avg)
    }));

    const unlockedCount = results.filter(r => r.unlocked).length;
    const totalCount = results.length;
    const categories = [...new Set(ACHIEVEMENT_DEFS.map(d => d.category))];
    const circumference = 150.8;
    const progress = Math.round((unlockedCount / totalCount) * circumference);

    container.innerHTML = `
        <!-- BAŞARIM BANNER -->
        <div class="ach-banner glass-card">
            <div class="ach-banner-left">
                <div class="ach-banner-icon"><i class="fa-solid fa-trophy"></i></div>
                <div>
                    <h2 class="ach-banner-title">BAŞARIMLAR</h2>
                    <p class="ach-banner-sub">${player.name} için kişisel başarım koleksiyonu</p>
                </div>
            </div>
            <div class="ach-banner-right">
                <div class="ach-progress-ring">
                    <svg viewBox="0 0 60 60">
                        <circle cx="30" cy="30" r="24" fill="none" stroke="#333" stroke-width="5"/>
                        <circle cx="30" cy="30" r="24" fill="none"
                            stroke="var(--neon-green)" stroke-width="5"
                            stroke-dasharray="${progress} ${circumference}"
                            stroke-dashoffset="37.7"
                            stroke-linecap="round"
                            style="transition: stroke-dasharray 1s ease;"/>
                    </svg>
                    <div class="ach-ring-text">
                        <span class="ach-ring-num">${unlockedCount}</span>
                        <span class="ach-ring-total">/ ${totalCount}</span>
                    </div>
                </div>
                <div class="ach-stat-pills">
                    <div class="ach-pill" style="border-color:#cd7f32; color:#cd7f32;">
                        🥉 ${results.filter(r => r.unlocked && r.tier === 'bronz').length}
                    </div>
                    <div class="ach-pill" style="border-color:#aaa; color:#aaa;">
                        🥈 ${results.filter(r => r.unlocked && r.tier === 'gumus').length}
                    </div>
                    <div class="ach-pill" style="border-color:gold; color:gold;">
                        🥇 ${results.filter(r => r.unlocked && r.tier === 'altin').length}
                    </div>
                </div>
            </div>
        </div>

        <!-- KATEGORİ BAZLI BAŞARIMLAR -->
        ${categories.map(cat => {
            const catResults = results.filter(r => r.category === cat);
            const catUnlocked = catResults.filter(r => r.unlocked).length;
            const catIcons = {
                Katılım: 'fa-calendar', Goller: 'fa-futbol',
                Teknik: 'fa-bolt', Savunma: 'fa-shield',
                Karakter: 'fa-masks-theater', Genel: 'fa-star'
            };
            const catColors = {
                Katılım: 'var(--neon-green)', Goller: 'var(--neon-cyan)',
                Teknik: 'gold', Savunma: 'var(--neon-pink)',
                Karakter: '#f97316', Genel: '#a78bfa'
            };
            return `
                <div class="ach-category-section">
                    <div class="ach-category-header">
                        <i class="fa-solid ${catIcons[cat]}" style="color:${catColors[cat]};"></i>
                        <h3 class="ach-category-title" style="color:${catColors[cat]}">${cat}</h3>
                        <span class="ach-category-count">${catUnlocked} / ${catResults.length}</span>
                    </div>
                    <div class="ach-cards-grid">
                        ${catResults.map(r => renderAchievementCard(r)).join('')}
                    </div>
                </div>
            `;
        }).join('')}
    `;
}

function renderAchievementCard(ach) {
    const tierEmoji = { bronz: '🥉', gumus: '🥈', altin: '🥇' }[ach.tier] || '';
    const unlockClass = ach.unlocked ? 'ach-unlocked' : 'ach-locked';
    const tierClass = `ach-tier-${ach.tier}`;

    return `
        <div class="ach-card ${unlockClass} ${tierClass}" title="${ach.criteria}">
            ${ach.unlocked ? `<div class="ach-card-glow" style="background:radial-gradient(circle, ${ach.color}33 0%, transparent 70%);"></div>` : ''}
            <div class="ach-card-top">
                <div class="ach-card-icon" style="${ach.unlocked ? `color:${ach.color};` : 'color:#444;'}">
                    <i class="fa-solid ${ach.icon}"></i>
                </div>
                <span class="ach-card-emoji">${ach.emoji}</span>
                ${ach.unlocked
                    ? `<div class="ach-status-badge ach-status-unlock"><i class="fa-solid fa-check"></i></div>`
                    : `<div class="ach-status-badge ach-status-lock"><i class="fa-solid fa-lock"></i></div>`}
            </div>
            <div class="ach-card-body">
                <h4 class="ach-card-title" style="${ach.unlocked ? `color:${ach.color}` : 'color:#555'}">${ach.title}</h4>
                <p class="ach-card-desc">${ach.desc}</p>
                ${!ach.unlocked ? `<div class="ach-card-hint"><i class="fa-solid fa-circle-info"></i> ${ach.criteria}</div>` : ''}
            </div>
            ${ach.unlocked ? `<div class="ach-tier-stamp">${tierEmoji}</div>` : ''}
        </div>
    `;
}

/**
 * Başarım toast bildirimi
 */
function showAchievementUnlockToast(ach) {
    const toast = document.createElement('div');
    toast.className = 'ach-toast';
    toast.innerHTML = `
        <div class="ach-toast-icon" style="color:${ach.color}"><i class="fa-solid ${ach.icon}"></i></div>
        <div>
            <div class="ach-toast-title">🎉 Başarım Açıldı!</div>
            <div class="ach-toast-name">${ach.emoji} ${ach.title}</div>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
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

    if (!player.stats) player.stats = {};
    const tMatches = getVal('inp-total-matches-detail');
    const tGoals   = getVal('inp-total-goals-detail');
    const tAssists = getVal('inp-total-assists-detail');
    if (tMatches !== null) player.stats.totalMatches = parseInt(tMatches) || 0;
    if (tGoals !== null)   player.stats.totalGoals   = parseInt(tGoals)   || 0;
    if (tAssists !== null) player.stats.totalAssists = parseInt(tAssists) || 0;

    // Form status (#11)
    const formVal = getVal('sel-form');
    if (formVal) player.details.formStatus = formVal;

    savePlayers();

    // Supabase entegrasyonu: otomatik kaydet
    const user = window.__AUTH_USER__;
    if (user && window.DB && user.id === (player.supabase_id || user.id)) {
        window.DB.Profiles.update(user.id, {
            age: player.details.age,
            height: player.details.height,
            weight: player.details.weight,
            ekol: player.details.ekol,
            sakatlik: player.details.sakatlik,
            ana_mevki: player.details.anaMevki,
            alt_pos: player.details.altPos,
            oyun_tarzi: player.details.oyunTarzi,
            form_status: player.details.formStatus,
            total_matches: player.stats.totalMatches,
            total_goals: player.stats.totalGoals,
            total_assists: player.stats.totalAssists
        }).catch(err => console.error("Detaylar DB'ye kaydedilemedi:", err));
    }

    // Header güncellemesi updateUI'a bırakıldı
    updateUI();
};

// Segmented control trait setter
window.setSegTrait = function(field, val, btnEl) {
    const player = players.find(p => p.id === activePlayerId);
    if (!player) return;
    if (!canEditPlayer(activePlayerId)) return;

    // Eğer val eksikse veya undefined ise, data-val attribute'ından oku
    const finalVal = (val !== undefined && val !== null && val !== '') ? val : (btnEl ? btnEl.dataset.val : '');
    if (!finalVal) return;

    player.details[field] = finalVal;
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


// ======================================================
// 12. AVATAR UPLOAD — Supabase Storage (#3)
// ======================================================

/**
 * Avatar dosyas\u0131 se\u00e7ilince \u00e7al\u0131\u015f\u0131r
 * Storage'a y\u00fckleme yap\u0131p hem local player'a hem Supabase'e kaydeder
 */
window.handleAvatarUpload = async function(input) {
    'use strict';
    const file = input.files && input.files[0];
    if (!file) return;

    const user = window.__AUTH_USER__;
    if (!user) {
        showToast('\u26a0\ufe0f Oturum bulunamad\u0131. L\u00fctfen giri\u015f yap\u0131n.');
        return;
    }

    // \u00d6nizleme: hemen g\u00f6ster
    const avatarEl = document.getElementById('profile-avatar');
    const reader = new FileReader();
    reader.onload = (e) => {
        if (avatarEl) avatarEl.src = e.target.result;
    };
    reader.readAsDataURL(file);

    showToast('\u23f3 Avatar y\u00fckleniyor...');

    try {
        if (!window.DB || !window.DB.Storage) throw new Error('Storage servisi haz\u0131r de\u011fil');

        const publicUrl = await window.DB.Storage.uploadAvatar(user.id, file);
        await window.DB.Storage.saveAvatarUrl(user.id, publicUrl);

        // Yerel player objesine kaydet
        const player = players.find(p => p.id === activePlayerId);
        if (player) {
            player.avatar_url = publicUrl;
            savePlayers();
        }

        // Avatar element'i kesin URL ile g\u00fcncelle
        if (avatarEl) avatarEl.src = publicUrl;

        showToast('\u2705 Avatar ba\u015far\u0131yla g\u00fcncellendi!');
    } catch(e) {
        console.error('Avatar upload error:', e);
        showToast('\u274c Avatar y\u00fcklenemedi: ' + (e.message || 'Hata'));
        // Hata olursa bo\u015f b\u0131rak
        if (avatarEl) avatarEl.src = '';
    }

    // Input'u s\u0131f\u0131rla — ayn\u0131 dosyay\u0131 tekrar se\u00e7ilince de tetiklensin
    input.value = '';
};


// ======================================================
// 13. MA\u00c7 GE\u00c7M\u0130\u015e\u0130 — Supabase'den \u00c7ek (#15)
// ======================================================

/**
 * Aktif oyuncunun ma\u00e7 ge\u00e7mi\u015fini Supabase'den \u00e7eker ve tabloya render eder
 */
async function loadMatchHistory() {
    'use strict';
    const tbody = document.getElementById('match-history-body');
    const loadingEl = document.getElementById('match-history-loading');
    if (!tbody) return;

    const user = window.__AUTH_USER__;
    if (!user || !window.DB) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#555; padding:2rem;">Oturum a\u00e7\u0131k de\u011fil</td></tr>';
        return;
    }

    // Y\u00fckleniyor g\u00f6ster
    if (loadingEl) loadingEl.style.display = 'block';
    tbody.innerHTML = '';

    try {
        const history = await window.DB.Matches.getPlayerHistory(user.id);

        if (!history || history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#555; padding:2rem;">\ud83c\udfc4 Hen\u00fcz kay\u0131tl\u0131 ma\u00e7 yok</td></tr>';
            return;
        }

        tbody.innerHTML = history.map(mp => {
            const m = mp.match;
            if (!m) return '';
            const date = m.scheduled_at
                ? new Date(m.scheduled_at).toLocaleDateString('tr-TR', { day:'2-digit', month:'short', year:'2-digit' })
                : '\u2014';

            // Hangi tak\u0131mda oynad\u0131?
            const teamName = mp.team_side === 'home'
                ? (m.home_team?.name || 'Ev Sahibi')
                : (m.away_team?.name || 'Deplasman');

            // Skor
            const score = (m.home_score !== null && m.away_score !== null)
                ? `${m.home_score} - ${m.away_score}` : '\u2014';

            const pos = mp.position_played || '\u2014';
            const goals   = mp.goals || 0;
            const assists = mp.assists || 0;
            const rating  = mp.performance_rating != null
                ? `<span class="rating-badge">${parseFloat(mp.performance_rating).toFixed(1)}</span>`
                : '\u2014';

            const posColor = { 'KL':'var(--neon-pink)', 'DEF':'var(--neon-cyan)', 'OS':'gold', 'FV':'var(--neon-green)' }[pos] || '#888';

            return `<tr>
                <td style="color:#888; font-size:0.85rem;">${date}</td>
                <td>${score}</td>
                <td style="color:var(--neon-cyan);">${teamName}</td>
                <td><span class="pos-badge" style="color:${posColor};">${pos}</span></td>
                <td style="color:var(--neon-green); font-weight:700;">${goals}</td>
                <td style="color:#aaa;">${assists}</td>
                <td>${rating}</td>
            </tr>`;
        }).join('');

    } catch(e) {
        console.error('Match history error:', e);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#555; padding:2rem;">\u274c Y\u00fcklenemedi</td></tr>';
    } finally {
        if (loadingEl) loadingEl.style.display = 'none';
    }
}


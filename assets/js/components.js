// =====================================================
// components.js — MPA Ortak Bileşenler
// Her sayfada sidebar ve bildirim panelini inject eder,
// MPA navigasyonunu kurar, aktif linki vurgular.
// =====================================================
(function () {

    // ── URL Haritası: relative, tüm ortamlarda çalışır ──────────
    // file://, localhost, GitHub Pages (/Sosyal-Sporcu/) fark etmeksizin
    // çalışır çünkü mutlak yol yerine görece yol kullanır.
    function _computeNavMap() {
        var path = location.pathname;
        // Alt dizinde mi? (/character/, /team/, /team-profile/, /feed/, /explore/, /matches/)
        var inSub = /\/(character|team|team-profile|feed|explore|matches)(\/|$)/i.test(path);
        var prefix = inSub ? '../' : '';
        return {
            dashboard:   prefix,  // kök dizin = index.html ('' ise falsy → MPA nav pas geçer)
            profile:     prefix + 'character/',
            takimim:     prefix + 'team/',
            matches:     prefix + 'matches/',
            feed:        prefix + 'feed/',
            explore:     prefix + 'explore/',
            teamProfile: prefix + 'team-profile/'
        };
    }
    var NAV_MAP = _computeNavMap();

    // ── Sidebar HTML ──────────────────────────────────
    function buildSidebarHTML() {
        return '<nav class="sidebar" id="sidebar">' +
            '<div class="logo">' +
                '<div class="logo-ball"><i class="fa-solid fa-futbol"></i></div>' +
                '<span>SOSYAL SPORCU</span>' +
            '</div>' +
            '<ul class="nav-menu">' +
                '<li class="nav-item" data-target="dashboard" id="nav-dashboard">' +
                    '<i class="fa-solid fa-house"></i>' +
                    '<span>Ana Sayfa</span>' +
                '</li>' +
                '<li class="nav-item" data-target="profile" id="nav-profile">' +
                    '<i class="fa-solid fa-id-card"></i>' +
                    '<span>Karakterim</span>' +
                    '<span class="nav-badge" id="profile-notif-badge" style="display:none; background:var(--neon-red); color:#fff;"></span>' +
                '</li>' +
                '<li class="nav-item" data-target="takimim">' +
                    '<i class="fa-solid fa-users-gear"></i>' +
                    '<span>Takımım</span>' +
                '</li>' +
                '<li class="nav-item" data-target="matches">' +
                    '<i class="fa-solid fa-clipboard-list"></i>' +
                    '<span>Maç Merkezi</span>' +
                '</li>' +
                '<li class="nav-item" data-target="feed" id="nav-feed">' +
                    '<i class="fa-solid fa-rss"></i>' +
                    '<span>Akış</span>' +
                    '<span class="nav-badge" id="feed-badge" style="display:none;"></span>' +
                '</li>' +
                '<li class="nav-item" data-target="explore">' +
                    '<i class="fa-solid fa-compass"></i>' +
                    '<span>Keşfet</span>' +
                '</li>' +
            '</ul>' +
            '<button class="theme-toggle-btn" id="theme-toggle-btn" onclick="toggleTheme()">' +
                '<i class="fa-solid fa-moon theme-icon" id="theme-icon"></i>' +
                '<span id="theme-label">Karanlık Mod</span>' +
            '</button>' +
            '<div class="account-switcher">' +
                '<div class="account-current" onclick="toggleAccountPanel()" id="account-current-btn">' +
                    '<img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" class="acc-avatar" id="current-account-avatar" alt="Hesap avatarı">' +
                    '<div class="acc-info">' +
                        '<span class="acc-name" id="current-account-name">Yükleniyor...</span>' +
                        '<span class="acc-role" id="current-account-role">—</span>' +
                    '</div>' +
                    '<i class="fa-solid fa-chevron-up acc-chevron" id="acc-chevron-icon"></i>' +
                '</div>' +
                '<div class="account-panel" id="account-panel">' +
                    '<div class="account-panel-header">' +
                        '<i class="fa-solid fa-users"></i> Hesap Geçişi' +
                        '<span style="font-size:.75rem;color:#666;margin-left:auto;">Oturumu değiştir</span>' +
                    '</div>' +
                    '<div class="account-list" id="account-list-container"></div>' +
                '</div>' +
            '</div>' +
        '</nav>';
    }

    // ── Aktif nav item'i vurgula ──────────────────────
    // Regex tabanlı: relative/absolute URL fark etmez,
    // GitHub Pages base path (/Sosyal-Sporcu/) ile de çalışır.
    function highlightActive() {
        var path = location.pathname;
        var pagePatterns = {
            profile:  /\/character(\/|$)/,
            takimim:  /\/team(\/|$)/,
            matches:  /\/matches(\/|$)/,
            feed:     /\/feed(\/|$)/,
            explore:  /\/explore(\/|$)/
        };
        document.querySelectorAll('.nav-item[data-target]').forEach(function (item) {
            var target = item.getAttribute('data-target');
            var pattern = pagePatterns[target];
            var isActive = pattern ? pattern.test(path) : false;
            item.classList.toggle('active', isActive);
        });
    }

    // ── MPA navigasyonunu kur ─────────────────────────
    // Sidebar nav-item tıklanınca ilgili MPA sayfasına yönlendir.
    // stopImmediatePropagation ile script.js setupNavigation ve
    // takimim.js click listener'larının çalışmasını engeller.
    function setupMPANav() {
        document.querySelectorAll('.nav-item[data-target]').forEach(function (item) {
            item.style.cursor = 'pointer';
            item.addEventListener('click', function (e) {
                var href = NAV_MAP[item.getAttribute('data-target')];
                if (href) {
                    e.stopImmediatePropagation();
                    window.location.href = href;
                }
            });
        });
    }

    // ── DOMContentLoaded: inject + init ──────────────
    document.addEventListener('DOMContentLoaded', function () {
        // 1. Sidebar inject
        var placeholder = document.getElementById('sidebar-placeholder');
        if (placeholder) {
            var tmp = document.createElement('div');
            tmp.innerHTML = buildSidebarHTML();
            placeholder.replaceWith(tmp.firstElementChild);
        }

        // 2. Aktif linki vurgula
        highlightActive();

        // 3. MPA navigasyonu kur
        setupMPANav();
    });

    // Global erişim için
    window._MPA_NAV_MAP = NAV_MAP;

    // ── Cross-page: Başka bir sayfadaki profil görüntüleme ──
    // Explore veya diğer sayfalarda openUserProfile() çağrılınca,
    // eğer #profile section bu sayfada yoksa, sessionStorage'a ID yaz
    // ve /character/ sayfasına yönlendir.
    document.addEventListener('DOMContentLoaded', function () {

        // showSection'ı MPA'ya duyarlı yap — olmayan section = sayfa geçişi
        setTimeout(function () {
            var _origShowSection = window.showSection;
            window.showSection = function (id) {
                var el = document.getElementById(id);
                if (el) {
                    // Section bu sayfada var → normal davran
                    if (typeof _origShowSection === 'function') _origShowSection(id);
                    return;
                }
                // Section yok → ilgili MPA sayfasına git
                var sectionToPage = {
                    profile: NAV_MAP.profile,
                    takimim: NAV_MAP.takimim,
                    matches: NAV_MAP.matches,
                    feed:    NAV_MAP.feed,
                    explore: NAV_MAP.explore
                };
                var url = sectionToPage[id];
                if (url) window.location.href = url;
            };
        }, 100); // script.js'in showSection'ı tanımlamasını bekle

        // openUserProfile → MPA redirect (karakter sayfası yoksa)
        setTimeout(function () {
            var _origOpenProfile = window.openUserProfile;
            window.openUserProfile = async function (supabaseId, username) {
                // Eğer profil section bu sayfadaysa orijinal işlev çalışsın
                if (document.getElementById('profile')) {
                    return typeof _origOpenProfile === 'function'
                        ? _origOpenProfile(supabaseId, username)
                        : null;
                }
                // Yoksa: ID ve username'i sessionStorage'a yaz, character sayfasına git
                sessionStorage.setItem('ss_view_player_id', supabaseId);
                if (username) sessionStorage.setItem('ss_view_player_username', username);
                window.location.href = NAV_MAP.profile;
            };
        }, 150);

        // goBackFromProfile → MPA'da önceki sayfaya dön
        setTimeout(function () {
            var _origGoBack = window.goBackFromProfile;
            window.goBackFromProfile = function () {
                // SPA'da (index.html) orijinal işlev çalışsın
                if (document.getElementById('takimim') && document.getElementById('explore')) {
                    return typeof _origGoBack === 'function' ? _origGoBack() : null;
                }
                // MPA: tarayıcı geçmişinde geri git
                if (document.referrer) {
                    window.history.back();
                } else {
                    window.location.href = NAV_MAP.explore;
                }
            };
        }, 150);
    });

    // ── Character sayfasında: sessionStorage'dan player ID ve username oku ──
    (function () {
        var pendingId       = sessionStorage.getItem('ss_view_player_id');
        var pendingUsername = sessionStorage.getItem('ss_view_player_username');
        if (pendingId && location.pathname.includes('/character')) {
            sessionStorage.removeItem('ss_view_player_id');
            sessionStorage.removeItem('ss_view_player_username');
            document.addEventListener('DOMContentLoaded', function () {
                setTimeout(function () {
                    // __openUserProfileCore → components.js sarmalayıcısını atlar
                    var fn = window.__openUserProfileCore || window.openUserProfile;
                    if (typeof fn === 'function') {
                        fn(pendingId, pendingUsername || undefined);
                    }
                }, 900); // updateUI (300ms) bittikten sonra çalış
            });
        }
    })();

})();

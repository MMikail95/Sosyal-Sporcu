// =====================================================
// DASHBOARD.JS — Ana Sayfa Modülü
// AI Gazete · Sosyal Duvar · Bölgesel Hub · Realtime
// =====================================================

(function () {
    'use strict';

    // ── Modül state ──────────────────────────────────
    let dashFeedPosts       = [];
    let dashMatchHistory    = [];   // gazete için maç geçmişi saklanır
    let dashRecentMatches   = [];   // son biten takım maçları
    let dashRealtimeChannel = null;
    let dashInitialized     = false;
    let dashLoading         = false;   // eşzamanlı çift-init koruması
    let dashUserProfile     = null;
    let dashUserId          = null;

    // ── Yardımcı: maç sonucu hesapla ────────────────
    function computeResult(row) {
        const m = row.match || row.matches;
        if (!m || m.home_score == null || m.away_score == null) return 'D';
        const isHome  = row.team_side === 'home';
        const my  = isHome ? m.home_score : m.away_score;
        const opp = isHome ? m.away_score : m.home_score;
        if (my > opp) return 'W';
        if (my < opp) return 'L';
        return 'D';
    }

    // ── Form şeridi ──────────────────────────────────
    function renderFormStrip(history) {
        const el = document.getElementById('dash-form-strip');
        if (!el) return;

        const finished = (history || [])
            .filter(r => (r.match || r.matches)?.status === 'finished')
            .slice(0, 5);

        const pills = [];
        // En eski → en yeni sırayla (soldan sağa okunur)
        const ordered = [...finished].reverse();
        for (let i = 0; i < 5; i++) {
            if (i < ordered.length) {
                const res = computeResult(ordered[i]);
                if (res === 'W') pills.push('<span class="form-pill form-w">G</span>');
                else if (res === 'L') pills.push('<span class="form-pill form-l">M</span>');
                else pills.push('<span class="form-pill form-d">B</span>');
            } else {
                pills.push('<span class="form-pill form-none">?</span>');
            }
        }
        el.innerHTML = pills.join('');
    }

    // ── Mini kart render ─────────────────────────────
    function renderDashMiniCard(profile, history) {
        dashUserProfile = profile;

        const avatarEl = document.getElementById('dash-mini-avatar');
        const nameEl   = document.getElementById('dash-mini-name');
        const posEl    = document.getElementById('dash-mini-pos');
        const ovrEl    = document.getElementById('dash-mini-ovr');

        if (!avatarEl) return;

        const seed = encodeURIComponent(profile?.username || 'player');
        avatarEl.src = profile?.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
        // Gerçek avatar (veya kullanıcının kendi username'ine dayalı DiceBear) hazır → görünür yap.
        // index.html'de avatar `visibility:hidden` başlar ki gerçek foto gelene kadar "seed=player"
        // yabancı yüz görünmesin; burada gösteriyoruz.
        avatarEl.style.visibility = 'visible';
        avatarEl.onerror = () => {
            avatarEl.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
        };

        if (nameEl) nameEl.textContent = profile?.full_name || profile?.username || '—';
        if (posEl)  posEl.textContent  = profile?.ana_mevki || profile?.position || '—';

        if (ovrEl) {
            const score = profile?.gen_score;
            ovrEl.textContent = score != null ? Math.round(score) : '—';

            // GEN renk kodlaması
            ovrEl.style.background =
                score >= 85 ? 'var(--neon-green)' :
                score >= 75 ? 'var(--neon-cyan)'  : '#ff9800';
            ovrEl.style.color = '#0a0a0f';
        }

        renderFormStrip(history);
    }

    // ── Mini kart yükle ──────────────────────────────
    async function loadDashMiniCard() {
        if (!dashUserId) return;

        // Cache-first render: giriş yapan kullanıcının profili zaten memory'de
        // (__SUPABASE_PROFILE__, initSupabaseUser doldurdu). DB round-trip'ini beklemeden
        // mini kartı hemen doldur ki statik iskelet — özellikle index.html'deki `seed=player`
        // DiceBear avatarı (kullanıcının "kapalı/yabancı yüz" olarak gördüğü placeholder) +
        // `—` isim/mevki/GEN — bir an bile görünmesin. Form şeridi (history) cache'de olmadığından
        // kısa süre `?` kalabilir; asıl göze batan avatar/isim/mevki/GEN anında gerçek veriye döner.
        const cached = window.__SUPABASE_PROFILE__;
        if (cached && cached.id === dashUserId) {
            renderDashMiniCard(cached, []);
        }

        try {
            const [profileRes, historyRes] = await Promise.all([
                window.DB.Profiles.get(dashUserId),
                window.DB.Matches.getPlayerHistory(dashUserId, 5)
            ]);
            renderDashMiniCard(profileRes, historyRes || []);
        } catch (e) {
            console.warn('[Dashboard] Mini kart yükleme hatası:', e);
        }
    }

    // ── Bölge sıralaması render ──────────────────────
    function renderDashStandings(profiles, myId) {
        const listEl = document.getElementById('dash-standings-list');
        const cityEl = document.getElementById('dash-standings-city');
        if (!listEl) return;

        if (!profiles || profiles.length === 0) {
            listEl.innerHTML = '<li style="color:var(--text-muted);font-size:0.8rem;padding:0.5rem;">Bölgede oyuncu bulunamadı.</li>';
            return;
        }

        if (cityEl && profiles[0]?.city) cityEl.textContent = profiles[0].city;

        const rankColors = ['dash-rank-gold', 'dash-rank-silver', 'dash-rank-bronze'];

        listEl.innerHTML = profiles.slice(0, 10).map((p, i) => {
            const isMe   = p.id === myId;
            const seed   = encodeURIComponent(p.username || 'player');
            const avatar = p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
            const score  = p.gen_score != null ? Math.round(p.gen_score) : '—';
            const rc     = rankColors[i] || '';
            return `
            <li class="dash-standing-row${isMe ? ' dash-standing-me' : ''}"
                onclick="if(typeof openUserProfile==='function')openUserProfile('${p.id}')">
                <span class="dash-rank ${rc}">#${i + 1}</span>
                <img class="dash-standing-avatar"
                     src="${avatar}"
                     onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}'"
                     alt="${p.username || ''}">
                <span class="dash-standing-name">${p.full_name || p.username || 'Oyuncu'}</span>
                <span class="dash-standing-score">${score} GEN</span>
            </li>`;
        }).join('');
    }

    // ── Bölge sıralaması yükle ───────────────────────
    async function loadDashStandings() {
        const city = dashUserProfile?.city;
        if (!city) {
            const listEl = document.getElementById('dash-standings-list');
            if (listEl) listEl.innerHTML =
                '<li style="color:var(--text-muted);font-size:0.8rem;padding:0.5rem;list-style:none;">Bölge sıralaması için profilinize şehir ekleyin.</li>';
            return;
        }

        try {
            const profiles = await window.DB.Profiles.getAll({ city, limit: 10 });
            renderDashStandings(profiles || [], dashUserId);
        } catch (e) {
            console.warn('[Dashboard] Sıralama yükleme hatası:', e);
        }
    }

    // ── Gazete başlıkları render ─────────────────────
    function renderDashGazette(history, recentMatches) {
        const ticker = document.getElementById('dash-gazette-ticker');
        if (!ticker) return;

        const finished = (history || []).filter(r =>
            (r.match || r.matches)?.status === 'finished'
        );
        const wins   = finished.filter(r => computeResult(r) === 'W').length;
        const losses = finished.filter(r => computeResult(r) === 'L').length;
        const goals  = finished.reduce((s, r) => s + (r.goals || 0), 0);
        const name   = dashUserProfile?.full_name || dashUserProfile?.username || 'Oyuncu';
        const city   = dashUserProfile?.city || 'Bölge';

        const pills = []; // { text, type }

        // — Kişisel istatistikler —
        if (finished.length > 0) {
            pills.push({ text: `🏆 ${name} son ${finished.length} maçta ${wins} galibiyet, ${losses} mağlubiyet kaydetti!`, type: 'personal' });
        }
        if (goals > 0) {
            pills.push({ text: `🎯 ${name} bu sezon toplam ${goals} gol attı — ${city} bölgesinin yıldızı!`, type: 'personal' });
        }
        if (wins >= 3) {
            pills.push({ text: `⚡ Formda devam! Son maçlarda ${wins} üst üste galibiyet — sürükleyici bir serüven!`, type: 'personal' });
        } else if (wins > 0) {
            pills.push({ text: `⭐ ${name} ${city}'de gündem olmaya devam ediyor — ${wins} galibiyet!`, type: 'personal' });
        }

        // — Takım aktiviteleri (son biten maçlar) —
        (recentMatches || dashRecentMatches).slice(0, 6).forEach(m => {
            const ht = m.home_team?.name || 'Ev Sahibi';
            const at = m.away_team?.name || 'Deplasman';
            const hs = m.home_score ?? 0;
            const as = m.away_score ?? 0;
            if (hs === as) {
                pills.push({ text: `🤝 ${ht} ile ${at} ${hs}-${as} berabere kaldı`, type: 'team' });
            } else {
                const winner = hs > as ? ht : at;
                const loser  = hs > as ? at : ht;
                pills.push({ text: `🏆 ${winner} ${hs}-${as} ${loser}'yi mağlup etti!`, type: 'team' });
            }
        });

        // — Gündem: en çok beğenilen paylaşımlar —
        const topPosts = [...dashFeedPosts]
            .filter(p => (p.like_count || 0) >= 3)
            .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
            .slice(0, 2);
        topPosts.forEach(p => {
            const author  = p.author?.username || p.author?.full_name || 'Oyuncu';
            const preview = (p.content || '').slice(0, 60) + ((p.content || '').length > 60 ? '…' : '');
            pills.push({ text: `🔥 @${author}: "${preview}"`, type: 'gundem' });
        });

        if (pills.length === 0) {
            pills.push({ text: `📰 ${city} bölgesindeki maç sonuçları bekleniyor — sahaya çık!`, type: 'personal' });
            pills.push({ text: `⚽ Yeni maç oluştur, sonuçları paylaş ve bölge sıralamasına gir!`, type: 'personal' });
        }

        ticker.innerHTML = pills
            .map(p => `<div class="dash-headline-pill pill-${p.type}">${p.text}</div>`)
            .join('');

        initGazetteSlider(pills.length);
    }

    // ── Gazete slider init ────────────────────────────
    const PILL_H = 56; // px — CSS min-height ile eşleşmeli
    const VISIBLE = 3;
    let gazetteIndex = 0;

    function initGazetteSlider(total) {
        gazetteIndex = 0;
        const ticker = document.getElementById('dash-gazette-ticker');
        const btnUp   = document.getElementById('dash-gz-up');
        const btnDown = document.getElementById('dash-gz-down');
        if (!ticker || !btnUp || !btnDown) return;

        function applySlide() {
            ticker.style.transform = `translateY(-${gazetteIndex * PILL_H}px)`;
            btnUp.disabled   = gazetteIndex === 0;
            btnDown.disabled = gazetteIndex >= total - VISIBLE;
        }

        // Listener'ları yenilemek için klonla
        btnUp.replaceWith(btnUp.cloneNode(true));
        btnDown.replaceWith(btnDown.cloneNode(true));
        const up   = document.getElementById('dash-gz-up');
        const down = document.getElementById('dash-gz-down');

        up.addEventListener('click', () => { if (gazetteIndex > 0) { gazetteIndex--; applySlide(); } });
        down.addEventListener('click', () => { if (gazetteIndex < total - VISIBLE) { gazetteIndex++; applySlide(); } });

        applySlide();
    }

    // ── Gazete yükle ─────────────────────────────────
    async function loadDashGazette() {
        try {
            const [history, recent] = await Promise.all([
                window.DB.Matches.getPlayerHistory(dashUserId, 10),
                window.DB.Matches.getRecentFinished(8)
            ]);
            dashMatchHistory  = history || [];
            dashRecentMatches = recent  || [];
            renderDashGazette(dashMatchHistory, dashRecentMatches);
        } catch (e) {
            console.warn('[Dashboard] Gazete yükleme hatası:', e);
            renderDashGazette([], []);
        }
    }

    // ── Feed render ──────────────────────────────────
    function renderDashFeed() {
        const el = document.getElementById('dash-feed-stream');
        if (!el) return;

        if (dashFeedPosts.length === 0) {
            el.innerHTML = `
            <div style="text-align:center;padding:2rem;color:var(--text-muted);">
                <i class="fa-solid fa-rss" style="font-size:2rem;margin-bottom:0.75rem;display:block;opacity:0.4;"></i>
                <div>Henüz paylaşım yok. İlk paylaşımı sen yap!</div>
            </div>`;
            return;
        }

        if (typeof window.buildRealFeedCard === 'function') {
            el.innerHTML = dashFeedPosts.map(window.buildRealFeedCard).join('');
        } else {
            // buildRealFeedCard henüz yüklenmediyse basit kart göster
            el.innerHTML = dashFeedPosts.map(p => {
                const author  = p.author?.username || p.author?.full_name || 'Oyuncu';
                const content = p.content || '';
                const ago     = p.created_at
                    ? new Date(p.created_at).toLocaleDateString('tr-TR')
                    : '';
                return `<div class="real-feed-card glass-card" style="margin-bottom:0.75rem;padding:1rem;">
                    <strong>${author}</strong>
                    <span style="float:right;font-size:0.75rem;color:var(--text-muted)">${ago}</span>
                    <p style="margin:0.5rem 0 0;">${content}</p>
                </div>`;
            }).join('');
        }
    }

    // ── Feed yükle ───────────────────────────────────
    async function loadDashFeed() {
        try {
            const posts = await window.DB.Feed.getPosts(dashUserId, 20);
            dashFeedPosts = posts || [];
            renderDashFeed();
        } catch (e) {
            console.warn('[Dashboard] Feed yükleme hatası:', e);
            renderDashFeed();
        }
    }

    // ── Realtime abone ol ────────────────────────────
    function subscribeDashFeed() {
        if (dashRealtimeChannel) return; // çift abone koruması

        try {
            dashRealtimeChannel = window.DB.Feed.subscribeToFeed(async newPost => {
                if (!newPost) return;
                // Realtime payload'ı raw satır döndürür — author join'i olmaz.
                // Feed'i yeniden çekerek doğru isim/avatar gösteriyoruz.
                await loadDashFeed();
                renderDashGazette(dashMatchHistory, dashRecentMatches);
                if (typeof window.showToast === 'function') {
                    window.showToast('🆕 Yeni paylaşım!');
                }
            });
        } catch (e) {
            console.warn('[Dashboard] Realtime abone hatası:', e);
        }
    }

    // ── Ana init ─────────────────────────────────────
    window.initDashboard = async function () {
        if (!window.DB) {
            setTimeout(() => window.initDashboard(), 300);
            return;
        }
        if (!window.__AUTH_USER__) {
            setTimeout(() => window.initDashboard(), 500);
            return;
        }
        // Çift-init koruması: hem script.js (DOMContentLoaded, erken tetik) hem
        // dashboard.js'in kendi 800ms fallback'i hem de showSection('dashboard')
        // aynı anda çağırabilir; yükleme sürerken tekrarını yok say (aksi halde
        // gereksiz çift network isteği ve iskelet titremesi olur).
        if (dashLoading) return;
        dashLoading = true;

        try {
            const user = window.__AUTH_USER__;
            dashUserId = user?.id || null;

            // Mini kart önce yüklensin — şehri öğrenmek için
            await loadDashMiniCard();

            // Geri kalanlar paralel
            await Promise.all([
                loadDashFeed(),
                loadDashGazette(),
                loadDashStandings()
            ]);

            subscribeDashFeed();
            dashInitialized = true;
        } finally {
            dashLoading = false;
        }
    };

    // ── İlk yükleme: DOMContentLoaded'dan sonra dashboard açıksa başlat ──
    // NOT: showSection wrapper kaldırıldı — script.js zaten 'dashboard' için initDashboard() çağırıyor.
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const dashEl = document.getElementById('dashboard');
            if (dashEl && (dashEl.classList.contains('active') ||
                dashEl.style.display === 'block')) {
                window.initDashboard();
            }
        }, 800);
    });

})();

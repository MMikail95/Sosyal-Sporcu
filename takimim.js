
// ======================================================
// TAKIMIM.JS — Takımım Sekmesi Yönetim Modülü
// Faz 1: Veri Modeli + Genel Bakış Sekmesi
// ======================================================

// ──────────────────────────────────────────────────────
// 1. VERİ MODELİ
// ──────────────────────────────────────────────────────

const TEAM_ICONS = [
    { id: 'fa-shield-cat',     label: 'Kedi Kalkan'   },
    { id: 'fa-shield-halved',  label: 'Kalkan'        },
    { id: 'fa-dragon',         label: 'Ejderha'       },
    { id: 'fa-crow',           label: 'Karga'         },
    { id: 'fa-horse',          label: 'At'            },
    { id: 'fa-star',           label: 'Yıldız'        },
    { id: 'fa-bolt',           label: 'Şimşek'        },
    { id: 'fa-fire',           label: 'Alev'          },
    { id: 'fa-skull',          label: 'Kuru Kafa'     },
    { id: 'fa-crown',          label: 'Taç'           },
    { id: 'fa-trophy',         label: 'Kupa'          },
    { id: 'fa-futbol',         label: 'Futbol'        },
    { id: 'fa-paw',            label: 'Pençe'         },
    { id: 'fa-otter',          label: 'Samur'         },
    { id: 'fa-feather-pointed',label: 'Kartal Tüyü'  },
];

const TEAM_ICON_COLORS = [
    '#00ff88', // neon green
    '#00e5ff', // neon cyan
    '#ff007f', // neon pink
    '#ffd700', // gold
    '#ff6b35', // orange
    '#a855f7', // purple
    '#ef4444', // red
    '#3b82f6', // blue
    '#ffffff',  // white
];

const DEFAULT_TEAM_DATA = {
    name: 'Yıldızlar FC',
    icon: 'fa-shield-cat',
    iconColor: '#00ff88',
    captainId: 'p1',
    members: [], // will be filled with all player ids on first load
    coreSquad: [],
    seasonStats: { matches: 42, wins: 28, draws: 8, losses: 6 },
    tactics: { formation: '3-2-2', positions: {} },
    founded: '2024',
    description: 'Halısaha sahalarının efendileri',
};

// Bireysel başarım tanımları yerinde, takımsal başarımlar:
const TEAM_ACHIEVEMENT_DEFS = [
    {
        id: 'ta-unbeatable',
        title: 'Yenilmez Kale',
        emoji: '🧱',
        icon: 'fa-shield-halved',
        category: 'Defans',
        tier: 'gumus',
        color: '#aaaaaa',
        desc: 'Sezon boyunca 5 maçta gol yemeden kapattınız.',
        criteria: 'Sezonda en az 5 gol yemeyen maç oynayın.',
        check: (team, stats) => (stats?.cleanSheets || 0) >= 5
    },
    {
        id: 'ta-goal-machine',
        title: 'Gol Makinesi',
        emoji: '⚽',
        icon: 'fa-bullseye',
        category: 'Hücum',
        tier: 'altin',
        color: '#ffd700',
        desc: 'Sezonda 50 gol attınız.',
        criteria: 'Takım olarak 50 gol skorlayın.',
        check: (team, stats) => (stats?.goalsFor || 0) >= 50
    },
    {
        id: 'ta-undefeated',
        title: 'Yenilmez Seri',
        emoji: '🔥',
        icon: 'fa-fire',
        category: 'Seri',
        tier: 'altin',
        color: '#ff6b35',
        desc: '10 maçlık yenilmezlik serisi.',
        criteria: 'Üst üste 10 maç kaybetmeyin.',
        check: (team, stats) => (stats?.unbeatenStreak || 0) >= 10
    },
    {
        id: 'ta-kemik-kadro',
        title: 'Kemik Kadro',
        emoji: '💀',
        icon: 'fa-bone',
        category: 'Bağ',
        tier: 'altin',
        color: '#e2e8f0',
        desc: 'Aynı 7 oyuncu 20 maç birlikte oynadı.',
        criteria: 'Kemik 7 oyuncu ile 20 maç tamamlayın.',
        check: (team, stats) => (stats?.coreSquadMatches || 0) >= 20
    },
    {
        id: 'ta-scoring-streak',
        title: 'Her Maçta Gol',
        emoji: '🎯',
        icon: 'fa-crosshairs',
        category: 'Hücum',
        tier: 'gumus',
        color: '#aaaaaa',
        desc: 'Üst üste 10 maçta gol attınız.',
        criteria: 'Art arda 10 maçta en az 1 gol atın.',
        check: (team, stats) => (stats?.scoringStreak || 0) >= 10
    },
    {
        id: 'ta-comeback-kings',
        title: 'Geri Dönüş Ustası',
        emoji: '↩️',
        icon: 'fa-rotate-left',
        category: 'Karakter',
        tier: 'gumus',
        color: '#00e5ff',
        desc: '3 kez geriden gelip galip geldiniz.',
        criteria: 'Geride iken 3 maçı kazanın.',
        check: (team, stats) => (stats?.comebacks || 0) >= 3
    },
    {
        id: 'ta-champion',
        title: 'Şampiyon',
        emoji: '🏆',
        icon: 'fa-trophy',
        category: 'Şampiyonluk',
        tier: 'altin',
        color: '#ffd700',
        desc: 'Liginizde şampiyon oldunuz.',
        criteria: 'Lig şampiyonu olun.',
        check: (team, stats) => (stats?.titles || 0) >= 1
    },
    {
        id: 'ta-solidarity',
        title: 'Dayanışma',
        emoji: '🤝',
        icon: 'fa-handshake',
        category: 'Bağ',
        tier: 'bronz',
        color: '#cd7f32',
        desc: 'Takıma 10 farklı oyuncu katkı sağladı.',
        criteria: 'En az 10 farklı oyuncu ile maç oynayın.',
        check: (team, stats) => (stats?.uniquePlayers || 0) >= 10
    },
];

// ──────────────────────────────────────────────────────
// 2. VERİ YÜKLEME / KAYDETME
// ──────────────────────────────────────────────────────

let teamData = null;

function loadTeamData() {
    const raw = localStorage.getItem('ss_team_v1');
    if (raw) {
        try {
            teamData = JSON.parse(raw);
            // migrate
            if (!teamData.iconColor)   teamData.iconColor   = '#00ff88';
            if (!teamData.seasonStats) teamData.seasonStats = { matches: 0, wins: 0, draws: 0, losses: 0 };
            if (!teamData.coreSquad)   teamData.coreSquad   = [];
            if (!teamData.tactics)     teamData.tactics     = { formation: '3-2-2', positions: {} };
        } catch (e) {
            teamData = JSON.parse(JSON.stringify(DEFAULT_TEAM_DATA));
        }
    } else {
        teamData = JSON.parse(JSON.stringify(DEFAULT_TEAM_DATA));
        // Auto-populate members from existing players
        if (typeof players !== 'undefined' && players.length > 0) {
            teamData.members = players.map(p => p.id);
            teamData.coreSquad = players.slice(0, 7).map(p => p.id);
        }
    }
    saveTeamData();
}

function saveTeamData() {
    localStorage.setItem('ss_team_v1', JSON.stringify(teamData));
}

function getTeamPlayers() {
    if (!teamData || !teamData.members) return players || [];
    return (players || []).filter(p => teamData.members.includes(p.id));
}

function getCoreSquadPlayers() {
    if (!teamData || !teamData.coreSquad) return [];
    return (players || []).filter(p => teamData.coreSquad.includes(p.id));
}

// ──────────────────────────────────────────────────────
// 3. GEN HESAPLAMA
// ──────────────────────────────────────────────────────

function calcPlayerGEN(player) {
    const vals = Object.values(player.ratings);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

/**
 * Takım GEN: İlk 7 (kemik) oyuncunun ortalama puanı
 */
function calcTeamGEN() {
    const teamPlayers = getTeamPlayers();
    if (teamPlayers.length === 0) return 0;

    // Sort by GEN desc, take top 7
    const sorted = [...teamPlayers].sort((a, b) => calcPlayerGEN(b) - calcPlayerGEN(a));
    const top7 = sorted.slice(0, 7);
    const avg = Math.round(top7.reduce((sum, p) => sum + calcPlayerGEN(p), 0) / top7.length);
    return avg;
}

/**
 * Takım ortalama stat profili (radar chart için)
 */
function calcTeamStatProfile() {
    const teamPlayers = getTeamPlayers();
    if (teamPlayers.length === 0) {
        return { teknik: 70, sut: 70, pas: 70, hiz: 70, fizik: 70, kondisyon: 70 };
    }
    const sorted = [...teamPlayers].sort((a, b) => calcPlayerGEN(b) - calcPlayerGEN(a));
    const top7 = sorted.slice(0, 7);
    const keys = ['teknik', 'sut', 'pas', 'hiz', 'fizik', 'kondisyon'];
    const result = {};
    keys.forEach(k => {
        const avg = Math.round(top7.reduce((sum, p) => sum + (p.ratings[k] || 70), 0) / top7.length);
        result[k] = avg;
    });
    return result;
}

/**
 * En güçlü özelliği döndürür (puan tavan yapan stat)
 */
function getTeamStrengths() {
    const profile = calcTeamStatProfile();
    const labels = {
        teknik: 'Teknik', sut: 'Şut Gücü', pas: 'Pas Kalitesi',
        hiz: 'Hız', fizik: 'Fiziksel Güç', kondisyon: 'Kondisyon'
    };
    const icons = {
        teknik: 'fa-wand-magic-sparkles', sut: 'fa-bullseye', pas: 'fa-arrows-split-up-and-left',
        hiz: 'fa-person-running', fizik: 'fa-dumbbell', kondisyon: 'fa-heart-pulse'
    };
    const colors = {
        teknik: 'var(--neon-cyan)', sut: 'var(--neon-pink)', pas: 'var(--neon-green)',
        hiz: '#ff6b35', fizik: '#a855f7', kondisyon: '#ffd700'
    };

    return Object.entries(profile)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([key, val]) => ({ key, val, label: labels[key], icon: icons[key], color: colors[key] }));
}

// ──────────────────────────────────────────────────────
// 4. SUB-TAB NAVIGATION
// ──────────────────────────────────────────────────────

window.switchTeamTab = function(tabId) {
    document.querySelectorAll('.team-subtab').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });
    document.querySelectorAll('.team-tab-btn').forEach(btn => btn.classList.remove('active'));

    const target = document.getElementById(tabId);
    if (target) {
        target.style.display = 'block';
        setTimeout(() => target.classList.add('active'), 10);
    }

    const activeBtn = document.querySelector(`.team-tab-btn[data-tab="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Trigger tab-specific render
    if (tabId === 'ttab-genel')       renderTeamOverview();
    if (tabId === 'ttab-basarimlar')  renderTeamAchievements();
    if (tabId === 'ttab-kadro')       renderKadroTab();
    if (tabId === 'ttab-saha')        renderSahaTab();
    if (tabId === 'ttab-olustur')     renderTakimOlusturTab();
    if (tabId === 'ttab-rakipler')    renderRakiplerTab();
    if (tabId === 'ttab-odemeler')    renderOdemelerTab();
    if (tabId === 'ttab-sinerji')     renderSinerjiTab();
};

// ──────────────────────────────────────────────────────
// 5. GENEL BAKIŞ SEKMESİ - RENDER
// ──────────────────────────────────────────────────────

let teamChartInstance = null;

function renderTeamHeader() {
    if (!teamData) return;

    const gen = calcTeamGEN();
    const teamPlayers = getTeamPlayers();

    const headerEl = document.getElementById('team-main-header');
    if (!headerEl) return;

    const isCapOrAdmin = () => {
        const acc = (typeof getActiveAccount === 'function') ? getActiveAccount() : null;
        return acc && (acc.role === 'admin' || acc.playerId === teamData.captainId);
    };

    headerEl.innerHTML = `
        <div class="team-identity-block">
            <div class="team-crest" id="team-crest-display" style="color:${teamData.iconColor};"
                 onclick="${isCapOrAdmin() ? 'openTeamEditModal()' : ''}"
                 title="${isCapOrAdmin() ? 'Takım profilini düzenle' : ''}">
                <i class="fa-solid ${teamData.icon}"></i>
            </div>
            <div class="team-name-block">
                <h1 class="team-main-name" id="team-name-display">${teamData.name}</h1>
                <div class="team-meta-row">
                    <span class="team-gen-badge" id="team-gen-badge">
                        <span id="team-gen-number">${gen}</span> GEN
                    </span>
                    <span class="team-member-count">
                        <i class="fa-solid fa-users"></i> ${teamPlayers.length} Oyuncu
                    </span>
                    <span class="team-captain-badge" title="Kaptan">
                        <i class="fa-solid fa-crown" style="color:#ffd700;"></i>
                        ${(() => { const cap = (players||[]).find(p=>p.id===teamData.captainId); return cap ? cap.name : 'Kaptan'; })()}
                    </span>
                </div>
                <div class="team-desc" id="team-desc-display">${teamData.description || ''}</div>
            </div>
        </div>
        <div class="team-header-actions">
            <div class="team-season-counters">
                <div class="ts-counter">
                    <span class="ts-val">${teamData.seasonStats.matches}</span>
                    <span class="ts-lbl">Maç</span>
                </div>
                <div class="ts-counter win">
                    <span class="ts-val">${teamData.seasonStats.wins}</span>
                    <span class="ts-lbl">Galibiyet</span>
                </div>
                <div class="ts-counter draw">
                    <span class="ts-val">${teamData.seasonStats.draws}</span>
                    <span class="ts-lbl">Beraberlik</span>
                </div>
                <div class="ts-counter loss">
                    <span class="ts-val">${teamData.seasonStats.losses}</span>
                    <span class="ts-lbl">Mağlubiyet</span>
                </div>
            </div>
            ${isCapOrAdmin() ? `
            <button class="btn-edit-team" onclick="openTeamEditModal()">
                <i class="fa-solid fa-pen-to-square"></i> Takımı Düzenle
            </button>` : ''}
        </div>
    `;
}

function renderTeamOverview() {
    if (!teamData) return;
    renderTeamHeader();
    renderTeamRadarChart();
    renderTeamStrengthBadges();
    renderCoreSquadSection();
    renderTeamMemberGrid();
}

function renderTeamRadarChart() {
    // Update the GEN chip in radar card header
    const genChipVal = document.getElementById('team-gen-radar-val');
    if (genChipVal) genChipVal.textContent = calcTeamGEN();
    const ctx = document.getElementById('team-radar-chart');
    if (!ctx) return;
    if (typeof Chart === 'undefined') return;

    const profile = calcTeamStatProfile();
    const dataVals = [
        profile.teknik, profile.sut, profile.pas,
        profile.hiz, profile.fizik, profile.kondisyon
    ];

    const config = {
        type: 'radar',
        data: {
            labels: ['Teknik', 'Şut', 'Pas', 'Hız', 'Fizik', 'Kondisyon'],
            datasets: [{
                label: 'Takım Profili',
                data: dataVals,
                backgroundColor: 'rgba(0, 255, 136, 0.15)',
                borderColor: '#00ff88',
                borderWidth: 2.5,
                pointBackgroundColor: '#00ff88',
                pointRadius: 5,
                pointHoverRadius: 7,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255,255,255,0.1)' },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    pointLabels: {
                        color: '#ddd',
                        font: { size: 13, weight: '600' }
                    },
                    suggestedMin: 0,
                    suggestedMax: 99,
                    ticks: { display: false, beginAtZero: true }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.label}: ${ctx.raw}`,
                    }
                }
            },
            animation: {
                duration: 800,
                easing: 'easeInOutQuart'
            }
        }
    };

    if (teamChartInstance) {
        teamChartInstance.data.datasets[0].data = dataVals;
        teamChartInstance.update();
    } else {
        teamChartInstance = new Chart(ctx, config);
    }
}

function renderTeamStrengthBadges() {
    const container = document.getElementById('team-strength-badges');
    if (!container) return;

    const strengths = getTeamStrengths();
    const profile = calcTeamStatProfile();
    const allStats = Object.entries(profile).sort((a, b) => b[1] - a[1]);

    const labels = {
        teknik: 'Teknik', sut: 'Şut', pas: 'Pas',
        hiz: 'Hız', fizik: 'Fizik', kondisyon: 'Kondisyon'
    };
    const icons = {
        teknik: 'fa-wand-magic-sparkles', sut: 'fa-bullseye',
        pas: 'fa-arrows-split-up-and-left', hiz: 'fa-person-running',
        fizik: 'fa-dumbbell', kondisyon: 'fa-heart-pulse'
    };
    const colors = {
        teknik: '#00e5ff', sut: '#ff007f', pas: '#00ff88',
        hiz: '#ff6b35', fizik: '#a855f7', kondisyon: '#ffd700'
    };

    container.innerHTML = `
        <div class="strength-header">
            <i class="fa-solid fa-chart-bar" style="color:var(--neon-green);"></i>
            TAKIM ÖZELLİK PROFİLİ
        </div>
        <div class="strength-bar-list">
            ${allStats.map(([key, val], i) => `
            <div class="strength-bar-row ${i === 0 ? 'top-stat' : ''}">
                <div class="strength-bar-label">
                    <i class="fa-solid ${icons[key]}" style="color:${colors[key]};"></i>
                    <span>${labels[key]}</span>
                    ${i === 0 ? '<span class="top-badge">EN GÜÇLÜ</span>' : ''}
                    ${i === allStats.length - 1 ? '<span class="weak-badge">GELİŞTİR</span>' : ''}
                </div>
                <div class="strength-bar-track">
                    <div class="strength-bar-fill"
                         style="width:${val}%; background:${colors[key]}; animation-delay:${i * 0.1}s;">
                    </div>
                </div>
                <span class="strength-bar-val" style="color:${colors[key]};">${val}</span>
            </div>`).join('')}
        </div>
    `;
}

function renderCoreSquadSection() {
    const container = document.getElementById('team-core-squad');
    if (!container) return;

    const teamPlayers = getTeamPlayers();
    const sorted = [...teamPlayers].sort((a, b) => calcPlayerGEN(b) - calcPlayerGEN(a));
    const top7 = sorted.slice(0, 7);

    const posColors = { KL: '#ffd700', DEF: '#00e5ff', OS: '#00ff88', FV: '#ff007f' };
    const posLabels = { KL: 'KALECI', DEF: 'DEFANS', OS: 'ORTA SAHA', FV: 'FORVET' };

    container.innerHTML = `
        <div class="core-squad-header">
            <div class="section-label-pill">
                <i class="fa-solid fa-star" style="color:#ffd700;"></i>
                BAŞLANGIÇ 7 / KİLİT KADRO
            </div>
            <span class="core-gen-total">
                Ort. GEN: <b style="color:var(--neon-green);">${calcTeamGEN()}</b>
            </span>
        </div>
        <div class="core-squad-grid">
            ${top7.map((p, i) => {
                const gen = calcPlayerGEN(p);
                const col = posColors[p.details.pos] || '#aaa';
                const isCore = teamData.coreSquad.includes(p.id);
                return `
                <div class="core-player-card ${isCore ? 'is-core' : ''}">
                    <div class="core-rank">${i + 1}</div>
                    <div class="core-avatar-wrap">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}"
                             class="core-avatar">
                        <div class="core-pos-dot" style="background:${col};"
                             title="${posLabels[p.details.pos] || p.details.pos}"></div>
                    </div>
                    <div class="core-info">
                        <span class="core-name">${p.name}</span>
                        <span class="core-pos" style="color:${col};">${p.details.pos}</span>
                    </div>
                    <div class="core-gen-chip" style="border-color:${gen >= 80 ? 'var(--neon-green)' : '#555'};">
                        ${gen}
                    </div>
                    ${isCore ? '<i class="fa-solid fa-bone core-bone-icon" title="Kemik Kadro"></i>' : ''}
                </div>`;
            }).join('')}
        </div>
    `;
}

function renderTeamMemberGrid() {
    const container = document.getElementById('team-member-grid');
    if (!container) return;

    const teamPlayers = getTeamPlayers();
    const posColors = { KL: '#ffd700', DEF: '#00e5ff', OS: '#00ff88', FV: '#ff007f' };

    // Group by position
    const byPos = { KL: [], DEF: [], OS: [], FV: [] };
    teamPlayers.forEach(p => {
        const pos = p.details.pos || 'OS';
        if (!byPos[pos]) byPos[pos] = [];
        byPos[pos].push(p);
    });

    const posOrder = ['KL', 'DEF', 'OS', 'FV'];
    const posLabels = { KL: '🧤 KALE', DEF: '🛡️ DEFANS', OS: '⚡ ORTA SAHA', FV: '⚽ FORVET' };

    container.innerHTML = `
        <div class="section-label-pill" style="margin-bottom:1.5rem;">
            <i class="fa-solid fa-users"></i> TÜM KADRO (${teamPlayers.length} Oyuncu)
        </div>
        ${posOrder.map(pos => {
            if (!byPos[pos] || byPos[pos].length === 0) return '';
            return `
            <div class="pos-group">
                <div class="pos-group-label" style="border-color:${posColors[pos]}; color:${posColors[pos]};">
                    ${posLabels[pos]}
                    <span class="pos-count">${byPos[pos].length}</span>
                </div>
                <div class="member-row">
                    ${byPos[pos].map(p => {
                        const gen = calcPlayerGEN(p);
                        const isCore = teamData.coreSquad.includes(p.id);
                        const isCap = p.id === teamData.captainId;
                        return `
                        <div class="member-chip" onclick="viewPlayerFromTeam('${p.id}')"
                             title="${p.name} — GEN ${gen}">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}" class="member-chip-avatar">
                            <div class="member-chip-info">
                                <span class="member-chip-name">
                                    ${p.name}
                                    ${isCap ? '<i class="fa-solid fa-crown" style="color:#ffd700;font-size:0.7rem;"></i>' : ''}
                                    ${isCore ? '<i class="fa-solid fa-bone" style="color:#888;font-size:0.65rem;"></i>' : ''}
                                </span>
                                <span class="member-chip-gen" style="color:${gen >= 80 ? 'var(--neon-green)' : 'orange'};">${gen} GEN</span>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        }).join('')}
    `;
}

// ──────────────────────────────────────────────────────
// 6. TAKIM BAŞARIMLAR (Placeholder — Faz 5'te tam)
// ──────────────────────────────────────────────────────

function renderTeamAchievements() {
    const container = document.getElementById('team-achievements-content');
    if (!container) return;

    const dummyStats = {
        cleanSheets: 3, goalsFor: 28, unbeatenStreak: 6,
        coreSquadMatches: 12, scoringStreak: 8, comebacks: 2,
        titles: 0, uniquePlayers: 11
    };

    const categories = {};
    TEAM_ACHIEVEMENT_DEFS.forEach(def => {
        const unlocked = def.check(teamData, dummyStats);
        const ach = { ...def, unlocked };
        if (!categories[def.category]) categories[def.category] = [];
        categories[def.category].push(ach);
    });

    const totalUnlocked = TEAM_ACHIEVEMENT_DEFS.filter(d => d.check(teamData, dummyStats)).length;

    container.innerHTML = `
        <div class="team-ach-header">
            <div class="team-ach-progress">
                <i class="fa-solid fa-trophy" style="color:#ffd700;"></i>
                Toplam: <b style="color:var(--neon-green);">${totalUnlocked}</b> / ${TEAM_ACHIEVEMENT_DEFS.length} Başarım Açık
            </div>
        </div>
        ${Object.entries(categories).map(([cat, achs]) => {
            const unlockedCount = achs.filter(a => a.unlocked).length;
            return `
            <div class="team-ach-category">
                <div class="ach-cat-header">
                    <span class="ach-cat-title">${cat}</span>
                    <span class="ach-cat-count">${unlockedCount} / ${achs.length}</span>
                </div>
                <div class="ach-cards-grid">
                    ${achs.map(a => renderTeamAchCard(a)).join('')}
                </div>
            </div>`;
        }).join('')}
    `;
}

function renderTeamAchCard(ach) {
    const unlockClass = ach.unlocked ? 'ach-unlocked' : 'ach-locked';
    return `
        <div class="ach-card ${unlockClass} ach-tier-${ach.tier}" title="${ach.criteria}">
            ${ach.unlocked ? `<div class="ach-card-glow" style="background:radial-gradient(circle,${ach.color}33 0%,transparent 70%);"></div>` : ''}
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
            ${ach.unlocked ? `<div class="ach-tier-stamp">${{bronz:'🥉',gumus:'🥈',altin:'🥇'}[ach.tier]||''}</div>` : ''}
        </div>
    `;
}

// ──────────────────────────────────────────────────────
// 7. TAKIM DÜZENLEMEmodali
// ──────────────────────────────────────────────────────

window.openTeamEditModal = function() {
    const acc = (typeof getActiveAccount === 'function') ? getActiveAccount() : null;
    if (!acc || (acc.role !== 'admin' && acc.playerId !== teamData.captainId)) {
        return;
    }

    // Create modal if not exists
    let modal = document.getElementById('team-edit-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'team-edit-modal';
        modal.className = 'modal-backdrop';
        modal.onclick = (e) => { if(e.target === modal) closeTeamEditModal(); };
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-box" onclick="event.stopPropagation()" style="max-width:520px;">
            <div class="modal-header">
                <h3><i class="fa-solid fa-pen-to-square" style="color:var(--neon-green);"></i> Takım Profilini Düzenle</h3>
                <button class="modal-close" onclick="closeTeamEditModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <div class="modal-field">
                    <label>Takım İsmi</label>
                    <input type="text" id="team-edit-name" class="profile-input" value="${teamData.name}"
                           maxlength="30" placeholder="Yıldızlar FC">
                </div>
                <div class="modal-field">
                    <label>Takım Açıklaması</label>
                    <input type="text" id="team-edit-desc" class="profile-input" value="${teamData.description || ''}"
                           maxlength="60" placeholder="Kısa bir slogan...">
                </div>
                <div class="modal-field">
                    <label>Arma Rengi</label>
                    <div class="color-picker-row">
                        ${TEAM_ICON_COLORS.map(c => `
                            <div class="color-dot ${teamData.iconColor === c ? 'selected' : ''}"
                                 style="background:${c};"
                                 onclick="selectTeamColor('${c}')" title="${c}"></div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-field">
                    <label>Arma İkonu</label>
                    <div class="icon-picker-grid">
                        ${TEAM_ICONS.map(ic => `
                            <div class="icon-pick-item ${teamData.icon === ic.id ? 'selected' : ''}"
                                 onclick="selectTeamIcon('${ic.id}')"
                                 title="${ic.label}"
                                 id="icon-pick-${ic.id}">
                                <i class="fa-solid ${ic.id}" style="color:${teamData.iconColor};"></i>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-field">
                    <label>Kaptan</label>
                    <select id="team-edit-captain" class="profile-select">
                        ${(players||[]).map(p => `
                            <option value="${p.id}" ${p.id === teamData.captainId ? 'selected' : ''}>
                                ${p.name} (GEN ${calcPlayerGEN(p)})
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="modal-field">
                    <label>Sezon İstatistikleri</label>
                    <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:0.5rem;">
                        <div>
                            <label style="font-size:0.75rem;color:#666;">Maç</label>
                            <input type="number" id="team-stat-matches" class="profile-input"
                                   value="${teamData.seasonStats.matches}" min="0">
                        </div>
                        <div>
                            <label style="font-size:0.75rem;color:var(--neon-green);">Galibiyet</label>
                            <input type="number" id="team-stat-wins" class="profile-input"
                                   value="${teamData.seasonStats.wins}" min="0">
                        </div>
                        <div>
                            <label style="font-size:0.75rem;color:#aaa;">Beraberlik</label>
                            <input type="number" id="team-stat-draws" class="profile-input"
                                   value="${teamData.seasonStats.draws}" min="0">
                        </div>
                        <div>
                            <label style="font-size:0.75rem;color:var(--neon-pink);">Mağlubiyet</label>
                            <input type="number" id="team-stat-losses" class="profile-input"
                                   value="${teamData.seasonStats.losses}" min="0">
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-outline" onclick="closeTeamEditModal()">İptal</button>
                <button class="btn-primary" onclick="saveTeamEdit()"
                        style="background:var(--neon-green);color:black;">
                    <i class="fa-solid fa-floppy-disk"></i> Kaydet
                </button>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
};

window.selectTeamColor = function(color) {
    teamData.iconColor = color;
    // Update UI preview
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
    const dots = document.querySelectorAll('.color-dot');
    dots.forEach(d => { if (d.style.background === color || d.title === color) d.classList.add('selected'); });
    // Update icon previews
    document.querySelectorAll('.icon-pick-item i').forEach(i => { i.style.color = color; });
};

window.selectTeamIcon = function(iconId) {
    teamData.icon = iconId;
    document.querySelectorAll('.icon-pick-item').forEach(el => el.classList.remove('selected'));
    const item = document.getElementById(`icon-pick-${iconId}`);
    if (item) item.classList.add('selected');
};

window.closeTeamEditModal = function() {
    const modal = document.getElementById('team-edit-modal');
    if (modal) modal.style.display = 'none';
};

window.saveTeamEdit = function() {
    const name = document.getElementById('team-edit-name')?.value.trim();
    const desc = document.getElementById('team-edit-desc')?.value.trim();
    const captainId = document.getElementById('team-edit-captain')?.value;

    if (!name) return;

    teamData.name = name;
    teamData.description = desc;
    teamData.captainId = captainId;
    teamData.seasonStats.matches = parseInt(document.getElementById('team-stat-matches')?.value) || 0;
    teamData.seasonStats.wins    = parseInt(document.getElementById('team-stat-wins')?.value)    || 0;
    teamData.seasonStats.draws   = parseInt(document.getElementById('team-stat-draws')?.value)   || 0;
    teamData.seasonStats.losses  = parseInt(document.getElementById('team-stat-losses')?.value)  || 0;

    saveTeamData();
    closeTeamEditModal();
    renderTeamOverview();
};

// ──────────────────────────────────────────────────────
// 8. YARDIMCI FONKSİYONLAR
// ──────────────────────────────────────────────────────

window.viewPlayerFromTeam = function(playerId) {
    if (typeof activePlayerId !== 'undefined') {
        window.activePlayerId = playerId;
        localStorage.setItem('activePlayerId', playerId);
    }
    if (typeof updateUI === 'function') updateUI();
    if (typeof showSection === 'function') {
        showSection('profile');
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const pNav = document.querySelector('.nav-item[data-target="profile"]');
        if (pNav) pNav.classList.add('active');
    }
};

// Placeholder render functions — overridden by faz2-7.js (loaded after this file)
window.renderKadroTab        = function() {};
window.renderSahaTab         = function() {};
window.renderTakimOlusturTab = function() {};
window.renderRakiplerTab     = function() {};
window.renderOdemelerTab     = function() {};
window.renderSinerjiTab      = function() {};


// ──────────────────────────────────────────────────────
// 9. INIT
// ──────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // Load team data after main data is loaded
    setTimeout(() => {
        loadTeamData();
        // Ensure all player ids are in members if first run
        if (teamData.members.length === 0 && typeof players !== 'undefined') {
            teamData.members = players.map(p => p.id);
            teamData.coreSquad = players.slice(0, 7).map(p => p.id);
            saveTeamData();
        }
        // Pre-render team header for immediate display
        renderTeamOverview();
    }, 200);
});


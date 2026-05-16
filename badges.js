'use strict';

// ======================================================
// TIER ROZET SİSTEMİ — Badges.js
// window.Badges = { DEFS, compute, refresh, renderStrip, renderGrid }
// ======================================================

const _BADGE_DEFS = [
    {
        id: 'gol-makinesi',
        label: 'GOL MAKİNESİ',
        icon: 'fa-fire',
        bronzeAt: 5, silverAt: 10, goldAt: 20,
        bronzeDesc: 'Tek maçta 5 gol',
        silverDesc: 'Tek maçta 10 gol',
        goldDesc: 'Tek maçta 20+ gol',
        evaluate(history) {
            return history.reduce((max, r) => Math.max(max, r.goals || 0), 0);
        }
    },
    {
        id: 'asist-krali',
        label: 'ASİST KRALI',
        icon: 'fa-hands-helping',
        bronzeAt: 20, silverAt: 100, goldAt: 300,
        bronzeDesc: 'Toplamda 20 asist',
        silverDesc: 'Toplamda 100 asist',
        goldDesc: 'Toplamda 300 asist',
        evaluate(history, profile) {
            return profile.total_assists || 0;
        }
    },
    {
        id: 'seri-katil',
        label: 'SERİ KATİL',
        icon: 'fa-skull',
        bronzeAt: 5, silverAt: 10, goldAt: 20,
        bronzeDesc: '5 üst üste galibiyet',
        silverDesc: '10 üst üste galibiyet',
        goldDesc: '20 üst üste galibiyet',
        evaluate(history) {
            const sorted = [...history]
                .filter(r => r.match && r.match.scheduled_at)
                .sort((a, b) => new Date(a.match.scheduled_at) - new Date(b.match.scheduled_at));
            let max = 0, cur = 0;
            for (const r of sorted) {
                const hs = r.match.home_score ?? 0;
                const as_ = r.match.away_score ?? 0;
                const won = r.team_side === 'home' ? hs > as_ : as_ > hs;
                if (won) { cur++; if (cur > max) max = cur; }
                else cur = 0;
            }
            return max;
        }
    },
    {
        id: 'cigersiz',
        label: 'CİĞERSİZ',
        icon: 'fa-lungs',
        bronzeAt: 5, silverAt: 10, goldAt: 20,
        bronzeDesc: 'Bir ayda 5 maç',
        silverDesc: 'Bir ayda 10 maç',
        goldDesc: 'Bir ayda 20+ maç',
        evaluate(history) {
            const months = {};
            history.forEach(r => {
                const key = r.match && r.match.scheduled_at
                    ? r.match.scheduled_at.slice(0, 7)
                    : null;
                if (key) months[key] = (months[key] || 0) + 1;
            });
            const vals = Object.values(months);
            return vals.length ? Math.max(...vals) : 0;
        }
    },
    {
        id: 'sahanin-tapusu',
        label: 'SAHANIN TAPUSUNU ALAN',
        icon: 'fa-landmark',
        bronzeAt: 50, silverAt: 250, goldAt: 500,
        bronzeDesc: '50 maç tamamla',
        silverDesc: '250 maç tamamla',
        goldDesc: '500+ maç tamamla',
        evaluate(history, profile) {
            return profile.total_matches || 0;
        }
    },
    {
        id: 'geri-donus',
        label: 'GERİ DÖNÜŞÜN MİMARI',
        icon: 'fa-rotate-left',
        bronzeAt: 1, silverAt: 5, goldAt: 15,
        bronzeDesc: '1 kez geri dönüş',
        silverDesc: '5 kez geri dönüş',
        goldDesc: '15 kez geri dönüş',
        evaluate(history) {
            return history.filter(r => {
                if (!r.match) return false;
                const hs = r.match.home_score ?? 0;
                const as_ = r.match.away_score ?? 0;
                const isHome = r.team_side === 'home';
                const myScore = isHome ? hs : as_;
                const oppScore = isHome ? as_ : hs;
                return myScore > oppScore && oppScore >= 3;
            }).length;
        }
    },
    {
        id: 'gecit-yok',
        label: 'GEÇİT YOK',
        icon: 'fa-shield',
        bronzeAt: 10, silverAt: 50, goldAt: 100,
        bronzeDesc: '10 maç 0-1 gol yiyerek',
        silverDesc: '50 maç 0-1 gol yiyerek',
        goldDesc: '100 maç 0-1 gol yiyerek',
        evaluate(history) {
            return history.filter(r => {
                if (!r.match) return false;
                const conceded = r.team_side === 'home'
                    ? (r.match.away_score ?? 0)
                    : (r.match.home_score ?? 0);
                return conceded < 2;
            }).length;
        }
    },
    {
        id: 'gece-kurdu',
        label: 'GECE KURDU',
        icon: 'fa-moon',
        bronzeAt: 10, silverAt: 50, goldAt: 150,
        bronzeDesc: '10 gece maçı (22:00+)',
        silverDesc: '50 gece maçı',
        goldDesc: '150 gece maçı',
        evaluate(history) {
            return history.filter(r => {
                if (!r.match || !r.match.scheduled_at) return false;
                return new Date(r.match.scheduled_at).getHours() >= 22;
            }).length;
        }
    }
];

// ── Yardımcı fonksiyonlar ─────────────────────────────────────

function _deriveTier(current, b, s, g) {
    if (current >= g) return 'altin';
    if (current >= s) return 'gumus';
    if (current >= b) return 'bronz';
    return null;
}

function _getTooltip(current, def) {
    if (current >= def.goldAt) return null;
    if (current >= def.silverAt) return `Altın için ${def.goldAt - current} daha`;
    if (current >= def.bronzeAt) return `Gümüş için ${def.silverAt - current} daha`;
    return `Bronz için ${def.bronzeAt - current} daha`;
}

function _progressPct(current, def, tier) {
    if (tier === 'altin') return 100;
    if (tier === 'gumus') {
        return Math.min(100, Math.round(((current - def.silverAt) / (def.goldAt - def.silverAt)) * 100));
    }
    if (tier === 'bronz') {
        return Math.min(100, Math.round(((current - def.bronzeAt) / (def.silverAt - def.bronzeAt)) * 100));
    }
    return Math.min(100, Math.round((current / def.bronzeAt) * 100));
}

// ── compute ──────────────────────────────────────────────────

async function _compute(userId, profile) {
    let history = [];
    try {
        if (window.DB && window.DB.Matches) {
            history = await window.DB.Matches.getPlayerHistory(userId, 200);
        }
    } catch(e) {
        console.warn('[Badges] getPlayerHistory failed:', e);
    }
    const finished = history.filter(r => r.match && r.match.status === 'finished');

    return _BADGE_DEFS.map(def => {
        const current = def.evaluate(finished, profile || {});
        const tier = _deriveTier(current, def.bronzeAt, def.silverAt, def.goldAt);
        const tooltipText = _getTooltip(current, def);
        const pct = _progressPct(current, def, tier);
        return { ...def, current, tier, tooltipText, pct };
    });
}

// ── renderStrip — #badge-strip'e chip'ler ekle ────────────────

function _renderStrip(results) {
    const strip = document.getElementById('badge-strip');
    if (!strip) return;
    const old = strip.querySelector('.tb-strip-row');
    if (old) old.remove();

    const earned = results.filter(r => r.tier);
    if (!earned.length) return;

    const row = document.createElement('div');
    row.className = 'tb-strip-row';
    row.innerHTML = earned.map(r => `
        <div class="tier-badge-chip tb-${r.tier}" title="${r.label}${r.tooltipText ? ' — ' + r.tooltipText : ''}">
            <i class="fa-solid ${r.icon}"></i>
            <span>${_tierLabel(r.tier)}</span>
        </div>
    `).join('');
    strip.appendChild(row);
}

// ── renderGrid — #achievements-container'a section ekle ───────

function _renderGrid(results) {
    const container = document.getElementById('achievements-container');
    if (!container) return;

    const old = container.querySelector('.tb-section');
    if (old) old.remove();

    const section = document.createElement('div');
    section.className = 'tb-section';

    const bronzCount = results.filter(r => r.tier === 'bronz').length;
    const gumusCount = results.filter(r => r.tier === 'gumus').length;
    const altinCount = results.filter(r => r.tier === 'altin').length;
    const earnedCount = results.filter(r => r.tier).length;
    const total = results.length;
    const circumference = 150.8;
    const progress = Math.round((earnedCount / total) * circumference);

    section.innerHTML = `
        <div class="ach-banner glass-card">
            <div class="ach-banner-left">
                <div class="ach-banner-icon"><i class="fa-solid fa-medal"></i></div>
                <div>
                    <h2 class="ach-banner-title">BAŞARIM ROZETLERİ</h2>
                    <p class="ach-banner-sub">İstatistik bazlı tier rozet sistemi</p>
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
                            style="transition:stroke-dasharray 1s ease;"/>
                    </svg>
                    <div class="ach-ring-text">
                        <span class="ach-ring-num">${earnedCount}</span>
                        <span class="ach-ring-total">/ ${total}</span>
                    </div>
                </div>
                <div class="ach-stat-pills">
                    <div class="ach-pill" style="border-color:#cd7f32; color:#cd7f32;">🥉 ${bronzCount}</div>
                    <div class="ach-pill" style="border-color:#aaa; color:#aaa;">🥈 ${gumusCount}</div>
                    <div class="ach-pill" style="border-color:#adff2f; color:#adff2f;">🥇 ${altinCount}</div>
                </div>
            </div>
        </div>
        <div class="ach-category-section" style="margin-top:0.75rem;">
            <div class="ach-cards-grid">
                ${results.map(_renderCard).join('')}
            </div>
        </div>
    `;
    container.appendChild(section);
}

function _tierLabel(tier) {
    return { bronz: 'BRONZ', gumus: 'GÜMÜŞ', altin: 'ALTIN' }[tier] || 'KİLİTLİ';
}

function _tierIcon(tier) {
    return { bronz: '🥉', gumus: '🥈', altin: '🥇' }[tier] || '🔒';
}

function _renderCard(r) {
    const locked = !r.tier;
    const color = _tierColor(r.tier);

    // Mevcut kademeye göre açıklama
    let desc = r.bronzeDesc;
    if (r.tier === 'gumus') desc = r.silverDesc;
    else if (r.tier === 'altin') desc = r.goldDesc;

    const hint = locked
        ? (r.tooltipText || `Bronz için ${r.bronzeAt} gerekli`)
        : (r.tooltipText || (r.tier === 'altin' ? 'En yüksek kademe! 🏆' : null));

    return `
        <div class="ach-card ${locked ? 'ach-locked' : 'ach-unlocked'} ${r.tier ? `ach-tier-${r.tier}` : ''}">
            ${!locked ? `<div class="ach-card-glow" style="background:radial-gradient(circle,${color}33 0%,transparent 70%);"></div>` : ''}
            <div class="ach-card-top">
                <div class="ach-card-icon" style="${!locked ? `color:${color};` : 'color:#444;'}">
                    <i class="fa-solid ${r.icon}"></i>
                </div>
                ${!locked
                    ? `<div class="ach-status-badge ach-status-unlock"><i class="fa-solid fa-check"></i></div>`
                    : `<div class="ach-status-badge ach-status-lock"><i class="fa-solid fa-lock"></i></div>`}
            </div>
            <div class="ach-card-body">
                <h4 class="ach-card-title" style="${!locked ? `color:${color}` : 'color:#555'}">${r.label}</h4>
                <p class="ach-card-desc">${desc}</p>
                ${!locked
                    ? `<div class="ach-card-hint" style="color:${color}; border-color:${color}33;"><i class="fa-solid fa-chart-bar"></i> ${r.current.toLocaleString('tr-TR')} · ${_tierLabel(r.tier)}</div>`
                    : hint ? `<div class="ach-card-hint"><i class="fa-solid fa-circle-info"></i> ${hint}</div>` : ''}
            </div>
            ${!locked ? `<div class="ach-tier-stamp">${_tierIcon(r.tier)}</div>` : ''}
        </div>
    `;
}

function _tierColor(tier) {
    return { bronz: '#CD7F32', gumus: '#A8A9AD', altin: '#adff2f' }[tier] || '#444';
}

// ── Public API ────────────────────────────────────────────────

async function _refresh(userId, profile) {
    if (!userId) return;
    try {
        const results = await _compute(userId, profile);
        _renderStrip(results);
        _renderGrid(results);
    } catch(e) {
        console.error('[Badges] refresh error:', e);
    }
}

window.Badges = {
    DEFS: _BADGE_DEFS,
    compute: _compute,
    refresh: _refresh,
    renderStrip: _renderStrip,
    renderGrid: _renderGrid,
};

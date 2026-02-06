
// ======================================================
// SOSYAL SPORCU MANAGER - CORE SCRIPT
// ======================================================

// 1. GLOBAL STATE & DATA
// ======================================================
let activePlayerId = 'p1';
const DEFAULT_PLAYER = {
    id: 'new',
    name: 'Yeni Oyuncu',
    details: {
        pos: 'OS', age: 24, height: 180, weight: 75,
        ekol: 'Halısaha Gazisi', sakatlik: 'Maç Seçer',
        macsatma: 'Keyfine Bağlı', mizac: 'Makara Yapıcı', lojistik: 'Kendi Gelir'
    },
    ratings: { teknik: 70, sut: 70, pas: 70, hiz: 70, fizik: 70, kondisyon: 70 }
};

// Initial Mock Data (If LocalStorage Empty)
// Initial Data Loading (Strict LocalStorage Priority)
let rawData = localStorage.getItem('ss_players');
let players = [];

if (rawData && rawData !== "undefined" && rawData !== "null") {
    try {
        players = JSON.parse(rawData);
        console.log("📂 Loaded from LocalStorage:", players.length, "players");
    } catch (e) {
        console.error("Corruption detected in LS, falling back to mock", e);
        players = []; // Will trigger mock load below
    }
}

// Fallback to Mock if empty
if (!players || players.length === 0) {
    console.log("⚠️ Storage empty, initializing Mock Data");
    players = [
        {
            id: 'p1', name: 'Mikimon',
            details: { pos: 'OS', age: 24, height: 182, weight: 76, ekol: 'Halısaha Gazisi', sakatlik: 'Maç Seçer', macsatma: 'Keyfine Bağlı', mizac: 'Makara Yapıcı', lojistik: 'Kendi Gelir' },
            ratings: { teknik: 85, sut: 80, pas: 90, hiz: 78, fizik: 65, kondisyon: 75 }
        },
        {
            id: 'p2', name: 'Barış',
            details: { pos: 'FV', age: 26, height: 185, weight: 80, ekol: 'Eski Lisanslı', sakatlik: 'Beton Gibi', macsatma: 'Asla Satmaz', mizac: 'Sessiz Katil', lojistik: 'Yolcu' },
            ratings: { teknik: 75, sut: 88, pas: 70, hiz: 82, fizik: 85, kondisyon: 80 }
        }
    ];
    savePlayers(); // Save initial mock state
}

function savePlayers() {
    localStorage.setItem('ss_players', JSON.stringify(players));
}


// 2. INITIALIZATION & NAVIGATION
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 App Initializing...');

    // Load last active player
    const lastId = localStorage.getItem('activePlayerId');
    if (lastId && players.find(p => p.id === lastId)) {
        activePlayerId = lastId;
    }

    // Initialize Navigation
    setupNavigation();

    // Initial Render
    updateUI();         // Render Profile
    renderPlayerList(); // Render Team Table
});

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // 1. Handle Active Class on Nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // 2. Get Target Section ID
            const targetId = item.getAttribute('data-target');

            // 3. Switch Section
            showSection(targetId);
        });
    });
}

function showSection(id) {
    // 1. Force Hide All Sections (Reset)
    document.querySelectorAll('.section').forEach(sec => {
        sec.style.display = 'none';      // HARD RESET
        sec.classList.remove('active');
    });

    // 2. Force Show Target
    const targetSec = document.getElementById(id);
    if (targetSec) {
        targetSec.style.display = 'block'; // FORCE VISIBLE
        // Force Reflow
        void targetSec.offsetWidth;
        targetSec.classList.add('active');
    } else {
        console.error(`❌ Section not found: #${id}`);
        return;
    }

    // 3. Data Triggers (CRITICAL)
    if (id === 'takimim') {
        console.log("⚡ Rendering Player List...");
        renderPlayerList();
    }

    if (id === 'profile') {
        setTimeout(() => {
            const player = players.find(p => p.id === activePlayerId) || players[0];
            updateChart(player); // Sekme açıldıktan 100ms sonra zorla çiz
        }, 100);
    }
}


// 3. PROFILE LOGIC (RICH FEATURES)
// ======================================================

// Tab Switching (Sub-tabs within Profile)
window.switchProfileTab = function (tabId) {
    // Hide all subtabs
    document.querySelectorAll('.profile-subtab').forEach(el => el.style.display = 'none');

    // Deactivate all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    // Show target
    const target = document.getElementById(tabId);
    if (target) {
        target.style.display = 'block';
    }

    // Activate specific button
    // (Simple lookup based on onclick attribute text)
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(b => {
        if (b.getAttribute('onclick').includes(tabId)) b.classList.add('active');
    });

    if (tabId === 'tab-genel') {
        setTimeout(() => {
            if (window.updateChart && activePlayerId) {
                const player = players.find(p => p.id === activePlayerId);
                if (player) updateChart(player);
            }
        }, 50);
    }
};

// Main UI Update Function (Preserves Rich Visuals)
window.updateUI = function () {
    const player = players.find(p => p.id === activePlayerId) || players[0];
    if (!player) return;

    // --- Header ---
    document.getElementById('player-name').textContent = player.name;
    document.getElementById('profile-avatar').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`;
    document.getElementById('disp-age-header').innerHTML = `<i class="fa-solid fa-cake-candles"></i> ${player.details.age} Yaş`;

    // --- Value Calculation ---
    const totalRating = Object.values(player.ratings).reduce((a, b) => a + b, 0);
    const avg = Math.round(totalRating / 6);
    const value = (totalRating * 200000) * (avg > 80 ? 1.5 : 1);
    document.getElementById('market-value').textContent = `€${(value / 1000000).toFixed(1)}M`;
    document.getElementById('overall-rating-disp').textContent = avg;

    // --- Stats & Inputs ---
    document.getElementById('disp-height-gb').textContent = `${player.details.height} cm`;
    document.getElementById('disp-weight-gb').textContent = `${player.details.weight} kg`;

    // Fill Inputs (if they exist in DOM)
    setVal('inp-age', player.details.age);
    setVal('inp-height', player.details.height);
    setVal('inp-weight', player.details.weight);
    setVal('sel-ekol', player.details.ekol);
    setVal('sel-sakatlik', player.details.sakatlik);
    setVal('sel-macsatma', player.details.macsatma);
    setVal('sel-mizac', player.details.mizac);
    setVal('sel-lojistik', player.details.lojistik);

    // Update Sliders
    for (const [key, val] of Object.entries(player.ratings)) {
        setVal(`rate-${key}`, val);
        setText(`disp-rate-${key}`, val);
    }

    // --- Chart ---
    try {
        updateChart(player);
    } catch (e) {
        console.error("Chart Update Failed:", e);
    }

    // --- Skills ---
    try {
        checkSkillUnlocks(player, avg);
    } catch (e) {
        console.error("Skill Unlock Check Failed:", e);
    }

    // Reset Save Button State on Player Switch/Load
    const btnSave = document.getElementById('btn-save-ratings');
    // Only reset if it's NOT in the middle of a "Saved" success animation
    if (btnSave && btnSave.innerHTML.includes('KAYDET')) {
        btnSave.disabled = true;
        btnSave.style.background = '#333';
        btnSave.style.color = '#777';
        btnSave.style.cursor = 'not-allowed';
        btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> KAYDET';
    }
};

// Helper to set value safely
function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}
function setText(id, txt) {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
}

// Chart.js Logic (ROBUST)
function updateChart(player) {
    const ctx = document.getElementById('profileChart');
    // 1. Visibility Check enforced by HTML styles now, but safe check:
    if (!ctx) return;

    // Ensure Chart library is loaded
    if (typeof Chart === 'undefined') {
        console.error("Chart.js not loaded!");
        return;
    }

    const dataValues = [
        player.ratings.teknik,
        player.ratings.sut,
        player.ratings.pas,
        player.ratings.hiz,
        player.ratings.fizik,
        player.ratings.kondisyon
    ];

    if (window.profileChartInstance) {
        // Update existing instance
        window.profileChartInstance.data.datasets[0].data = dataValues;
        window.profileChartInstance.update();
        window.profileChartInstance.resize(); // CRITICAL FIX
    } else {
        // Create new instance
        window.profileChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Teknik', 'Şut', 'Pas', 'Hız', 'Fizik', 'Kondiyon'],
                datasets: [{
                    label: 'Yetenekler',
                    data: dataValues,
                    backgroundColor: 'rgba(173, 255, 47, 0.2)',
                    borderColor: '#adff2f',
                    borderWidth: 2,
                    pointBackgroundColor: '#adff2f'
                }]
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
                        ticks: {
                            display: false,
                            beginAtZero: true,
                            max: 100
                        }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
}

// Skill Unlocking
function checkSkillUnlocks(player, avg) {
    const skills = [
        { id: 'sc-maestro', check: player.ratings.pas > 85 },
        { id: 'sc-tank', check: player.ratings.fizik > 85 },
        { id: 'sc-makina', check: avg > 88 },
        { id: 'sc-flash', check: player.ratings.hiz > 85 }
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

// Data Sync (from inputs)
// Data Sync (from inputs)
window.syncProfileData = function () {
    const player = players.find(p => p.id === activePlayerId);
    if (!player) return;

    // Read all inputs safely
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : null;
    };

    // Update Player Data
    player.details.age = getVal('inp-age') || player.details.age;
    player.details.height = getVal('inp-height') || player.details.height;
    player.details.weight = getVal('inp-weight') || player.details.weight;

    player.details.ekol = getVal('sel-ekol') || player.details.ekol;
    player.details.sakatlik = getVal('sel-sakatlik') || player.details.sakatlik;

    player.details.macsatma = getVal('sel-macsatma') || player.details.macsatma;
    player.details.mizac = getVal('sel-mizac') || player.details.mizac;
    player.details.lojistik = getVal('sel-lojistik') || player.details.lojistik;

    console.log("💾 Synced Profile Data:", player.details);
    savePlayers();

    // Update Header UI immediately (e.g. Age might be in header)
    document.getElementById('disp-age-header').innerHTML = `<i class="fa-solid fa-cake-candles"></i> ${player.details.age} Yaş`;
    // updateUI(); // Recursion risk? No, but let's just update header specific parts or efficient re-render
    // Actually updateUI is safe here
    // updateUI(); 
};

window.updateRateDisp = function (type, val) {
    document.getElementById(`disp-rate-${type}`).innerText = val;
    const btn = document.getElementById('btn-save-ratings');
    if (btn) {
        btn.disabled = false;
        btn.style.background = 'var(--neon-green)'; // Neon active
        btn.style.color = 'black';
        btn.style.cursor = 'pointer';
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> KAYDET'; // Reset text if was "Saved"
    }
}

window.saveRatings = function () {
    const player = players.find(p => p.id === activePlayerId);
    if (!player) return;

    // 1. Capture Data
    const types = ['teknik', 'sut', 'pas', 'hiz', 'fizik', 'kondisyon'];
    types.forEach(t => {
        const input = document.getElementById(`rate-${t}`);
        if (input) player.ratings[t] = parseInt(input.value);
    });

    // 2. Save to Storage
    savePlayers();

    // 3. FORCE VISUAL FEEDBACK (Priority 1)
    const btn = document.getElementById('btn-save-ratings');
    if (btn) {
        btn.innerHTML = '✅ KAYDEDİLDİ';
        btn.disabled = true;
        btn.style.setProperty('background-color', 'var(--neon-green)', 'important');
        btn.style.color = 'black';
        btn.style.cursor = 'default';

        // Schedule reset
        setTimeout(() => {
            btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> KAYDET';
            btn.disabled = true;
            btn.style.background = '#333';
            btn.style.color = '#777';
            btn.style.cursor = 'not-allowed';
        }, 1500);
    }


    // 4. Update UI (Priority 2 - Wrapped to prevent crashing)
    try {
        updateUI();
        renderPlayerList();
    } catch (e) {
        console.error("UI Refresh Error:", e);
    }
}

// MANUAL SAVE DETAILS BUTTON
window.saveProfileDetails = function () {
    const player = players.find(p => p.id === activePlayerId);
    if (!player) return alert("Oyuncu bulunamadı!");

    // Capture All Inputs
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : null;
    };

    // Update Player Object
    player.details.age = getVal('inp-age') || player.details.age;
    player.details.height = getVal('inp-height') || player.details.height;
    player.details.weight = getVal('inp-weight') || player.details.weight;

    player.details.ekol = getVal('sel-ekol') || player.details.ekol;
    player.details.sakatlik = getVal('sel-sakatlik') || player.details.sakatlik;

    player.details.macsatma = getVal('sel-macsatma') || player.details.macsatma;
    player.details.mizac = getVal('sel-mizac') || player.details.mizac;
    player.details.lojistik = getVal('sel-lojistik') || player.details.lojistik;

    // Save to LocalStorage
    savePlayers();

    // Visual Feedback
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

    // Refresh Headers
    updateUI();
};


// 4. TEAM MANAGEMENT
// 4. TEAM MANAGEMENT
// ======================================================

function renderPlayerList() {
    const tbody = document.getElementById('player-list-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    players.forEach(p => {
        // Calculate GEN
        const vals = Object.values(p.ratings);
        const gen = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);

        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #333';
        tr.style.cursor = 'pointer';

        // Highlight active
        if (p.id === activePlayerId) {
            tr.style.background = 'rgba(173, 255, 47, 0.1)';
        }

        // Click Handler -> Update Global State & Navigate
        tr.onclick = () => {
            activePlayerId = p.id;
            localStorage.setItem('activePlayerId', p.id);

            // 1. Update Profile Data
            updateUI();
            renderPlayerList(); // Update highlights

            // 2. Auto-Navigate to Profile
            showSection('profile');

            // 3. Update Nav UI
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            const profileNav = document.querySelector('.nav-item[data-target="profile"]');
            if (profileNav) profileNav.classList.add('active');
        };

        // Make Row Draggable
        tr.draggable = true;
        tr.ondragstart = (e) => {
            e.dataTransfer.setData("text/plain", p.id);
            e.dataTransfer.effectAllowed = "copy";
        };

        tr.innerHTML = `
            <td style="padding:10px; display:flex; align-items:center; gap:10px;">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}" style="width:32px; height:32px; border-radius:50%; background:#222;">
                <span style="font-weight:600; color:#eee;">${p.name}</span>
            </td>
            <td>
                <!-- Position Select -->
                <select class="pos-select" onclick="event.stopPropagation()" onchange="updatePlayerPos('${p.id}', this.value)">
                    <option value="KL" ${p.details.pos === 'KL' ? 'selected' : ''}>KL</option>
                    <option value="DEF" ${p.details.pos === 'DEF' ? 'selected' : ''}>DEF</option>
                    <option value="OS" ${p.details.pos === 'OS' ? 'selected' : ''}>OS</option>
                    <option value="FV" ${p.details.pos === 'FV' ? 'selected' : ''}>FV</option>
                </select>
            </td>
            <td>
                <span style="color:${gen >= 80 ? 'var(--neon-green)' : 'orange'}">
                ${gen >= 80 ? '🔥' : '⚡'}
                </span>
            </td>
            <td>
                 <span style="font-weight:800; color:var(--neon-green); font-size:1.1rem;">${gen}</span>
            </td>
            <td style="text-align:center;">
                <!-- Red Delete Icon -->
                <i class="fa-solid fa-circle-xmark" 
                   style="color:#ff4444; cursor:pointer; font-size:1.2rem; transition: transform 0.2s;" 
                   onmouseover="this.style.transform='scale(1.2)'" 
                   onmouseout="this.style.transform='scale(1)'"
                   onclick="event.stopPropagation(); deletePlayer('${p.id}')"></i>
            </td>
        `;
        tbody.appendChild(tr);
    });
}


// --- DRAG AND DROP ENGINE ---
window.allowDrop = function (e) {
    e.preventDefault();
};

window.handleDrop = function (e) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;

    // ROBUST COORDINATE CALCULATION
    const pitch = document.querySelector('.pitch-container');
    const rect = pitch.getBoundingClientRect();

    // Calculate relative to Pitch Container (regardless of what child element was dropped on)
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check bounds (optional, but good for safety)
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

    // Add to Visuals
    addToPitch(id, x, y);

    // SAVE STATE
    const player = players.find(p => p.id === id);
    if (player) {
        player.pitchPos = { left: x, top: y };
        savePlayers();
    }
};

window.addToPitch = function (id, x, y) {
    const player = players.find(p => p.id === id);
    if (!player) return;

    const pitch = document.querySelector('.pitch-container');

    // Check if token already exists? Maybe allow duplicates for tactics board visual
    // or remove existing one. Let's allow duplicates for now or just append.

    const token = document.createElement('div');
    token.className = 'pitch-player-token';

    // Direct Placement (Expects Top-Left coordinates)
    token.style.left = (x !== undefined ? x : 50) + 'px';
    token.style.top = (y !== undefined ? y : 50) + 'px';

    // Default position if dropped without coords (e.g. click)
    // Note: handleDrop ensures coords are passed.
    if (x === undefined) {
        token.style.top = '50%';
        token.style.left = '50%';
        token.style.transform = 'translate(-50%, -50%)'; // Center only default
    }

    token.innerHTML = `
        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}" class="token-avatar">
        <span class="token-name">${player.name} (${player.details.pos})</span>
    `;

    // Make Token Draggable (within pitch)
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    token.onmousedown = function (e) {
        e.preventDefault();
        e.stopPropagation(); // Prevent pitch drop? No, preventing default drag
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = token.offsetLeft;
        initialTop = token.offsetTop;
        token.style.cursor = 'grabbing';
        token.style.zIndex = 1000;
        token.style.transform = 'scale(1.1)';
    };

    // Attach mousemove to document to prevent losing focus
    const mouseMoveHandler = function (e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        token.style.left = `${initialLeft + dx}px`;
        token.style.top = `${initialTop + dy}px`;
    };

    const mouseUpHandler = function () {
        if (isDragging) {
            isDragging = false;
            token.style.cursor = 'grab';
            token.style.zIndex = 10;
            token.style.transform = 'scale(1)';

            // CHECK BOUNDS for REMOVAL ("Çekip Bırakarak Kaldırma")
            const pitchRect = pitch.getBoundingClientRect();
            const tokenRect = token.getBoundingClientRect();

            // Check if center of token is outside pitch
            const centerX = tokenRect.left + tokenRect.width / 2;
            const centerY = tokenRect.top + tokenRect.height / 2;

            if (
                centerX < pitchRect.left ||
                centerX > pitchRect.right ||
                centerY < pitchRect.top ||
                centerY > pitchRect.bottom
            ) {
                // Remove Token
                token.remove();
                document.removeEventListener('mousemove', mouseMoveHandler);
                document.removeEventListener('mouseup', mouseUpHandler);
            }
        }
    };

    // We can attach these globally or to the pitch. 
    // Document level is safer for smooth dragging.
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);

    // Double click to remove from pitch
    token.ondblclick = function () {
        token.remove();
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };

    pitch.appendChild(token);
};




// --- TEAM MANAGEMENT ACTIONS ---

window.deletePlayer = function (id) {
    if (id === 'p1' || (players.length > 0 && id === players[0].id)) {
        return alert("Ana karakteri (Mikimon) takımdan kovamazsın!");
    }

    if (confirm("Bu oyuncuyu takımdan silmek istediğine emin misiniz?")) {
        // Remove from array
        players = players.filter(p => p.id !== id);

        // Reset active if needed
        if (activePlayerId === id) {
            activePlayerId = players[0] ? players[0].id : null;
        }

        savePlayers();
        renderPlayerList();
        updateUI();
    }
};

window.updatePlayerPos = function (id, newPos) {
    const player = players.find(p => p.id === id);
    if (player) {
        player.details.pos = newPos;
        savePlayers();
        console.log(`Position updated: ${player.name} -> ${newPos}`);

        // If modified player is currently viewed, update profile header/data
        if (activePlayerId === id) {
            updateUI();
        }
    }
};

window.addNewPlayer = function () {
    const name = document.getElementById('new-player-name').value;
    if (!name) return alert("İsim giriniz");

    const newP = JSON.parse(JSON.stringify(DEFAULT_PLAYER));
    newP.id = 'p_' + Date.now();
    newP.name = name;
    newP.details.pos = document.getElementById('new-player-pos').value;

    // Randomize stats
    Object.keys(newP.ratings).forEach(k => newP.ratings[k] = 50 + Math.floor(Math.random() * 40));

    players.push(newP);
    savePlayers();
    renderPlayerList();
    document.getElementById('new-player-name').value = '';
    alert("Oyuncu eklendi!");
};

// --- RESTORE PITCH ---
window.restorePitchState = function () {
    const pitch = document.querySelector('.pitch-container');
    if (!pitch) return;

    // Clear tokens
    document.querySelectorAll('.pitch-player-token').forEach(t => t.remove());

    let restoredCount = 0;

    // Safety Bounds (Pitch Size approx)
    const MAX_W = 1200;
    const MAX_H = 1200;

    players.forEach(p => {
        if (p.pitchPos && p.pitchPos.left !== undefined) {
            let x = parseFloat(p.pitchPos.left);
            let y = parseFloat(p.pitchPos.top);

            // AGGRESSIVE SANITIZATION
            // If data is weird (NaN, negative, or huge), DELETE IT.
            if (isNaN(x) || isNaN(y) || x < -20 || y < -20 || x > MAX_W || y > MAX_H) {
                console.warn(`🗑️ Corrupted Pos for ${p.name} (${x},${y}) -> DELETING`);
                delete p.pitchPos;
            } else {
                addToPitch(p.id, x, y);
                restoredCount++;
            }
        }
    });

    // Always save to clean up deleted corrupted entries
    savePlayers();
    console.log(`✅ Restored ${restoredCount} players.`);
};



// Auto-restore on load (delayed to ensure DOM and Data)
setTimeout(() => {
    restorePitchState();
    // Re-run once more in case of slow rendering or layout shifts
    setTimeout(restorePitchState, 1000);
}, 300);

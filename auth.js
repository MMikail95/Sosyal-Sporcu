// =====================================================
// AUTH.JS — FAZ 1: Kimlik Doğrulama Yönetimi
// Supabase Auth entegrasyonu
// =====================================================

'use strict';

// --------- YARDIMCI DEĞİŞKENLER ---------
let selectedPosition = 'OS';
let usernameCheckTimer = null;
let currentUser = null;

// --------- BAŞLANGIÇ: OTURUM KONTROLÜ ---------

async function initAuth() {
  const sb = window.sbClient;

  // Oturum var mı kontrol et
  const { data: { session } } = await sb.auth.getSession();

  if (session) {
    // Zaten giriş yapılmış → ana uygulamaya yönlendir
    window.location.replace('index.html');
    return;
  }

  // Oturum yok → auth sayfasını göster
  hideLoading();

  // Auth state değişikliklerini dinle
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      window.location.replace('index.html');
    }
  });
}

// --------- PANEL GEÇİŞ ---------

window.switchAuthTab = function(tab) {
  clearMessage();

  // Panel'leri güncelle
  document.getElementById('panel-giris').classList.toggle('active', tab === 'giris');
  document.getElementById('panel-kayit').classList.toggle('active', tab === 'kayit');

  // Tab butonlarını güncelle
  document.getElementById('tab-giris-btn').classList.toggle('active', tab === 'giris');
  document.getElementById('tab-kayit-btn').classList.toggle('active', tab === 'kayit');

  // Formu sıfırla
  clearMessage();
};

// --------- GİRİŞ ---------

window.handleLogin = async function(e) {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showMessage('E-posta ve şifre alanları boş bırakılamaz.', 'error');
    return;
  }

  setLoading('btn-login', true);
  clearMessage();

  try {
    const { data, error } = await window.sbClient.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Başarılı giriş — onAuthStateChange yönlendirir
    showMessage('✅ Giriş başarılı! Yükleniyor...', 'success');

  } catch (error) {
    setLoading('btn-login', false);
    const msg = translateError(error.message);
    showMessage(`❌ ${msg}`, 'error');
    console.error('Login error:', error);
  }
};

// --------- KAYIT ---------

window.handleRegister = async function(e) {
  e.preventDefault();

  const username = document.getElementById('reg-username').value.trim().toLowerCase();
  const fullName = document.getElementById('reg-fullname').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  // Validasyon
  if (!username || !fullName || !email || !password) {
    showMessage('Tüm alanları doldurun.', 'error');
    return;
  }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    showMessage('Kullanıcı adı: sadece harf, rakam ve _ (3-20 karakter)', 'error');
    return;
  }
  if (password.length < 6) {
    showMessage('Şifre en az 6 karakter olmalıdır.', 'error');
    return;
  }

  // Username müsait mi kontrol et
  const sbClient = window.sbClient;
  const { data: existing } = await sbClient
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (existing) {
    showMessage('❌ Bu kullanıcı adı zaten alınmış.', 'error');
    return;
  }

  setLoading('btn-register', true);
  clearMessage();

  try {
    const { data, error } = await sbClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName
        }
      }
    });

    if (error) throw error;

    // Başarılı kayıt
    currentUser = data.user;
    showOnboarding();

  } catch (error) {
    setLoading('btn-register', false);
    const msg = translateError(error.message);
    showMessage(`❌ ${msg}`, 'error');
    console.error('Register error:', error);
  }
};

// --------- ŞİFRE SIFIRLA ---------

window.handleForgotPassword = async function(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();

  if (!email) {
    showMessage('Şifre sıfırlamak için e-posta adresinizi girin.', 'error');
    return;
  }

  try {
    const { error } = await window.sbClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth.html'
    });
    if (error) throw error;
    showMessage(`✅ Şifre sıfırlama bağlantısı ${email} adresine gönderildi.`, 'success');
  } catch (error) {
    showMessage(`❌ ${translateError(error.message)}`, 'error');
  }
};

// --------- ONBOARDING ---------

function showOnboarding() {
  // Tabları ve formları gizle
  document.getElementById('auth-tabs').style.display = 'none';
  document.getElementById('panel-giris').classList.remove('active');
  document.getElementById('panel-kayit').classList.remove('active');
  document.getElementById('auth-message').className = 'auth-message';

  // Onboarding panelini göster
  document.getElementById('panel-onboarding').style.display = 'block';
}

window.selectPosition = function(pos, el) {
  selectedPosition = pos;
  document.querySelectorAll('.pos-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
};

window.completeOnboarding = async function() {
  const city = document.getElementById('onb-city').value.trim() || 'İstanbul';
  const sbClient = window.sbClient;

  // Oturum al (yeni kayıt olunmuş kullanıcı)
  const { data: { session } } = await sbClient.auth.getSession();
  const userId = session?.user?.id || currentUser?.id;

  if (!userId) {
    // Onboarding'i geç, yine de yönlendir
    window.location.replace('index.html');
    return;
  }

  try {
    // Profili güncelle (position + city)
    await sbClient
      .from('profiles')
      .update({
        position: selectedPosition,
        city: city,
        ana_mevki: getDefaultMevki(selectedPosition),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
  } catch (err) {
    console.error('Onboarding update error:', err);
  }

  // Ana sayfaya yönlendir
  window.location.replace('index.html');
};

function getDefaultMevki(pos) {
  const map = {
    KL:  'Kaleci',
    DEF: 'Stoper',
    OS:  'Ofansif OS (10 Numara)',
    FV:  'Santrafor (9 Numara)'
  };
  return map[pos] || 'Ofansif OS (10 Numara)';
}

// --------- KULLANICI ADI KONTROLÜ ---------

window.checkUsernameAvailability = function(value) {
  clearTimeout(usernameCheckTimer);
  const checkEl = document.getElementById('username-check');
  const errEl   = document.getElementById('err-username');

  if (value.length < 3) {
    checkEl.textContent = '';
    errEl.classList.remove('show');
    return;
  }

  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    checkEl.innerHTML = '<span style="color:#ff4d4d">✗</span>';
    errEl.classList.add('show');
    return;
  }
  errEl.classList.remove('show');
  checkEl.innerHTML = '<span style="color:#888">...</span>';

  usernameCheckTimer = setTimeout(async () => {
    try {
      const { data } = await window.sbClient
        .from('profiles')
        .select('id')
        .eq('username', value.toLowerCase())
        .maybeSingle();

      if (data) {
        checkEl.innerHTML = '<span style="color:#ff4d4d">✗ Alınmış</span>';
      } else {
        checkEl.innerHTML = '<span style="color:#adff2f">✓ Müsait</span>';
      }
    } catch { checkEl.textContent = ''; }
  }, 600);
};

// --------- ŞİFRE GÜÇLENDİRİCİ ---------

window.updatePasswordStrength = function(password) {
  const bars  = [1, 2, 3, 4].map(n => document.getElementById(`str-${n}`));
  const score = getPasswordScore(password);

  bars.forEach((bar, i) => {
    bar.className = 'strength-bar';
    if (i < score) {
      bar.classList.add(score <= 1 ? 'weak' : score <= 2 ? 'medium' : 'strong');
    }
  });
};

function getPasswordScore(pwd) {
  let score = 0;
  if (pwd.length >= 6)  score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd) || /[^a-zA-Z0-9]/.test(pwd)) score++;
  return score;
}

// --------- ŞIFRE GÖR/GİZLE ---------

window.togglePassword = function(inputId, btn) {
  const input = document.getElementById(inputId);
  const icon  = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fa-solid fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fa-solid fa-eye';
  }
};

// --------- UI YARDIMCILARI ---------

function setLoading(btnId, isLoading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = isLoading;
  btn.classList.toggle('loading', isLoading);
}

function showMessage(msg, type) {
  const el = document.getElementById('auth-message');
  el.innerHTML = `<i class="fa-solid fa-${type === 'error' ? 'circle-exclamation' : 'circle-check'}"></i> ${msg}`;
  el.className = `auth-message ${type}`;
  // Success mesajı 5 saniye sonra kaybolsun
  if (type === 'success') {
    setTimeout(() => { if (el.className.includes('success')) clearMessage(); }, 5000);
  }
}

function clearMessage() {
  const el = document.getElementById('auth-message');
  el.className = 'auth-message';
  el.textContent = '';
}

function hideLoading() {
  const loadEl = document.getElementById('auth-loading');
  const cardEl = document.getElementById('auth-card');
  if (loadEl) loadEl.style.display = 'none';
  if (cardEl) cardEl.style.display = 'block';
}

function translateError(message) {
  const map = {
    'Invalid login credentials': 'E-posta veya şifre hatalı.',
    'Email not confirmed': 'E-posta adresinizi doğrulayın.',
    'User already registered': 'Bu e-posta zaten kayıtlı.',
    'Password should be at least 6 characters': 'Şifre en az 6 karakter olmalı.',
    'Unable to validate email address: invalid format': 'Geçersiz e-posta formatı.',
    'Email rate limit exceeded': 'Çok fazla deneme. Lütfen bekleyin.',
    'signup_disabled': 'Kayıt şu an devre dışı.',
    'over_email_send_rate_limit': 'Çok fazla istek. Lütfen bekleyin.',
  };
  for (const [key, val] of Object.entries(map)) {
    if (message.includes(key)) return val;
  }
  return message || 'Beklenmeyen bir hata oluştu.';
}

// --------- BAŞLAT ---------
initAuth();

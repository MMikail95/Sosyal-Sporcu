// =====================================================
// moderation.js — İçerik Moderasyonu (CLIENT / UX katmanı)
//
// ⚠️ ÖNEMLİ: Bu dosya SADECE hızlı, kullanıcı dostu ön uyarı verir.
//    Gerçek zorlama Postgres trigger'larındadır (moderation-migration.sql).
//    Buradaki tüm kontroller tarayıcı konsolundan atlanabilir; DB katmanı
//    (banned_words / reserved_usernames / banned_domains + trigger) atlanamaz.
//    Kural (bkz. CLAUDE.md, trg_protect_profile_privileged_columns dersi):
//    client-side filtre = UX, DB trigger = güvenlik.
//
// Yalnız window.sbClient'e bağlıdır → hem index.html hem auth.html'de çalışır
// (auth.html'de db.js yüklü değildir).
// =====================================================
(function () {
  'use strict';

  // --- Karakter katlama: Türkçe + leetspeak + küçük harf --------------------
  // DB'deki public.moderation_fold() ile AYNI mantık.
  const TR_MAP = {
    'ç':'c','Ç':'c','ğ':'g','Ğ':'g','ı':'i','I':'i','İ':'i',
    'ö':'o','Ö':'o','ş':'s','Ş':'s','ü':'u','Ü':'u',
    'â':'a','Â':'a','î':'i','Î':'i','û':'u','Û':'u'
  };
  const LEET_MAP = { '0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','8':'b','@':'a','$':'s' };

  function foldChars(str) {
    let out = '';
    for (const ch of String(str || '')) {
      if (TR_MAP[ch] != null) { out += TR_MAP[ch]; continue; }
      const low = ch.toLowerCase();
      if (TR_MAP[low] != null) out += TR_MAP[low];
      else if (LEET_MAP[low] != null) out += LEET_MAP[low];
      else out += low;
    }
    return out;
  }

  // Boşluk korumalı → kelime (token) eşleştirme için
  function normalizeSpaced(str) {
    return foldChars(str).replace(/[^a-z0-9]+/g, ' ').trim();
  }

  // Kompakt: tüm ayraçları sil + tekrar eden karakteri tek'e indir
  // ("s.i.k.t.i.r" / "s i k t i r" / "siiiktir" → "siktir") → substring eşleştirme
  function normalizeCompact(str) {
    return foldChars(str)
      .replace(/[^a-z0-9]+/g, '')
      .replace(/(.)\1+/g, '$1');
  }

  function tokensOf(str) {
    return normalizeSpaced(str)
      .split(' ')
      .filter(Boolean)
      .map(t => t.replace(/(.)\1+/g, '$1'));   // token içi tekrarları da sadeleştir
  }

  // --- Bellekteki listeler (DB'den yüklenir) --------------------------------
  let BANNED_WORDS = [];      // [{ word, type:'word'|'substring', norm }]
  let RESERVED     = new Set();
  let BANNED_DOMAINS = [];    // ['pornhub.com', ...]
  let _loaded = false;

  async function loadLists() {
    const sb = window.sbClient;
    if (!sb) return;
    try {
      const [w, r, d] = await Promise.all([
        sb.from('banned_words').select('word,match_type'),
        sb.from('reserved_usernames').select('name'),
        sb.from('banned_domains').select('domain')
      ]);
      if (w && w.data) {
        BANNED_WORDS = w.data
          .map(x => ({ word: x.word, type: x.match_type || 'word', norm: normalizeCompact(x.word) }))
          .filter(x => x.norm);
      }
      if (r && r.data) RESERVED = new Set(r.data.map(x => normalizeCompact(x.name)).filter(Boolean));
      if (d && d.data) BANNED_DOMAINS = d.data.map(x => String(x.domain || '').toLowerCase().trim()).filter(Boolean);
      _loaded = true;
    } catch (e) {
      console.warn('[moderation] listeler yüklenemedi (DB katmanı yine de korur):', e);
    }
  }

  const ready = (async () => { await loadLists(); })();

  // --- Kontroller -----------------------------------------------------------

  // Metinde yasaklı kelime var mı? Eşleşen kelimeyi veya null döner.
  function checkText(text) {
    if (!text || !BANNED_WORDS.length) return null;
    const compact = normalizeCompact(text);
    const tokenSet = new Set(tokensOf(text));
    for (const b of BANNED_WORDS) {
      if (b.type === 'substring') {
        if (compact.includes(b.norm)) return b.word;
      } else {
        if (tokenSet.has(b.norm)) return b.word;
      }
    }
    return null;
  }

  function isReservedUsername(username) {
    return RESERVED.has(normalizeCompact(username));
  }

  // Metindeki bir URL yasaklı domaine mi işaret ediyor? Eşleşen domaini/null döner.
  function findBannedDomain(text) {
    if (!text || !BANNED_DOMAINS.length) return null;
    const low = String(text).toLowerCase();
    const re = /([a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+)/g;
    let m;
    while ((m = re.exec(low))) {
      const host = m[1];
      if (!host.includes('.')) continue;
      for (const bd of BANNED_DOMAINS) {
        if (host === bd || host.endsWith('.' + bd)) return bd;
      }
    }
    return null;
  }

  // --- Yüksek seviye doğrulayıcılar (UI bunları çağırır) --------------------
  function validateUsername(username) {
    if (isReservedUsername(username)) {
      return { ok: false, reason: 'Bu kullanıcı adı rezerve edilmiştir, seçilemez.' };
    }
    if (checkText(username)) {
      return { ok: false, reason: 'Kullanıcı adı uygunsuz bir ifade içeriyor.' };
    }
    return { ok: true };
  }

  function validateName(name) {
    if (checkText(name)) return { ok: false, reason: 'İsimde uygunsuz bir ifade var.' };
    return { ok: true };
  }

  // Serbest metin (post, yorum, açıklama) → küfür + yasaklı link
  function validateContent(text) {
    if (checkText(text)) {
      return { ok: false, reason: 'İçerik uygunsuz bir ifade içeriyor.' };
    }
    if (findBannedDomain(text)) {
      return { ok: false, reason: 'Paylaşımda izin verilmeyen bir bağlantı (link) var.' };
    }
    return { ok: true };
  }

  window.Moderation = {
    ready,
    loadLists,
    get loaded() { return _loaded; },
    // düşük seviye
    normalizeSpaced,
    normalizeCompact,
    checkText,
    isReservedUsername,
    findBannedDomain,
    // yüksek seviye
    validateUsername,
    validateName,
    validateContent
  };
})();

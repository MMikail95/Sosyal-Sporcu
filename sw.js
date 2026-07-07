const CACHE = 'ss-v13';

// Works both on localhost (/sw.js) and GitHub Pages (/Sosyal-Sporcu/sw.js)
const BASE = self.location.pathname.replace(/\/sw\.js$/, '');

const APP_SHELL = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/auth.html',
  BASE + '/style.css',
  BASE + '/team-fix.css',
  BASE + '/team-and-matches.css',
  BASE + '/fixes.css',
  BASE + '/script.js',
  BASE + '/db.js',
  BASE + '/team-and-matches.js',
  BASE + '/social-features.js',
  BASE + '/notifications-and-toast.js',
  BASE + '/takimim.js',
  BASE + '/dashboard.js',
  BASE + '/auth.js',
  BASE + '/supabase.js',
  BASE + '/badges.js',
  BASE + '/assets/js/components.js',
  BASE + '/icons/icon-192.png',
  BASE + '/icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Supabase API ve dış istekler — her zaman network
  if (url.hostname.includes('supabase.co') || url.hostname.includes('supabase.in') ||
      url.hostname !== self.location.hostname) {
    return;
  }

  // HTML sayfaları — network önce, offline'da cache
  if (e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request) || caches.match('/index.html'))
    );
    return;
  }

  // Statik dosyalar (JS/CSS/img) — NETWORK ÖNCE, offline'da cache.
  // Eskiden stale-while-revalidate idi: cache'ten hemen sunup yeniyi arka planda çekiyordu →
  // her deploy'dan sonra ilk yüklemede ESKİ JS servis ediliyor, kullanıcı düzeltmeleri görmek
  // için 2. kez yenilemek (veya cache bump beklemek) zorunda kalıyordu. Bu, "1sn flash"
  // şikâyetlerinin bir kısmının aslında görülmeyen (henüz ulaşmamış) düzeltmeler olmasına yol
  // açtı. Network-first ile online kullanıcı HER ZAMAN en güncel dosyayı alır; sadece network
  // gerçekten başarısızsa (offline) cache'e düşer. Başarılı yanıt cache'e yazılır (offline için).
  e.respondWith(
    fetch(e.request).then(response => {
      if (response && response.ok) {
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
      }
      return response;
    }).catch(() =>
      caches.open(CACHE).then(cache => cache.match(e.request))
    )
  );
});

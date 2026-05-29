const CACHE = 'ss-v1';

const APP_SHELL = [
  '/',
  '/index.html',
  '/auth.html',
  '/style.css',
  '/team-fix.css',
  '/faz2-7.css',
  '/fixes.css',
  '/script.js',
  '/db.js',
  '/faz2-7.js',
  '/faz2-social.js',
  '/faz1.js',
  '/takimim.js',
  '/auth.js',
  '/supabase.js',
  '/badges.js',
  '/assets/js/components.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
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

  // Statik dosyalar — cache önce
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});


const VERSION = 'od-pwa-v1';
const CORE = [
  '/', '/index.html',
  '/pages/opskrift.html', '/pages/seneste.html',
  '/kategori/gloegg.html', '/kategori/sunde-shots.html',
  '/assets/manifest.json',
  '/assets/pwa-192.png', '/assets/pwa-512.png',
  '/js/app.js', '/js/recipes.js', '/js/search.js', '/js/pwa.js',
  '/assets/icons.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(k => k !== VERSION)
    .map(k => caches.delete(k))
  )));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  if (CORE.includes(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        if (res.ok) caches.open(VERSION).then(c => c.put(e.request, res.clone()));
        return res;
      }))
    );
    return;
  }

  if (url.pathname.startsWith('/data/')) {
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const cached = await cache.match(e.request);
      const network = fetch(e.request).then(res => {
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      }).catch(() => null);
      return cached || network || caches.match('/pages/offline.html');
    })());
    return;
  }

  e.respondWith(
    fetch(e.request).catch(() => caches.match('/pages/offline.html'))
  );
});

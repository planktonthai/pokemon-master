/* 寶可夢卡牌訓練營：離線快取
   - 網頁（HTML）：先抓網路最新版，斷線時才用快取
   - 素材（字型、程式、圖片、音樂）：先用快取立刻顯示，同時在背景更新
   - 程式與樣式的網址帶版本號（?v=），網站一更新就是新網址，不會新舊混用
   - CACHE 名稱與 CORE 清單由 tools/build.py 自動產生 */
const CACHE = 'ptcg-camp-fd4d826b';
const CORE = [
  './', 'index.html', 'map.html', 'about.html', 'achievements.html', 'manifest.webmanifest',
  'assets/css/style.min.css?v=fd4d826b', 'assets/fonts/huninn.woff2', 'assets/fonts/notosanstc-900.woff2',
  'assets/js/common.js?v=fd4d826b', 'assets/js/audio.js?v=fd4d826b', 'assets/img/icon.svg', 'assets/img/icon-192.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range') || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === 'navigate' || req.destination === 'document';
  if (isPage) {
    e.respondWith(fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || Response.redirect(new URL('map.html', self.registration.scope).href, 302))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req);   // 網址含版本號，要完全相同才用快取
    const net = fetch(req).then(res => { if (res.ok && res.status === 200) c.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});

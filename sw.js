// Finanzía Service Worker v2.0
// ⚡ Network-first: always tries to load fresh from server
const CACHE_NAME = 'finanzía-v2';
const ASSETS = ['/'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

// Activate: DELETE all old caches and take control immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => {
      console.log('[SW] v2.0 activated - old caches cleared');
      return clients.claim();
    })
  );
});

// NETWORK FIRST — always tries server, falls back to cache
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(e.request).then(cached => cached || caches.match('/'))
      )
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {title:'Finanzía 💰',body:'Tienes pagos pendientes'};
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: '/icon-192.png', badge: '/icon-192.png',
    vibrate: [200,100,200], data: {url: '/'}
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'close') return;
  e.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(list => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

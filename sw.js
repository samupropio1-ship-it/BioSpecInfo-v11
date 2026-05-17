// BioSpecInfo Service Worker v11
const VERSION = 'bsi-v11.0.0';
const STATIC = `${VERSION}-static`;
const RUNTIME = `${VERSION}-runtime`;
const API_CACHE = `${VERSION}-api`;

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './js/core.js',
  './js/pwa.js',
  './assets/css/main.css',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

// Install: precache shell critico
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC)
      .then(c => c.addAll(PRECACHE).catch(err => console.warn('Precache partial:', err)))
      .then(() => self.skipWaiting())
  );
});

// Activate: cleanup vecchie cache
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: cache strategies per tipo
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // PubChem API → Stale-while-revalidate
  if(url.hostname.includes('pubchem.ncbi.nlm.nih.gov')){
    e.respondWith(staleWhileRevalidate(e.request, API_CACHE));
    return;
  }

  // RCSB protein → Cache-first
  if(url.hostname.includes('rcsb.org') || url.hostname.includes('files.rcsb.org')){
    e.respondWith(cacheFirst(e.request, API_CACHE));
    return;
  }

  // Risorse locali → Cache-first
  if(url.origin === location.origin){
    e.respondWith(cacheFirst(e.request, STATIC));
    return;
  }

  // Default → network-first
  e.respondWith(networkFirst(e.request, RUNTIME));
});

async function cacheFirst(req, cacheName){
  const cached = await caches.match(req);
  if(cached) return cached;
  try {
    const fresh = await fetch(req);
    if(fresh.ok){
      const cache = await caches.open(cacheName);
      cache.put(req, fresh.clone());
    }
    return fresh;
  } catch(e){
    return cached || new Response('Offline', {status: 503, statusText: 'Offline'});
  }
}

async function networkFirst(req, cacheName){
  try {
    const fresh = await fetch(req);
    if(fresh.ok){
      const cache = await caches.open(cacheName);
      cache.put(req, fresh.clone());
    }
    return fresh;
  } catch(e){
    return (await caches.match(req)) || new Response('Offline', {status: 503});
  }
}

async function staleWhileRevalidate(req, cacheName){
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req).then(fresh => {
    if(fresh.ok) cache.put(req, fresh.clone());
    return fresh;
  }).catch(() => cached);
  return cached || fetchPromise;
}

// Message handling for skipWaiting
self.addEventListener('message', e => {
  if(e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

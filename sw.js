// BioSpecInfo Service Worker v64 — network-first, precache dei file pesanti
var CACHE = 'bsi-v64';
var PRECACHE = [
  './RDKit_minimal.js',
  './RDKit_minimal.wasm',
  './3Dmol-min.js',
  './three.min.js',
  './three_bloom.js',
  './gltf_loader.js',
  './smiles-drawer.min.js',
  './lib/sql-wasm.js',
  './lib/sql-wasm.wasm',
  './lib/dimuon.js',
  './textures/earth_day.jpg',
  './textures/earth_clouds.png',
  './textures/earth_lights.png',
  './textures/earth_normal.jpg',
  './textures/earth_specular.jpg',
  './textures/moon.jpg'
];

self.addEventListener('install', function(e){
  self.skipWaiting();
  // pre-carico i file pesanti così l'app funziona anche offline
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(PRECACHE.map(function(u){
        return c.add(u).catch(function(){ /* se manca, non blocco l'installazione */ });
      }));
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ if(k !== CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  var url = e.request.url;

  // Non intercetto MAI le risorse esterne (NASA Eyes, immagini ESA/Hubble, CDN):
  // altrimenti l'iframe della NASA e le foto dei telescopi non caricano.
  if(url.indexOf(self.location.origin) !== 0) return;

  // NETWORK-FIRST: prendo sempre la versione fresca; la cache serve solo offline.
  e.respondWith(
    fetch(e.request).then(function(resp){
      if(resp && resp.status === 200 && resp.type === 'basic'){
        var copy = resp.clone();
        caches.open(CACHE).then(function(c){ try{ c.put(e.request, copy); }catch(_){} });
      }
      return resp;
    }).catch(function(){
      return caches.match(e.request).then(function(r){
        return r || caches.match('./index.html');
      });
    })
  );
});

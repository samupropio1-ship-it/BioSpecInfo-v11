// BioSpecInfo Service Worker v134 — network-first + precache di pagine e librerie
'use strict';

var CACHE = 'bsi-v162';

// Precarico solo file che esistono davvero nel deploy (una voce inesistente
// costa una richiesta fallita ad ogni install). NON precarico models/*.glb:
// da soli pesano ~106 MB e verrebbero scaricati all'installazione; restano
// comunque messi in cache su richiesta dal gestore fetch network-first.
var PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // pagine (overlay iframe): senza queste l'app offline mostrava iframe vuoti
  './astro.html',
  './pro.html',
  './accademia.html',
  './rdkit_lab.html',
  './chimorga.html',
  './guidaret.html',
  './sr_completo.html',
  './sr_essenziale.html',
  './simulazioni.html',
  './file_manager.html',
  './changelog_tesi.html',
  './Biochimica_Guida_Definitiva.html',
  './download.html',
  // librerie locali pesanti
  './bsi-ai-hub.js',
  './bsi-spettri.js',
  './3Dmol-min.js',
  './three.min.js',
  './three_bloom.js',
  './gltf_loader.js',
  './smiles-drawer.min.js',
  './lib/sql-wasm.js',
  './lib/dimuon.js',
  // binari WASM: senza questi RDKit e il lab SQL non funzionano offline
  './RDKit_minimal.wasm',
  './lib/sql-wasm.wasm',
  // texture dei corpi celesti (Terra fotorealistica + Luna)
  './textures/earth_day.jpg',
  './textures/earth_clouds.png',
  './textures/earth_lights.png',
  './textures/earth_normal.jpg',
  './textures/earth_specular.jpg',
  './textures/moon.jpg'
];

self.addEventListener('install', function(e){
  self.skipWaiting();
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
    })
    .then(function(){ return self.clients.claim(); })
    .then(function(){ return self.clients.matchAll({type:'window'}); })
    .then(function(clients){
      /* AVVISO, non ricarica forzata.
         Prima qui c'era c.navigate(c.url): ad ogni nuova versione le schede
         aperte venivano ricaricate di colpo. Se in quel momento Spectra stava
         rispondendo, o c'era una nota lunga scritta a meta', quel lavoro
         spariva senza una parola. Ora si avvisa e basta: e' la pagina a
         decidere se ricaricarsi subito (nessun lavoro in corso) o mostrare
         "Aggiorna" e lasciar scegliere. */
      clients.forEach(function(c){
        try{ c.postMessage({type:'BSI_SW_UPDATED', cache: CACHE}); }catch(_e){}
      });
    })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  var url = e.request.url;

  // Non intercetto MAI le risorse esterne (NASA Eyes, immagini ESA/Hubble, CDN):
  // altrimenti l'iframe della NASA e le foto dei telescopi non caricano.
  if(url.indexOf(self.location.origin) !== 0) return;

  /* NETWORK-FIRST CON PAZIENZA LIMITATA.
     "Offline" e "rete pessima" non sono la stessa cosa, e la seconda e' molto
     piu' frequente: in treno, in ascensore, con una tacca di segnale, il
     fetch non fallisce — resta appeso finche' il browser non si arrende, e
     possono passare anche trenta secondi. In quei trenta secondi l'app e'
     bianca, pur avendo in cache tutto il necessario. Quindi: si aspetta la
     rete SOLO per qualche secondo; se non risponde e una copia c'e', si
     serve quella e non si fa aspettare nessuno. La copia in cache viene
     comunque aggiornata quando la rete arriva, con calma, dopo. */
  var ATTESA_RETE_MS = 3500;

  var dallaRete = fetch(e.request).then(function(resp){
    if(resp && resp.status === 200 && resp.type === 'basic'){
      var copy = resp.clone();
      caches.open(CACHE).then(function(c){ try{ c.put(e.request, copy); }catch(_){} });
    }
    return resp;
  });

  // Se rispondo dalla cache, il service worker potrebbe essere spento prima
  // che la rete arrivi: waitUntil lo tiene sveglio finche' la copia nuova
  // e' stata riposta, altrimenti l'aggiornamento non avverrebbe mai.
  e.waitUntil(dallaRete.catch(function(){}));

  e.respondWith(
    caches.match(e.request).then(function(inCache){
      // Senza una copia non c'e' scelta: si aspetta la rete fino in fondo.
      if(!inCache){
        return dallaRete.catch(function(){
          // fallback solo per le navigazioni: per un asset mancante devo restituire
          // un 404 vero, altrimenti il chiamante riceve HTML al posto di JS/immagini
          // e il fallback applicativo (es. texture o CDN) non scatta mai.
          if(e.request.mode === 'navigate') return caches.match('./index.html');
          return new Response('', {status:504, statusText:'offline'});
        });
      }
      // Con una copia in mano: vince chi arriva prima fra rete e cronometro.
      var cronometro = new Promise(function(res){
        setTimeout(function(){ res(inCache); }, ATTESA_RETE_MS);
      });
      return Promise.race([
        dallaRete.catch(function(){ return inCache; }),
        cronometro
      ]);
    })
  );
});

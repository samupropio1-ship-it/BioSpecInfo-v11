// BioSpecInfo Service Worker v10.4
var CACHE='bsi-v10';
self.addEventListener('install',function(e){self.skipWaiting();});
self.addEventListener('activate',function(e){self.clients.claim();});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).catch(function(){return caches.match(e.request);}));
});

var CACHE_VERSION = 'bhq-v1.45';
var CORE_ASSETS = [
  './', './index.html', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache){
      return Promise.all(CORE_ASSETS.map(function(url){
        return cache.add(url).catch(function(){ /* asset not present in this hosting context, ignore */ });
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_VERSION; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  var req = event.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return; // AI worker / cross-origin calls pass straight through
  if(req.cache === 'no-store') return; // let the app's own update-check fetch hit the network directly

  event.respondWith(
    fetch(req).then(function(res){
      if(res && res.ok){
        var copy = res.clone();
        caches.open(CACHE_VERSION).then(function(cache){ cache.put(req, copy); });
      }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(cached){
        return cached || caches.match('./index.html');
      });
    })
  );
});

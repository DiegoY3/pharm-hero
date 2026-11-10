const CACHE = 'pharm-hero-pages-11';
const PRECACHE = ["./CONTENT.json", "./assets/calc.js", "./assets/dose-engine.js", "./assets/drug-box-designer.js", "./assets/drug-box-ui.js", "./assets/drug-box.js", "./assets/fonts/AllertaStencil-Regular.ttf", "./assets/fonts/Manrope-VariableFont_wght.ttf", "./assets/icons/apple-touch-icon-152.png", "./assets/icons/apple-touch-icon-167.png", "./assets/icons/apple-touch-icon.png", "./assets/icons/ecg-hero-A1.svg", "./assets/icons/ecg-hero.ico", "./assets/icons/favicon-32.png", "./assets/icons/icon-192.png", "./assets/icons/icon-512.png", "./assets/icons/icon-maskable-512.png", "./assets/icons/pharm-hero.png", "./assets/theme-t5.css", "./assets/theme-t5.js", "./css/pharm.css", "./css/shell.css", "./index.html", "./js/access-codes.js", "./js/app.js", "./js/facts.js", "./js/grade.js", "./js/progress.js", "./manifest.webmanifest"];

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll(PRECACHE);
  }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key !== CACHE; }).map(function (key) {
      return caches.delete(key);
    }));
  }).then(function () { return self.clients.claim(); }));
});

function isDocument(request) {
  if (request.mode === 'navigate') return true;
  var path = new URL(request.url).pathname;
  return /\/$/.test(path) || /\/index\.html$/.test(path);
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isDocument(request)) {
    event.respondWith(fetch(request).then(function (response) {
      var copy = response.clone();
      caches.open(CACHE).then(function (cache) { cache.put('./index.html', copy); });
      return response;
    }).catch(function () {
      return caches.match('./index.html');
    }));
    return;
  }
  event.respondWith(caches.match(request).then(function (cached) {
    var network = fetch(request).then(function (response) {
      if (response && response.ok) {
        var copy = response.clone();
        caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
      }
      return response;
    }).catch(function () { return cached; });
    return cached || network;
  }));
});

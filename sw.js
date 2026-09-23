// Service worker di Le Mie Finanze.
// Strategia: i file dell'app arrivano SEMPRE dalla rete quando c'è connessione (così ogni
// modifica pubblicata su GitHub compare alla prima apertura), la cache serve solo offline.
// Il numero va cambiato solo quando si modifica questo file.
const CACHE_NAME = 'le-mie-finanze-v3';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Librerie (Excel/PDF) e font: URL con versione fissa, si possono prendere dalla cache.
// Le API dei prezzi NON passano mai dalla cache.
const CACHEABLE_HOSTS = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // cache: 'reload' salta la cache HTTP del browser (GitHub Pages la tiene 10 minuti)
      .then((cache) => cache.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function putInCache(request, response) {
  if (response && response.status === 200) {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  }
  return response;
}

// Prima la rete (senza cache HTTP), poi la cache se offline o se la rete è troppo lenta.
function networkFirst(request) {
  const network = fetch(request, { cache: 'no-cache' }).then((res) => putInCache(request, res));
  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS));
  const fromCache = () => caches.match(request, { ignoreSearch: true });
  return Promise.race([network, timeout.then(() => null)])
    .then((res) => res || fromCache().then((cached) => cached || network))
    .catch(() => fromCache().then((cached) => cached || Response.error()));
}

function cacheFirst(request) {
  return caches.match(request).then((cached) => cached || fetch(request).then((res) => putInCache(request, res)));
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(event.request));
  } else if (CACHEABLE_HOSTS.indexOf(url.hostname) > -1) {
    event.respondWith(cacheFirst(event.request));
  }
  // tutto il resto (es. prezzi) va direttamente in rete
});

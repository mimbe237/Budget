// Service Worker pour mode hors ligne et cache des assets
// v2: manifest.webmanifest + icônes + navigation preload
const CACHE_NAME = 'budget-app-v2';
const RUNTIME_CACHE = 'budget-runtime-v2';

// Assets à mettre en cache lors de l'installation (léger et stable)
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.webmanifest',
  // Icônes PWA
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32x32.png',
  '/icons/favicon-16x16.png',
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Activer Navigation Preload si disponible (améliore NetworkFirst)
  if ('navigationPreload' in self.registration) {
    self.registration.navigationPreload.enable().catch(() => {});
  }
  self.clients.claim();
});

// Stratégie de cache: Network First avec fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-HTTP
  if (!request.url.startsWith('http')) return;

  // Ignorer les requêtes Firebase/Firestore (toujours online)
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('googleapis.com')
  ) {
    return;
  }

  // API requests: Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets: Cache First
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Pages: Network First avec cache fallback (+ Navigation Preload)
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, event));
    return;
  }

  // Par défaut (autres requêtes): Network First sécurisé
  event.respondWith(networkFirst(request));
});

// Stratégie Network First
async function networkFirst(request, event) {
  try {
    // Préférence à la réponse préchargée si présente (Navigation Preload)
    const preload = event?.preloadResponse ? await event.preloadResponse : null;
    const response = preload || (await fetch(request));
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Si offline et pas de cache, retourner page offline
    if (request.mode === 'navigate') {
      return caches.match('/offline');
    }
    
    throw error;
  }
}

// Stratégie Cache First
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}

// Message handling pour contrôle du cache
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    });
  }
});

/**
 * frontend/sw.js
 * Service Worker for PWA offline support and caching strategies.
 */

const CACHE_NAME = 'ai-portfolio-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/profile-photo.jpg',
  '/manifest.json',
];

// Install event: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return Promise.all(
          ASSETS_TO_CACHE.map(url =>
            cache.add(url).catch(err => console.warn(`Failed to cache ${url}:`, err))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: serve from cache first, then network
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise, fetch from network and cache the response
      return fetch(event.request).then((response) => {
        // Don't cache opaque responses (e.g., from other origins without CORS)
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch((error) => {
        console.error('Fetch failed:', error);
        // Optionally, return an offline page here
        // return caches.match('/offline.html');
      });
    })
  );
});

const CACHE_NAME = 'zenith-glorious-v2'; // Changed version to force update
const CRITICAL_ASSETS = [
    './',
    './index.html',
    './manifest.json'
];

// Install: Cache ONLY critical local files first (Safer)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Caching critical assets');
            return cache.addAll(CRITICAL_ASSETS);
        })
    );
    self.skipWaiting(); // Force activation immediately
});

// Fetch: Serve from cache, fall back to network, and cache external links on the fly
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return cached response if found
            if (cachedResponse) {
                return cachedResponse;
            }

            // Otherwise fetch from network
            return fetch(event.request).then((networkResponse) => {
                // Check if we received a valid response
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
                    return networkResponse;
                }

                // Clone the response because it's a stream and can only be consumed once
                const responseToCache = networkResponse.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                // If offline and request fails (and not in cache), just return nothing or a fallback
                // This prevents the "downasaur" error for cached pages
            });
        })
    );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});
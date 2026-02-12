// Service Worker for Grimstone website
// Provides offline support and caching

const CACHE_NAME = 'grimstone-v3-' + Date.now(); // Version bump with timestamp
const urlsToCache = [
    '/',
    '/index.html',
    '/press.html',
    '/tools/setlist-optimizer.html',
    'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;700&family=Space+Grotesk:wght@400;700&display=swap'
];

// Install event - cache resources and activate immediately
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting()) // Activate immediately
    );
});

// Fetch event - network-first for HTML, cache-first for other assets
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Network-first strategy for HTML files
    if (event.request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Clone and cache the response
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(event.request);
                })
        );
    } else {
        // Cache-first for assets (images, fonts, etc.)
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request);
                }
            )
        );
    }
});

// Activate event - clean up old caches and take control immediately
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        // Delete all old caches
                        if (cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim()) // Take control of all pages immediately
    );
});

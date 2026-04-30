// TimeTool service worker - offline-first
// Bump CACHE_VERSION whenever you ship code changes so clients refresh assets.
const CACHE_VERSION = 'timetool-v3';
const APP_SHELL = [
    './',
    './index.html',
    './manifest.webmanifest',
    './css/timetool.css',
    './css/bootstrap.min.css',
    './js/jquery-3.3.1.min.js',
    './js/bootstrap.min.js',
    './js/xlsx.full.min.js',
    './js/clock.js',
    './js/ics.js',
    './img/icon-192.png',
    './img/icon-512.png',
    './img/apple-touch-icon.png',
    './img/favicon-16x16.png',
    './img/favicon-32x32.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
        )).then(() => self.clients.claim())
    );
});

// Fetch strategy:
//  - Events.xlsx: network-first (always try fresh, fall back to cache)
//  - everything else: cache-first (offline-first), network fallback
self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);

    // Only handle same-origin requests (skip CDN, analytics, etc.)
    if (url.origin !== self.location.origin) return;

    if (url.pathname.endsWith('/Events.xlsx') || url.pathname.endsWith('events/Events.xlsx')) {
        event.respondWith(
            fetch(req).then(resp => {
                const copy = resp.clone();
                caches.open(CACHE_VERSION).then(c => c.put(req, copy));
                return resp;
            }).catch(() => caches.match(req))
        );
        return;
    }

    event.respondWith(
        caches.match(req).then(cached => cached || fetch(req).then(resp => {
            const copy = resp.clone();
            caches.open(CACHE_VERSION).then(c => c.put(req, copy));
            return resp;
        }))
    );
});

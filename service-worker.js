const CACHE_NAME = "timing-helper-v3.1";

const FILES = [
    "timings.html",
    "timings.css",
    "timings.js",
    "manifest.webmanifest",
    "images/icon-192.png",
    "images/icon-512.png",
    "images/sam.svg",
    "images/cloud.svg",
    "fonts/RockSalt-Regular.ttf"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
        )
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(r => r || fetch(event.request))
    );
});

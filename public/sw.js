/* TankKoll service worker — offline-first app shell. */
const VERSION = "tankkoll-v1";

// Base path is derived from where the SW is registered so the same file
// works locally (/) and on GitHub Pages (/tankkoll/).
const BASE = new URL(self.registration.scope).pathname;

const PRECACHE = [
  BASE,
  `${BASE}tankningar/`,
  `${BASE}tankning/`,
  `${BASE}statistik/`,
  `${BASE}bilar/`,
  `${BASE}installningar/`,
  `${BASE}manifest.webmanifest`,
  `${BASE}icons/icon-192.png`,
  `${BASE}icons/icon-512.png`,
  `${BASE}images/logo.webp`,
  `${BASE}images/empty-tankningar.webp`,
  `${BASE}images/empty-bilar.webp`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    // Network first so deploys reach users; cached shell offline.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached ?? caches.match(BASE))
            .then((cached) => cached ?? Response.error()),
        ),
    );
    return;
  }

  // Static assets: cache first, then network (and cache the result).
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});

/* BaroER service worker — vanilla, no Workbox. Hand-tuned for a small PWA. */

const VERSION = "v1";
const APP_SHELL = `baroer-shell-${VERSION}`;
const RUNTIME = `baroer-runtime-${VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/home",
  "/login",
  "/manifest.json",
  "/logo.png",
  "/favicon.png",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== APP_SHELL && k !== RUNTIME)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

function isApiRequest(url) {
  return url.pathname.startsWith("/api/");
}

function isStaticAsset(url) {
  return (
    url.origin === self.location.origin &&
    /\.(?:png|jpg|jpeg|svg|webp|ico|css|js|woff2?|ttf)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Never intercept API requests — let the network handle them.
  if (isApiRequest(url)) return;

  // HTML navigation: network-first, fall back to /home shell when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(RUNTIME).then((c) => c.put(req, clone)).catch(() => undefined);
          return res;
        })
        .catch(() => caches.match(req).then((m) => m || caches.match("/home"))),
    );
    return;
  }

  // Static assets: cache-first.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const clone = res.clone();
            caches.open(RUNTIME).then((c) => c.put(req, clone)).catch(() => undefined);
            return res;
          }),
      ),
    );
  }
});

/* Minimal offline shell cache for ANOtaciones PWA */
const CACHE = 'anotaciones-shell-v1'
const ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/logo.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((response) => {
          const copy = response.clone()
          void caches.open(CACHE).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() => cached)
      return cached || fetched
    }),
  )
})

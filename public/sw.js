/* Minimal offline shell cache for ANOtaciones PWA.
 * HTML/navegación: network-first (evita index.html viejo con hashes de assets obsoletos → pantalla blanca).
 * Resto: network-first con fallback a caché.
 */
const CACHE = 'anotaciones-shell-v2'
const ASSETS = ['/manifest.webmanifest', '/logo.png']

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

  const accept = request.headers.get('accept') || ''
  const isHtml =
    request.mode === 'navigate' ||
    accept.includes('text/html') ||
    new URL(request.url).pathname === '/' ||
    new URL(request.url).pathname.endsWith('.html')

  if (isHtml) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            void caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/index.html')),
        ),
    )
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          void caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return response
      })
      .catch(() => caches.match(request)),
  )
})

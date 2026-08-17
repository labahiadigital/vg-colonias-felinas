const CACHE_NAME = 'kolonia-v1';
const STATIC_ASSETS = [
	'/manifest.json'
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
		)
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	const { request } = event;

	if (request.method !== 'GET') return;

	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request).catch(() =>
				caches.match('/dashboard') || new Response('Offline', { status: 503 })
			)
		);
		return;
	}

	if (request.destination === 'image' || request.destination === 'font' || request.destination === 'style') {
		event.respondWith(
			caches.open(CACHE_NAME).then((cache) =>
				cache.match(request).then((cached) => {
					const fetched = fetch(request).then((response) => {
						if (response.ok) cache.put(request, response.clone());
						return response;
					});
					return cached || fetched;
				})
			)
		);
	}
});

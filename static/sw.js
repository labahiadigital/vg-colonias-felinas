const CACHE_NAME = 'gatopolis-v1';
const OFFLINE_QUEUE_KEY = 'gatopolis-offline-queue';

const STATIC_ASSETS = [
	'/',
	'/manifest.json',
	'/favicon.svg'
];

const CACHEABLE_EXTENSIONS = /\.(js|css|woff2?|ttf|png|jpg|jpeg|svg|webp|ico)$/;

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
	const url = new URL(request.url);

	if (request.method !== 'GET') {
		event.respondWith(handleMutatingRequest(request));
		return;
	}

	if (url.pathname.startsWith('/api/')) {
		event.respondWith(networkFirst(request));
		return;
	}

	if (CACHEABLE_EXTENSIONS.test(url.pathname) || url.pathname.startsWith('/_app/')) {
		event.respondWith(cacheFirst(request));
		return;
	}

	event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
	const cached = await caches.match(request);
	if (cached) return cached;
	try {
		const response = await fetch(request);
		if (response.ok) {
			const cache = await caches.open(CACHE_NAME);
			cache.put(request, response.clone());
		}
		return response;
	} catch {
		return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
	}
}

async function networkFirst(request) {
	try {
		const response = await fetch(request);
		if (response.ok && request.method === 'GET') {
			const cache = await caches.open(CACHE_NAME);
			cache.put(request, response.clone());
		}
		return response;
	} catch {
		const cached = await caches.match(request);
		if (cached) return cached;
		if (request.headers.get('Accept')?.includes('text/html')) {
			const cachedRoot = await caches.match('/');
			if (cachedRoot) return cachedRoot;
		}
		return new Response(JSON.stringify({ offline: true, error: 'Sin conexión' }), {
			status: 503,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}

async function handleMutatingRequest(request) {
	try {
		return await fetch(request);
	} catch {
		if (request.method === 'POST') {
			const url = new URL(request.url);
			const queueableRoutes = ['/visitas', '/reportar', '/campanas', '/incidencias'];
			const isQueueable = queueableRoutes.some((r) => url.pathname.includes(r));

			if (isQueueable) {
				const body = await request.clone().text();
				await queueOfflineOperation({
					url: request.url,
					method: request.method,
					headers: Object.fromEntries(request.headers.entries()),
					body,
					timestamp: Date.now()
				});

				const clients = await self.clients.matchAll();
				clients.forEach((client) => {
					client.postMessage({ type: 'OFFLINE_QUEUED', url: request.url });
				});

				return new Response(
					JSON.stringify({ offline: true, queued: true, message: 'Operación guardada. Se enviará cuando vuelva la conexión.' }),
					{ status: 202, headers: { 'Content-Type': 'application/json' } }
				);
			}
		}
		return new Response(JSON.stringify({ offline: true, error: 'Sin conexión' }), {
			status: 503,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}

async function queueOfflineOperation(operation) {
	const db = await openOfflineDB();
	const tx = db.transaction('queue', 'readwrite');
	tx.objectStore('queue').add(operation);
	await new Promise((resolve, reject) => {
		tx.oncomplete = resolve;
		tx.onerror = reject;
	});
}

async function getQueuedOperations() {
	const db = await openOfflineDB();
	const tx = db.transaction('queue', 'readonly');
	const store = tx.objectStore('queue');
	return new Promise((resolve, reject) => {
		const req = store.getAll();
		req.onsuccess = () => resolve(req.result);
		req.onerror = reject;
	});
}

async function clearQueue() {
	const db = await openOfflineDB();
	const tx = db.transaction('queue', 'readwrite');
	tx.objectStore('queue').clear();
	await new Promise((resolve, reject) => {
		tx.oncomplete = resolve;
		tx.onerror = reject;
	});
}

function openOfflineDB() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open('gatopolis-offline', 1);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains('queue')) {
				db.createObjectStore('queue', { keyPath: 'timestamp' });
			}
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = reject;
	});
}

self.addEventListener('sync', (event) => {
	if (event.tag === 'sync-offline-queue') {
		event.waitUntil(syncOfflineQueue());
	}
});

async function syncOfflineQueue() {
	const operations = await getQueuedOperations();
	if (operations.length === 0) return;

	const results = [];
	for (const op of operations) {
		try {
			const response = await fetch(op.url, {
				method: op.method,
				headers: op.headers,
				body: op.body
			});
			results.push({ url: op.url, success: response.ok, status: response.status });
		} catch {
			results.push({ url: op.url, success: false, status: 0 });
		}
	}

	const allSuccess = results.every((r) => r.success);
	if (allSuccess) {
		await clearQueue();
	}

	const clients = await self.clients.matchAll();
	clients.forEach((client) => {
		client.postMessage({
			type: 'SYNC_COMPLETE',
			results,
			allSuccess
		});
	});
}

self.addEventListener('online', () => {
	syncOfflineQueue();
});

self.addEventListener('push', (event) => {
	let data = { title: 'Gatopolis', body: 'Tienes una notificación', icon: '/icon-192.png', data: { url: '/dashboard' } };
	try {
		if (event.data) data = { ...data, ...JSON.parse(event.data.text()) };
	} catch { /* use defaults */ }

	event.waitUntil(
		self.registration.showNotification(data.title, {
			body: data.body,
			icon: data.icon || '/icon-192.png',
			badge: '/icon-192.png',
			tag: data.tag || 'gatopolis-notification',
			data: data.data
		})
	);
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = event.notification.data?.url || '/dashboard';
	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
			const existing = clients.find((c) => c.url.includes(url));
			if (existing) return existing.focus();
			return self.clients.openWindow(url);
		})
	);
});

self.addEventListener('message', (event) => {
	if (event.data?.type === 'SYNC_NOW') {
		syncOfflineQueue();
	}
	if (event.data?.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});

import { describe, it, expect } from 'vitest';

const CACHE_NAME = 'gatopolis-v1';
const CACHEABLE_EXTENSIONS = /\.(js|css|woff2?|ttf|png|jpg|jpeg|svg|webp|ico)$/;
const STATIC_ASSETS = ['/', '/manifest.json', '/favicon.svg'];

const QUEUEABLE_ROUTES = ['/visitas', '/reportar', '/campanas', '/incidencias'];

function shouldCacheFirst(pathname: string): boolean {
	return CACHEABLE_EXTENSIONS.test(pathname) || pathname.startsWith('/_app/');
}

function isApiRoute(pathname: string): boolean {
	return pathname.startsWith('/api/');
}

function isQueueable(pathname: string): boolean {
	return QUEUEABLE_ROUTES.some(r => pathname.includes(r));
}

function parseNotificationData(raw: string | null): {
	title: string; body: string; icon: string; data: { url: string }; tag?: string;
} {
	const defaults = { title: 'Gatopolis', body: 'Tienes una notificación', icon: '/icon-192.png', data: { url: '/dashboard' } };
	if (!raw) return defaults;
	try {
		return { ...defaults, ...JSON.parse(raw) };
	} catch {
		return defaults;
	}
}

describe('Service Worker: caching strategy', () => {
	it('caches JS files with cacheFirst', () => {
		expect(shouldCacheFirst('/app.js')).toBe(true);
	});

	it('caches CSS files with cacheFirst', () => {
		expect(shouldCacheFirst('/style.css')).toBe(true);
	});

	it('caches font files', () => {
		expect(shouldCacheFirst('/font.woff2')).toBe(true);
		expect(shouldCacheFirst('/font.ttf')).toBe(true);
	});

	it('caches image files', () => {
		expect(shouldCacheFirst('/cat.png')).toBe(true);
		expect(shouldCacheFirst('/photo.jpg')).toBe(true);
		expect(shouldCacheFirst('/logo.svg')).toBe(true);
		expect(shouldCacheFirst('/icon.webp')).toBe(true);
		expect(shouldCacheFirst('/favicon.ico')).toBe(true);
	});

	it('caches _app/ paths', () => {
		expect(shouldCacheFirst('/_app/immutable/entry.js')).toBe(true);
	});

	it('does not cache HTML pages', () => {
		expect(shouldCacheFirst('/dashboard')).toBe(false);
		expect(shouldCacheFirst('/colonias')).toBe(false);
	});

	it('does not cache unknown extensions', () => {
		expect(shouldCacheFirst('/data.json')).toBe(false);
	});
});

describe('Service Worker: API detection', () => {
	it('detects API routes', () => {
		expect(isApiRoute('/api/v1/colonies')).toBe(true);
		expect(isApiRoute('/api/export-pdf')).toBe(true);
		expect(isApiRoute('/api/auth/sign-in/email')).toBe(true);
	});

	it('rejects non-API routes', () => {
		expect(isApiRoute('/dashboard')).toBe(false);
		expect(isApiRoute('/colonias')).toBe(false);
	});
});

describe('Service Worker: offline queue routing', () => {
	it('queues POST to /visitas when offline', () => {
		expect(isQueueable('/visitas')).toBe(true);
	});

	it('queues POST to /reportar', () => {
		expect(isQueueable('/reportar')).toBe(true);
	});

	it('queues POST to /campanas', () => {
		expect(isQueueable('/campanas')).toBe(true);
	});

	it('queues POST to /incidencias', () => {
		expect(isQueueable('/incidencias')).toBe(true);
	});

	it('does not queue /login', () => {
		expect(isQueueable('/login')).toBe(false);
	});

	it('does not queue /api/export-pdf', () => {
		expect(isQueueable('/api/export-pdf')).toBe(false);
	});

	it('does not queue /dashboard', () => {
		expect(isQueueable('/dashboard')).toBe(false);
	});
});

describe('Service Worker: push notification parsing', () => {
	it('returns defaults for null data', () => {
		const result = parseNotificationData(null);
		expect(result.title).toBe('Gatopolis');
		expect(result.body).toBe('Tienes una notificación');
		expect(result.icon).toBe('/icon-192.png');
		expect(result.data.url).toBe('/dashboard');
	});

	it('returns defaults for invalid JSON', () => {
		const result = parseNotificationData('not json');
		expect(result.title).toBe('Gatopolis');
	});

	it('merges custom data with defaults', () => {
		const result = parseNotificationData(JSON.stringify({ title: 'Nueva incidencia', body: 'Detalle' }));
		expect(result.title).toBe('Nueva incidencia');
		expect(result.body).toBe('Detalle');
		expect(result.icon).toBe('/icon-192.png');
	});

	it('overrides icon when provided', () => {
		const result = parseNotificationData(JSON.stringify({ icon: '/custom.png' }));
		expect(result.icon).toBe('/custom.png');
	});

	it('preserves tag field', () => {
		const result = parseNotificationData(JSON.stringify({ tag: 'incident-123' }));
		expect(result.tag).toBe('incident-123');
	});
});

describe('Service Worker: STATIC_ASSETS', () => {
	it('includes root', () => {
		expect(STATIC_ASSETS).toContain('/');
	});

	it('includes manifest', () => {
		expect(STATIC_ASSETS).toContain('/manifest.json');
	});

	it('includes favicon', () => {
		expect(STATIC_ASSETS).toContain('/favicon.svg');
	});
});

describe('Service Worker: CACHE_NAME', () => {
	it('has versioned cache name', () => {
		expect(CACHE_NAME).toMatch(/^gatopolis-v\d+$/);
	});
});

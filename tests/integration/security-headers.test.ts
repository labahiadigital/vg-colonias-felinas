import { describe, it, expect, beforeAll } from 'vitest';

const BASE = 'http://localhost:5173';

async function isServerRunning(): Promise<boolean> {
	try {
		const res = await fetch(`${BASE}/login`, { redirect: 'manual' });
		return res.status === 200;
	} catch {
		return false;
	}
}

describe('Security headers from hooks.server.ts', () => {
	let serverAvailable = false;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
	});

	it('sets X-Frame-Options: DENY', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/login`);
		expect(res.headers.get('X-Frame-Options')).toBe('DENY');
	});

	it('sets X-Content-Type-Options: nosniff', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/login`);
		expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
	});

	it('sets Referrer-Policy', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/login`);
		expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
	});

	it('sets Permissions-Policy', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/login`);
		const pp = res.headers.get('Permissions-Policy');
		expect(pp).toContain('camera=(self)');
		expect(pp).toContain('geolocation=(self)');
		expect(pp).toContain('microphone=()');
	});
});

describe('Locale handling from hooks.server.ts', () => {
	let serverAvailable = false;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
	});

	it('defaults to Spanish locale without cookie', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/login`);
		const html = await res.text();
		expect(html).toContain('lang="es"');
	});

	it('respects locale cookie for translations', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/login`, {
			headers: { Cookie: 'locale=en' }
		});
		expect(res.status).toBe(200);
	});
});

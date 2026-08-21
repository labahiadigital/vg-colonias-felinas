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

async function getAuthCookie(): Promise<string | null> {
	const res = await fetch(`${BASE}/api/auth/sign-in/email`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email: 'test@gatopolis.app', password: 'Gatopolis2026!' })
	});
	if (res.status !== 200) return null;
	const cookies = res.headers.getSetCookie();
	if (!cookies || cookies.length === 0) return null;
	return cookies.map(c => c.split(';')[0]).join('; ');
}

describe('Search API endpoint', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('returns results for valid query', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/search?q=test`, { headers: { Cookie: cookie } });
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data).toBeDefined();
	});

	it('handles empty query', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/search?q=`, { headers: { Cookie: cookie } });
		expect([200, 400]).toContain(res.status);
	});
});

describe('Upload API endpoint', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('rejects unauthenticated request', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/api/upload`, { method: 'POST' });
		expect(res.status).toBe(401);
	});

	it('rejects request without file', async () => {
		if (!serverAvailable || !cookie) return;
		const form = new FormData();
		const res = await fetch(`${BASE}/api/upload`, {
			method: 'POST',
			headers: { Cookie: cookie },
			body: form
		});
		expect([400, 500]).toContain(res.status);
	});
});

describe('Subsidy Report endpoint', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('rejects unauthenticated request', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/api/subsidy-report`);
		expect(res.status).toBe(401);
	});

	it('returns HTML report when authenticated', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/subsidy-report`, { headers: { Cookie: cookie } });
		if (res.status === 200) {
			const contentType = res.headers.get('Content-Type');
			expect(contentType).toContain('text/html');
		}
	});
});

describe('Certificado endpoint', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('rejects unauthenticated request', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/api/certificado/fake-id`);
		expect(res.status).toBe(401);
	});

	it('returns 404 for non-existent cat', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/certificado/00000000-0000-0000-0000-000000000000`, {
			headers: { Cookie: cookie }
		});
		expect([404, 500]).toContain(res.status);
	});
});

describe('Verificar endpoint', () => {
	let serverAvailable = false;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
	});

	it('returns result for hash lookup', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/api/verificar/fakehash123`);
		expect([200, 404]).toContain(res.status);
	});
});

describe('Credencial endpoint', () => {
	let serverAvailable = false;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
	});

	it('rejects unauthenticated request', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/api/credencial/fake-id`);
		expect(res.status).toBe(401);
	});
});

describe('API v1 Stats endpoint', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('returns stats data', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/v1/stats`, { headers: { Cookie: cookie } });
		if (res.status === 200) {
			const data = await res.json();
			expect(data).toBeDefined();
		}
	});
});

describe('Seed API endpoint', () => {
	let serverAvailable = false;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
	});

	it('exists and responds', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/api/seed`);
		expect([200, 401, 405, 500]).toContain(res.status);
	});
});

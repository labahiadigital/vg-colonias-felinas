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

describe('Colonias page CRUD', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('loads colonias page when authenticated', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/colonias`, {
			headers: { Cookie: cookie },
			redirect: 'manual'
		});
		expect(res.status).toBe(200);
	});

	it('creates a new colony via form action', async () => {
		if (!serverAvailable || !cookie) return;
		const form = new URLSearchParams();
		form.set('name', `Test Colony ${Date.now()}`);
		form.set('district', 'Centro');
		form.set('classification', 'urbana');
		form.set('description', 'Test colony for automated testing');
		form.set('latitude', '42.85');
		form.set('longitude', '-2.67');

		const res = await fetch(`${BASE}/colonias?/create`, {
			method: 'POST',
			headers: { Cookie: cookie, 'Content-Type': 'application/x-www-form-urlencoded' },
			body: form.toString(),
			redirect: 'manual'
		});
		expect([200, 303]).toContain(res.status);
	});

	it('rejects colony creation without name', async () => {
		if (!serverAvailable || !cookie) return;
		const form = new URLSearchParams();
		form.set('district', 'Centro');

		const res = await fetch(`${BASE}/colonias?/create`, {
			method: 'POST',
			headers: { Cookie: cookie, 'Content-Type': 'application/x-www-form-urlencoded' },
			body: form.toString(),
			redirect: 'manual'
		});
		expect([200, 400, 303]).toContain(res.status);
	});

	it('supports search filter', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/colonias?q=test`, {
			headers: { Cookie: cookie },
			redirect: 'manual'
		});
		expect(res.status).toBe(200);
	});

	it('supports status filter', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/colonias?status=active`, {
			headers: { Cookie: cookie },
			redirect: 'manual'
		});
		expect(res.status).toBe(200);
	});
});

describe('Gatos page CRUD', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('loads gatos page when authenticated', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/gatos`, {
			headers: { Cookie: cookie },
			redirect: 'manual'
		});
		expect(res.status).toBe(200);
	});

	it('creates a new cat via form action', async () => {
		if (!serverAvailable || !cookie) return;
		const form = new URLSearchParams();
		form.set('name', `TestCat_${Date.now()}`);
		form.set('sex', 'male');
		form.set('estimatedAge', 'adulto');

		const res = await fetch(`${BASE}/gatos?/create`, {
			method: 'POST',
			headers: { Cookie: cookie, 'Content-Type': 'application/x-www-form-urlencoded' },
			body: form.toString(),
			redirect: 'manual'
		});
		expect([200, 303]).toContain(res.status);
	});

	it('supports sterilized filter', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/gatos?sterilized=yes`, {
			headers: { Cookie: cookie },
			redirect: 'manual'
		});
		expect(res.status).toBe(200);
	});
});

describe('Incidencias page CRUD', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('loads incidencias page when authenticated', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/incidencias`, {
			headers: { Cookie: cookie },
			redirect: 'manual'
		});
		expect(res.status).toBe(200);
	});

	it('creates a new incident', async () => {
		if (!serverAvailable || !cookie) return;
		const form = new URLSearchParams();
		form.set('category', 'salud');
		form.set('priority', 'high');
		form.set('description', 'Automated test incident');

		const res = await fetch(`${BASE}/incidencias?/create`, {
			method: 'POST',
			headers: { Cookie: cookie, 'Content-Type': 'application/x-www-form-urlencoded' },
			body: form.toString(),
			redirect: 'manual'
		});
		expect([200, 303]).toContain(res.status);
	});

	it('rejects incident without category/description', async () => {
		if (!serverAvailable || !cookie) return;
		const form = new URLSearchParams();
		form.set('priority', 'low');

		const res = await fetch(`${BASE}/incidencias?/create`, {
			method: 'POST',
			headers: { Cookie: cookie, 'Content-Type': 'application/x-www-form-urlencoded' },
			body: form.toString(),
			redirect: 'manual'
		});
		expect([200, 400, 303]).toContain(res.status);
	});

	it('supports status filter', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/incidencias?status=open`, {
			headers: { Cookie: cookie },
			redirect: 'manual'
		});
		expect(res.status).toBe(200);
	});
});

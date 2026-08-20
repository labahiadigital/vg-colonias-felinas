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

describe('Colony detail page [id]', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('returns 200 for existing colony', async () => {
		if (!serverAvailable || !cookie) return;
		const listRes = await fetch(`${BASE}/api/export-full?format=json`, { headers: { Cookie: cookie } });
		if (listRes.status !== 200) return;
		const data = await listRes.json();
		const colonies = data.data?.colonies ?? [];
		if (colonies.length === 0) return;

		const firstId = colonies[0].id;
		const res = await fetch(`${BASE}/colonias/${firstId}`, {
			headers: { Cookie: cookie },
			redirect: 'manual'
		});
		expect(res.status).toBe(200);
	});

	it('returns 404 or error for non-existent colony', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/colonias/00000000-0000-0000-0000-000000000000`, {
			headers: { Cookie: cookie },
			redirect: 'manual'
		});
		expect([404, 500, 302]).toContain(res.status);
	});
});

describe('Cat detail page [id]', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('returns 200 for existing cat', async () => {
		if (!serverAvailable || !cookie) return;
		const listRes = await fetch(`${BASE}/api/export-full?format=json`, { headers: { Cookie: cookie } });
		if (listRes.status !== 200) return;
		const data = await listRes.json();
		const cats = data.data?.cats ?? [];
		if (cats.length === 0) return;

		const firstId = cats[0].id;
		const res = await fetch(`${BASE}/gatos/${firstId}`, {
			headers: { Cookie: cookie },
			redirect: 'manual'
		});
		expect(res.status).toBe(200);
	});

	it('returns 404 or error for non-existent cat', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/gatos/00000000-0000-0000-0000-000000000000`, {
			headers: { Cookie: cookie },
			redirect: 'manual'
		});
		expect([404, 500, 302]).toContain(res.status);
	});
});

describe('Dashboard page', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('loads dashboard with KPIs', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/dashboard`, {
			headers: { Cookie: cookie },
			redirect: 'manual'
		});
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html.length).toBeGreaterThan(1000);
	});
});

describe('Gatos identificar page', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('loads identification page', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/gatos/identificar`, {
			headers: { Cookie: cookie },
			redirect: 'manual'
		});
		expect(res.status).toBe(200);
	});
});

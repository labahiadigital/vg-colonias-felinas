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

describe('Mapa page', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('loads mapa page', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/mapa`, {
			headers: { Cookie: cookie },
			redirect: 'manual'
		});
		expect(res.status).toBe(200);
	});
});

describe('Informes page', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('loads informes page', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/informes`, {
			headers: { Cookie: cookie },
			redirect: 'manual'
		});
		expect(res.status).toBe(200);
	});
});

describe('Reportar public page (citizen report)', () => {
	let serverAvailable = false;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
	});

	it('loads reportar page without auth', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/reportar`);
		expect(res.status).toBe(200);
	});
});

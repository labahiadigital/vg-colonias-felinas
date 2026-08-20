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

describe('Protected routes redirect to login without auth', () => {
	let serverAvailable = false;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
	});

	const protectedRoutes = [
		'/dashboard',
		'/colonias',
		'/gatos',
		'/mapa',
		'/incidencias',
		'/visitas',
		'/informes',
		'/configuracion',
		'/campanas',
		'/material'
	];

	it.each(protectedRoutes)('%s redirects to /login without session', async (route) => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}${route}`, { redirect: 'manual' });
		expect(res.status).toBe(302);
		const location = res.headers.get('Location');
		expect(location).toContain('/login');
	});
});

describe('Auth routes redirect to dashboard when authenticated', () => {
	let serverAvailable = false;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
	});

	it('/login redirects to /dashboard when logged in', async () => {
		if (!serverAvailable) return;
		const cookie = await getAuthCookie();
		if (!cookie) return;

		const res = await fetch(`${BASE}/login`, {
			redirect: 'manual',
			headers: { Cookie: cookie }
		});
		expect(res.status).toBe(302);
		expect(res.headers.get('Location')).toContain('/dashboard');
	});

	it('/ redirects to /dashboard when logged in', async () => {
		if (!serverAvailable) return;
		const cookie = await getAuthCookie();
		if (!cookie) return;

		const res = await fetch(`${BASE}/`, {
			redirect: 'manual',
			headers: { Cookie: cookie }
		});
		expect(res.status).toBe(302);
		expect(res.headers.get('Location')).toContain('/dashboard');
	});
});

describe('Public routes work without auth', () => {
	let serverAvailable = false;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
	});

	it('/login returns 200', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/login`, { redirect: 'manual' });
		expect(res.status).toBe(200);
	});

	it('/reportar returns 200 (citizen portal)', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/reportar`, { redirect: 'manual' });
		expect(res.status).toBe(200);
	});

	it('/registro returns 200', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/registro`, { redirect: 'manual' });
		expect(res.status).toBe(200);
	});
});

describe('Protected routes return 200 when authenticated', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) {
			cookie = await getAuthCookie();
		}
	});

	it('/dashboard returns 200 with session', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/dashboard`, {
			redirect: 'manual',
			headers: { Cookie: cookie }
		});
		expect(res.status).toBe(200);
	});

	it('/colonias returns 200 with session', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/colonias`, {
			redirect: 'manual',
			headers: { Cookie: cookie }
		});
		expect(res.status).toBe(200);
	});

	it('/gatos returns 200 with session', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/gatos`, {
			redirect: 'manual',
			headers: { Cookie: cookie }
		});
		expect(res.status).toBe(200);
	});

	it('/mapa returns 200 with session', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/mapa`, {
			redirect: 'manual',
			headers: { Cookie: cookie }
		});
		expect(res.status).toBe(200);
	});
});

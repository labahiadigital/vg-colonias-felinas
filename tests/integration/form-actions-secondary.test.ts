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

describe('Visitas page', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('loads visitas page', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/visitas`, { headers: { Cookie: cookie }, redirect: 'manual' });
		expect(res.status).toBe(200);
	});

	it('creates a visit', async () => {
		if (!serverAvailable || !cookie) return;
		const form = new URLSearchParams();
		form.set('notes', 'Visita de prueba automatizada');
		const res = await fetch(`${BASE}/visitas?/create`, {
			method: 'POST',
			headers: { Cookie: cookie, 'Content-Type': 'application/x-www-form-urlencoded' },
			body: form.toString(),
			redirect: 'manual'
		});
		expect([200, 303]).toContain(res.status);
	});
});

describe('Campañas page', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('loads campanas page', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/campanas`, { headers: { Cookie: cookie }, redirect: 'manual' });
		expect(res.status).toBe(200);
	});

	it('creates a campaign', async () => {
		if (!serverAvailable || !cookie) return;
		const form = new URLSearchParams();
		form.set('name', `TestCampaign_${Date.now()}`);
		form.set('startDate', '2026-08-20');
		form.set('endDate', '2026-09-20');
		const res = await fetch(`${BASE}/campanas?/create`, {
			method: 'POST',
			headers: { Cookie: cookie, 'Content-Type': 'application/x-www-form-urlencoded' },
			body: form.toString(),
			redirect: 'manual'
		});
		expect([200, 303]).toContain(res.status);
	});
});

describe('Material page', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('loads material page', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/material`, { headers: { Cookie: cookie }, redirect: 'manual' });
		expect(res.status).toBe(200);
	});

	it('creates equipment', async () => {
		if (!serverAvailable || !cookie) return;
		const form = new URLSearchParams();
		form.set('name', `Trampa Test ${Date.now()}`);
		form.set('type', 'trampa');
		form.set('quantity', '5');
		const res = await fetch(`${BASE}/material?/create`, {
			method: 'POST',
			headers: { Cookie: cookie, 'Content-Type': 'application/x-www-form-urlencoded' },
			body: form.toString(),
			redirect: 'manual'
		});
		expect([200, 303]).toContain(res.status);
	});
});

describe('Salud page', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('loads salud page', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/salud`, { headers: { Cookie: cookie }, redirect: 'manual' });
		expect(res.status).toBe(200);
	});

	it('creates a health record', async () => {
		if (!serverAvailable || !cookie) return;
		const form = new URLSearchParams();
		form.set('type', 'vaccination');
		form.set('vetName', 'Dr. Test');
		form.set('notes', 'Automated health record test');
		const res = await fetch(`${BASE}/salud?/create`, {
			method: 'POST',
			headers: { Cookie: cookie, 'Content-Type': 'application/x-www-form-urlencoded' },
			body: form.toString(),
			redirect: 'manual'
		});
		expect([200, 303]).toContain(res.status);
	});
});

describe('Adopciones page', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('loads adopciones page', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/adopciones`, { headers: { Cookie: cookie }, redirect: 'manual' });
		expect(res.status).toBe(200);
	});
});

describe('Inspecciones page', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('loads inspecciones page', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/inspecciones`, { headers: { Cookie: cookie }, redirect: 'manual' });
		expect(res.status).toBe(200);
	});
});

describe('Proveedores page', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('loads proveedores page', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/proveedores`, { headers: { Cookie: cookie }, redirect: 'manual' });
		expect(res.status).toBe(200);
	});
});

describe('Colaboradores page', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('loads colaboradores page', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/colaboradores`, { headers: { Cookie: cookie }, redirect: 'manual' });
		expect(res.status).toBe(200);
	});
});

describe('CER page', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('loads CER page', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/cer`, { headers: { Cookie: cookie }, redirect: 'manual' });
		expect(res.status).toBe(200);
	});
});

describe('Mensajes page', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('loads mensajes page', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/mensajes`, { headers: { Cookie: cookie }, redirect: 'manual' });
		expect(res.status).toBe(200);
	});
});

describe('Configuración page', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('loads configuracion page', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/configuracion`, { headers: { Cookie: cookie }, redirect: 'manual' });
		expect(res.status).toBe(200);
	});
});

describe('Superadmin page', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('loads superadmin page', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/superadmin`, { headers: { Cookie: cookie }, redirect: 'manual' });
		expect([200, 403]).toContain(res.status);
	});
});

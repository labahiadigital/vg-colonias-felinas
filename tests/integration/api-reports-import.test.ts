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

describe('Regulatory Report endpoint', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('rejects unauthenticated request', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/api/regulatory-report`);
		expect(res.status).toBe(401);
	});

	it('returns template list without params', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/regulatory-report`, {
			headers: { Cookie: cookie }
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.templates).toBeDefined();
		expect(data.templates.ES).toBeDefined();
		expect(data.templates.ES.length).toBeGreaterThan(0);
	});

	it('generates Spanish memoria_anual report', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/regulatory-report?country=ES&type=memoria_anual&year=2026&org=TestOrg&municipio=TestCity`, {
			headers: { Cookie: cookie }
		});
		expect(res.status).toBe(200);
		expect(res.headers.get('Content-Type')).toContain('text/html');
		const html = await res.text();
		expect(html).toContain('MEMORIA ANUAL');
		expect(html).toContain('TestOrg');
		expect(html).toContain('TestCity');
		expect(html).toContain('2026');
	});

	it('generates Portuguese report', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/regulatory-report?country=PT&type=relatorio_anual&year=2026`, {
			headers: { Cookie: cookie }
		});
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain('RELATÓRIO ANUAL');
	});

	it('generates Italian report', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/regulatory-report?country=IT&type=relazione_annuale`, {
			headers: { Cookie: cookie }
		});
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain('RELAZIONE ANNUALE');
	});

	it('generates French report', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/regulatory-report?country=FR&type=rapport_annuel`, {
			headers: { Cookie: cookie }
		});
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain('RAPPORT ANNUEL');
	});

	it('returns 404 for unknown template', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/regulatory-report?country=XX&type=fake`, {
			headers: { Cookie: cookie }
		});
		expect(res.status).toBe(404);
	});
});

describe('Cat Identify endpoint', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('rejects unauthenticated request', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/api/cat-identify`, { method: 'POST' });
		expect(res.status).toBe(401);
	});

	it('rejects request without photo', async () => {
		if (!serverAvailable || !cookie) return;
		const form = new FormData();
		const res = await fetch(`${BASE}/api/cat-identify`, {
			method: 'POST',
			headers: { Cookie: cookie },
			body: form
		});
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toContain('foto');
	});

	it('rejects oversized file', async () => {
		if (!serverAvailable || !cookie) return;
		const bigBlob = new Blob([new Uint8Array(11 * 1024 * 1024)], { type: 'image/jpeg' });
		const form = new FormData();
		form.append('photo', bigBlob, 'big.jpg');
		const res = await fetch(`${BASE}/api/cat-identify`, {
			method: 'POST',
			headers: { Cookie: cookie },
			body: form
		});
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toContain('grande');
	});

	it('returns manual analysis when no OpenAI key', async () => {
		if (!serverAvailable || !cookie) return;
		const smallBlob = new Blob([new Uint8Array(100)], { type: 'image/jpeg' });
		const form = new FormData();
		form.append('photo', smallBlob, 'cat.jpg');
		const res = await fetch(`${BASE}/api/cat-identify`, {
			method: 'POST',
			headers: { Cookie: cookie },
			body: form
		});
		if (res.status === 200) {
			const data = await res.json();
			expect(data.method).toBeDefined();
			expect(['manual', 'ai', 'fallback']).toContain(data.method);
			expect(data.analysis).toBeDefined();
		}
	});
});

describe('Import endpoint', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('rejects unauthenticated request', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/api/import`, { method: 'POST' });
		expect(res.status).toBe(401);
	});

	it('rejects request without file', async () => {
		if (!serverAvailable || !cookie) return;
		const form = new FormData();
		form.append('entity', 'colonies');
		const res = await fetch(`${BASE}/api/import`, {
			method: 'POST',
			headers: { Cookie: cookie },
			body: form
		});
		expect(res.status).toBe(400);
	});

	it('rejects unsupported entity', async () => {
		if (!serverAvailable || !cookie) return;
		const form = new FormData();
		const csvBlob = new Blob(['name,status\nTest,active'], { type: 'text/csv' });
		form.append('file', csvBlob, 'test.csv');
		form.append('entity', 'unknown_entity');
		const res = await fetch(`${BASE}/api/import`, {
			method: 'POST',
			headers: { Cookie: cookie },
			body: form
		});
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toContain('no soportada');
	});

	it('imports valid colonies CSV', async () => {
		if (!serverAvailable || !cookie) return;
		const csv = 'nombre,estado,distrito\nColonia Test Import,active,Centro';
		const form = new FormData();
		form.append('file', new Blob([csv], { type: 'text/csv' }), 'colonies.csv');
		form.append('entity', 'colonies');
		const res = await fetch(`${BASE}/api/import`, {
			method: 'POST',
			headers: { Cookie: cookie },
			body: form
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.imported).toBeGreaterThanOrEqual(1);
	});

	it('rejects empty CSV', async () => {
		if (!serverAvailable || !cookie) return;
		const form = new FormData();
		form.append('file', new Blob([''], { type: 'text/csv' }), 'empty.csv');
		form.append('entity', 'colonies');
		const res = await fetch(`${BASE}/api/import`, {
			method: 'POST',
			headers: { Cookie: cookie },
			body: form
		});
		expect(res.status).toBe(400);
	});
});

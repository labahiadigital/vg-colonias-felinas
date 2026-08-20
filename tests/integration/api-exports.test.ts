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

describe('Export PDF endpoint', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('rejects unauthenticated request', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/api/export-pdf`);
		expect(res.status).toBe(401);
	});

	it('returns HTML report (general)', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/export-pdf?type=general`, {
			headers: { Cookie: cookie }
		});
		expect(res.status).toBe(200);
		expect(res.headers.get('Content-Type')).toContain('text/html');
		expect(res.headers.get('Content-Disposition')).toContain('attachment');
		const html = await res.text();
		expect(html).toContain('<!DOCTYPE html>');
		expect(html).toContain('INFORME');
	});

	it('returns compliance report', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/export-pdf?type=compliance_report`, {
			headers: { Cookie: cookie }
		});
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain('CUMPLIMIENTO NORMATIVO');
		expect(html).toContain('Ley 7/2023');
	});

	it('returns subsidy DGDA report', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/export-pdf?type=subsidy_dgda`, {
			headers: { Cookie: cookie }
		});
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain('MEMORIA JUSTIFICATIVA');
		expect(html).toContain('DGDA');
	});
});

describe('Export Excel (CSV) endpoint', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('rejects unauthenticated request', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/api/export-excel`);
		expect(res.status).toBe(401);
	});

	it('exports colonies CSV', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/export-excel?type=colonies`, {
			headers: { Cookie: cookie }
		});
		expect(res.status).toBe(200);
		expect(res.headers.get('Content-Type')).toContain('text/csv');
		const csv = await res.text();
		expect(csv).toContain('ID');
		expect(csv).toContain('Nombre');
	});

	it('exports cats CSV', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/export-excel?type=cats`, {
			headers: { Cookie: cookie }
		});
		expect(res.status).toBe(200);
		const csv = await res.text();
		expect(csv).toContain('Microchip');
	});

	it('exports incidents CSV', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/export-excel?type=incidents`, {
			headers: { Cookie: cookie }
		});
		expect(res.status).toBe(200);
	});

	it('rejects invalid type', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/export-excel?type=invalid`, {
			headers: { Cookie: cookie }
		});
		expect(res.status).toBe(400);
	});
});

describe('Export Full endpoint', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('rejects unauthenticated request', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/api/export-full`);
		expect(res.status).toBe(401);
	});

	it('returns JSON with manifest and data', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/export-full?format=json`, {
			headers: { Cookie: cookie }
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.manifest).toBeDefined();
		expect(data.manifest.exportedAt).toBeDefined();
		expect(data.manifest.tables).toBeDefined();
		expect(data.data).toBeDefined();
		expect(data.data.colonies).toBeDefined();
		expect(data.data.cats).toBeDefined();
	});

	it('returns CSV format', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/export-full?format=csv`, {
			headers: { Cookie: cookie }
		});
		expect(res.status).toBe(200);
		expect(res.headers.get('Content-Type')).toContain('text/csv');
	});
});

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

describe('API v1 endpoints', () => {
	let serverAvailable = false;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
	});

	describe('GET /api/v1/colonies', () => {
		it('rejects request without API key', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/api/v1/colonies`);
			expect(res.status).toBe(401);
			const data = await res.json();
			expect(data.error).toContain('API key');
		});

		it('rejects request with invalid API key', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/api/v1/colonies`, {
				headers: { Authorization: 'Bearer invalid_key_here' }
			});
			expect(res.status).toBe(401);
		});

		it('rejects Bearer token without gtp_ prefix', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/api/v1/colonies`, {
				headers: { Authorization: 'Bearer sk_some_other_key' }
			});
			expect(res.status).toBe(401);
			const data = await res.json();
			expect(data.error).toContain('gtp_');
		});
	});

	describe('GET /api/v1/cats', () => {
		it('rejects request without API key', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/api/v1/cats`);
			expect(res.status).toBe(401);
		});
	});

	describe('GET /api/v1/stats', () => {
		it('rejects request without API key', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/api/v1/stats`);
			expect(res.status).toBe(401);
		});
	});

	describe('GET /api/v1/openapi.json', () => {
		it('returns OpenAPI spec without auth', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/api/v1/openapi.json`);
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.openapi).toBe('3.0.3');
			expect(data.info.title).toContain('Gatopolis');
			expect(data.paths).toBeDefined();
			expect(data.paths['/colonies']).toBeDefined();
			expect(data.paths['/cats']).toBeDefined();
			expect(data.paths['/stats']).toBeDefined();
		});
	});
});

describe('Search endpoint', () => {
	let serverAvailable = false;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
	});

	it('rejects unauthenticated short query', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/api/search?q=a`);
		expect(res.status).toBe(401);
	});

	it('rejects unauthenticated empty query', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/api/search`);
		expect(res.status).toBe(401);
	});

	it('rejects unauthenticated colony search', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/api/search?q=Florida`);
		expect(res.status).toBe(401);
	});

	it('rejects unauthenticated cat search', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/api/search?q=Luna`);
		expect(res.status).toBe(401);
	});
});

describe('Citizen report endpoint', () => {
	let serverAvailable = false;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
	});

	it('rejects invalid report (short description)', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/api/citizen-report`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ category: 'abandoned', description: 'ab' })
		});
		expect(res.status).toBe(400);
	});

	it('rejects invalid category', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/api/citizen-report`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ category: 'fake', description: 'A valid description here' })
		});
		expect(res.status).toBe(400);
	});

	it('accepts valid citizen report or is rate-limited', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/api/citizen-report`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				category: 'abandoned',
				description: 'Test citizen report from automated test - gato abandonado en parque',
				latitude: 42.846,
				longitude: -2.672,
				email: 'test-citizen@example.com'
			})
		});
		if (res.status === 429) return;
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);
	});
});

describe('Set locale endpoint', () => {
	let serverAvailable = false;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
	});

	it('sets locale cookie via formData and redirects', async () => {
		if (!serverAvailable) return;
		const form = new FormData();
		form.append('locale', 'eu');
		const res = await fetch(`${BASE}/api/set-locale`, {
			method: 'POST',
			body: form,
			redirect: 'manual'
		});
		expect(res.status).toBe(303);
	});
});

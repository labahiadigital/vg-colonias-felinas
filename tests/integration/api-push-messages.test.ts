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

describe('Push Subscribe endpoint', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('POST rejects unauthenticated', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/api/push-subscribe`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({})
		});
		expect(res.status).toBe(401);
	});

	it('POST rejects invalid subscription', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/push-subscribe`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Cookie: cookie },
			body: JSON.stringify({ endpoint: '' })
		});
		expect(res.status).toBe(400);
	});

	it('POST accepts valid subscription', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/push-subscribe`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Cookie: cookie },
			body: JSON.stringify({
				endpoint: 'https://fcm.googleapis.com/test-endpoint-' + Date.now(),
				keys: { p256dh: 'test-p256dh', auth: 'test-auth' }
			})
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.ok).toBe(true);
	});

	it('DELETE rejects unauthenticated', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/api/push-subscribe`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({})
		});
		expect(res.status).toBe(401);
	});

	it('DELETE requires endpoint', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/push-subscribe`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json', Cookie: cookie },
			body: JSON.stringify({})
		});
		expect(res.status).toBe(400);
	});

	it('DELETE succeeds with valid endpoint', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/push-subscribe`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json', Cookie: cookie },
			body: JSON.stringify({ endpoint: 'https://fcm.googleapis.com/nonexistent' })
		});
		expect(res.status).toBe(200);
	});
});

describe('Messages endpoint', () => {
	let serverAvailable = false;
	let cookie: string | null = null;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
		if (serverAvailable) cookie = await getAuthCookie();
	});

	it('rejects unauthenticated request', async () => {
		if (!serverAvailable) return;
		const res = await fetch(`${BASE}/api/messages/fake-conversation-id`);
		expect(res.status).toBe(401);
	});

	it('returns array for valid conversation (may be empty)', async () => {
		if (!serverAvailable || !cookie) return;
		const res = await fetch(`${BASE}/api/messages/test-convo-id`, {
			headers: { Cookie: cookie }
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(Array.isArray(data)).toBe(true);
	});
});

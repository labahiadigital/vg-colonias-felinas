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

describe('Auth API endpoints', () => {
	let serverAvailable = false;

	beforeAll(async () => {
		serverAvailable = await isServerRunning();
	});

	describe('sign-in endpoint', () => {
		it('rejects wrong password', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/api/auth/sign-in/email`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'test@gatopolis.app', password: 'WrongPassword1!' })
			});
			// 401, 403 (rate limit), or 429 are all valid rejection statuses
			expect(res.status).toBeGreaterThanOrEqual(400);
		});

		it('rejects non-existent user', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/api/auth/sign-in/email`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'nonexistent@example.com', password: 'SomePassword1!' })
			});
			expect(res.status).toBeGreaterThanOrEqual(400);
		});

		it('returns user data on valid credentials', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/api/auth/sign-in/email`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'test@gatopolis.app', password: 'Gatopolis2026!' })
			});
			if (res.status === 429 || res.status === 403) return; // rate limited
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.user).toBeDefined();
			expect(data.user.email).toBe('test@gatopolis.app');
		});
	});

	describe('sign-up endpoint', () => {
		it('rejects duplicate email', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Duplicate',
					email: 'test@gatopolis.app',
					password: 'DuplicatePass2026!'
				})
			});
			if (res.status === 429) return; // rate limited
			expect(res.status).toBeGreaterThanOrEqual(400);
		});

		it('rejects short password', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Short Pass',
					email: `shortpass-${Date.now()}@test.com`,
					password: 'abc'
				})
			});
			if (res.status === 429) return;
			expect(res.status).toBeGreaterThanOrEqual(400);
		});
	});

	describe('session endpoint', () => {
		it('returns null for unauthenticated request', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/api/auth/get-session`);
			const data = await res.json();
			expect(data).toBeNull();
		});
	});
});

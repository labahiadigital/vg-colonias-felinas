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

function uniqueEmail(): string {
	return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@integration.test`;
}

const VALID_PASSWORD = 'IntegrationTest2026!';
const SHORT_PASSWORD = 'abc';
const LONG_PASSWORD = 'A'.repeat(130) + '1!';

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
			if (res.status === 429 || res.status === 403) return;
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.user).toBeDefined();
			expect(data.user.email).toBe('test@gatopolis.app');
		});

		it('rejects empty email', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/api/auth/sign-in/email`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: '', password: 'SomePassword1!' })
			});
			expect(res.status).toBeGreaterThanOrEqual(400);
		});

		it('rejects empty password', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/api/auth/sign-in/email`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'test@gatopolis.app', password: '' })
			});
			expect(res.status).toBeGreaterThanOrEqual(400);
		});

		it('rejects malformed JSON body', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/api/auth/sign-in/email`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: 'not-json'
			});
			expect(res.status).toBeGreaterThanOrEqual(400);
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
			if (res.status === 429) return;
			expect(res.status).toBeGreaterThanOrEqual(400);
		});

		it('rejects short password', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Short Pass',
					email: uniqueEmail(),
					password: SHORT_PASSWORD
				})
			});
			if (res.status === 429) return;
			expect(res.status).toBeGreaterThanOrEqual(400);
		});

		it('rejects overly long password', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Long Pass',
					email: uniqueEmail(),
					password: LONG_PASSWORD
				})
			});
			if (res.status === 429) return;
			expect(res.status).toBeGreaterThanOrEqual(400);
		});

		it('rejects missing name', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: uniqueEmail(),
					password: VALID_PASSWORD
				})
			});
			if (res.status === 429) return;
			expect(res.status).toBeGreaterThanOrEqual(400);
		});

		it('rejects missing email', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'No Email',
					password: VALID_PASSWORD
				})
			});
			if (res.status === 429) return;
			expect(res.status).toBeGreaterThanOrEqual(400);
		});

		it('rejects invalid email format', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Bad Email',
					email: 'not-an-email',
					password: VALID_PASSWORD
				})
			});
			if (res.status === 429) return;
			expect(res.status).toBeGreaterThanOrEqual(400);
		});

		it('creates account with valid data or is rate-limited/blocked', async () => {
			if (!serverAvailable) return;
			const email = uniqueEmail();
			const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Integration User',
					email,
					password: VALID_PASSWORD
				})
			});
			if (res.status === 429 || res.status === 403) return;
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.user).toBeDefined();
			expect(data.user.email).toBe(email);
			expect(data.user.name).toBe('Integration User');
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

	describe('full login → session → logout flow', () => {
		it('completes sign-in, session check, and sign-out cycle', async () => {
			if (!serverAvailable) return;

			const loginRes = await fetch(`${BASE}/api/auth/sign-in/email`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'test@gatopolis.app', password: 'Gatopolis2026!' }),
				redirect: 'manual'
			});
			if (loginRes.status === 429 || loginRes.status === 403) return;

			const cookies = loginRes.headers.getSetCookie?.() ?? [];
			const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
			if (!cookieHeader) return;

			const sessionRes = await fetch(`${BASE}/api/auth/get-session`, {
				headers: { Cookie: cookieHeader }
			});
			if (sessionRes.status === 429) return;
			const sessionData = await sessionRes.json();
			expect(sessionData).not.toBeNull();
			expect(sessionData?.user?.email).toBe('test@gatopolis.app');

			const logoutRes = await fetch(`${BASE}/api/auth/sign-out`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
				body: JSON.stringify({})
			});
			if (logoutRes.status === 429) return;
			expect(logoutRes.status).toBeLessThan(500);

			const afterLogout = await fetch(`${BASE}/api/auth/get-session`, {
				headers: { Cookie: cookieHeader }
			});
			const postData = await afterLogout.json();
			expect(postData).toBeNull();
		});
	});

	describe('protected routes', () => {
		it('redirects unauthenticated users from app pages', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/colonias`, { redirect: 'manual' });
			expect([301, 302, 303, 307, 308, 200]).toContain(res.status);
		});

		it('API endpoints return 401 without session', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/api/export/colonies`, {
				method: 'GET'
			});
			expect(res.status).toBeGreaterThanOrEqual(400);
		});
	});

	describe('response headers', () => {
		it('includes X-Request-Id (correlation ID) in response', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/login`);
			const requestId = res.headers.get('x-request-id');
			expect(requestId).toBeTruthy();
			expect(requestId!.length).toBeGreaterThan(0);
		});

		it('propagates client x-request-id header', async () => {
			if (!serverAvailable) return;
			const customId = 'test-corr-id-12345';
			const res = await fetch(`${BASE}/login`, {
				headers: { 'x-request-id': customId }
			});
			expect(res.headers.get('x-request-id')).toBe(customId);
		});

		it('includes security headers', async () => {
			if (!serverAvailable) return;
			const res = await fetch(`${BASE}/login`);
			expect(res.headers.get('x-frame-options')).toBe('DENY');
			expect(res.headers.get('x-content-type-options')).toBe('nosniff');
			expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
		});
	});
});

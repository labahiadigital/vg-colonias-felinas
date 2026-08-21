import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'crypto';

const limitMock = vi.fn();
const whereMock = vi.fn(() => ({ limit: limitMock }));
const andMock = vi.fn();
const setMock = vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) }));
const updateMock = vi.fn(() => ({ set: setMock }));
const fromMock = vi.fn(() => ({ where: whereMock }));
const selectMock = vi.fn(() => ({ from: fromMock }));

vi.mock('../../src/lib/server/db/index.js', () => ({
	db: {
		select: selectMock,
		update: updateMock
	}
}));

vi.mock('../../src/lib/server/rate-limit.js', () => ({
	rateLimitGuard: vi.fn().mockReturnValue(null)
}));

const { validateApiKey, requireApiAuth } = await import('../../src/lib/server/api-auth.js');

function makeRequest(key?: string): Request {
	const headers: Record<string, string> = {};
	if (key) headers['Authorization'] = `Bearer ${key}`;
	return { headers: new Headers(headers) } as unknown as Request;
}

const VALID_KEY = 'gtp_testKeyForValidation123456';
const VALID_HASH = createHash('sha256').update(VALID_KEY).digest('hex');

function mockDbKeyResult(overrides: Record<string, unknown> = {}) {
	const key = {
		id: 'key-1',
		keyHash: VALID_HASH,
		active: true,
		organizationId: 'org-1',
		scopes: ['read:colonies', 'read:cats'],
		rateLimit: 500,
		expiresAt: null,
		...overrides
	};
	limitMock.mockResolvedValue([key]);
}

beforeEach(() => {
	vi.clearAllMocks();
	limitMock.mockResolvedValue([]);
});

describe('validateApiKey', () => {
	it('rejects when no Authorization header', async () => {
		const result = await validateApiKey(makeRequest());
		expect(result.valid).toBe(false);
		expect(result.error).toContain('Missing');
	});

	it('rejects when Authorization does not start with Bearer gtp_', async () => {
		const result = await validateApiKey(makeRequest('sk_other_key'));
		expect(result.valid).toBe(false);
		expect(result.error).toContain('Missing');
	});

	it('rejects when key not found in DB', async () => {
		limitMock.mockResolvedValue([]);
		const result = await validateApiKey(makeRequest(VALID_KEY));
		expect(result.valid).toBe(false);
		expect(result.error).toContain('Invalid API key');
	});

	it('rejects when key is expired', async () => {
		mockDbKeyResult({ expiresAt: new Date('2020-01-01') });
		const result = await validateApiKey(makeRequest(VALID_KEY));
		expect(result.valid).toBe(false);
		expect(result.error).toContain('expired');
	});

	it('returns valid for a correct, non-expired key', async () => {
		mockDbKeyResult();
		const result = await validateApiKey(makeRequest(VALID_KEY));
		expect(result.valid).toBe(true);
		expect(result.organizationId).toBe('org-1');
		expect(result.remaining).toBe(500);
	});

	it('allows any scope when key has wildcard scope ["*"]', async () => {
		mockDbKeyResult({ scopes: ['*'] });
		const result = await validateApiKey(makeRequest(VALID_KEY), 'admin:destroy');
		expect(result.valid).toBe(true);
	});

	it('rejects when required scope is not in key scopes', async () => {
		mockDbKeyResult({ scopes: ['read:colonies'] });
		const result = await validateApiKey(makeRequest(VALID_KEY), 'write:cats');
		expect(result.valid).toBe(false);
		expect(result.error).toContain('Insufficient scope');
	});

	it('allows when required scope matches one of key scopes', async () => {
		mockDbKeyResult({ scopes: ['read:colonies', 'read:cats'] });
		const result = await validateApiKey(makeRequest(VALID_KEY), 'read:cats');
		expect(result.valid).toBe(true);
	});

	it('skips scope check when requiredScope is undefined', async () => {
		mockDbKeyResult({ scopes: ['read:colonies'] });
		const result = await validateApiKey(makeRequest(VALID_KEY));
		expect(result.valid).toBe(true);
	});

	it('updates lastUsedAt on valid key', async () => {
		mockDbKeyResult();
		await validateApiKey(makeRequest(VALID_KEY));
		expect(updateMock).toHaveBeenCalled();
	});

	it('does not update lastUsedAt on invalid key', async () => {
		limitMock.mockResolvedValue([]);
		await validateApiKey(makeRequest(VALID_KEY));
		expect(updateMock).not.toHaveBeenCalled();
	});

	it('returns default remaining 1000 when key has no rateLimit', async () => {
		mockDbKeyResult({ rateLimit: null });
		const result = await validateApiKey(makeRequest(VALID_KEY));
		expect(result.remaining).toBe(1000);
	});

	it('handles non-expired future date correctly', async () => {
		mockDbKeyResult({ expiresAt: new Date('2030-12-31') });
		const result = await validateApiKey(makeRequest(VALID_KEY));
		expect(result.valid).toBe(true);
	});
});

describe('requireApiAuth', () => {
	it('returns error Response when key is invalid', async () => {
		const result = await requireApiAuth(makeRequest(), 'read:colonies');
		expect(result).toBeInstanceOf(Response);
		const body = await (result as Response).json();
		expect(body.error).toContain('Missing');
		expect((result as Response).status).toBe(401);
	});

	it('returns org context when key is valid and rate limit passes', async () => {
		mockDbKeyResult();
		const result = await requireApiAuth(makeRequest(VALID_KEY), 'read:colonies');
		expect(result).not.toBeInstanceOf(Response);
		expect((result as { organizationId: string }).organizationId).toBe('org-1');
		expect((result as { remaining: number }).remaining).toBe(500);
	});

	it('returns rate limit Response when rate limited', async () => {
		mockDbKeyResult();
		const { rateLimitGuard } = await import('../../src/lib/server/rate-limit.js');
		(rateLimitGuard as ReturnType<typeof vi.fn>).mockReturnValueOnce(
			new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 })
		);

		const result = await requireApiAuth(makeRequest(VALID_KEY), 'read:colonies');
		expect(result).toBeInstanceOf(Response);
		expect((result as Response).status).toBe(429);
	});
});

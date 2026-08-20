import { describe, it, expect } from 'vitest';

function parseAuthHeader(authHeader: string | null): { valid: boolean; rawKey?: string; error?: string } {
	if (!authHeader?.startsWith('Bearer gtp_')) {
		return { valid: false, error: 'Missing or invalid API key. Use: Authorization: Bearer gtp_...' };
	}
	const rawKey = authHeader.replace('Bearer ', '');
	return { valid: true, rawKey };
}

function checkScope(scopes: string[], requiredScope: string): boolean {
	return scopes.includes('*') || scopes.includes(requiredScope);
}

function isExpired(expiresAt: string | null): boolean {
	if (!expiresAt) return false;
	return new Date(expiresAt) < new Date();
}

describe('API auth header parsing', () => {
	it('rejects null header', () => {
		const result = parseAuthHeader(null);
		expect(result.valid).toBe(false);
		expect(result.error).toContain('Missing');
	});

	it('rejects header without Bearer prefix', () => {
		const result = parseAuthHeader('gtp_abc123');
		expect(result.valid).toBe(false);
	});

	it('rejects Bearer with non-gtp key', () => {
		const result = parseAuthHeader('Bearer sk_abc123');
		expect(result.valid).toBe(false);
	});

	it('accepts valid Bearer gtp_ header', () => {
		const result = parseAuthHeader('Bearer gtp_abcdefghijklmnopqrstuvwxyz123456789012');
		expect(result.valid).toBe(true);
		expect(result.rawKey).toBe('gtp_abcdefghijklmnopqrstuvwxyz123456789012');
	});
});

describe('scope checking', () => {
	it('wildcard scope grants everything', () => {
		expect(checkScope(['*'], 'colonies:read')).toBe(true);
		expect(checkScope(['*'], 'cats:write')).toBe(true);
	});

	it('specific scope matches exactly', () => {
		expect(checkScope(['colonies:read', 'cats:read'], 'colonies:read')).toBe(true);
	});

	it('rejects missing scope', () => {
		expect(checkScope(['colonies:read'], 'cats:write')).toBe(false);
	});

	it('empty scopes reject everything', () => {
		expect(checkScope([], 'colonies:read')).toBe(false);
	});
});

describe('expiry checking', () => {
	it('null expiry means not expired', () => {
		expect(isExpired(null)).toBe(false);
	});

	it('future date is not expired', () => {
		const future = new Date(Date.now() + 86400000).toISOString();
		expect(isExpired(future)).toBe(false);
	});

	it('past date is expired', () => {
		const past = new Date(Date.now() - 86400000).toISOString();
		expect(isExpired(past)).toBe(true);
	});
});

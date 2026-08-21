import { describe, it, expect } from 'vitest';
import { generateApiKey } from '../../src/lib/server/api-auth.js';

vi.mock('../../src/lib/server/db/index.js', () => ({
	db: {}
}));

describe('generateApiKey', () => {
	it('returns an object with key, hash, and prefix', () => {
		const result = generateApiKey();
		expect(result).toHaveProperty('key');
		expect(result).toHaveProperty('hash');
		expect(result).toHaveProperty('prefix');
	});

	it('key starts with gtp_ prefix', () => {
		const { key } = generateApiKey();
		expect(key).toMatch(/^gtp_/);
	});

	it('prefix is the first 8 characters of the key', () => {
		const { key, prefix } = generateApiKey();
		expect(prefix).toBe(key.substring(0, 8));
	});

	it('hash is a valid 64-character hex string (SHA-256)', () => {
		const { hash } = generateApiKey();
		expect(hash).toMatch(/^[0-9a-f]{64}$/);
	});

	it('generates unique keys on each call', () => {
		const k1 = generateApiKey();
		const k2 = generateApiKey();
		expect(k1.key).not.toBe(k2.key);
		expect(k1.hash).not.toBe(k2.hash);
	});

	it('key is long enough to be cryptographically secure', () => {
		const { key } = generateApiKey();
		expect(key.length).toBeGreaterThan(30);
	});

	it('hash is deterministic for the same key content', () => {
		const { key, hash } = generateApiKey();
		const { createHash } = require('crypto');
		const manualHash = createHash('sha256').update(key).digest('hex');
		expect(hash).toBe(manualHash);
	});
});

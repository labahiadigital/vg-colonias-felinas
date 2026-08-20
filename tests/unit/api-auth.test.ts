import { describe, it, expect } from 'vitest';
import { generateApiKey } from '../../src/lib/server/api-auth.js';

describe('generateApiKey', () => {
	it('returns object with key, hash, and prefix', () => {
		const result = generateApiKey();
		expect(result).toHaveProperty('key');
		expect(result).toHaveProperty('hash');
		expect(result).toHaveProperty('prefix');
	});

	it('key starts with gtp_ prefix', () => {
		const { key } = generateApiKey();
		expect(key.startsWith('gtp_')).toBe(true);
	});

	it('key has sufficient length (44+ chars)', () => {
		const { key } = generateApiKey();
		expect(key.length).toBeGreaterThanOrEqual(44);
	});

	it('hash is a 64-char hex string (sha256)', () => {
		const { hash } = generateApiKey();
		expect(hash).toMatch(/^[a-f0-9]{64}$/);
	});

	it('prefix is the first 8 chars of the key', () => {
		const { key, prefix } = generateApiKey();
		expect(prefix).toBe(key.substring(0, 8));
	});

	it('generates unique keys each time', () => {
		const key1 = generateApiKey();
		const key2 = generateApiKey();
		expect(key1.key).not.toBe(key2.key);
		expect(key1.hash).not.toBe(key2.hash);
	});

	it('same key always produces same hash', () => {
		const { key, hash } = generateApiKey();
		const { createHash } = require('crypto');
		const recomputedHash = createHash('sha256').update(key).digest('hex');
		expect(hash).toBe(recomputedHash);
	});
});

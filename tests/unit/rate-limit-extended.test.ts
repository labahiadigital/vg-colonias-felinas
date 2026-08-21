import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RateLimiter, applyRateLimit, rateLimiter, rateLimitGuard } from '../../src/lib/server/rate-limit.js';
import type { RateLimitConfig, RateLimitStore } from '../../src/lib/server/rate-limit.js';

describe('RateLimiter GC', () => {
	let limiter: RateLimiter;

	beforeEach(() => {
		vi.useFakeTimers();
		limiter = new RateLimiter();
	});

	afterEach(() => {
		limiter.stopGc();
		vi.useRealTimers();
	});

	it('startGc removes expired buckets', () => {
		const config: RateLimitConfig = { windowMs: 1_000, maxRequests: 100 };
		limiter.check('old', config, 1);
		expect(limiter.size).toBe(1);

		limiter.startGc();
		vi.advanceTimersByTime(700_000);
		expect(limiter.size).toBe(0);
	});

	it('startGc is idempotent', () => {
		limiter.startGc();
		limiter.startGc();
		limiter.stopGc();
	});

	it('stopGc stops interval', () => {
		limiter.startGc();
		limiter.stopGc();
		const config: RateLimitConfig = { windowMs: 1_000, maxRequests: 100 };
		limiter.check('key', config, 1);
		vi.advanceTimersByTime(700_000);
		expect(limiter.size).toBe(1);
	});

	it('gc keeps recent buckets', () => {
		const config: RateLimitConfig = { windowMs: 60_000, maxRequests: 100 };
		const now = Date.now();
		limiter.check('recent', config, now);
		limiter.startGc();
		vi.advanceTimersByTime(61_000);
		expect(limiter.size).toBe(1);
	});
});

describe('RateLimiter.setStore', () => {
	it('replaces the backing store', () => {
		const limiter = new RateLimiter();
		const config: RateLimitConfig = { windowMs: 60_000, maxRequests: 10 };
		limiter.check('old-store-key', config);

		const newStore: RateLimitStore = {
			_data: new Map(),
			get(k) { return (this as unknown as { _data: Map<string, { timestamps: number[] }> })._data.get(k); },
			set(k, v) { (this as unknown as { _data: Map<string, { timestamps: number[] }> })._data.set(k, v); },
			delete(k) { (this as unknown as { _data: Map<string, { timestamps: number[] }> })._data.delete(k); },
			entries() { return (this as unknown as { _data: Map<string, { timestamps: number[] }> })._data.entries(); },
			get size() { return (this as unknown as { _data: Map<string, { timestamps: number[] }> })._data.size; },
			clear() { (this as unknown as { _data: Map<string, { timestamps: number[] }> })._data.clear(); }
		} as unknown as RateLimitStore;

		limiter.setStore(newStore);
		expect(limiter.size).toBe(0);
		limiter.check('new-key', config);
		expect(limiter.size).toBe(1);
	});
});

describe('applyRateLimit', () => {
	beforeEach(() => rateLimiter.reset());

	it('uses correct config for category', () => {
		const result = applyRateLimit('export', 'user1', '1.2.3.4');
		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(9);
	});

	it('blocks after exceeding limit', () => {
		for (let i = 0; i < 10; i++) {
			applyRateLimit('export', 'user2', '1.2.3.4');
		}
		const result = applyRateLimit('export', 'user2', '1.2.3.4');
		expect(result.allowed).toBe(false);
	});
});

describe('rateLimitGuard with Request IP extraction', () => {
	beforeEach(() => rateLimiter.reset());

	it('extracts IP from x-forwarded-for header', () => {
		const req = new Request('http://localhost/api/test', {
			headers: { 'x-forwarded-for': '192.168.1.1' }
		});
		const result = rateLimitGuard('general', undefined, req);
		expect(result).toBeNull();
	});

	it('extracts IP from x-real-ip header', () => {
		const req = new Request('http://localhost/api/test', {
			headers: { 'x-real-ip': '10.0.0.1' }
		});
		const result = rateLimitGuard('general', undefined, req);
		expect(result).toBeNull();
	});

	it('handles undefined ipOrRequest', () => {
		const result = rateLimitGuard('general', 'user1', undefined);
		expect(result).toBeNull();
	});
});

import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from '../../src/lib/server/rate-limit';
import type { RateLimitStore } from '../../src/lib/server/rate-limit';

class FakeStore implements RateLimitStore {
	private buckets = new Map<string, { timestamps: number[] }>();

	get(key: string) {
		return this.buckets.get(key);
	}

	set(key: string, bucket: { timestamps: number[] }) {
		this.buckets.set(key, bucket);
	}

	delete(key: string) {
		this.buckets.delete(key);
	}

	entries() {
		return this.buckets.entries();
	}

	get size() {
		return this.buckets.size;
	}

	clear() {
		this.buckets.clear();
	}

	allKeys() {
		return [...this.buckets.keys()];
	}

	allData() {
		return Object.fromEntries(this.buckets);
	}
}

describe('RateLimiter with custom store', () => {
	let store: FakeStore;
	let limiter: RateLimiter;

	beforeEach(() => {
		store = new FakeStore();
		limiter = new RateLimiter(store);
	});

	it('writes to custom store on check', () => {
		limiter.check('user:1', { windowMs: 60_000, maxRequests: 5 });
		expect(store.size).toBe(1);
		expect(store.get('user:1')).toBeDefined();
		expect(store.get('user:1')!.timestamps).toHaveLength(1);
	});

	it('reads from custom store on subsequent checks', () => {
		limiter.check('user:1', { windowMs: 60_000, maxRequests: 5 });
		limiter.check('user:1', { windowMs: 60_000, maxRequests: 5 });
		expect(store.get('user:1')!.timestamps).toHaveLength(2);
	});

	it('respects maxRequests via custom store', () => {
		const config = { windowMs: 60_000, maxRequests: 2 };
		const r1 = limiter.check('user:1', config);
		expect(r1.allowed).toBe(true);
		const r2 = limiter.check('user:1', config);
		expect(r2.allowed).toBe(true);
		const r3 = limiter.check('user:1', config);
		expect(r3.allowed).toBe(false);
	});

	it('resets properly with custom store', () => {
		limiter.check('user:1', { windowMs: 60_000, maxRequests: 5 });
		limiter.check('user:2', { windowMs: 60_000, maxRequests: 5 });
		expect(store.size).toBe(2);
		limiter.reset();
		expect(store.size).toBe(0);
	});

	it('allows after window expires with custom store', () => {
		const config = { windowMs: 1_000, maxRequests: 1 };
		const now = Date.now();
		const r1 = limiter.check('user:1', config, now);
		expect(r1.allowed).toBe(true);
		const r2 = limiter.check('user:1', config, now + 500);
		expect(r2.allowed).toBe(false);
		const r3 = limiter.check('user:1', config, now + 1_001);
		expect(r3.allowed).toBe(true);
	});

	it('pre-populated store data is respected', () => {
		store.set('user:pre', { timestamps: [Date.now(), Date.now()] });
		const result = limiter.check('user:pre', { windowMs: 60_000, maxRequests: 3 });
		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(0);
	});

	it('separate keys are independent in store', () => {
		const config = { windowMs: 60_000, maxRequests: 1 };
		limiter.check('user:a', config);
		const result = limiter.check('user:b', config);
		expect(result.allowed).toBe(true);
		expect(store.size).toBe(2);
	});
});

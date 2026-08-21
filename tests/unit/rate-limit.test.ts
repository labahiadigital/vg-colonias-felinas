import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter, rateLimitKey, RATE_LIMITS, setRateLimitHeaders, rateLimitGuard, rateLimiter } from '../../src/lib/server/rate-limit.js';
import type { RateLimitConfig, RateLimitResult, RateLimitStore } from '../../src/lib/server/rate-limit.js';

describe('RateLimiter', () => {
	let limiter: RateLimiter;

	beforeEach(() => {
		limiter = new RateLimiter();
	});

	it('allows requests within limit', () => {
		const config: RateLimitConfig = { windowMs: 60_000, maxRequests: 3 };
		const r1 = limiter.check('user:1', config, 1000);
		expect(r1.allowed).toBe(true);
		expect(r1.remaining).toBe(2);
		expect(r1.retryAfterMs).toBeNull();
	});

	it('blocks when limit exceeded', () => {
		const config: RateLimitConfig = { windowMs: 60_000, maxRequests: 2 };
		limiter.check('user:1', config, 1000);
		limiter.check('user:1', config, 2000);
		const r3 = limiter.check('user:1', config, 3000);
		expect(r3.allowed).toBe(false);
		expect(r3.remaining).toBe(0);
		expect(r3.retryAfterMs).toBeGreaterThan(0);
	});

	it('allows again after window expires', () => {
		const config: RateLimitConfig = { windowMs: 5_000, maxRequests: 1 };
		limiter.check('user:1', config, 1000);
		const blocked = limiter.check('user:1', config, 2000);
		expect(blocked.allowed).toBe(false);

		const allowed = limiter.check('user:1', config, 7000);
		expect(allowed.allowed).toBe(true);
		expect(allowed.remaining).toBe(0);
	});

	it('isolates keys from each other', () => {
		const config: RateLimitConfig = { windowMs: 60_000, maxRequests: 1 };
		limiter.check('user:1', config, 1000);
		const r2 = limiter.check('user:2', config, 1000);
		expect(r2.allowed).toBe(true);
	});

	it('reports correct retryAfterMs', () => {
		const config: RateLimitConfig = { windowMs: 10_000, maxRequests: 1 };
		limiter.check('k', config, 1000);
		const blocked = limiter.check('k', config, 5000);
		expect(blocked.retryAfterMs).toBe(6000);
	});

	it('tracks size', () => {
		const config: RateLimitConfig = { windowMs: 60_000, maxRequests: 10 };
		limiter.check('a', config);
		limiter.check('b', config);
		expect(limiter.size).toBe(2);
	});

	it('reset clears all buckets', () => {
		const config: RateLimitConfig = { windowMs: 60_000, maxRequests: 10 };
		limiter.check('a', config);
		limiter.reset();
		expect(limiter.size).toBe(0);
	});
});

describe('RateLimiter with custom store', () => {
	it('works with an injected store adapter', () => {
		const store: RateLimitStore = {
			_map: new Map(),
			get(key: string) { return (this._map as Map<string, { timestamps: number[] }>).get(key); },
			set(key: string, bucket: { timestamps: number[] }) { (this._map as Map<string, { timestamps: number[] }>).set(key, bucket); },
			delete(key: string) { (this._map as Map<string, { timestamps: number[] }>).delete(key); },
			entries() { return (this._map as Map<string, { timestamps: number[] }>).entries(); },
			get size() { return (this._map as Map<string, { timestamps: number[] }>).size; },
			clear() { (this._map as Map<string, { timestamps: number[] }>).clear(); }
		} as RateLimitStore & { _map: Map<string, { timestamps: number[] }> };

		const limiter = new RateLimiter(store);
		const config: RateLimitConfig = { windowMs: 60_000, maxRequests: 2 };

		const r1 = limiter.check('key', config, 1000);
		expect(r1.allowed).toBe(true);
		expect(limiter.size).toBe(1);

		limiter.check('key', config, 2000);
		const r3 = limiter.check('key', config, 3000);
		expect(r3.allowed).toBe(false);
	});

	it('backward-compatible: numeric first arg sets GC interval', () => {
		const limiter = new RateLimiter(30_000);
		const config: RateLimitConfig = { windowMs: 60_000, maxRequests: 5 };
		const result = limiter.check('test', config);
		expect(result.allowed).toBe(true);
	});
});

describe('rateLimitKey', () => {
	it('prefers userId over IP', () => {
		expect(rateLimitKey('export', 'u1', '1.2.3.4')).toBe('export:u1');
	});

	it('falls back to IP when no userId', () => {
		expect(rateLimitKey('export', undefined, '1.2.3.4')).toBe('export:1.2.3.4');
	});

	it('falls back to anonymous when neither available', () => {
		expect(rateLimitKey('export', undefined, undefined)).toBe('export:anonymous');
	});
});

describe('RATE_LIMITS', () => {
	it('has all expected categories', () => {
		const expected = ['export', 'import', 'ai', 'upload', 'search', 'general', 'publicApi', 'citizenReport'];
		for (const key of expected) {
			expect(RATE_LIMITS).toHaveProperty(key);
			expect(RATE_LIMITS[key as keyof typeof RATE_LIMITS].windowMs).toBeGreaterThan(0);
			expect(RATE_LIMITS[key as keyof typeof RATE_LIMITS].maxRequests).toBeGreaterThan(0);
		}
	});
});

describe('setRateLimitHeaders', () => {
	it('sets standard headers', () => {
		const headers = new Headers();
		const config: RateLimitConfig = { windowMs: 60_000, maxRequests: 10 };
		const result: RateLimitResult = { allowed: true, remaining: 7, retryAfterMs: null };
		setRateLimitHeaders(headers, result, config);

		expect(headers.get('X-RateLimit-Limit')).toBe('10');
		expect(headers.get('X-RateLimit-Remaining')).toBe('7');
		expect(headers.has('Retry-After')).toBe(false);
	});

	it('sets Retry-After when blocked', () => {
		const headers = new Headers();
		const config: RateLimitConfig = { windowMs: 60_000, maxRequests: 10 };
		const result: RateLimitResult = { allowed: false, remaining: 0, retryAfterMs: 15_000 };
		setRateLimitHeaders(headers, result, config);

		expect(headers.get('Retry-After')).toBe('15');
	});
});

describe('rateLimitGuard', () => {
	beforeEach(() => rateLimiter.reset());

	it('returns null when under limit', () => {
		const result = rateLimitGuard('general', 'user1', '1.2.3.4');
		expect(result).toBeNull();
	});

	it('returns 429 Response when limit exceeded', () => {
		for (let i = 0; i < 60; i++) rateLimitGuard('general', 'user2', '1.2.3.4');
		const result = rateLimitGuard('general', 'user2', '1.2.3.4');
		expect(result).toBeInstanceOf(Response);
		expect(result!.status).toBe(429);
	});

	it('response includes rate-limit headers', async () => {
		for (let i = 0; i < 60; i++) rateLimitGuard('general', 'user3', '1.2.3.4');
		const result = rateLimitGuard('general', 'user3', '1.2.3.4')!;
		expect(result.headers.get('X-RateLimit-Limit')).toBe('60');
		expect(result.headers.get('X-RateLimit-Remaining')).toBe('0');
		expect(result.headers.has('Retry-After')).toBe(true);
		const body = await result.json();
		expect(body.error).toBe('Too many requests');
	});

	it('accepts a Request object and extracts IP from x-forwarded-for', () => {
		const req = new Request('http://localhost/api/test', {
			headers: { 'x-forwarded-for': '10.0.0.1' }
		});
		const result = rateLimitGuard('general', undefined, req);
		expect(result).toBeNull();
	});

	it('accepts a Request object and extracts IP from x-real-ip', () => {
		const req = new Request('http://localhost/api/test', {
			headers: { 'x-real-ip': '10.0.0.2' }
		});
		const result = rateLimitGuard('general', undefined, req);
		expect(result).toBeNull();
	});
});

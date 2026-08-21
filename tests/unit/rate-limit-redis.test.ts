import { describe, it, expect, beforeEach } from 'vitest';
import { RedisStore } from '../../src/lib/server/rate-limit-redis.js';
import { RateLimiter } from '../../src/lib/server/rate-limit.js';
import type { RateLimitConfig } from '../../src/lib/server/rate-limit.js';

class MockRedis {
	private store = new Map<string, Map<number, string>>();

	async zrangebyscore(key: string, min: number | string, max: number | string): Promise<string[]> {
		const set = this.store.get(key);
		if (!set) return [];
		const minN = typeof min === 'string' ? (min === '-inf' ? -Infinity : Number(min)) : min;
		const maxN = typeof max === 'string' ? (max === '+inf' ? Infinity : Number(max)) : max;
		const results: string[] = [];
		for (const [score, member] of set.entries()) {
			if (score >= minN && score <= maxN) results.push(member);
		}
		return results.sort((a, b) => Number(a) - Number(b));
	}

	async zadd(key: string, ...args: (string | number)[]): Promise<number> {
		if (!this.store.has(key)) this.store.set(key, new Map());
		const set = this.store.get(key)!;
		let added = 0;
		for (let i = 0; i < args.length; i += 2) {
			const score = Number(args[i]);
			const member = String(args[i + 1]);
			if (!set.has(score)) added++;
			set.set(score, member);
		}
		return added;
	}

	async zremrangebyscore(key: string, min: number | string, max: number | string): Promise<number> {
		const set = this.store.get(key);
		if (!set) return 0;
		const minN = typeof min === 'string' ? (min === '-inf' ? -Infinity : Number(min)) : min;
		const maxN = typeof max === 'string' ? (max === '+inf' ? Infinity : Number(max)) : max;
		let removed = 0;
		for (const score of set.keys()) {
			if (score >= minN && score <= maxN) {
				set.delete(score);
				removed++;
			}
		}
		return removed;
	}

	async expire(_key: string, _seconds: number): Promise<number> {
		return 1;
	}

	async del(...keys: string[]): Promise<number> {
		let deleted = 0;
		for (const k of keys) {
			if (this.store.delete(k)) deleted++;
		}
		return deleted;
	}

	async keys(pattern: string): Promise<string[]> {
		const prefix = pattern.replace('*', '');
		return [...this.store.keys()].filter(k => k.startsWith(prefix));
	}

	async zcard(key: string): Promise<number> {
		return this.store.get(key)?.size ?? 0;
	}
}

describe('RedisStore', () => {
	let redis: MockRedis;
	let store: RedisStore;
	let limiter: RateLimiter;

	beforeEach(() => {
		redis = new MockRedis();
		store = new RedisStore(redis);
		limiter = new RateLimiter(store);
	});

	it('implements RateLimitStore interface', () => {
		expect(typeof store.get).toBe('function');
		expect(typeof store.set).toBe('function');
		expect(typeof store.delete).toBe('function');
		expect(typeof store.entries).toBe('function');
		expect(typeof store.clear).toBe('function');
		expect(typeof store.size).toBe('number');
	});

	it('allows requests within limit via synchronous check', () => {
		const config: RateLimitConfig = { windowMs: 60_000, maxRequests: 3 };
		const result = limiter.check('user:1', config, 1000);
		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(2);
	});

	it('blocks when limit exceeded', () => {
		const config: RateLimitConfig = { windowMs: 60_000, maxRequests: 2 };
		limiter.check('user:1', config, 1000);
		limiter.check('user:1', config, 2000);
		const r3 = limiter.check('user:1', config, 3000);
		expect(r3.allowed).toBe(false);
		expect(r3.remaining).toBe(0);
	});

	it('checkAsync preloads from Redis and then checks', async () => {
		const config: RateLimitConfig = { windowMs: 60_000, maxRequests: 3 };
		const result = await store.checkAsync(limiter, 'async:1', config);
		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(2);
	});

	it('checkAsync blocks when limit reached via pre-seeded Redis', async () => {
		const config: RateLimitConfig = { windowMs: 60_000, maxRequests: 2 };
		const now = Date.now();
		await redis.zadd('rl:async:2', now - 2000, String(now - 2000));
		await redis.zadd('rl:async:2', now - 1000, String(now - 1000));
		const r3 = await store.checkAsync(limiter, 'async:2', config);
		expect(r3.allowed).toBe(false);
	});

	it('preload populates cache from Redis with recent timestamps', async () => {
		const now = Date.now();
		const ts1 = now - 10_000;
		const ts2 = now - 5_000;
		await redis.zadd('rl:preload:1', ts1, String(ts1));
		await redis.zadd('rl:preload:1', ts2, String(ts2));
		await store.preload('preload:1', 60_000);

		const bucket = store.get('preload:1');
		expect(bucket).toBeDefined();
		expect(bucket!.timestamps).toEqual([ts1, ts2]);
	});

	it('delete removes from cache', () => {
		const config: RateLimitConfig = { windowMs: 60_000, maxRequests: 5 };
		limiter.check('del:1', config);
		expect(store.size).toBe(1);
		store.delete('del:1');
		expect(store.size).toBe(0);
	});

	it('clear empties cache', () => {
		const config: RateLimitConfig = { windowMs: 60_000, maxRequests: 5 };
		limiter.check('a', config);
		limiter.check('b', config);
		expect(store.size).toBe(2);
		store.clear();
		expect(store.size).toBe(0);
	});

	it('entries returns iterable', () => {
		const config: RateLimitConfig = { windowMs: 60_000, maxRequests: 5 };
		limiter.check('x', config);
		limiter.check('y', config);
		const entries = [...store.entries()];
		expect(entries.length).toBe(2);
		expect(entries[0]![0]).toBe('x');
		expect(entries[1]![0]).toBe('y');
	});

	it('supports custom prefix', () => {
		const customStore = new RedisStore(redis, { prefix: 'myapp:rl:' });
		const customLimiter = new RateLimiter(customStore);
		const config: RateLimitConfig = { windowMs: 60_000, maxRequests: 5 };
		const result = customLimiter.check('test', config);
		expect(result.allowed).toBe(true);
	});
});

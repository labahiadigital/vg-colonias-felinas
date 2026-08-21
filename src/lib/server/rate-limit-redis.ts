/**
 * Redis-backed RateLimitStore implementation.
 *
 * Uses sorted sets (ZRANGEBYSCORE) for O(log n) sliding-window checks.
 * Each rate-limit key maps to a Redis sorted set where members are
 * unique request IDs and scores are Unix timestamps.
 *
 * Requires: ioredis or any Redis client that exposes the standard commands.
 *
 * Usage:
 *   import Redis from 'ioredis';
 *   import { RedisStore } from './rate-limit-redis.js';
 *   import { RateLimiter } from './rate-limit.js';
 *
 *   const redis = new Redis(process.env.REDIS_URL);
 *   const store = new RedisStore(redis);
 *   const limiter = new RateLimiter(store);
 */

import type { RateLimitStore } from './rate-limit.js';

interface Bucket {
	timestamps: number[];
}

interface RedisLike {
	zrangebyscore(key: string, min: number | string, max: number | string): Promise<string[]>;
	zadd(key: string, ...args: (string | number)[]): Promise<number>;
	zremrangebyscore(key: string, min: number | string, max: number | string): Promise<number>;
	expire(key: string, seconds: number): Promise<number>;
	del(...keys: string[]): Promise<number>;
	keys(pattern: string): Promise<string[]>;
	zcard(key: string): Promise<number>;
}

const KEY_PREFIX = 'rl:';
const DEFAULT_TTL_SECONDS = 900;

export class RedisStore implements RateLimitStore {
	private readonly redis: RedisLike;
	private readonly prefix: string;
	private readonly ttlSeconds: number;

	constructor(redis: RedisLike, options?: { prefix?: string; ttlSeconds?: number }) {
		this.redis = redis;
		this.prefix = options?.prefix ?? KEY_PREFIX;
		this.ttlSeconds = options?.ttlSeconds ?? DEFAULT_TTL_SECONDS;
	}

	private key(k: string): string {
		return `${this.prefix}${k}`;
	}

	/**
	 * Synchronous get — returns from local cache.
	 * For Redis, use getAsync() and pre-populate before check().
	 * The RateLimiter's check() is synchronous, so we provide a
	 * synchronous shim that the async middleware should pre-populate.
	 */
	private cache = new Map<string, Bucket>();

	get(key: string): Bucket | undefined {
		return this.cache.get(key);
	}

	set(key: string, bucket: Bucket): void {
		this.cache.set(key, bucket);
		void this.syncToRedis(key, bucket);
	}

	delete(key: string): void {
		this.cache.delete(key);
		void this.redis.del(this.key(key));
	}

	entries(): Iterable<[string, Bucket]> {
		return this.cache.entries();
	}

	get size(): number {
		return this.cache.size;
	}

	clear(): void {
		this.cache.clear();
	}

	/**
	 * Load bucket from Redis into local cache before calling check().
	 * Must be called in async context before RateLimiter.check().
	 */
	async preload(key: string, windowMs: number): Promise<void> {
		const redisKey = this.key(key);
		const windowStart = Date.now() - windowMs;
		const members = await this.redis.zrangebyscore(redisKey, windowStart, '+inf');
		this.cache.set(key, { timestamps: members.map(Number) });
	}

	private async syncToRedis(key: string, bucket: Bucket): Promise<void> {
		const redisKey = this.key(key);
		const windowStart = Math.min(...bucket.timestamps) - 1;

		await this.redis.zremrangebyscore(redisKey, '-inf', windowStart);

		if (bucket.timestamps.length > 0) {
			const latest = bucket.timestamps[bucket.timestamps.length - 1] ?? Date.now();
			await this.redis.zadd(redisKey, latest, String(latest));
			await this.redis.expire(redisKey, this.ttlSeconds);
		}
	}

	/**
	 * Full async check — combines preload + check in one call.
	 * Preferred over the synchronous RateLimiter.check() for Redis.
	 */
	async checkAsync(
		limiter: { check(key: string, config: { windowMs: number; maxRequests: number }, now?: number): { allowed: boolean; remaining: number; retryAfterMs: number | null } },
		key: string,
		config: { windowMs: number; maxRequests: number }
	): Promise<{ allowed: boolean; remaining: number; retryAfterMs: number | null }> {
		await this.preload(key, config.windowMs);
		return limiter.check(key, config);
	}
}

/**
 * Sliding-window rate limiter with pluggable storage.
 *
 * Default: in-memory Map (single-process).
 * For multi-instance deployments, inject a `RateLimitStore` backed by
 * Redis, PostgreSQL, or any external store via `new RateLimiter(store)`.
 *
 * Pure logic is exported for unit testing; the singleton `rateLimiter`
 * is the in-process store used by endpoints.
 */

export interface RateLimitConfig {
	windowMs: number;
	maxRequests: number;
}

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	retryAfterMs: number | null;
}

interface Bucket {
	timestamps: number[];
}

/**
 * Storage adapter interface for rate-limit buckets.
 * Implement this to back rate limiting with Redis, PostgreSQL, etc.
 */
export interface RateLimitStore {
	get(key: string): Bucket | undefined;
	set(key: string, bucket: Bucket): void;
	delete(key: string): void;
	entries(): Iterable<[string, Bucket]>;
	readonly size: number;
	clear(): void;
}

class InMemoryStore implements RateLimitStore {
	private buckets = new Map<string, Bucket>();

	get(key: string): Bucket | undefined {
		return this.buckets.get(key);
	}

	set(key: string, bucket: Bucket): void {
		this.buckets.set(key, bucket);
	}

	delete(key: string): void {
		this.buckets.delete(key);
	}

	entries(): Iterable<[string, Bucket]> {
		return this.buckets.entries();
	}

	get size(): number {
		return this.buckets.size;
	}

	clear(): void {
		this.buckets.clear();
	}
}

export class RateLimiter {
	private _store: RateLimitStore;
	private gcIntervalId: ReturnType<typeof setInterval> | null = null;
	private readonly gcIntervalMs: number;

	constructor(storeOrGcMs?: RateLimitStore | number, gcEveryMs = 60_000) {
		if (typeof storeOrGcMs === 'number') {
			this._store = new InMemoryStore();
			this.gcIntervalMs = storeOrGcMs;
		} else {
			this._store = storeOrGcMs ?? new InMemoryStore();
			this.gcIntervalMs = gcEveryMs;
		}
	}

	/** Replace the backing store (used to upgrade from in-memory to persistent). */
	setStore(store: RateLimitStore): void {
		this._store = store;
	}

	check(key: string, config: RateLimitConfig, now = Date.now()): RateLimitResult {
		const bucket = this._store.get(key) ?? { timestamps: [] };
		const windowStart = now - config.windowMs;

		bucket.timestamps = bucket.timestamps.filter(t => t > windowStart);

		if (bucket.timestamps.length >= config.maxRequests) {
			const oldest = bucket.timestamps[0] ?? now;
			return {
				allowed: false,
				remaining: 0,
				retryAfterMs: oldest + config.windowMs - now
			};
		}

		bucket.timestamps.push(now);
		this._store.set(key, bucket);

		return {
			allowed: true,
			remaining: config.maxRequests - bucket.timestamps.length,
			retryAfterMs: null
		};
	}

	startGc(): void {
		if (this.gcIntervalId) return;
		this.gcIntervalId = setInterval(() => this.gc(), this.gcIntervalMs);
	}

	stopGc(): void {
		if (this.gcIntervalId) {
			clearInterval(this.gcIntervalId);
			this.gcIntervalId = null;
		}
	}

	private gc(): void {
		const now = Date.now();
		for (const [key, bucket] of this._store.entries()) {
			bucket.timestamps = bucket.timestamps.filter(t => t > now - 600_000);
			if (bucket.timestamps.length === 0) {
				this._store.delete(key);
			}
		}
	}

	get size(): number {
		return this._store.size;
	}

	reset(): void {
		this._store.clear();
	}
}

/** Pre-configured limits per endpoint category. */
export const RATE_LIMITS = {
	export: { windowMs: 60_000, maxRequests: 10 },
	import: { windowMs: 60_000, maxRequests: 5 },
	ai: { windowMs: 60_000, maxRequests: 15 },
	upload: { windowMs: 60_000, maxRequests: 20 },
	search: { windowMs: 10_000, maxRequests: 30 },
	general: { windowMs: 60_000, maxRequests: 60 },
	publicApi: { windowMs: 60_000, maxRequests: 100 },
	citizenReport: { windowMs: 300_000, maxRequests: 5 }
} as const satisfies Record<string, RateLimitConfig>;

export const rateLimiter = new RateLimiter();

/**
 * Initialize persistent rate limiting backed by PostgreSQL.
 * Call once at server startup. Falls back to in-memory if it fails.
 */
export async function initPersistentRateLimiter(): Promise<void> {
	try {
		const { PgRateLimitStore } = await import('./rate-limit-pg-store.js');
		const pgStore = new PgRateLimitStore();
		await pgStore.loadFromDb();
		pgStore.startFlush(5_000);
		rateLimiter.setStore(pgStore);
	} catch {
		// In-memory fallback — already initialized
	}
}

/**
 * Build a rate-limit key from request context.
 * Prefers userId (authenticated), falls back to IP.
 */
export function rateLimitKey(
	prefix: string,
	userId: string | undefined,
	ip: string | undefined
): string {
	const id = userId ?? ip ?? 'anonymous';
	return `${prefix}:${id}`;
}

/**
 * Sets standard rate-limit headers on a Response.
 */
export function setRateLimitHeaders(
	headers: Headers,
	result: RateLimitResult,
	config: RateLimitConfig
): void {
	headers.set('X-RateLimit-Limit', String(config.maxRequests));
	headers.set('X-RateLimit-Remaining', String(result.remaining));
	if (result.retryAfterMs !== null) {
		headers.set('Retry-After', String(Math.ceil(result.retryAfterMs / 1000)));
	}
}

/**
 * Checks rate limit and returns the result.
 * Callers can inspect `result.allowed` and use `rateLimitResponse` for 429s.
 */
export function applyRateLimit(
	category: keyof typeof RATE_LIMITS,
	userId: string | undefined,
	ip: string | undefined
): RateLimitResult {
	const config = RATE_LIMITS[category];
	const key = rateLimitKey(category, userId, ip);
	return rateLimiter.check(key, config);
}

function extractIpFromRequest(request?: Request): string | undefined {
	return request?.headers.get('x-forwarded-for') ?? request?.headers.get('x-real-ip') ?? undefined;
}

/**
 * One-liner guard: returns a 429 Response if rate limit is exceeded, or null if allowed.
 * Accepts either raw `ip` string or a `Request` to auto-extract the IP.
 * Usage: `const blocked = rateLimitGuard('export', userId, request); if (blocked) return blocked;`
 */
export function rateLimitGuard(
	category: keyof typeof RATE_LIMITS,
	userId: string | undefined,
	ipOrRequest: string | Request | undefined
): Response | null {
	const ip = ipOrRequest instanceof Request ? extractIpFromRequest(ipOrRequest) : ipOrRequest;
	const config = RATE_LIMITS[category];
	const result = applyRateLimit(category, userId, ip);
	if (!result.allowed) {
		const h = new Headers({ 'Content-Type': 'application/json' });
		setRateLimitHeaders(h, result, config);
		return new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429, headers: h });
	}
	return null;
}

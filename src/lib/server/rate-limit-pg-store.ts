/**
 * PostgreSQL-backed rate-limit store.
 *
 * Replaces the default in-memory store so that rate limits survive
 * server restarts and work across multiple instances.
 *
 * Uses a simple write-through cache: reads come from memory,
 * writes are flushed to PostgreSQL in batches on a timer.
 */
import { db } from './db/index.js';
import { rateLimitBuckets } from './db/schema.js';
import { eq, lt } from 'drizzle-orm';
import type { RateLimitStore } from './rate-limit.js';

interface Bucket {
	timestamps: number[];
}

export class PgRateLimitStore implements RateLimitStore {
	private cache = new Map<string, Bucket>();
	private dirty = new Set<string>();
	private deleted = new Set<string>();
	private flushTimer: ReturnType<typeof setInterval> | null = null;
	private loaded = false;

	get(key: string): Bucket | undefined {
		return this.cache.get(key);
	}

	set(key: string, bucket: Bucket): void {
		this.cache.set(key, bucket);
		this.dirty.add(key);
		this.deleted.delete(key);
	}

	delete(key: string): void {
		this.cache.delete(key);
		this.dirty.delete(key);
		this.deleted.add(key);
	}

	entries(): Iterable<[string, Bucket]> {
		return this.cache.entries();
	}

	get size(): number {
		return this.cache.size;
	}

	clear(): void {
		for (const key of this.cache.keys()) {
			this.deleted.add(key);
		}
		this.cache.clear();
		this.dirty.clear();
	}

	async loadFromDb(): Promise<void> {
		if (this.loaded) return;
		try {
			const rows = await db.select().from(rateLimitBuckets);
			for (const row of rows) {
				const timestamps = Array.isArray(row.timestamps) ? (row.timestamps as number[]) : [];
				this.cache.set(row.key, { timestamps });
			}
			this.loaded = true;
		} catch {
			this.loaded = true;
		}
	}

	startFlush(intervalMs = 5_000): void {
		if (this.flushTimer) return;
		this.flushTimer = setInterval(() => {
			void this.flush();
		}, intervalMs);
	}

	stopFlush(): void {
		if (this.flushTimer) {
			clearInterval(this.flushTimer);
			this.flushTimer = null;
		}
	}

	async flush(): Promise<void> {
		const dirtyKeys = [...this.dirty];
		const deletedKeys = [...this.deleted];
		this.dirty.clear();
		this.deleted.clear();

		for (const key of deletedKeys) {
			try {
				await db.delete(rateLimitBuckets).where(eq(rateLimitBuckets.key, key));
			} catch {
				// Ignore delete failures for non-existent keys
			}
		}

		for (const key of dirtyKeys) {
			const bucket = this.cache.get(key);
			if (!bucket) continue;
			try {
				await db
					.insert(rateLimitBuckets)
					.values({
						key,
						timestamps: bucket.timestamps,
						updatedAt: new Date()
					})
					.onConflictDoUpdate({
						target: rateLimitBuckets.key,
						set: {
							timestamps: bucket.timestamps,
							updatedAt: new Date()
						}
					});
			} catch {
				this.dirty.add(key);
			}
		}
	}

	async cleanExpired(maxAgeMs = 600_000): Promise<void> {
		const cutoff = new Date(Date.now() - maxAgeMs);
		try {
			await db.delete(rateLimitBuckets).where(lt(rateLimitBuckets.updatedAt, cutoff));
		} catch {
			// Best effort
		}
	}
}

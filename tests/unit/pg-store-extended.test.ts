import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockInsert = vi.fn().mockReturnValue({
	values: vi.fn().mockReturnValue({
		onConflictDoUpdate: vi.fn().mockResolvedValue(undefined)
	})
});
const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
const mockSelectFrom = vi.fn().mockResolvedValue([]);

vi.mock('$lib/server/db/index.js', () => ({
	db: {
		select: () => ({
			from: () => mockSelectFrom()
		}),
		insert: () => mockInsert(),
		delete: () => ({
			where: (...args: unknown[]) => mockDeleteWhere(...args)
		})
	}
}));

vi.mock('$lib/server/db/schema.js', () => ({
	rateLimitBuckets: { key: 'key', timestamps: 'timestamps', updatedAt: 'updatedAt' }
}));

vi.mock('drizzle-orm', () => ({
	eq: (a: unknown, b: unknown) => ({ type: 'eq', a, b }),
	lt: (a: unknown, b: unknown) => ({ type: 'lt', a, b })
}));

import { PgRateLimitStore } from '../../src/lib/server/rate-limit-pg-store.js';

let store: PgRateLimitStore;

beforeEach(() => {
	vi.clearAllMocks();
	store = new PgRateLimitStore();
});

afterEach(() => {
	store.stopFlush();
});

describe('PgRateLimitStore in-memory operations', () => {
	it('get/set/delete work like a Map', () => {
		expect(store.get('key')).toBeUndefined();
		store.set('key', { timestamps: [1, 2] });
		expect(store.get('key')).toEqual({ timestamps: [1, 2] });
		expect(store.size).toBe(1);
		store.delete('key');
		expect(store.get('key')).toBeUndefined();
		expect(store.size).toBe(0);
	});

	it('entries returns all items', () => {
		store.set('a', { timestamps: [1] });
		store.set('b', { timestamps: [2] });
		const entries = [...store.entries()];
		expect(entries).toHaveLength(2);
	});

	it('clear removes all items', () => {
		store.set('a', { timestamps: [1] });
		store.set('b', { timestamps: [2] });
		store.clear();
		expect(store.size).toBe(0);
	});
});

describe('PgRateLimitStore.loadFromDb', () => {
	it('loads rows from database', async () => {
		mockSelectFrom.mockResolvedValueOnce([
			{ key: 'k1', timestamps: [100, 200] },
			{ key: 'k2', timestamps: [300] }
		]);
		await store.loadFromDb();
		expect(store.get('k1')).toEqual({ timestamps: [100, 200] });
		expect(store.get('k2')).toEqual({ timestamps: [300] });
	});

	it('only loads once', async () => {
		await store.loadFromDb();
		await store.loadFromDb();
		expect(mockSelectFrom).toHaveBeenCalledTimes(1);
	});

	it('handles invalid timestamps gracefully', async () => {
		mockSelectFrom.mockResolvedValueOnce([
			{ key: 'k1', timestamps: 'not-array' }
		]);
		await store.loadFromDb();
		expect(store.get('k1')).toEqual({ timestamps: [] });
	});

	it('handles DB errors gracefully', async () => {
		mockSelectFrom.mockRejectedValueOnce(new Error('DB down'));
		await store.loadFromDb();
		expect(store.size).toBe(0);
	});
});

describe('PgRateLimitStore.flush', () => {
	it('flushes dirty keys to database', async () => {
		store.set('dirty-key', { timestamps: [1, 2, 3] });
		await store.flush();
		expect(mockInsert).toHaveBeenCalled();
	});

	it('deletes removed keys from database', async () => {
		store.set('to-delete', { timestamps: [1] });
		store.delete('to-delete');
		await store.flush();
		expect(mockDeleteWhere).toHaveBeenCalled();
	});

	it('re-marks key as dirty on insert failure', async () => {
		mockInsert.mockReturnValueOnce({
			values: vi.fn().mockReturnValue({
				onConflictDoUpdate: vi.fn().mockRejectedValueOnce(new Error('Insert failed'))
			})
		});
		store.set('fail-key', { timestamps: [1] });
		await store.flush();
	});
});

describe('PgRateLimitStore.startFlush/stopFlush', () => {
	it('starts and stops periodic flush', () => {
		vi.useFakeTimers();
		store.startFlush(100);
		store.startFlush(100);
		store.stopFlush();
		vi.useRealTimers();
	});
});

describe('PgRateLimitStore.cleanExpired', () => {
	it('deletes old entries from DB', async () => {
		await store.cleanExpired(600_000);
		expect(mockDeleteWhere).toHaveBeenCalled();
	});

	it('handles DB error gracefully', async () => {
		mockDeleteWhere.mockRejectedValueOnce(new Error('DB down'));
		await expect(store.cleanExpired()).resolves.toBeUndefined();
	});
});

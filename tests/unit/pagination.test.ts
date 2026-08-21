import { describe, it, expect, vi, beforeEach } from 'vitest';

const fromMock = vi.fn();
const selectMock = vi.fn(() => ({ from: fromMock }));

vi.mock('../../src/lib/server/db/index.js', () => ({
	db: { select: selectMock }
}));

const { parsePagination, applyPagination, paginatedResponse, paginateWithCount } = await import(
	'../../src/lib/server/pagination.js'
);

beforeEach(() => {
	vi.clearAllMocks();
});

describe('parsePagination', () => {
	it('returns defaults for empty URL', () => {
		const url = new URL('http://x.com/foo');
		const result = parsePagination(url);
		expect(result).toEqual({ page: 1, pageSize: 50 });
	});

	it('parses valid page and pageSize', () => {
		const url = new URL('http://x.com/foo?page=3&pageSize=25');
		const result = parsePagination(url);
		expect(result).toEqual({ page: 3, pageSize: 25 });
	});

	it('clamps page to 1 for invalid values', () => {
		expect(parsePagination(new URL('http://x.com/?page=-1')).page).toBe(1);
		expect(parsePagination(new URL('http://x.com/?page=abc')).page).toBe(1);
		expect(parsePagination(new URL('http://x.com/?page=0')).page).toBe(1);
	});

	it('clamps pageSize to MAX_PAGE_SIZE', () => {
		const url = new URL('http://x.com/?pageSize=999');
		expect(parsePagination(url).pageSize).toBe(200);
	});

	it('floors fractional page numbers', () => {
		const url = new URL('http://x.com/?page=2.7');
		expect(parsePagination(url).page).toBe(2);
	});
});

describe('paginatedResponse', () => {
	it('calculates totalPages correctly', () => {
		const result = paginatedResponse(['a', 'b'], 10, { page: 1, pageSize: 3 });
		expect(result).toEqual({
			items: ['a', 'b'],
			page: 1,
			pageSize: 3,
			totalItems: 10,
			totalPages: 4
		});
	});

	it('handles zero items', () => {
		const result = paginatedResponse([], 0, { page: 1, pageSize: 10 });
		expect(result.totalPages).toBe(0);
		expect(result.totalItems).toBe(0);
	});

	it('handles exact page boundary', () => {
		const result = paginatedResponse(['a'], 20, { page: 2, pageSize: 10 });
		expect(result.totalPages).toBe(2);
	});
});

describe('applyPagination', () => {
	it('applies limit and offset to query', () => {
		const mockQuery = {
			limit: vi.fn().mockReturnThis(),
			offset: vi.fn().mockReturnThis()
		};
		applyPagination(mockQuery as never, { page: 3, pageSize: 10 });
		expect(mockQuery.limit).toHaveBeenCalledWith(10);
		expect(mockQuery.offset).toHaveBeenCalledWith(20);
	});

	it('handles page 1 with offset 0', () => {
		const mockQuery = {
			limit: vi.fn().mockReturnThis(),
			offset: vi.fn().mockReturnThis()
		};
		applyPagination(mockQuery as never, { page: 1, pageSize: 50 });
		expect(mockQuery.offset).toHaveBeenCalledWith(0);
	});
});

describe('paginateWithCount', () => {
	it('combines paginated query and count into PaginatedResult', async () => {
		const items = [{ id: '1' }, { id: '2' }];
		const mockQuery = {
			limit: vi.fn().mockReturnThis(),
			offset: vi.fn().mockResolvedValue(items)
		};
		fromMock.mockReturnValue({ where: vi.fn().mockResolvedValue([{ total: 42 }]) });

		const result = await paginateWithCount(
			mockQuery as never,
			'fakeTable' as never,
			undefined,
			{ page: 1, pageSize: 10 }
		);

		expect(result).toEqual({
			items,
			page: 1,
			pageSize: 10,
			totalItems: 42,
			totalPages: 5
		});
	});

	it('handles zero results', async () => {
		const mockQuery = {
			limit: vi.fn().mockReturnThis(),
			offset: vi.fn().mockResolvedValue([])
		};
		fromMock.mockReturnValue({ where: vi.fn().mockResolvedValue([{ total: 0 }]) });

		const result = await paginateWithCount(
			mockQuery as never,
			'fakeTable' as never,
			undefined,
			{ page: 1, pageSize: 10 }
		);

		expect(result.items).toEqual([]);
		expect(result.totalItems).toBe(0);
		expect(result.totalPages).toBe(0);
	});

	it('passes where clause to count query', async () => {
		const mockQuery = {
			limit: vi.fn().mockReturnThis(),
			offset: vi.fn().mockResolvedValue([])
		};
		const whereFn = vi.fn().mockResolvedValue([{ total: 5 }]);
		fromMock.mockReturnValue({ where: whereFn });
		const fakeWhere = { type: 'eq' } as never;

		await paginateWithCount(
			mockQuery as never,
			'fakeTable' as never,
			fakeWhere,
			{ page: 1, pageSize: 10 }
		);

		expect(whereFn).toHaveBeenCalledWith(fakeWhere);
	});

	it('runs paginated query and count in parallel', async () => {
		let countResolved = false;
		let queryResolved = false;
		const mockQuery = {
			limit: vi.fn().mockReturnThis(),
			offset: vi.fn().mockImplementation(async () => {
				queryResolved = true;
				return [];
			})
		};
		fromMock.mockReturnValue({
			where: vi.fn().mockImplementation(async () => {
				countResolved = true;
				return [{ total: 0 }];
			})
		});

		await paginateWithCount(
			mockQuery as never,
			'fakeTable' as never,
			undefined,
			{ page: 1, pageSize: 10 }
		);

		expect(queryResolved).toBe(true);
		expect(countResolved).toBe(true);
	});
});

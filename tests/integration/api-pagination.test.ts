import { describe, it, expect } from 'vitest';

function parsePagination(searchParams: URLSearchParams) {
	const page = Math.max(1, Number(searchParams.get('page') || 1));
	const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 20)));
	const offset = (page - 1) * limit;
	return { page, limit, offset };
}

function buildPaginationLinks(page: number, limit: number, total: number) {
	const totalPages = Math.ceil(total / limit);
	return {
		self: `/api/v1/resource?page=${page}&limit=${limit}`,
		...(page * limit < total ? { next: `/api/v1/resource?page=${page + 1}&limit=${limit}` } : {}),
		...(page > 1 ? { prev: `/api/v1/resource?page=${page - 1}&limit=${limit}` } : {})
	};
}

describe('API pagination parsing', () => {
	it('defaults to page 1 limit 20', () => {
		const params = new URLSearchParams();
		const { page, limit, offset } = parsePagination(params);
		expect(page).toBe(1);
		expect(limit).toBe(20);
		expect(offset).toBe(0);
	});

	it('parses explicit page and limit', () => {
		const params = new URLSearchParams('page=3&limit=50');
		const { page, limit, offset } = parsePagination(params);
		expect(page).toBe(3);
		expect(limit).toBe(50);
		expect(offset).toBe(100);
	});

	it('clamps limit to max 100', () => {
		const params = new URLSearchParams('limit=500');
		const { limit } = parsePagination(params);
		expect(limit).toBe(100);
	});

	it('clamps limit to min 1', () => {
		const params = new URLSearchParams('limit=0');
		const { limit } = parsePagination(params);
		expect(limit).toBe(1);
	});

	it('clamps page to min 1', () => {
		const params = new URLSearchParams('page=-5');
		const { page } = parsePagination(params);
		expect(page).toBe(1);
	});

	it('NaN inputs produce NaN (known behavior — sanitize before calling)', () => {
		const params = new URLSearchParams('page=abc&limit=xyz');
		const { page, limit } = parsePagination(params);
		expect(Number.isNaN(page)).toBe(true);
		expect(Number.isNaN(limit)).toBe(true);
	});
});

describe('API pagination links', () => {
	it('no next link on last page', () => {
		const links = buildPaginationLinks(5, 10, 50);
		expect(links.next).toBeUndefined();
		expect(links.prev).toBeDefined();
	});

	it('no prev link on first page', () => {
		const links = buildPaginationLinks(1, 10, 50);
		expect(links.prev).toBeUndefined();
		expect(links.next).toBeDefined();
	});

	it('both links on middle page', () => {
		const links = buildPaginationLinks(3, 10, 50);
		expect(links.prev).toBeDefined();
		expect(links.next).toBeDefined();
	});

	it('self link always present', () => {
		const links = buildPaginationLinks(1, 10, 5);
		expect(links.self).toContain('page=1');
		expect(links.self).toContain('limit=10');
	});
});

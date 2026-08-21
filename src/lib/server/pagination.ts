import { sql, type SQL } from 'drizzle-orm';
import type { PgSelect, PgTable } from 'drizzle-orm/pg-core';
import { db } from './db/index.js';

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

export interface PaginationParams {
	page: number;
	pageSize: number;
}

export interface PaginatedResult<T> {
	items: T[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

export function parsePagination(url: URL): PaginationParams {
	const raw = Number(url.searchParams.get('page'));
	const page = Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;

	const rawSize = Number(url.searchParams.get('pageSize'));
	const pageSize = Number.isFinite(rawSize) && rawSize >= 1
		? Math.min(Math.floor(rawSize), MAX_PAGE_SIZE)
		: DEFAULT_PAGE_SIZE;

	return { page, pageSize };
}

export function applyPagination<T extends PgSelect>(
	query: T,
	{ page, pageSize }: PaginationParams
): T {
	return query.limit(pageSize).offset((page - 1) * pageSize) as T;
}

/**
 * Runs a paginated query and its parallel count in one call.
 * `T` is inferred from the query's select shape — no explicit generic needed.
 */
export async function paginateWithCount<T extends PgSelect>(
	query: T,
	countTable: PgTable,
	where: SQL | undefined,
	pagination: PaginationParams
): Promise<PaginatedResult<Awaited<T>[number]>> {
	const [items, countRows] = await Promise.all([
		applyPagination(query, pagination),
		db.select({ total: sql<number>`count(*)` }).from(countTable).where(where)
	]);
	const total = countRows[0]?.total ?? 0;
	return paginatedResponse(items as Awaited<T>[number][], Number(total), pagination);
}

export function paginatedResponse<T>(
	items: T[],
	totalItems: number,
	params: PaginationParams
): PaginatedResult<T> {
	return {
		items,
		page: params.page,
		pageSize: params.pageSize,
		totalItems,
		totalPages: Math.ceil(totalItems / params.pageSize)
	};
}

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies } from '$lib/server/db/schema.js';
import { sql } from 'drizzle-orm';
import { requireApiAuth } from '$lib/server/api-auth.js';
import { orgScope } from '$lib/server/tenant.js';
import { parsePagination, paginatedResponse } from '$lib/server/pagination.js';

export const GET: RequestHandler = async ({ request, url }) => {
	const auth = await requireApiAuth(request, 'colonies:read');
	if (auth instanceof Response) return auth;

	const { page, pageSize } = parsePagination(url);
	const orgId = auth.organizationId;
	const where = orgScope(colonies.organizationId, orgId);

	const [data, countRows] = await Promise.all([
		db.select({
			id: colonies.id,
			name: colonies.name,
			district: colonies.district,
			latitude: colonies.latitude,
			longitude: colonies.longitude,
			status: colonies.status,
			isActive: colonies.isActive,
			createdAt: colonies.createdAt,
			catCount: sql<number>`(select count(*) from cats where cats.colony_id = colonies.id)`
		})
			.from(colonies)
			.where(where)
			.limit(pageSize)
			.offset((page - 1) * pageSize),
		db.select({ count: sql<number>`count(*)` }).from(colonies).where(where)
	]);

	const total = Number(countRows[0]?.count ?? 0);
	const paginated = paginatedResponse(data, total, { page, pageSize });

	return json({
		data: paginated.items,
		pagination: {
			page: paginated.page,
			limit: paginated.pageSize,
			total: paginated.totalItems,
			totalPages: paginated.totalPages
		},
		_links: {
			self: `/api/v1/colonies?page=${page}&limit=${pageSize}`,
			...(page * pageSize < total ? { next: `/api/v1/colonies?page=${page + 1}&limit=${pageSize}` } : {}),
			...(page > 1 ? { prev: `/api/v1/colonies?page=${page - 1}&limit=${pageSize}` } : {})
		}
	}, {
		headers: {
			'X-Total-Count': String(total),
			'X-Page': String(page),
			'X-RateLimit-Remaining': String(auth.remaining)
		}
	});
};

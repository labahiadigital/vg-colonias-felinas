import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { cats, colonies } from '$lib/server/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { requireApiAuth } from '$lib/server/api-auth.js';
import { orgScope, buildWhere } from '$lib/server/tenant.js';
import { parsePagination, paginatedResponse } from '$lib/server/pagination.js';

export const GET: RequestHandler = async ({ request, url }) => {
	const auth = await requireApiAuth(request, 'cats:read');
	if (auth instanceof Response) return auth;

	const { page, pageSize } = parsePagination(url);
	const orgId = auth.organizationId;
	const colonyId = url.searchParams.get('colony_id');

	const where = buildWhere(
		orgScope(cats.organizationId, orgId),
		colonyId ? eq(cats.colonyId, colonyId) : undefined
	);

	const [data, countRows] = await Promise.all([
		db.select({
			id: cats.id,
			name: cats.name,
			sex: cats.sex,
			sterilized: cats.sterilized,
			sterilizationDate: cats.sterilizationDate,
			microchip: cats.microchip,
			status: cats.status,
			estimatedAge: cats.estimatedAge,
			colonyId: cats.colonyId,
			colonyName: colonies.name,
			createdAt: cats.createdAt
		})
			.from(cats)
			.leftJoin(colonies, eq(cats.colonyId, colonies.id))
			.where(where)
			.limit(pageSize)
			.offset((page - 1) * pageSize),
		db.select({ count: sql<number>`count(*)` }).from(cats).where(orgScope(cats.organizationId, orgId))
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
		}
	}, {
		headers: {
			'X-Total-Count': String(total),
			'X-RateLimit-Remaining': String(auth.remaining)
		}
	});
};

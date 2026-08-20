import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies, cats, apiKeys } from '$lib/server/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { validateApiKey } from '$lib/server/api-auth.js';

export const GET: RequestHandler = async ({ request, url }) => {
	const auth = await validateApiKey(request, 'colonies:read');
	if (!auth.valid) return json({ error: auth.error }, { status: 401 });

	const page = Math.max(1, Number(url.searchParams.get('page') || 1));
	const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 20)));
	const offset = (page - 1) * limit;

	const data = await db
		.select({
			id: colonies.id,
			name: colonies.name,
			address: colonies.address,
			latitude: colonies.latitude,
			longitude: colonies.longitude,
			environment: colonies.environment,
			isActive: colonies.isActive,
			createdAt: colonies.createdAt,
			catCount: sql<number>`(select count(*) from cats where cats.colony_id = colonies.id)`
		})
		.from(colonies)
		.limit(limit)
		.offset(offset);

	const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(colonies);

	return json({
		data,
		pagination: {
			page,
			limit,
			total: Number(count),
			totalPages: Math.ceil(Number(count) / limit)
		},
		_links: {
			self: `/api/v1/colonies?page=${page}&limit=${limit}`,
			...(page * limit < Number(count) ? { next: `/api/v1/colonies?page=${page + 1}&limit=${limit}` } : {}),
			...(page > 1 ? { prev: `/api/v1/colonies?page=${page - 1}&limit=${limit}` } : {})
		}
	}, {
		headers: {
			'X-Total-Count': String(count),
			'X-Page': String(page),
			'X-RateLimit-Remaining': String(auth.remaining ?? 999)
		}
	});
};

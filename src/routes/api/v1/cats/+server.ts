import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { cats, colonies } from '$lib/server/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { validateApiKey } from '$lib/server/api-auth.js';

export const GET: RequestHandler = async ({ request, url }) => {
	const auth = await validateApiKey(request, 'cats:read');
	if (!auth.valid) return json({ error: auth.error }, { status: 401 });

	const page = Math.max(1, Number(url.searchParams.get('page') || 1));
	const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 20)));
	const offset = (page - 1) * limit;
	const colonyId = url.searchParams.get('colony_id');

	let query = db
		.select({
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
		.limit(limit)
		.offset(offset);

	if (colonyId) {
		query = query.where(eq(cats.colonyId, colonyId)) as typeof query;
	}

	const data = await query;
	const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(cats);

	return json({
		data,
		pagination: {
			page,
			limit,
			total: Number(count),
			totalPages: Math.ceil(Number(count) / limit)
		}
	}, {
		headers: {
			'X-Total-Count': String(count),
			'X-RateLimit-Remaining': String(auth.remaining ?? 999)
		}
	});
};

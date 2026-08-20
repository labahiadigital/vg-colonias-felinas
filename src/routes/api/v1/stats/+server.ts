import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies, cats, visits, incidents, healthRecords } from '$lib/server/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { validateApiKey } from '$lib/server/api-auth.js';

export const GET: RequestHandler = async ({ request }) => {
	const auth = await validateApiKey(request, 'stats:read');
	if (!auth.valid) return json({ error: auth.error }, { status: 401 });

	const [[colonyCount], [catCount], [sterilizedCount], [visitCount], [incidentCount], [healthCount]] =
		await Promise.all([
			db.select({ count: sql<number>`count(*)` }).from(colonies),
			db.select({ count: sql<number>`count(*)` }).from(cats),
			db.select({ count: sql<number>`count(*)` }).from(cats).where(eq(cats.sterilized, true)),
			db.select({ count: sql<number>`count(*)` }).from(visits),
			db.select({ count: sql<number>`count(*)` }).from(incidents),
			db.select({ count: sql<number>`count(*)` }).from(healthRecords)
		]);

	const totalCats = Number(catCount?.count ?? 0);
	const sterilized = Number(sterilizedCount?.count ?? 0);

	return json({
		data: {
			colonies: Number(colonyCount?.count ?? 0),
			cats: totalCats,
			sterilized,
			sterilizationRate: totalCats > 0 ? Number(((sterilized / totalCats) * 100).toFixed(1)) : 0,
			visits: Number(visitCount?.count ?? 0),
			incidents: Number(incidentCount?.count ?? 0),
			healthRecords: Number(healthCount?.count ?? 0)
		},
		generatedAt: new Date().toISOString()
	});
};

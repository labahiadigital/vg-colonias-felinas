import type { PageServerLoad } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies, feedingPoints, incidents, cats } from '$lib/server/db/schema.js';
import { eq, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const [allColonies, allFeedingPoints, openIncidents] = await Promise.all([
		db.select({
			id: colonies.id,
			name: colonies.name,
			status: colonies.status,
			classification: colonies.classification,
			district: colonies.district,
			latitude: colonies.latitude,
			longitude: colonies.longitude,
			catCount: sql<number>`(SELECT count(*) FROM cats WHERE cats.colony_id = ${colonies.id})`
		}).from(colonies),
		db.select().from(feedingPoints),
		db.select({
			id: incidents.id,
			category: incidents.category,
			priority: incidents.priority,
			status: incidents.status,
			description: incidents.description,
			latitude: incidents.latitude,
			longitude: incidents.longitude
		}).from(incidents).where(
			sql`${incidents.status} != 'resolved'`
		)
	]);

	return {
		locale: locals.locale,
		colonies: allColonies,
		feedingPoints: allFeedingPoints,
		incidents: openIncidents
	};
};

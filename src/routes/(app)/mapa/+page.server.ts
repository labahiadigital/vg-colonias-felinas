import type { PageServerLoad } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies, feedingPoints, incidents, cats, visits } from '$lib/server/db/schema.js';
import { eq, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const [allColonies, allFeedingPoints, openIncidents, allIncidentsForHeat, visitsByColony] = await Promise.all([
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
		),
		db.select({
			latitude: incidents.latitude,
			longitude: incidents.longitude,
			priority: incidents.priority
		}).from(incidents),
		db.select({
			colonyId: visits.colonyId,
			visitCount: sql<number>`count(*)`
		}).from(visits).groupBy(visits.colonyId)
	]);

	const visitCountMap = new Map(visitsByColony.map(v => [v.colonyId, Number(v.visitCount)]));

	return {
		locale: locals.locale,
		colonies: allColonies,
		feedingPoints: allFeedingPoints,
		incidents: openIncidents,
		heatmapData: {
			catDensity: allColonies
				.filter((c): c is typeof c & { latitude: number; longitude: number } => c.latitude != null && c.longitude != null)
				.map(c => [c.latitude, c.longitude, Number(c.catCount) || 1]),
			incidentFrequency: allIncidentsForHeat
				.filter((i): i is typeof i & { latitude: number; longitude: number } => i.latitude != null && i.longitude != null)
				.map(i => [i.latitude, i.longitude, i.priority === 'critical' ? 3 : i.priority === 'high' ? 2 : 1]),
			volunteerActivity: allColonies
				.filter((c): c is typeof c & { latitude: number; longitude: number } => c.latitude != null && c.longitude != null)
				.map(c => [c.latitude, c.longitude, visitCountMap.get(c.id) ?? 0])
				.filter(v => (v[2] as number) > 0)
		}
	};
};

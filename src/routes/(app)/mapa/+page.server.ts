import type { PageServerLoad } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies, feedingPoints, incidents, visits } from '$lib/server/db/schema.js';
import { sql, ne, inArray } from 'drizzle-orm';
import { orgScope, buildWhere } from '$lib/server/tenant.js';
import { buildHeatmapData } from '$lib/server/heatmap.js';

export const load: PageServerLoad = async ({ locals }) => {
	const orgId = locals.organizationId;

	const orgColoniesSubquery = orgId
		? db.select({ id: colonies.id }).from(colonies).where(orgScope(colonies.organizationId, orgId))
		: undefined;

	const [allColonies, allFeedingPoints, openIncidents, allIncidentsForHeat, visitsByColony] = await Promise.all([
		db.select({
			id: colonies.id,
			name: colonies.name,
			status: colonies.status,
			classification: colonies.classification,
			district: colonies.district,
			latitude: colonies.latitude,
			longitude: colonies.longitude,
			geojson: colonies.geojson,
			catCount: sql<number>`(SELECT count(*) FROM cats WHERE cats.colony_id = ${colonies.id})`
		}).from(colonies).where(orgScope(colonies.organizationId, orgId)),
		db.select().from(feedingPoints).where(
			orgColoniesSubquery
				? inArray(feedingPoints.colonyId, orgColoniesSubquery)
				: undefined
		),
		db.select({
			id: incidents.id,
			category: incidents.category,
			priority: incidents.priority,
			status: incidents.status,
			description: incidents.description,
			latitude: incidents.latitude,
			longitude: incidents.longitude
		}).from(incidents).where(
			buildWhere(
				orgScope(incidents.organizationId, orgId),
				ne(incidents.status, 'resolved')
			)
		),
		db.select({
			latitude: incidents.latitude,
			longitude: incidents.longitude,
			priority: incidents.priority
		}).from(incidents).where(orgScope(incidents.organizationId, orgId)),
		db.select({
			colonyId: visits.colonyId,
			visitCount: sql<number>`count(*)`
		}).from(visits).where(orgScope(visits.organizationId, orgId)).groupBy(visits.colonyId)
	]);

	return {
		locale: locals.locale,
		colonies: allColonies,
		feedingPoints: allFeedingPoints,
		incidents: openIncidents,
		heatmapData: buildHeatmapData(allColonies, allIncidentsForHeat, visitsByColony)
	};
};

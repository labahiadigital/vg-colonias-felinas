import type { PageServerLoad } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies, cats, incidents, cerActions, adoptions } from '$lib/server/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { getStats } from '$lib/server/stats.js';
import { orgScope, loadRecentAudit } from '$lib/server/tenant.js';

export const load: PageServerLoad = async ({ locals }) => {
	const orgId = locals.organizationId;

	const [stats, catsByColony, incidentsByCategory, recentAudit, totalAdoptions, cerByMonth] = await Promise.all([
		getStats(orgId),
		db.select({
			colonyName: colonies.name,
			catCount: sql<number>`count(${cats.id})`
		}).from(cats).innerJoin(colonies, eq(cats.colonyId, colonies.id)).where(orgScope(colonies.organizationId, orgId)).groupBy(colonies.name),
		db.select({
			category: incidents.category,
			count: sql<number>`count(*)`
		}).from(incidents).where(orgScope(incidents.organizationId, orgId)).groupBy(incidents.category),
		loadRecentAudit(orgId, { limit: 10 }),
		db.select({ count: sql<number>`count(*)` }).from(adoptions).where(orgScope(adoptions.organizationId, orgId)),
		db.select({
			month: sql<string>`to_char(${cerActions.capturedAt}, 'YYYY-MM')`,
			count: sql<number>`count(*)`
		}).from(cerActions).where(orgScope(cerActions.organizationId, orgId)).groupBy(sql`to_char(${cerActions.capturedAt}, 'YYYY-MM')`).orderBy(sql`to_char(${cerActions.capturedAt}, 'YYYY-MM')`)
	]);

	return {
		locale: locals.locale,
		kpis: {
			totalColonies: stats.totalColonies,
			activeColonies: stats.activeColonies,
			totalCats: stats.totalCats,
			sterilizedCats: stats.sterilizedCats,
			microchippedCats: stats.microchipped,
			sterilizationRate: stats.sterilizationRate,
			totalIncidents: stats.totalIncidents,
			openIncidents: stats.openIncidents,
			resolvedIncidents: stats.resolvedIncidents,
			incidentResolutionRate: stats.incidentResolutionRate,
			totalCER: stats.totalCER,
			totalCollaborators: stats.totalCollab,
			activeCollaborators: stats.activeCollaborators,
			totalVisits: stats.totalVisits,
			recentVisits: stats.recentVisits,
			totalInspections: stats.totalInsp,
			activeProviders: stats.activeProviders,
			volunteerHours: stats.volunteerHours,
			totalAdoptions: Number(totalAdoptions[0]?.count ?? 0),
			geolocatedColonies: stats.geoColonies,
			geolocatedPct: stats.geoRate,
			totalHealthRecords: stats.totalHealth
		},
		catsByColony,
		incidentsByCategory,
		cerByMonth,
		auditLog: recentAudit
	};
};

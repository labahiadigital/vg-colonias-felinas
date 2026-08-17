import type { PageServerLoad } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies, cats, incidents, collaborators, cerActions, auditLogs, users, visits, inspections, providers, volunteerHours } from '$lib/server/db/schema.js';
import { eq, sql, and, desc, gte } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

	const [
		colonyCount,
		activeColonyCount,
		catCount,
		sterilizedCount,
		microchippedCount,
		openIncidentCount,
		highPriorityCount,
		cerCount,
		recentLogs,
		pendingCollaborators,
		activeCollaboratorCount,
		visitCountRecent,
		inspectionCount,
		providerCount,
		volunteerHoursTotal,
		geolocatedColonies
	] = await Promise.all([
		db.select({ count: sql<number>`count(*)` }).from(colonies),
		db.select({ count: sql<number>`count(*)` }).from(colonies).where(eq(colonies.status, 'active')),
		db.select({ count: sql<number>`count(*)` }).from(cats),
		db.select({ count: sql<number>`count(*)` }).from(cats).where(eq(cats.sterilized, true)),
		db.select({ count: sql<number>`count(*)` }).from(cats).where(sql`${cats.microchip} is not null and ${cats.microchip} != ''`),
		db.select({ count: sql<number>`count(*)` }).from(incidents).where(eq(incidents.status, 'open')),
		db.select({ count: sql<number>`count(*)` }).from(incidents).where(and(eq(incidents.status, 'open'), eq(incidents.priority, 'high'))),
		db.select({ count: sql<number>`count(*)` }).from(cerActions),
		db.select({
			id: auditLogs.id,
			entity: auditLogs.entity,
			action: auditLogs.action,
			details: auditLogs.details,
			createdAt: auditLogs.createdAt,
			userName: users.name
		})
			.from(auditLogs)
			.leftJoin(users, eq(auditLogs.userId, users.id))
			.orderBy(desc(auditLogs.createdAt))
			.limit(5),
		db.select({ count: sql<number>`count(*)` }).from(collaborators).where(eq(collaborators.status, 'pending')),
		db.select({ count: sql<number>`count(*)` }).from(collaborators).where(eq(collaborators.status, 'active')),
		db.select({ count: sql<number>`count(*)` }).from(visits).where(gte(visits.visitedAt, thirtyDaysAgo)),
		db.select({ count: sql<number>`count(*)` }).from(inspections),
		db.select({ count: sql<number>`count(*)` }).from(providers).where(eq(providers.status, 'active')),
		db.select({ total: sql<number>`coalesce(sum(${volunteerHours.hours}), 0)` }).from(volunteerHours),
		db.select({ count: sql<number>`count(*)` }).from(colonies).where(sql`${colonies.latitude} is not null`)
	]);

	const totalCats = Number(catCount[0]?.count ?? 0);
	const sterilized = Number(sterilizedCount[0]?.count ?? 0);
	const sterilizationRate = totalCats > 0 ? Math.round((sterilized / totalCats) * 100) : 0;
	const totalColonies = Number(colonyCount[0]?.count ?? 0);
	const geolocated = Number(geolocatedColonies[0]?.count ?? 0);

	return {
		user: locals.user,
		locale: locals.locale,
		stats: {
			totalColonies,
			activeColonies: Number(activeColonyCount[0]?.count ?? 0),
			totalCats,
			sterilized,
			microchipped: Number(microchippedCount[0]?.count ?? 0),
			sterilizationRate,
			openIncidents: Number(openIncidentCount[0]?.count ?? 0),
			highPriority: Number(highPriorityCount[0]?.count ?? 0),
			cerTotal: Number(cerCount[0]?.count ?? 0),
			pendingCollaborators: Number(pendingCollaborators[0]?.count ?? 0),
			activeCollaborators: Number(activeCollaboratorCount[0]?.count ?? 0),
			recentVisits: Number(visitCountRecent[0]?.count ?? 0),
			totalInspections: Number(inspectionCount[0]?.count ?? 0),
			activeProviders: Number(providerCount[0]?.count ?? 0),
			volunteerHours: Number(volunteerHoursTotal[0]?.total ?? 0),
			geolocatedColonies: geolocated,
			geolocatedPct: totalColonies > 0 ? Math.round((geolocated / totalColonies) * 100) : 0
		},
		recentActivity: recentLogs
	};
};

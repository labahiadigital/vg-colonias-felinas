import type { PageServerLoad } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies, cats, incidents, cerActions, collaborators, auditLogs, users, visits, inspections, providers, volunteerHours, healthRecords, adoptions } from '$lib/server/db/schema.js';
import { eq, sql, desc, gte } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

	const [
		totalColonies,
		activeColonies,
		totalCats,
		sterilizedCats,
		microchippedCats,
		totalIncidents,
		openIncidents,
		resolvedIncidents,
		totalCER,
		totalCollaborators,
		activeCollaborators,
		catsByColony,
		incidentsByCategory,
		recentAudit,
		totalVisits,
		recentVisitCount,
		totalInspections,
		activeProviders,
		volHoursTotal,
		totalAdoptions,
		geolocatedColonies,
		totalHealthRecords,
		cerByMonth
	] = await Promise.all([
		db.select({ count: sql<number>`count(*)` }).from(colonies),
		db.select({ count: sql<number>`count(*)` }).from(colonies).where(eq(colonies.status, 'active')),
		db.select({ count: sql<number>`count(*)` }).from(cats),
		db.select({ count: sql<number>`count(*)` }).from(cats).where(eq(cats.sterilized, true)),
		db.select({ count: sql<number>`count(*)` }).from(cats).where(sql`${cats.microchip} is not null and ${cats.microchip} != ''`),
		db.select({ count: sql<number>`count(*)` }).from(incidents),
		db.select({ count: sql<number>`count(*)` }).from(incidents).where(eq(incidents.status, 'open')),
		db.select({ count: sql<number>`count(*)` }).from(incidents).where(eq(incidents.status, 'resolved')),
		db.select({ count: sql<number>`count(*)` }).from(cerActions),
		db.select({ count: sql<number>`count(*)` }).from(collaborators),
		db.select({ count: sql<number>`count(*)` }).from(collaborators).where(eq(collaborators.status, 'active')),
		db.select({
			colonyName: colonies.name,
			catCount: sql<number>`count(${cats.id})`
		}).from(cats).innerJoin(colonies, eq(cats.colonyId, colonies.id)).groupBy(colonies.name),
		db.select({
			category: incidents.category,
			count: sql<number>`count(*)`
		}).from(incidents).groupBy(incidents.category),
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
			.limit(10),
		db.select({ count: sql<number>`count(*)` }).from(visits),
		db.select({ count: sql<number>`count(*)` }).from(visits).where(gte(visits.visitedAt, thirtyDaysAgo)),
		db.select({ count: sql<number>`count(*)` }).from(inspections),
		db.select({ count: sql<number>`count(*)` }).from(providers).where(eq(providers.status, 'active')),
		db.select({ total: sql<number>`coalesce(sum(${volunteerHours.hours}), 0)` }).from(volunteerHours),
		db.select({ count: sql<number>`count(*)` }).from(adoptions),
		db.select({ count: sql<number>`count(*)` }).from(colonies).where(sql`${colonies.latitude} is not null`),
		db.select({ count: sql<number>`count(*)` }).from(healthRecords),
		db.select({
			month: sql<string>`to_char(${cerActions.capturedAt}, 'YYYY-MM')`,
			count: sql<number>`count(*)`
		}).from(cerActions).groupBy(sql`to_char(${cerActions.capturedAt}, 'YYYY-MM')`).orderBy(sql`to_char(${cerActions.capturedAt}, 'YYYY-MM')`)
	]);

	const tc = Number(totalCats[0]?.count ?? 0);
	const sc = Number(sterilizedCats[0]?.count ?? 0);
	const totalCol = Number(totalColonies[0]?.count ?? 0);
	const geoCol = Number(geolocatedColonies[0]?.count ?? 0);

	return {
		locale: locals.locale,
		kpis: {
			totalColonies: totalCol,
			activeColonies: Number(activeColonies[0]?.count ?? 0),
			totalCats: tc,
			sterilizedCats: sc,
			microchippedCats: Number(microchippedCats[0]?.count ?? 0),
			sterilizationRate: tc > 0 ? Math.round((sc / tc) * 100) : 0,
			totalIncidents: Number(totalIncidents[0]?.count ?? 0),
			openIncidents: Number(openIncidents[0]?.count ?? 0),
			resolvedIncidents: Number(resolvedIncidents[0]?.count ?? 0),
			incidentResolutionRate: Number(totalIncidents[0]?.count ?? 0) > 0 ? Math.round((Number(resolvedIncidents[0]?.count ?? 0) / Number(totalIncidents[0]?.count ?? 0)) * 100) : 0,
			totalCER: Number(totalCER[0]?.count ?? 0),
			totalCollaborators: Number(totalCollaborators[0]?.count ?? 0),
			activeCollaborators: Number(activeCollaborators[0]?.count ?? 0),
			totalVisits: Number(totalVisits[0]?.count ?? 0),
			recentVisits: Number(recentVisitCount[0]?.count ?? 0),
			totalInspections: Number(totalInspections[0]?.count ?? 0),
			activeProviders: Number(activeProviders[0]?.count ?? 0),
			volunteerHours: Number(volHoursTotal[0]?.total ?? 0),
			totalAdoptions: Number(totalAdoptions[0]?.count ?? 0),
			geolocatedColonies: geoCol,
			geolocatedPct: totalCol > 0 ? Math.round((geoCol / totalCol) * 100) : 0,
			totalHealthRecords: Number(totalHealthRecords[0]?.count ?? 0)
		},
		catsByColony,
		incidentsByCategory,
		cerByMonth,
		auditLog: recentAudit
	};
};

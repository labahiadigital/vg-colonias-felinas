import type { PageServerLoad } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies, cats, incidents, cerActions, collaborators, auditLogs, users } from '$lib/server/db/schema.js';
import { eq, sql, desc, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const [
		totalColonies,
		activeColonies,
		totalCats,
		sterilizedCats,
		totalIncidents,
		openIncidents,
		resolvedIncidents,
		totalCER,
		totalCollaborators,
		activeCollaborators,
		catsByColony,
		incidentsByCategory,
		recentAudit
	] = await Promise.all([
		db.select({ count: sql<number>`count(*)` }).from(colonies),
		db.select({ count: sql<number>`count(*)` }).from(colonies).where(eq(colonies.status, 'active')),
		db.select({ count: sql<number>`count(*)` }).from(cats),
		db.select({ count: sql<number>`count(*)` }).from(cats).where(eq(cats.sterilized, true)),
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
			.limit(10)
	]);

	const tc = Number(totalCats[0]?.count ?? 0);
	const sc = Number(sterilizedCats[0]?.count ?? 0);

	return {
		locale: locals.locale,
		kpis: {
			totalColonies: Number(totalColonies[0]?.count ?? 0),
			activeColonies: Number(activeColonies[0]?.count ?? 0),
			totalCats: tc,
			sterilizedCats: sc,
			sterilizationRate: tc > 0 ? Math.round((sc / tc) * 100) : 0,
			totalIncidents: Number(totalIncidents[0]?.count ?? 0),
			openIncidents: Number(openIncidents[0]?.count ?? 0),
			resolvedIncidents: Number(resolvedIncidents[0]?.count ?? 0),
			totalCER: Number(totalCER[0]?.count ?? 0),
			totalCollaborators: Number(totalCollaborators[0]?.count ?? 0),
			activeCollaborators: Number(activeCollaborators[0]?.count ?? 0)
		},
		catsByColony,
		incidentsByCategory,
		auditLog: recentAudit
	};
};

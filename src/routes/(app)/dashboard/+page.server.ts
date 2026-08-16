import type { PageServerLoad } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies, cats, incidents, collaborators, cerActions, auditLogs, users } from '$lib/server/db/schema.js';
import { eq, sql, and, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const [
		colonyCount,
		activeColonyCount,
		catCount,
		sterilizedCount,
		openIncidentCount,
		highPriorityCount,
		cerCount,
		recentLogs,
		pendingCollaborators
	] = await Promise.all([
		db.select({ count: sql<number>`count(*)` }).from(colonies),
		db.select({ count: sql<number>`count(*)` }).from(colonies).where(eq(colonies.status, 'active')),
		db.select({ count: sql<number>`count(*)` }).from(cats),
		db.select({ count: sql<number>`count(*)` }).from(cats).where(eq(cats.sterilized, true)),
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
		db.select({ count: sql<number>`count(*)` }).from(collaborators).where(eq(collaborators.status, 'pending'))
	]);

	const totalCats = Number(catCount[0]?.count ?? 0);
	const sterilized = Number(sterilizedCount[0]?.count ?? 0);
	const sterilizationRate = totalCats > 0 ? Math.round((sterilized / totalCats) * 100) : 0;

	return {
		user: locals.user,
		locale: locals.locale,
		stats: {
			totalColonies: Number(colonyCount[0]?.count ?? 0),
			activeColonies: Number(activeColonyCount[0]?.count ?? 0),
			totalCats,
			sterilized,
			sterilizationRate,
			openIncidents: Number(openIncidentCount[0]?.count ?? 0),
			highPriority: Number(highPriorityCount[0]?.count ?? 0),
			cerTotal: Number(cerCount[0]?.count ?? 0),
			pendingCollaborators: Number(pendingCollaborators[0]?.count ?? 0)
		},
		recentActivity: recentLogs
	};
};

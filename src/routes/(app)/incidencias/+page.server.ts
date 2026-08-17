import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { incidents, colonies, users, auditLogs } from '$lib/server/db/schema.js';
import { eq, and, desc, ilike, sql } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { logAudit } from '$lib/server/audit.js';
import { notify } from '$lib/server/notifications.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const statusFilter = url.searchParams.get('status') ?? '';
	const priorityFilter = url.searchParams.get('priority') ?? '';
	const categoryFilter = url.searchParams.get('category') ?? '';
	const search = url.searchParams.get('q') ?? '';

	const reporterAlias = sql`reporter`;
	const assigneeAlias = sql`assignee`;

	let query = db.select({
		id: incidents.id,
		colonyId: incidents.colonyId,
		catId: incidents.catId,
		category: incidents.category,
		priority: incidents.priority,
		status: incidents.status,
		description: incidents.description,
		latitude: incidents.latitude,
		longitude: incidents.longitude,
		photos: incidents.photos,
		assignedTo: incidents.assignedTo,
		createdAt: incidents.createdAt,
		updatedAt: incidents.updatedAt,
		colonyName: colonies.name,
		reporterName: users.name
	})
		.from(incidents)
		.leftJoin(colonies, eq(incidents.colonyId, colonies.id))
		.leftJoin(users, eq(incidents.reportedBy, users.id))
		.orderBy(desc(incidents.createdAt))
		.$dynamic();

	const conditions = [];
	if (statusFilter) conditions.push(eq(incidents.status, statusFilter));
	if (priorityFilter) conditions.push(eq(incidents.priority, priorityFilter));
	if (categoryFilter) conditions.push(eq(incidents.category, categoryFilter));
	if (search) conditions.push(ilike(incidents.description, `%${search}%`));
	if (conditions.length > 0) query = query.where(and(...conditions));

	const allIncidents = await query;
	const allColonies = await db.select({ id: colonies.id, name: colonies.name }).from(colonies);
	const allUsers = await db.select({ id: users.id, name: users.name }).from(users);

	const incidentAudit = await db
		.select({
			entityId: auditLogs.entityId,
			action: auditLogs.action,
			details: auditLogs.details,
			userName: users.name,
			createdAt: auditLogs.createdAt
		})
		.from(auditLogs)
		.leftJoin(users, eq(auditLogs.userId, users.id))
		.where(eq(auditLogs.entity, 'incident'))
		.orderBy(desc(auditLogs.createdAt))
		.limit(50);

	return {
		locale: locals.locale,
		incidents: allIncidents,
		colonies: allColonies,
		users: allUsers,
		incidentComments: incidentAudit,
		filters: { status: statusFilter, priority: priorityFilter, category: categoryFilter, search }
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		const fd = await request.formData();

		const category = fd.get('category') as string;
		const priority = fd.get('priority') as string;
		const colonyId = fd.get('colonyId') as string;
		const description = fd.get('description') as string;
		const latitude = parseFloat(fd.get('latitude') as string);
		const longitude = parseFloat(fd.get('longitude') as string);

		if (!category || !description) return fail(400, { error: 'Categoría y descripción son obligatorios' });

		const result = await db.insert(incidents).values({
			category,
			priority: priority || 'medium',
			colonyId: colonyId || null,
			description,
			latitude: isNaN(latitude) ? null : latitude,
			longitude: isNaN(longitude) ? null : longitude,
			reportedBy: locals.user.id,
			status: 'open'
		}).returning();

		if (result[0]) {
			await logAudit({ userId: locals.user.id, entity: 'incident', entityId: result[0].id, action: 'create', details: { category, priority } });
		}
		return { success: true };
	},

	updateStatus: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		const fd = await request.formData();
		const id = fd.get('id') as string;
		const status = fd.get('status') as string;

		await db.update(incidents).set({ status, updatedAt: new Date() }).where(eq(incidents.id, id));
		await logAudit({ userId: locals.user.id, entity: 'incident', entityId: id, action: 'change_status', details: { newStatus: status } });

		const statusLabels: Record<string, string> = { open: 'Abierta', in_progress: 'En progreso', resolved: 'Resuelta', closed: 'Cerrada' };
		await notify({ type: 'incident_status', title: 'Incidencia actualizada', message: `La incidencia ha cambiado a estado: ${statusLabels[status] || status}`, payload: { incidentId: id, status } });

		return { updated: true };
	},

	assign: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		const fd = await request.formData();
		const id = fd.get('id') as string;
		const assignedTo = fd.get('assignedTo') as string;

		await db.update(incidents).set({ assignedTo: assignedTo || null, updatedAt: new Date() }).where(eq(incidents.id, id));

		if (assignedTo) {
			await notify({ userId: assignedTo, type: 'incident_assigned', title: 'Incidencia asignada', message: 'Se te ha asignado una nueva incidencia.', payload: { incidentId: id } });
		}
		await logAudit({ userId: locals.user.id, entity: 'incident', entityId: id, action: 'assign', details: { assignedTo } });
		return { assigned: true };
	},

	addComment: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		const fd = await request.formData();
		const incidentId = fd.get('incidentId') as string;
		const comment = fd.get('comment') as string;

		if (!comment) return fail(400, { error: 'El comentario no puede estar vacío' });

		await logAudit({ userId: locals.user.id, entity: 'incident', entityId: incidentId, action: 'comment', details: { text: comment } });
		return { commented: true };
	},

	edit: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		const fd = await request.formData();
		const id = fd.get('id') as string;
		const category = fd.get('category') as string;
		const priority = fd.get('priority') as string;
		const description = fd.get('description') as string;
		const colonyId = fd.get('colonyId') as string;

		if (!id) return fail(400, { error: 'ID obligatorio' });

		await db.update(incidents).set({
			...(category && { category }),
			...(priority && { priority }),
			...(description && { description }),
			colonyId: colonyId || null,
			updatedAt: new Date()
		}).where(eq(incidents.id, id));

		await logAudit({ userId: locals.user.id, entity: 'incident', entityId: id, action: 'update', details: { category, priority } });
		return { edited: true };
	},

	delete: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		const fd = await request.formData();
		const id = fd.get('id') as string;
		if (!id) return fail(400, { error: 'ID obligatorio' });

		await db.delete(incidents).where(eq(incidents.id, id));
		await logAudit({ userId: locals.user.id, entity: 'incident', entityId: id, action: 'delete', details: {} });
		return { deleted: true };
	}
};

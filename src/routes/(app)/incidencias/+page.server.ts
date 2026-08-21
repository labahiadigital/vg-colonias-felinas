import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { incidents, colonies, users } from '$lib/server/db/schema.js';
import { eq, and, desc, ilike } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { requireAuthContext, getFormField, getFormNumber, requireField, requireFields } from '$lib/server/action-helpers.js';
import { audit } from '$lib/server/audit.js';
import { notify } from '$lib/server/notifications.js';
import { orgScope, escapeLike, verifyOrgOwnership, buildWhere, loadOrgColonies, loadOrgUsers, loadRecentAudit } from '$lib/server/tenant.js';
import { guardedUpdate, guardedDelete, guardedUpdateWith, guardedInsert } from '$lib/server/db-helpers.js';
import { parsePagination, paginateWithCount } from '$lib/server/pagination.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const orgId = locals.organizationId;
	const statusFilter = url.searchParams.get('status') ?? '';
	const priorityFilter = url.searchParams.get('priority') ?? '';
	const categoryFilter = url.searchParams.get('category') ?? '';
	const search = url.searchParams.get('q') ?? '';
	const pagination = parsePagination(url);

	const whereClause = buildWhere(
		orgScope(incidents.organizationId, orgId),
		statusFilter && eq(incidents.status, statusFilter),
		priorityFilter && eq(incidents.priority, priorityFilter),
		categoryFilter && eq(incidents.category, categoryFilter),
		search && ilike(incidents.description, `%${escapeLike(search)}%`)
	);

	const baseSelect = db.select({
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

	if (whereClause) baseSelect.where(whereClause);

	const [paginated, allColonies, allUsers, incidentAudit] = await Promise.all([
		paginateWithCount(baseSelect, incidents, whereClause, pagination),
		loadOrgColonies(orgId),
		loadOrgUsers(orgId),
		loadRecentAudit(orgId, { entity: 'incident', limit: 50 })
	]);

	return {
		locale: locals.locale,
		...paginated,
		colonies: allColonies,
		users: allUsers,
		incidentComments: incidentAudit,
		filters: { status: statusFilter, priority: priorityFilter, category: categoryFilter, search }
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();

		const { category, description } = requireFields(fd, {
			category: 'La categoría', description: 'La descripción'
		});

		const priority = getFormField(fd, 'priority') || 'medium';
		const colonyId = getFormField(fd, 'colonyId');
		if (colonyId && !await verifyOrgOwnership(colonies, colonyId, ctx.organizationId)) {
			return fail(404, { error: 'Colonia no encontrada' });
		}

		const latitude = getFormNumber(fd, 'latitude');
		const longitude = getFormNumber(fd, 'longitude');

		await guardedInsert(incidents, {
			organizationId: ctx.organizationId,
			category,
			priority,
			colonyId: colonyId || null,
			description,
			latitude,
			longitude,
			reportedBy: ctx.userId,
			status: 'open'
		}, ctx, 'incident', 'create', { category, priority });

		return { success: true };
	},

	updateStatus: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const { id, status } = requireFields(fd, { id: 'El ID', status: 'El estado' });

		const statusLabels: Record<string, string> = { open: 'Abierta', in_progress: 'En progreso', resolved: 'Resuelta', closed: 'Cerrada' };
		await guardedUpdateWith(incidents, { status, updatedAt: new Date() },
			and(eq(incidents.id, id), orgScope(incidents.organizationId, ctx.organizationId)),
			{ id: incidents.id }, async () => {
				await audit(ctx, 'incident', id, 'change_status', { newStatus: status });
				await notify({ organizationId: ctx.organizationId, type: 'incident_status', title: 'Incidencia actualizada', message: `La incidencia ha cambiado a estado: ${statusLabels[status] || status}`, payload: { incidentId: id, status } });
			});

		return { updated: true };
	},

	assign: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const id = requireField(fd, 'id', 'El ID');
		const assignedTo = getFormField(fd, 'assignedTo');

		await guardedUpdateWith(incidents, { assignedTo: assignedTo || null, updatedAt: new Date() },
			and(eq(incidents.id, id), orgScope(incidents.organizationId, ctx.organizationId)),
			{ id: incidents.id }, async () => {
				if (assignedTo) {
					await notify({ organizationId: ctx.organizationId, userId: assignedTo, type: 'incident_assigned', title: 'Incidencia asignada', message: 'Se te ha asignado una nueva incidencia.', payload: { incidentId: id } });
				}
				await audit(ctx, 'incident', id, 'assign', { assignedTo });
			});
		return { assigned: true };
	},

	addComment: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const { incidentId, comment } = requireFields(fd, {
			incidentId: 'La incidencia', comment: 'El comentario'
		});

		if (!await verifyOrgOwnership(incidents, incidentId, ctx.organizationId)) {
			return fail(404, { error: 'Incidencia no encontrada' });
		}

		await audit(ctx, 'incident', incidentId, 'comment', { text: comment });
		return { commented: true };
	},

	edit: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const id = requireField(fd, 'id', 'El ID');

		const category = getFormField(fd, 'category');
		const priority = getFormField(fd, 'priority');
		const description = getFormField(fd, 'description');
		const colonyId = getFormField(fd, 'colonyId');

		if (colonyId && !await verifyOrgOwnership(colonies, colonyId, ctx.organizationId)) {
			return fail(404, { error: 'Colonia no encontrada' });
		}

		await guardedUpdate(incidents, {
			...(category && { category }), ...(priority && { priority }),
			...(description && { description }), colonyId: colonyId || null, updatedAt: new Date()
		}, and(eq(incidents.id, id), orgScope(incidents.organizationId, ctx.organizationId)),
			ctx, 'incident', id, 'update', { category, priority });
		return { edited: true };
	},

	delete: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const id = requireField(fd, 'id', 'El ID');

		await guardedDelete(incidents, and(eq(incidents.id, id), orgScope(incidents.organizationId, ctx.organizationId)),
			ctx, 'incident', id, 'delete');
		return { deleted: true };
	}
};

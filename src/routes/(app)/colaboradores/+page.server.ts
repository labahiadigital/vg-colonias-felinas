import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { collaborators, colonies } from '$lib/server/db/schema.js';
import { eq, ilike, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { requireAuthContext, getFormField, requireField, requireFields, getFormStringArray } from '$lib/server/action-helpers.js';
import { audit } from '$lib/server/audit.js';
import { notify } from '$lib/server/notifications.js';
import { orgScope, escapeLike, verifyOrgOwnership, buildWhere, loadOrgColonies } from '$lib/server/tenant.js';
import { guardedUpdateWith, guardedInsert } from '$lib/server/db-helpers.js';
import { toDateString } from '$lib/index.js';
import { toStringArray } from '$lib/index.js';
import { parsePagination, paginateWithCount } from '$lib/server/pagination.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const orgId = locals.organizationId;
	const search = url.searchParams.get('q') ?? '';
	const statusFilter = url.searchParams.get('status') ?? '';
	const pagination = parsePagination(url);

	const whereClause = buildWhere(
		orgScope(collaborators.organizationId, orgId),
		search && ilike(collaborators.name, `%${escapeLike(search)}%`),
		statusFilter && eq(collaborators.status, statusFilter)
	);

	const baseSelect = db.select().from(collaborators).$dynamic();
	if (whereClause) baseSelect.where(whereClause);

	const [paginated, allColonies] = await Promise.all([
		paginateWithCount(baseSelect, collaborators, whereClause, pagination),
		loadOrgColonies(orgId)
	]);

	const colonyMap = new Map(allColonies.map(c => [c.id, c.name]));

	const items = paginated.items.map(col => ({
		...col,
		colonyNames: toStringArray(col.assignedColonies).map(id => colonyMap.get(id) ?? id)
	}));

	return {
		locale: locals.locale,
		...paginated,
		items,
		colonies: allColonies,
		filters: { search, status: statusFilter }
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();

		const name = requireField(fd, 'name', 'El nombre');
		const documentId = getFormField(fd, 'documentId');
		const assignedColonies = getFormStringArray(fd, 'assignedColonies');

		for (const cId of assignedColonies) {
			if (!await verifyOrgOwnership(colonies, cId, ctx.organizationId)) {
				return fail(404, { error: 'Colonia asignada no encontrada' });
			}
		}

		await guardedInsert(collaborators, {
			organizationId: ctx.organizationId,
			name,
			documentId: documentId || null,
			assignedColonies: assignedColonies.length > 0 ? assignedColonies : [],
			status: 'pending',
			privacyNoticeSigned: false
		}, ctx, 'collaborator', 'create', { name });

		return { success: true };
	},

	updateStatus: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const { id, status } = requireFields(fd, { id: 'El ID', status: 'El estado' });

		const updates: Record<string, unknown> = { status, updatedAt: new Date() };
		if (status === 'active') {
			const validUntil = new Date();
			validUntil.setFullYear(validUntil.getFullYear() + 1);
			updates.validUntil = toDateString(validUntil);
		}

		const statusLabels: Record<string, string> = { active: 'Activo', rejected: 'Rechazado', suspended: 'Suspendido', pending: 'Pendiente' };
		await guardedUpdateWith(collaborators, updates,
			and(eq(collaborators.id, id), orgScope(collaborators.organizationId, ctx.organizationId)),
			{ id: collaborators.id, userId: collaborators.userId }, async (rows) => {
				const col = rows[0];
				if (col?.userId) {
					await notify({ organizationId: ctx.organizationId, userId: String(col.userId), type: 'collaborator_status', title: 'Estado de colaborador actualizado', message: `Tu estado como colaborador/a ha cambiado a: ${statusLabels[status] || status}`, payload: { collaboratorId: id, status } });
				}
				await audit(ctx, 'collaborator', id, 'change_status', { status });
			});
		return { updated: true };
	}
};

import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { collaborators, colonies } from '$lib/server/db/schema.js';
import { eq, ilike, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { notify } from '$lib/server/notifications.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const search = url.searchParams.get('q') ?? '';
	const statusFilter = url.searchParams.get('status') ?? '';

	let query = db.select().from(collaborators).$dynamic();
	const conditions = [];
	if (search) conditions.push(ilike(collaborators.name, `%${search}%`));
	if (statusFilter) conditions.push(eq(collaborators.status, statusFilter));
	if (conditions.length > 0) query = query.where(and(...conditions));

	const allCollaborators = await query;
	const allColonies = await db.select({ id: colonies.id, name: colonies.name }).from(colonies);

	const colonyMap = new Map(allColonies.map(c => [c.id, c.name]));

	const enriched = allCollaborators.map(col => ({
		...col,
		colonyNames: Array.isArray(col.assignedColonies)
			? (col.assignedColonies as string[]).map(id => colonyMap.get(id) ?? id)
			: []
	}));

	return {
		locale: locals.locale,
		collaborators: enriched,
		colonies: allColonies,
		filters: { search, status: statusFilter }
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		const fd = await request.formData();
		const name = fd.get('name') as string;
		const documentId = fd.get('documentId') as string;
		const assignedColonies = fd.getAll('assignedColonies') as string[];

		if (!name) return fail(400, { error: 'El nombre es obligatorio' });

		await db.insert(collaborators).values({
			name,
			documentId: documentId || null,
			assignedColonies: assignedColonies.length > 0 ? assignedColonies : [],
			status: 'pending',
			privacyNoticeSigned: false
		});

		return { success: true };
	},

	updateStatus: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		const fd = await request.formData();
		const id = fd.get('id') as string;
		const status = fd.get('status') as string;

		const updates: Record<string, unknown> = { status, updatedAt: new Date() };
		if (status === 'active') {
			const validUntil = new Date();
			validUntil.setFullYear(validUntil.getFullYear() + 1);
			updates.validUntil = validUntil.toISOString().split('T')[0];
		}

		await db.update(collaborators).set(updates).where(eq(collaborators.id, id));

		const [col] = await db.select().from(collaborators).where(eq(collaborators.id, id));
		if (col?.userId) {
			const statusLabels: Record<string, string> = { active: 'Activo', rejected: 'Rechazado', suspended: 'Suspendido', pending: 'Pendiente' };
			await notify({ userId: col.userId, type: 'collaborator_status', title: 'Estado de colaborador actualizado', message: `Tu estado como colaborador/a ha cambiado a: ${statusLabels[status] || status}`, payload: { collaboratorId: id, status } });
		}

		return { updated: true };
	}
};

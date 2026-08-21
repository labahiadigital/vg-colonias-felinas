import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { cats, colonies } from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { requireAuthContext, getFormField, requireFields } from '$lib/server/action-helpers.js';
import { orgScope, verifyOrgOwnership, loadOrgColonies, loadCatDetail } from '$lib/server/tenant.js';
import { guardedUpdate, guardedDelete, guardedInsert } from '$lib/server/db-helpers.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const orgId = locals.organizationId;

	const catRows = await db.select({
		id: cats.id, name: cats.name, colonyId: cats.colonyId, sex: cats.sex,
		sterilized: cats.sterilized, sterilizationDate: cats.sterilizationDate,
		microchip: cats.microchip, status: cats.status, estimatedAge: cats.estimatedAge,
		photo: cats.photo, createdAt: cats.createdAt, colonyName: colonies.name
	})
		.from(cats)
		.leftJoin(colonies, eq(cats.colonyId, colonies.id))
		.where(and(eq(cats.id, params.id), orgScope(cats.organizationId, orgId)))
		.limit(1);

	if (!catRows[0]) throw error(404, 'Gato no encontrado');

	const [detail, allColonies] = await Promise.all([
		loadCatDetail(params.id, orgId),
		loadOrgColonies(orgId)
	]);

	return {
		locale: locals.locale,
		cat: catRows[0],
		...detail,
		colonies: allColonies
	};
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();

		const colonyId = getFormField(fd, 'colonyId');
		if (colonyId && !await verifyOrgOwnership(colonies, colonyId, ctx.organizationId)) {
			return fail(404, { error: 'Colonia no encontrada' });
		}

		await guardedUpdate(cats, {
			name: getFormField(fd, 'name') || null, colonyId: colonyId || null,
			sex: getFormField(fd, 'sex') || null, microchip: getFormField(fd, 'microchip') || null,
			estimatedAge: getFormField(fd, 'estimatedAge') || null, status: getFormField(fd, 'status') || 'in_colony',
			updatedAt: new Date()
		}, and(eq(cats.id, params.id), orgScope(cats.organizationId, ctx.organizationId)),
			ctx, 'cat', params.id, 'update');
		return { success: true };
	},

	addHealth: async ({ request, params, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();

		const [cat] = await db.select({ id: cats.id }).from(cats)
			.where(and(eq(cats.id, params.id), orgScope(cats.organizationId, ctx.organizationId)))
			.limit(1);
		if (!cat) return fail(404, { error: 'Gato no encontrado' });

		const { type, performedAt } = requireFields(fd, {
			type: 'El tipo', performedAt: 'La fecha'
		});

		const { healthRecords } = await import('$lib/server/db/schema.js');
		await guardedInsert(healthRecords, {
			organizationId: ctx.organizationId,
			catId: params.id,
			type,
			performedAt: new Date(performedAt),
			vetName: getFormField(fd, 'vetName') || null,
			vetClinic: getFormField(fd, 'vetClinic') || null,
			notes: getFormField(fd, 'notes') || null
		}, ctx, 'health_record', 'create', { catId: params.id, type });

		return { healthAdded: true };
	},

	delete: async ({ params, locals, request }) => {
		const ctx = requireAuthContext(locals, request);
		await guardedDelete(cats, and(eq(cats.id, params.id), orgScope(cats.organizationId, ctx.organizationId)),
			ctx, 'cat', params.id, 'delete');
		return { deleted: true };
	}
};

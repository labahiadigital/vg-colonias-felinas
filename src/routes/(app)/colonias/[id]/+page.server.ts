import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies } from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { requireAuthContext, getFormField } from '$lib/server/action-helpers.js';
import { orgScope, loadColonyDetail } from '$lib/server/tenant.js';
import { guardedUpdate, guardedDelete } from '$lib/server/db-helpers.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const orgId = locals.organizationId;
	const colony = await db.select().from(colonies).where(and(eq(colonies.id, params.id), orgScope(colonies.organizationId, orgId))).limit(1);
	if (!colony[0]) throw error(404, 'Colonia no encontrada');

	const detail = await loadColonyDetail(params.id, orgId);

	return {
		locale: locals.locale,
		colony: colony[0],
		...detail
	};
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const name = getFormField(fd, 'name').trim();
		if (!name) return fail(400, { error: 'El nombre es obligatorio' });

		const district = getFormField(fd, 'district');
		const classification = getFormField(fd, 'classification');
		const description = getFormField(fd, 'description');
		const status = getFormField(fd, 'status');

		await guardedUpdate(colonies, {
			name, district: district || null, classification: classification || null,
			description: description || null, status: status || 'active', updatedAt: new Date()
		}, and(eq(colonies.id, params.id), orgScope(colonies.organizationId, ctx.organizationId)),
			ctx, 'colony', params.id, 'update', { name, status });
		return { success: true };
	},

	delete: async ({ params, locals, request }) => {
		const ctx = requireAuthContext(locals, request);
		await guardedDelete(colonies, and(eq(colonies.id, params.id), orgScope(colonies.organizationId, ctx.organizationId)),
			ctx, 'colony', params.id, 'delete');
		return { deleted: true };
	}
};

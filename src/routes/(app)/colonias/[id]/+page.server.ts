import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies, cats, feedingPoints, incidents, cerActions, collaborators } from '$lib/server/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const colony = await db.select().from(colonies).where(eq(colonies.id, params.id)).limit(1);
	if (!colony[0]) throw error(404, 'Colonia no encontrada');

	const [colonyCats, colonyFPs, colonyIncidents, colonyCER] = await Promise.all([
		db.select().from(cats).where(eq(cats.colonyId, params.id)),
		db.select().from(feedingPoints).where(eq(feedingPoints.colonyId, params.id)),
		db.select().from(incidents).where(eq(incidents.colonyId, params.id)),
		db.select().from(cerActions).where(eq(cerActions.colonyId, params.id))
	]);

	return {
		locale: locals.locale,
		colony: colony[0],
		cats: colonyCats,
		feedingPoints: colonyFPs,
		incidents: colonyIncidents,
		cerActions: colonyCER
	};
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const district = formData.get('district') as string;
		const classification = formData.get('classification') as string;
		const description = formData.get('description') as string;
		const status = formData.get('status') as string;

		if (!name) return fail(400, { error: 'El nombre es obligatorio' });

		await db.update(colonies).set({
			name,
			district: district || null,
			classification: classification || null,
			description: description || null,
			status: status || 'active',
			updatedAt: new Date()
		}).where(eq(colonies.id, params.id));

		return { success: true };
	},

	delete: async ({ params, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		await db.delete(colonies).where(eq(colonies.id, params.id));
		return { deleted: true };
	}
};

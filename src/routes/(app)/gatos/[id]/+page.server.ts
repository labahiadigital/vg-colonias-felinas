import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { cats, colonies, healthRecords, cerActions, adoptions } from '$lib/server/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const catRows = await db.select({
		id: cats.id,
		name: cats.name,
		colonyId: cats.colonyId,
		sex: cats.sex,
		sterilized: cats.sterilized,
		sterilizationDate: cats.sterilizationDate,
		microchip: cats.microchip,
		status: cats.status,
		estimatedAge: cats.estimatedAge,
		photo: cats.photo,
		createdAt: cats.createdAt,
		colonyName: colonies.name
	})
		.from(cats)
		.leftJoin(colonies, eq(cats.colonyId, colonies.id))
		.where(eq(cats.id, params.id))
		.limit(1);

	if (!catRows[0]) throw error(404, 'Gato no encontrado');

	const [health, cer, adoption, allColonies] = await Promise.all([
		db.select().from(healthRecords).where(eq(healthRecords.catId, params.id)).orderBy(desc(healthRecords.performedAt)),
		db.select().from(cerActions).where(eq(cerActions.catId, params.id)),
		db.select().from(adoptions).where(eq(adoptions.catId, params.id)),
		db.select({ id: colonies.id, name: colonies.name }).from(colonies)
	]);

	return {
		locale: locals.locale,
		cat: catRows[0],
		healthRecords: health,
		cerActions: cer,
		adoptions: adoption,
		colonies: allColonies
	};
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		const fd = await request.formData();

		await db.update(cats).set({
			name: (fd.get('name') as string) || null,
			colonyId: (fd.get('colonyId') as string) || null,
			sex: (fd.get('sex') as string) || null,
			microchip: (fd.get('microchip') as string) || null,
			estimatedAge: (fd.get('estimatedAge') as string) || null,
			status: (fd.get('status') as string) || 'in_colony',
			updatedAt: new Date()
		}).where(eq(cats.id, params.id));

		return { success: true };
	},

	addHealth: async ({ request, params, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		const fd = await request.formData();

		await db.insert(healthRecords).values({
			catId: params.id,
			type: fd.get('type') as string,
			performedAt: new Date(fd.get('performedAt') as string),
			vetName: (fd.get('vetName') as string) || null,
			vetClinic: (fd.get('vetClinic') as string) || null,
			notes: (fd.get('notes') as string) || null
		});

		return { healthAdded: true };
	},

	delete: async ({ params, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		await db.delete(cats).where(eq(cats.id, params.id));
		return { deleted: true };
	}
};

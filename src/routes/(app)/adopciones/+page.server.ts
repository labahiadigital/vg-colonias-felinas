import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { adoptions, cats, colonies, auditLogs } from '$lib/server/db/schema.js';
import { desc, eq } from 'drizzle-orm';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');

	const allAdoptions = await db
		.select({
			id: adoptions.id,
			catId: adoptions.catId,
			catName: cats.name,
			colonyName: colonies.name,
			adopterInfo: adoptions.adopterInfo,
			consent: adoptions.consent,
			status: adoptions.status,
			adoptedAt: adoptions.adoptedAt,
			documents: adoptions.documents,
			createdAt: adoptions.createdAt
		})
		.from(adoptions)
		.leftJoin(cats, eq(adoptions.catId, cats.id))
		.leftJoin(colonies, eq(cats.colonyId, colonies.id))
		.orderBy(desc(adoptions.createdAt));

	const availableCats = await db
		.select({ id: cats.id, name: cats.name, colonyName: colonies.name })
		.from(cats)
		.leftJoin(colonies, eq(cats.colonyId, colonies.id))
		.where(eq(cats.status, 'in_colony'))
		.orderBy(cats.name);

	return {
		locale: locals.locale,
		adoptions: allAdoptions,
		availableCats
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');
		const fd = await request.formData();

		const catId = fd.get('catId') as string;
		const adopterName = fd.get('adopterName') as string;
		const adopterPhone = fd.get('adopterPhone') as string;
		const adopterEmail = fd.get('adopterEmail') as string;
		const adopterAddress = fd.get('adopterAddress') as string;
		const adopterDocument = fd.get('adopterDocument') as string;
		const consentSigned = fd.get('consentSigned') === 'on';

		if (!catId || !adopterName) {
			return fail(400, { error: 'Gato y nombre del adoptante son obligatorios' });
		}

		const [adoption] = await db.insert(adoptions).values({
			catId,
			adopterInfo: {
				name: adopterName,
				phone: adopterPhone || null,
				email: adopterEmail || null,
				address: adopterAddress || null,
				document: adopterDocument || null
			},
			consent: { signed: consentSigned, signedAt: consentSigned ? new Date().toISOString() : null },
			status: 'pending'
		}).returning();

		await db.insert(auditLogs).values({
			userId: locals.user.id,
			entity: 'adoption',
			entityId: adoption.id,
			action: 'create',
			details: { catId, adopterName }
		});

		return { success: true };
	},
	updateStatus: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');
		const fd = await request.formData();
		const id = fd.get('id') as string;
		const status = fd.get('status') as string;

		if (!id || !status) return fail(400, { error: 'Datos incompletos' });

		const updates: Record<string, unknown> = { status };
		if (status === 'completed') {
			updates.adoptedAt = new Date();
		}

		await db.update(adoptions).set(updates).where(eq(adoptions.id, id));

		if (status === 'completed') {
			const [adoption] = await db.select().from(adoptions).where(eq(adoptions.id, id));
			if (adoption) {
				await db.update(cats).set({ status: 'adopted' }).where(eq(cats.id, adoption.catId));
			}
		}

		await db.insert(auditLogs).values({
			userId: locals.user.id,
			entity: 'adoption',
			entityId: id,
			action: 'update_status',
			details: { status }
		});

		return { success: true };
	}
};

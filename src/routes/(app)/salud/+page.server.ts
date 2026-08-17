import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { healthRecords, cats, colonies, auditLogs } from '$lib/server/db/schema.js';
import { desc, eq, ilike, sql } from 'drizzle-orm';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) throw redirect(302, '/login');

	const search = url.searchParams.get('q') || '';
	const typeFilter = url.searchParams.get('type') || '';

	let query = db
		.select({
			id: healthRecords.id,
			type: healthRecords.type,
			performedAt: healthRecords.performedAt,
			vetName: healthRecords.vetName,
			vetClinic: healthRecords.vetClinic,
			notes: healthRecords.notes,
			catId: healthRecords.catId,
			catName: cats.name,
			colonyId: cats.colonyId,
			colonyName: colonies.name,
			createdAt: healthRecords.createdAt
		})
		.from(healthRecords)
		.leftJoin(cats, eq(healthRecords.catId, cats.id))
		.leftJoin(colonies, eq(cats.colonyId, colonies.id))
		.orderBy(desc(healthRecords.performedAt));

	const records = await query;

	const filtered = records.filter((r) => {
		if (typeFilter && r.type !== typeFilter) return false;
		if (search) {
			const s = search.toLowerCase();
			const matchCat = r.catName?.toLowerCase().includes(s);
			const matchVet = r.vetName?.toLowerCase().includes(s);
			const matchClinic = r.vetClinic?.toLowerCase().includes(s);
			if (!matchCat && !matchVet && !matchClinic) return false;
		}
		return true;
	});

	const allCats = await db
		.select({ id: cats.id, name: cats.name, colonyName: colonies.name })
		.from(cats)
		.leftJoin(colonies, eq(cats.colonyId, colonies.id))
		.orderBy(cats.name);

	return {
		locale: locals.locale,
		records: filtered,
		cats: allCats,
		search,
		typeFilter
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');
		const fd = await request.formData();

		const catId = fd.get('catId') as string;
		const type = fd.get('type') as string;
		const performedAt = fd.get('performedAt') as string;
		const vetName = fd.get('vetName') as string;
		const vetClinic = fd.get('vetClinic') as string;
		const notes = fd.get('notes') as string;

		if (!catId || !type || !performedAt) {
			return fail(400, { error: 'Faltan campos obligatorios' });
		}

		const [record] = await db.insert(healthRecords).values({
			catId,
			type,
			performedAt: new Date(performedAt),
			vetName: vetName || null,
			vetClinic: vetClinic || null,
			notes: notes || null
		}).returning();

		await db.insert(auditLogs).values({
			userId: locals.user.id,
			entity: 'health_record',
			entityId: record.id,
			action: 'create',
			details: { type, catId }
		});

		return { success: true };
	},

	edit: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');
		const fd = await request.formData();
		const id = fd.get('id') as string;
		const type = fd.get('type') as string;
		const performedAt = fd.get('performedAt') as string;
		const vetName = fd.get('vetName') as string;
		const vetClinic = fd.get('vetClinic') as string;
		const notes = fd.get('notes') as string;

		if (!id) return fail(400, { error: 'ID obligatorio' });

		await db.update(healthRecords).set({
			...(type && { type }),
			...(performedAt && { performedAt: new Date(performedAt) }),
			vetName: vetName || null,
			vetClinic: vetClinic || null,
			notes: notes || null
		}).where(eq(healthRecords.id, id));

		await db.insert(auditLogs).values({
			userId: locals.user.id,
			entity: 'health_record',
			entityId: id,
			action: 'update',
			details: { type }
		});
		return { edited: true };
	},

	delete: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');
		const fd = await request.formData();
		const id = fd.get('id') as string;
		if (!id) return fail(400, { error: 'ID obligatorio' });

		await db.delete(healthRecords).where(eq(healthRecords.id, id));
		await db.insert(auditLogs).values({
			userId: locals.user.id,
			entity: 'health_record',
			entityId: id,
			action: 'delete',
			details: {}
		});
		return { deleted: true };
	}
};

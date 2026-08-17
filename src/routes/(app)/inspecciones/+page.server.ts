import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { inspections, inspectionTemplates, colonies, users, auditLogs } from '$lib/server/db/schema.js';
import { desc, eq } from 'drizzle-orm';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');

	const allInspections = await db
		.select({
			id: inspections.id,
			templateId: inspections.templateId,
			colonyId: inspections.colonyId,
			colonyName: colonies.name,
			inspectorId: inspections.inspectorId,
			results: inspections.results,
			photos: inspections.photos,
			notes: inspections.notes,
			score: inspections.score,
			passed: inspections.passed,
			followUpRequired: inspections.followUpRequired,
			followUpDate: inspections.followUpDate,
			createdAt: inspections.createdAt
		})
		.from(inspections)
		.leftJoin(colonies, eq(inspections.colonyId, colonies.id))
		.orderBy(desc(inspections.createdAt));

	const templates = await db
		.select()
		.from(inspectionTemplates)
		.orderBy(inspectionTemplates.name);

	const allColonies = await db
		.select({ id: colonies.id, name: colonies.name })
		.from(colonies)
		.orderBy(colonies.name);

	return {
		locale: locals.locale,
		inspections: allInspections,
		templates,
		colonies: allColonies
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');
		const fd = await request.formData();

		const templateId = fd.get('templateId') as string;
		const colonyId = fd.get('colonyId') as string;
		const notes = fd.get('notes') as string;
		const resultsRaw = fd.get('results') as string;
		const scoreRaw = fd.get('score') as string;
		const passedRaw = fd.get('passed') as string;

		if (!colonyId) {
			return fail(400, { error: 'Colonia es obligatoria' });
		}

		let results: Record<string, unknown> = {};
		if (resultsRaw) {
			try { results = JSON.parse(resultsRaw); } catch { results = { raw: resultsRaw }; }
		}

		const score = scoreRaw ? parseInt(scoreRaw, 10) : null;
		const passed = passedRaw === 'true' ? true : passedRaw === 'false' ? false : null;
		const followUpRequired = passed === false;

		const [inspection] = await db.insert(inspections).values({
			templateId: templateId || null,
			colonyId,
			inspectorId: locals.user.id,
			results,
			notes: notes || null,
			score,
			passed,
			followUpRequired,
			followUpDate: followUpRequired ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null
		}).returning();

		await db.insert(auditLogs).values({
			userId: locals.user.id,
			entity: 'inspection',
			entityId: inspection.id,
			action: 'create',
			details: { colonyId, templateId }
		});

		return { success: true };
	},
	createTemplate: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');
		const fd = await request.formData();

		const name = fd.get('name') as string;
		const fieldsRaw = fd.get('fields') as string;

		if (!name) return fail(400, { error: 'Nombre de plantilla obligatorio' });

		let schema: unknown[] = [];
		if (fieldsRaw) {
			try { schema = JSON.parse(fieldsRaw); } catch { schema = []; }
		}

		await db.insert(inspectionTemplates).values({ name, schema });
		return { templateSuccess: true };
	},

	edit: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');
		const fd = await request.formData();
		const id = fd.get('id') as string;
		const colonyId = fd.get('colonyId') as string;
		const notes = fd.get('notes') as string;
		const scoreRaw = fd.get('score') as string;
		const passedRaw = fd.get('passed') as string;

		if (!id) return fail(400, { error: 'ID obligatorio' });

		const score = scoreRaw ? parseInt(scoreRaw, 10) : undefined;
		const passed = passedRaw === 'true' ? true : passedRaw === 'false' ? false : undefined;

		await db.update(inspections).set({
			...(colonyId && { colonyId }),
			notes: notes || null,
			...(score !== undefined && { score }),
			...(passed !== undefined && { passed }),
			followUpRequired: passed === false
		}).where(eq(inspections.id, id));

		await db.insert(auditLogs).values({
			userId: locals.user.id,
			entity: 'inspection',
			entityId: id,
			action: 'update',
			details: { colonyId, score }
		});
		return { edited: true };
	},

	delete: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');
		const fd = await request.formData();
		const id = fd.get('id') as string;
		if (!id) return fail(400, { error: 'ID obligatorio' });

		await db.delete(inspections).where(eq(inspections.id, id));
		await db.insert(auditLogs).values({
			userId: locals.user.id,
			entity: 'inspection',
			entityId: id,
			action: 'delete',
			details: {}
		});
		return { deleted: true };
	}
};

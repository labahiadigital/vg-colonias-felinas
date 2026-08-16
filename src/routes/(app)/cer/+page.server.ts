import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { cerActions, cats, colonies, auditLogs } from '$lib/server/db/schema.js';
import { desc, eq, sql, count } from 'drizzle-orm';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');

	const actions = await db
		.select({
			id: cerActions.id,
			catId: cerActions.catId,
			catName: cats.name,
			colonyId: cerActions.colonyId,
			colonyName: colonies.name,
			capturedAt: cerActions.capturedAt,
			sterilizedAt: cerActions.sterilizedAt,
			returnedAt: cerActions.returnedAt,
			collaboratorName: cerActions.collaboratorName,
			notes: cerActions.notes,
			createdAt: cerActions.createdAt
		})
		.from(cerActions)
		.leftJoin(cats, eq(cerActions.catId, cats.id))
		.leftJoin(colonies, eq(cerActions.colonyId, colonies.id))
		.orderBy(desc(cerActions.createdAt));

	const totalActions = actions.length;
	const completed = actions.filter(a => a.capturedAt && a.sterilizedAt && a.returnedAt).length;
	const pendingReturn = actions.filter(a => a.sterilizedAt && !a.returnedAt).length;
	const successRate = totalActions > 0 ? Math.round((completed / totalActions) * 100) : 0;

	const monthlyData: Record<string, number> = {};
	for (const a of actions) {
		if (a.createdAt) {
			const key = new Date(a.createdAt).toISOString().slice(0, 7);
			monthlyData[key] = (monthlyData[key] || 0) + 1;
		}
	}
	const monthlyChart = Object.entries(monthlyData)
		.sort(([a], [b]) => a.localeCompare(b))
		.slice(-12)
		.map(([month, count]) => ({ month, count }));

	const allCats = await db
		.select({ id: cats.id, name: cats.name })
		.from(cats)
		.orderBy(cats.name);

	const allColonies = await db
		.select({ id: colonies.id, name: colonies.name })
		.from(colonies)
		.orderBy(colonies.name);

	return {
		locale: locals.locale,
		actions,
		indicators: { totalActions, completed, pendingReturn, successRate },
		monthlyChart,
		cats: allCats,
		colonies: allColonies
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');
		const fd = await request.formData();

		const catId = fd.get('catId') as string;
		const colonyId = fd.get('colonyId') as string;
		const capturedAt = fd.get('capturedAt') as string;
		const sterilizedAt = fd.get('sterilizedAt') as string;
		const returnedAt = fd.get('returnedAt') as string;
		const collaboratorName = fd.get('collaboratorName') as string;
		const notes = fd.get('notes') as string;

		if (!catId || !colonyId) {
			return fail(400, { error: 'Gato y colonia son obligatorios' });
		}

		const [action] = await db.insert(cerActions).values({
			catId,
			colonyId,
			capturedAt: capturedAt ? new Date(capturedAt) : null,
			sterilizedAt: sterilizedAt ? new Date(sterilizedAt) : null,
			returnedAt: returnedAt ? new Date(returnedAt) : null,
			collaboratorName: collaboratorName || null,
			notes: notes || null
		}).returning();

		await db.insert(auditLogs).values({
			userId: locals.user.id,
			entity: 'cer_action',
			entityId: action.id,
			action: 'create',
			details: { catId, colonyId }
		});

		return { success: true };
	}
};

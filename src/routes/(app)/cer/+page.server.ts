import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { cerActions, cats, colonies } from '$lib/server/db/schema.js';
import { desc, eq, sql } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { requireAuthContext, getFormField, requireFields } from '$lib/server/action-helpers.js';
import { orgScope, verifyOrgOwnership, loadOrgColonies, loadOrgCats } from '$lib/server/tenant.js';
import { guardedInsert } from '$lib/server/db-helpers.js';
import { parsePagination, applyPagination, paginatedResponse } from '$lib/server/pagination.js';
import { computeRate } from '$lib/index.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const orgId = locals.organizationId;
	const pagination = parsePagination(url);
	const whereCer = orgScope(cerActions.organizationId, orgId);

	const baseSelect = db.select({
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
		.where(whereCer)
		.orderBy(desc(cerActions.createdAt))
		.$dynamic();

	const [items, cerCountRows, monthlyRows, allCats, allColonies] = await Promise.all([
		applyPagination(baseSelect, pagination),
		db.select({
			total: sql<number>`count(*)`,
			completed: sql<number>`count(*) filter (where ${cerActions.capturedAt} is not null and ${cerActions.sterilizedAt} is not null and ${cerActions.returnedAt} is not null)`,
			pendingReturn: sql<number>`count(*) filter (where ${cerActions.sterilizedAt} is not null and ${cerActions.returnedAt} is null)`
		}).from(cerActions).where(whereCer),
		db.select({
			month: sql<string>`to_char(${cerActions.createdAt}, 'YYYY-MM')`,
			count: sql<number>`count(*)`
		}).from(cerActions).where(whereCer).groupBy(sql`to_char(${cerActions.createdAt}, 'YYYY-MM')`).orderBy(sql`to_char(${cerActions.createdAt}, 'YYYY-MM')`).limit(12),
		loadOrgCats(orgId),
		loadOrgColonies(orgId)
	]);

	const cerCount = cerCountRows[0];
	const totalActions = Number(cerCount?.total ?? 0);
	const completedCount = Number(cerCount?.completed ?? 0);
	const pendingReturnCount = Number(cerCount?.pendingReturn ?? 0);
	const successRate = computeRate(completedCount, totalActions);

	const monthlyChart = monthlyRows
		.filter((r): r is typeof r & { month: string } => r.month !== null)
		.map(r => ({ month: r.month, count: Number(r.count) }));

	return {
		locale: locals.locale,
		...paginatedResponse(items, totalActions, pagination),
		indicators: { totalActions, completed: completedCount, pendingReturn: pendingReturnCount, successRate },
		monthlyChart,
		cats: allCats,
		colonies: allColonies
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();

		const { catId, colonyId } = requireFields(fd, {
			catId: 'El gato', colonyId: 'La colonia'
		});

		const [catOk, colOk] = await Promise.all([
			verifyOrgOwnership(cats, catId, ctx.organizationId),
			verifyOrgOwnership(colonies, colonyId, ctx.organizationId)
		]);
		if (!catOk) return fail(404, { error: 'Gato no encontrado' });
		if (!colOk) return fail(404, { error: 'Colonia no encontrada' });

		const capturedAt = getFormField(fd, 'capturedAt');
		const sterilizedAt = getFormField(fd, 'sterilizedAt');
		const returnedAt = getFormField(fd, 'returnedAt');
		const collaboratorName = getFormField(fd, 'collaboratorName');
		const notes = getFormField(fd, 'notes');

		await guardedInsert(cerActions, {
			organizationId: ctx.organizationId,
			catId,
			colonyId,
			capturedAt: capturedAt ? new Date(capturedAt) : null,
			sterilizedAt: sterilizedAt ? new Date(sterilizedAt) : null,
			returnedAt: returnedAt ? new Date(returnedAt) : null,
			collaboratorName: collaboratorName || null,
			notes: notes || null
		}, ctx, 'cer_action', 'create', { catId, colonyId });
		return { success: true };
	}
};

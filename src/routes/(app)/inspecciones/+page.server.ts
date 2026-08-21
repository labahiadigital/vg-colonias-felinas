import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { inspections, inspectionTemplates, colonies } from '$lib/server/db/schema.js';
import { desc, eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { requireAuthContext, getFormField, requireField } from '$lib/server/action-helpers.js';
import { orgScope, verifyOrgOwnership, loadOrgColonies } from '$lib/server/tenant.js';
import { guardedUpdate, guardedDelete, guardedInsert } from '$lib/server/db-helpers.js';
import { parsePagination, paginateWithCount } from '$lib/server/pagination.js';
import { toDateString } from '$lib/index.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const orgId = locals.organizationId;
	const pagination = parsePagination(url);
	const whereInsp = orgScope(inspections.organizationId, orgId);

	const baseSelect = db.select({
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
		.where(whereInsp)
		.orderBy(desc(inspections.createdAt))
		.$dynamic();

	const [paginated, templates, allColonies] = await Promise.all([
		paginateWithCount(baseSelect, inspections, whereInsp, pagination),
		db.select().from(inspectionTemplates).where(orgScope(inspectionTemplates.organizationId, orgId)).orderBy(inspectionTemplates.name),
		loadOrgColonies(orgId)
	]);

	return {
		locale: locals.locale,
		...paginated,
		templates,
		colonies: allColonies
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();

		const colonyId = requireField(fd, 'colonyId', 'La colonia');

		if (!await verifyOrgOwnership(colonies, colonyId, ctx.organizationId)) {
			return fail(404, { error: 'Colonia no encontrada' });
		}

		const templateId = getFormField(fd, 'templateId');
		if (templateId && !await verifyOrgOwnership(inspectionTemplates, templateId, ctx.organizationId)) {
			return fail(404, { error: 'Plantilla no encontrada' });
		}

		const notes = getFormField(fd, 'notes');
		const resultsRaw = getFormField(fd, 'results');
		const scoreRaw = getFormField(fd, 'score');
		const passedRaw = getFormField(fd, 'passed');

		let results: Record<string, unknown> = {};
		if (resultsRaw) {
			try { results = JSON.parse(resultsRaw); } catch { results = { raw: resultsRaw }; }
		}

		const score = scoreRaw ? parseInt(scoreRaw, 10) : null;
		const passed = passedRaw === 'true' ? true : passedRaw === 'false' ? false : null;
		const followUpRequired = passed === false;

		await guardedInsert(inspections, {
			organizationId: ctx.organizationId,
			templateId: templateId || null,
			colonyId,
			inspectorId: ctx.userId,
			results,
			notes: notes || null,
			score,
			passed,
			followUpRequired,
			followUpDate: followUpRequired ? toDateString(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) : null
		}, ctx, 'inspection', 'create', { colonyId, templateId });

		return { success: true };
	},

	createTemplate: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const name = requireField(fd, 'name', 'El nombre de plantilla');

		const fieldsRaw = getFormField(fd, 'fields');
		let schema: unknown[] = [];
		if (fieldsRaw) {
			try { schema = JSON.parse(fieldsRaw); } catch { schema = []; }
		}

		await guardedInsert(inspectionTemplates, { organizationId: ctx.organizationId, name, schema }, ctx, 'inspection_template', 'create', { name });

		return { templateSuccess: true };
	},

	edit: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const id = requireField(fd, 'id', 'El ID');

		const colonyId = getFormField(fd, 'colonyId');
		const notes = getFormField(fd, 'notes');
		const scoreRaw = getFormField(fd, 'score');
		const passedRaw = getFormField(fd, 'passed');

		const score = scoreRaw ? parseInt(scoreRaw, 10) : undefined;
		const passed = passedRaw === 'true' ? true : passedRaw === 'false' ? false : undefined;

		await guardedUpdate(inspections, {
			...(colonyId && { colonyId }), notes: notes || null,
			...(score !== undefined && { score }), ...(passed !== undefined && { passed }),
			followUpRequired: passed === false
		}, and(eq(inspections.id, id), orgScope(inspections.organizationId, ctx.organizationId)),
			ctx, 'inspection', id, 'update', { colonyId, score });
		return { edited: true };
	},

	delete: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const id = requireField(fd, 'id', 'El ID');

		await guardedDelete(inspections, and(eq(inspections.id, id), orgScope(inspections.organizationId, ctx.organizationId)),
			ctx, 'inspection', id, 'delete');
		return { deleted: true };
	}
};

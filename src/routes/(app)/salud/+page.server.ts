import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { healthRecords, cats, colonies } from '$lib/server/db/schema.js';
import { desc, eq, ilike, and, or } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { requireAuthContext, getFormField, requireField, requireFields } from '$lib/server/action-helpers.js';
import { orgScope, escapeLike, verifyOrgOwnership, buildWhere } from '$lib/server/tenant.js';
import { guardedUpdate, guardedDelete, guardedInsert } from '$lib/server/db-helpers.js';
import { parsePagination, paginateWithCount } from '$lib/server/pagination.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const orgId = locals.organizationId;
	const pagination = parsePagination(url);

	const search = url.searchParams.get('q') || '';
	const typeFilter = url.searchParams.get('type') || '';

	const s = search ? escapeLike(search) : '';
	const whereClause = buildWhere(
		orgScope(healthRecords.organizationId, orgId),
		typeFilter && eq(healthRecords.type, typeFilter),
		search && or(
			ilike(cats.name, `%${s}%`),
			ilike(healthRecords.vetName, `%${s}%`),
			ilike(healthRecords.vetClinic, `%${s}%`)
		)
	);

	const baseSelect = db
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
		.where(whereClause)
		.orderBy(desc(healthRecords.performedAt))
		.$dynamic();

	const [paginated, allCats] = await Promise.all([
		paginateWithCount(baseSelect, healthRecords, whereClause, pagination),
		db.select({ id: cats.id, name: cats.name, colonyName: colonies.name })
			.from(cats)
			.leftJoin(colonies, eq(cats.colonyId, colonies.id))
			.where(orgScope(cats.organizationId, orgId))
			.orderBy(cats.name)
	]);

	return {
		locale: locals.locale,
		...paginated,
		cats: allCats,
		search,
		typeFilter
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();

		const { catId, type, performedAt } = requireFields(fd, {
			catId: 'El gato', type: 'El tipo', performedAt: 'La fecha'
		});

		if (!await verifyOrgOwnership(cats, catId, ctx.organizationId)) {
			return fail(404, { error: 'Gato no encontrado' });
		}

		const vetName = getFormField(fd, 'vetName');
		const vetClinic = getFormField(fd, 'vetClinic');
		const notes = getFormField(fd, 'notes');

		await guardedInsert(healthRecords, {
			organizationId: ctx.organizationId,
			catId,
			type,
			performedAt: new Date(performedAt),
			vetName: vetName || null,
			vetClinic: vetClinic || null,
			notes: notes || null
		}, ctx, 'health_record', 'create', { type, catId });

		return { success: true };
	},

	edit: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const id = requireField(fd, 'id', 'El ID');

		const type = getFormField(fd, 'type');
		const performedAt = getFormField(fd, 'performedAt');
		const vetName = getFormField(fd, 'vetName');
		const vetClinic = getFormField(fd, 'vetClinic');
		const notes = getFormField(fd, 'notes');

		await guardedUpdate(healthRecords, {
			...(type && { type }), ...(performedAt && { performedAt: new Date(performedAt) }),
			vetName: vetName || null, vetClinic: vetClinic || null, notes: notes || null
		}, and(eq(healthRecords.id, id), orgScope(healthRecords.organizationId, ctx.organizationId)),
			ctx, 'health_record', id, 'update', { type });
		return { edited: true };
	},

	delete: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const id = requireField(fd, 'id', 'El ID');

		await guardedDelete(healthRecords, and(eq(healthRecords.id, id), orgScope(healthRecords.organizationId, ctx.organizationId)),
			ctx, 'health_record', id, 'delete');
		return { deleted: true };
	}
};

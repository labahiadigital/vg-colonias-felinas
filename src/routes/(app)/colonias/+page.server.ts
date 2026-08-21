import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies } from '$lib/server/db/schema.js';
import { fail } from '@sveltejs/kit';
import { eq, ilike, sql } from 'drizzle-orm';
import { requireAuthContext, getFormField, getFormNumber } from '$lib/server/action-helpers.js';
import { orgScope, escapeLike, buildWhere, loadOrgColonies } from '$lib/server/tenant.js';
import { guardedInsert } from '$lib/server/db-helpers.js';
import { parsePagination, paginateWithCount } from '$lib/server/pagination.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const orgId = locals.organizationId;
	const search = url.searchParams.get('q') ?? '';
	const statusFilter = url.searchParams.get('status') ?? '';
	const districtFilter = url.searchParams.get('district') ?? '';
	const pagination = parsePagination(url);

	const whereClause = buildWhere(
		orgScope(colonies.organizationId, orgId),
		search && ilike(colonies.name, `%${escapeLike(search)}%`),
		statusFilter && eq(colonies.status, statusFilter),
		districtFilter && eq(colonies.district, districtFilter)
	);

	const baseSelect = db.select({
		id: colonies.id,
		name: colonies.name,
		status: colonies.status,
		classification: colonies.classification,
		district: colonies.district,
		description: colonies.description,
		latitude: colonies.latitude,
		longitude: colonies.longitude,
		createdAt: colonies.createdAt,
		catCount: sql<number>`(SELECT count(*) FROM cats WHERE cats.colony_id = ${colonies.id})`,
		sterilizedCount: sql<number>`(SELECT count(*) FROM cats WHERE cats.colony_id = ${colonies.id} AND cats.sterilized = true)`
	}).from(colonies).$dynamic();

	if (whereClause) baseSelect.where(whereClause);

	const [paginated, districts] = await Promise.all([
		paginateWithCount(baseSelect, colonies, whereClause, pagination),
		db.selectDistinct({ district: colonies.district }).from(colonies).where(orgScope(colonies.organizationId, orgId))
	]);

	return {
		locale: locals.locale,
		...paginated,
		districts: districts.map(d => d.district).filter((d): d is string => d != null),
		filters: { search, status: statusFilter, district: districtFilter }
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();

		const name = getFormField(fd, 'name').trim();
		if (!name) return fail(400, { error: 'El nombre es obligatorio' });
		const district = getFormField(fd, 'district');
		const classification = getFormField(fd, 'classification');
		const description = getFormField(fd, 'description');
		const latitude = getFormNumber(fd, 'latitude');
		const longitude = getFormNumber(fd, 'longitude');

		const colonyId = await guardedInsert(colonies, {
			organizationId: ctx.organizationId,
			name,
			district: district || null,
			classification: classification || null,
			description: description || null,
			latitude,
			longitude,
			status: 'active'
		}, ctx, 'colony', 'create', { name, district });

		return { success: true, colonyId };
	}
};

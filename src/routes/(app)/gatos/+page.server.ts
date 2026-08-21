import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { cats, colonies } from '$lib/server/db/schema.js';
import { eq, ilike } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { requireAuthContext, getFormField } from '$lib/server/action-helpers.js';
import { orgScope, escapeLike, verifyOrgOwnership, buildWhere, loadOrgColonies } from '$lib/server/tenant.js';
import { guardedInsert } from '$lib/server/db-helpers.js';
import { parsePagination, paginateWithCount } from '$lib/server/pagination.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const orgId = locals.organizationId;
	const search = url.searchParams.get('q') ?? '';
	const statusFilter = url.searchParams.get('status') ?? '';
	const colonyFilter = url.searchParams.get('colony') ?? '';
	const sterilizedFilter = url.searchParams.get('sterilized') ?? '';
	const pagination = parsePagination(url);

	const whereClause = buildWhere(
		orgScope(cats.organizationId, orgId),
		search && ilike(cats.name, `%${escapeLike(search)}%`),
		statusFilter && eq(cats.status, statusFilter),
		colonyFilter && eq(cats.colonyId, colonyFilter),
		sterilizedFilter === 'yes' && eq(cats.sterilized, true),
		sterilizedFilter === 'no' && eq(cats.sterilized, false)
	);

	const baseSelect = db.select({
		id: cats.id,
		name: cats.name,
		colonyId: cats.colonyId,
		sex: cats.sex,
		sterilized: cats.sterilized,
		sterilizationDate: cats.sterilizationDate,
		microchip: cats.microchip,
		status: cats.status,
		estimatedAge: cats.estimatedAge,
		createdAt: cats.createdAt,
		colonyName: colonies.name
	})
		.from(cats)
		.leftJoin(colonies, eq(cats.colonyId, colonies.id))
		.$dynamic();

	if (whereClause) baseSelect.where(whereClause);

	const [paginated, allColonies] = await Promise.all([
		paginateWithCount(baseSelect, cats, whereClause, pagination),
		loadOrgColonies(orgId)
	]);

	return {
		locale: locals.locale,
		...paginated,
		colonies: allColonies,
		filters: { search, status: statusFilter, colony: colonyFilter, sterilized: sterilizedFilter }
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();

		const name = getFormField(fd, 'name');
		const colonyId = getFormField(fd, 'colonyId');

		if (colonyId && !await verifyOrgOwnership(colonies, colonyId, ctx.organizationId)) {
			return fail(404, { error: 'Colonia no encontrada' });
		}

		const sex = getFormField(fd, 'sex');
		const microchip = getFormField(fd, 'microchip');
		const estimatedAge = getFormField(fd, 'estimatedAge');
		const photo = getFormField(fd, 'photo');

		const catId = await guardedInsert(cats, {
			organizationId: ctx.organizationId,
			name: name || null,
			colonyId: colonyId || null,
			sex: sex || null,
			microchip: microchip || null,
			estimatedAge: estimatedAge || null,
			photo: photo || null,
			status: 'in_colony',
			sterilized: false
		}, ctx, 'cat', 'create', { name, colonyId });

		return { success: true, catId };
	}
};

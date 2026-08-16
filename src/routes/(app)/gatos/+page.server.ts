import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { cats, colonies } from '$lib/server/db/schema.js';
import { eq, ilike, and, sql } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const search = url.searchParams.get('q') ?? '';
	const statusFilter = url.searchParams.get('status') ?? '';
	const colonyFilter = url.searchParams.get('colony') ?? '';
	const sterilizedFilter = url.searchParams.get('sterilized') ?? '';

	let query = db.select({
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

	const conditions = [];
	if (search) conditions.push(ilike(cats.name, `%${search}%`));
	if (statusFilter) conditions.push(eq(cats.status, statusFilter));
	if (colonyFilter) conditions.push(eq(cats.colonyId, colonyFilter));
	if (sterilizedFilter === 'yes') conditions.push(eq(cats.sterilized, true));
	if (sterilizedFilter === 'no') conditions.push(eq(cats.sterilized, false));
	if (conditions.length > 0) query = query.where(and(...conditions));

	const allCats = await query;
	const allColonies = await db.select({ id: colonies.id, name: colonies.name }).from(colonies);

	return {
		locale: locals.locale,
		cats: allCats,
		colonies: allColonies,
		filters: { search, status: statusFilter, colony: colonyFilter, sterilized: sterilizedFilter }
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		const fd = await request.formData();
		const name = fd.get('name') as string;
		const colonyId = fd.get('colonyId') as string;
		const sex = fd.get('sex') as string;
		const microchip = fd.get('microchip') as string;
		const estimatedAge = fd.get('estimatedAge') as string;

		const [newCat] = await db.insert(cats).values({
			name: name || null,
			colonyId: colonyId || null,
			sex: sex || null,
			microchip: microchip || null,
			estimatedAge: estimatedAge || null,
			status: 'in_colony',
			sterilized: false
		}).returning({ id: cats.id });

		return { success: true, catId: newCat.id };
	}
};

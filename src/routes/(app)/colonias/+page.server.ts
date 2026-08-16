import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies, cats } from '$lib/server/db/schema.js';
import { eq, sql, ilike, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const search = url.searchParams.get('q') ?? '';
	const statusFilter = url.searchParams.get('status') ?? '';
	const districtFilter = url.searchParams.get('district') ?? '';

	let query = db.select({
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

	const conditions = [];
	if (search) conditions.push(ilike(colonies.name, `%${search}%`));
	if (statusFilter) conditions.push(eq(colonies.status, statusFilter));
	if (districtFilter) conditions.push(eq(colonies.district, districtFilter));
	if (conditions.length > 0) query = query.where(and(...conditions));

	const allColonies = await query;

	const districts = await db.selectDistinct({ district: colonies.district }).from(colonies);

	return {
		locale: locals.locale,
		colonies: allColonies,
		districts: districts.map(d => d.district).filter(Boolean) as string[],
		filters: { search, status: statusFilter, district: districtFilter }
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const district = formData.get('district') as string;
		const classification = formData.get('classification') as string;
		const description = formData.get('description') as string;
		const latitude = parseFloat(formData.get('latitude') as string);
		const longitude = parseFloat(formData.get('longitude') as string);

		if (!name) return fail(400, { error: 'El nombre es obligatorio' });

		const [newColony] = await db.insert(colonies).values({
			name,
			district: district || null,
			classification: classification || null,
			description: description || null,
			latitude: isNaN(latitude) ? null : latitude,
			longitude: isNaN(longitude) ? null : longitude,
			status: 'active'
		}).returning({ id: colonies.id });

		return { success: true, colonyId: newColony.id };
	}
};

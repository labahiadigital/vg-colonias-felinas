import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { incidents, colonies, cats, users } from '$lib/server/db/schema.js';
import { eq, and, desc, ilike } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const statusFilter = url.searchParams.get('status') ?? '';
	const priorityFilter = url.searchParams.get('priority') ?? '';
	const search = url.searchParams.get('q') ?? '';

	let query = db.select({
		id: incidents.id,
		colonyId: incidents.colonyId,
		catId: incidents.catId,
		category: incidents.category,
		priority: incidents.priority,
		status: incidents.status,
		description: incidents.description,
		latitude: incidents.latitude,
		longitude: incidents.longitude,
		createdAt: incidents.createdAt,
		colonyName: colonies.name,
		reporterName: users.name
	})
		.from(incidents)
		.leftJoin(colonies, eq(incidents.colonyId, colonies.id))
		.leftJoin(users, eq(incidents.reportedBy, users.id))
		.orderBy(desc(incidents.createdAt))
		.$dynamic();

	const conditions = [];
	if (statusFilter) conditions.push(eq(incidents.status, statusFilter));
	if (priorityFilter) conditions.push(eq(incidents.priority, priorityFilter));
	if (search) conditions.push(ilike(incidents.description, `%${search}%`));
	if (conditions.length > 0) query = query.where(and(...conditions));

	const allIncidents = await query;
	const allColonies = await db.select({ id: colonies.id, name: colonies.name }).from(colonies);

	return {
		locale: locals.locale,
		incidents: allIncidents,
		colonies: allColonies,
		filters: { status: statusFilter, priority: priorityFilter, search }
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		const fd = await request.formData();

		const category = fd.get('category') as string;
		const priority = fd.get('priority') as string;
		const colonyId = fd.get('colonyId') as string;
		const description = fd.get('description') as string;
		const latitude = parseFloat(fd.get('latitude') as string);
		const longitude = parseFloat(fd.get('longitude') as string);

		if (!category || !description) return fail(400, { error: 'Categoría y descripción son obligatorios' });

		await db.insert(incidents).values({
			category,
			priority: priority || 'medium',
			colonyId: colonyId || null,
			description,
			latitude: isNaN(latitude) ? null : latitude,
			longitude: isNaN(longitude) ? null : longitude,
			reportedBy: locals.user.id,
			status: 'open'
		});

		return { success: true };
	},

	updateStatus: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		const fd = await request.formData();
		const id = fd.get('id') as string;
		const status = fd.get('status') as string;

		await db.update(incidents).set({ status, updatedAt: new Date() }).where(eq(incidents.id, id));
		return { updated: true };
	}
};

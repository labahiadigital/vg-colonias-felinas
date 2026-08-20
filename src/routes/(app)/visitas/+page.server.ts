import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { visits, colonies, users, collaborators, volunteerHours } from '$lib/server/db/schema.js';
import { eq, desc, and, sql, gte, lte } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { logAudit } from '$lib/server/audit.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const colonyFilter = url.searchParams.get('colony') ?? '';
	const typeFilter = url.searchParams.get('type') ?? '';
	const from = url.searchParams.get('from') ?? '';
	const to = url.searchParams.get('to') ?? '';

	const conditions = [];
	if (colonyFilter) conditions.push(eq(visits.colonyId, colonyFilter));
	if (typeFilter) conditions.push(eq(visits.type, typeFilter));
	if (from) conditions.push(gte(visits.visitedAt, new Date(from)));
	if (to) conditions.push(lte(visits.visitedAt, new Date(to)));

	const allVisits = await db
		.select({
			id: visits.id,
			colonyId: visits.colonyId,
			type: visits.type,
			latitude: visits.latitude,
			longitude: visits.longitude,
			durationMinutes: visits.durationMinutes,
			notes: visits.notes,
			catsObserved: visits.catsObserved,
			foodProvided: visits.foodProvided,
			waterProvided: visits.waterProvided,
			foodQuantityKg: visits.foodQuantityKg,
			foodType: visits.foodType,
			waterQuantityL: visits.waterQuantityL,
			feedingCostEur: visits.feedingCostEur,
			specialNeeds: visits.specialNeeds,
			incidentDetected: visits.incidentDetected,
			visitedAt: visits.visitedAt,
			colonyName: colonies.name,
			userName: users.name
		})
		.from(visits)
		.leftJoin(colonies, eq(visits.colonyId, colonies.id))
		.leftJoin(users, eq(visits.userId, users.id))
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(desc(visits.visitedAt))
		.limit(100);

	const allColonies = await db.select({ id: colonies.id, name: colonies.name }).from(colonies);

	const totalHoursResult = await db
		.select({ total: sql<number>`coalesce(sum(${volunteerHours.hours}), 0)` })
		.from(volunteerHours);
	const totalVolunteerHours = totalHoursResult[0]?.total ?? 0;

	const totalVisitsCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(visits);

	return {
		locale: locals.locale,
		visits: allVisits,
		colonies: allColonies,
		totalVolunteerHours,
		totalVisits: totalVisitsCount[0]?.count ?? 0,
		filters: { colony: colonyFilter, type: typeFilter, from, to }
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		const fd = await request.formData();

		const colonyId = fd.get('colonyId') as string;
		const type = fd.get('type') as string;
		const durationMinutes = parseInt(fd.get('durationMinutes') as string);
		const notes = fd.get('notes') as string;
		const catsObserved = parseInt(fd.get('catsObserved') as string);
		const latitude = parseFloat(fd.get('latitude') as string);
		const longitude = parseFloat(fd.get('longitude') as string);
		const foodProvided = fd.get('foodProvided') === 'on';
		const waterProvided = fd.get('waterProvided') === 'on';
		const incidentDetected = fd.get('incidentDetected') === 'on';
		const foodQuantityKg = parseFloat(fd.get('foodQuantityKg') as string);
		const foodType = fd.get('foodType') as string;
		const waterQuantityL = parseFloat(fd.get('waterQuantityL') as string);
		const feedingCostEur = parseFloat(fd.get('feedingCostEur') as string);
		const specialNeeds = fd.get('specialNeeds') as string;

		if (!colonyId) return fail(400, { error: 'La colonia es obligatoria' });

		const result = await db.insert(visits).values({
			colonyId,
			userId: locals.user.id,
			type: type || 'feeding',
			durationMinutes: isNaN(durationMinutes) ? null : durationMinutes,
			notes: notes || null,
			catsObserved: isNaN(catsObserved) ? null : catsObserved,
			latitude: isNaN(latitude) ? null : latitude,
			longitude: isNaN(longitude) ? null : longitude,
			foodProvided,
			waterProvided,
			foodQuantityKg: isNaN(foodQuantityKg) ? null : foodQuantityKg,
			foodType: foodType || null,
			waterQuantityL: isNaN(waterQuantityL) ? null : waterQuantityL,
			feedingCostEur: isNaN(feedingCostEur) ? null : feedingCostEur,
			specialNeeds: specialNeeds || null,
			incidentDetected
		}).returning();

		if (result[0] && !isNaN(durationMinutes) && durationMinutes > 0) {
			await db.insert(volunteerHours).values({
				userId: locals.user.id,
				colonyId,
				visitId: result[0].id,
				hours: durationMinutes / 60,
				activityType: type || 'feeding',
				date: new Date().toISOString().split('T')[0]
			});
		}

		if (result[0]) {
			await logAudit({
				userId: locals.user.id,
				entity: 'visit',
				entityId: result[0].id,
				action: 'create',
				details: { colonyId, type, durationMinutes }
			});
		}

		return { success: true };
	},

	edit: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		const fd = await request.formData();
		const id = fd.get('id') as string;
		const colonyId = fd.get('colonyId') as string;
		const type = fd.get('type') as string;
		const durationMinutes = parseInt(fd.get('durationMinutes') as string);
		const notes = fd.get('notes') as string;
		const catsObserved = parseInt(fd.get('catsObserved') as string);

		if (!id) return fail(400, { error: 'ID obligatorio' });

		await db.update(visits).set({
			...(colonyId && { colonyId }),
			...(type && { type }),
			durationMinutes: isNaN(durationMinutes) ? undefined : durationMinutes,
			notes: notes || null,
			catsObserved: isNaN(catsObserved) ? undefined : catsObserved
		}).where(eq(visits.id, id));

		await logAudit({ userId: locals.user.id, entity: 'visit', entityId: id, action: 'update', details: { colonyId, type } });
		return { edited: true };
	},

	delete: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		const fd = await request.formData();
		const id = fd.get('id') as string;
		if (!id) return fail(400, { error: 'ID obligatorio' });

		await db.delete(visits).where(eq(visits.id, id));
		await logAudit({ userId: locals.user.id, entity: 'visit', entityId: id, action: 'delete', details: {} });
		return { deleted: true };
	}
};

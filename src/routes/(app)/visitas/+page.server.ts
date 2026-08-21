import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { visits, colonies, users, volunteerHours } from '$lib/server/db/schema.js';
import { eq, desc, and, sql, gte, lte } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { requireAuthContext, getFormField, getFormInt, getFormNumber, getFormBool, requireField } from '$lib/server/action-helpers.js';
import { orgScope, verifyOrgOwnership, buildWhere, loadOrgColonies } from '$lib/server/tenant.js';
import { guardedUpdate, guardedDelete, guardedInsert } from '$lib/server/db-helpers.js';
import { parsePagination, paginateWithCount } from '$lib/server/pagination.js';
import { toDateString } from '$lib/index.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const orgId = locals.organizationId;
	const pagination = parsePagination(url);
	const colonyFilter = url.searchParams.get('colony') ?? '';
	const typeFilter = url.searchParams.get('type') ?? '';
	const from = url.searchParams.get('from') ?? '';
	const to = url.searchParams.get('to') ?? '';

	const whereClause = buildWhere(
		orgScope(visits.organizationId, orgId),
		colonyFilter && eq(visits.colonyId, colonyFilter),
		typeFilter && eq(visits.type, typeFilter),
		from && gte(visits.visitedAt, new Date(from)),
		to && lte(visits.visitedAt, new Date(to))
	);

	const baseSelect = db.select({
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
		.where(whereClause)
		.orderBy(desc(visits.visitedAt))
		.$dynamic();

	const [paginated, allColonies, totalHoursResult] = await Promise.all([
		paginateWithCount(baseSelect, visits, whereClause, pagination),
		loadOrgColonies(orgId),
		db.select({ total: sql<number>`coalesce(sum(${volunteerHours.hours}), 0)` }).from(volunteerHours).where(orgScope(volunteerHours.organizationId, orgId))
	]);

	return {
		locale: locals.locale,
		...paginated,
		colonies: allColonies,
		totalVolunteerHours: totalHoursResult[0]?.total ?? 0,
		totalVisits: paginated.totalItems,
		filters: { colony: colonyFilter, type: typeFilter, from, to }
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

		const type = getFormField(fd, 'type') || 'feeding';
		const durationMinutes = getFormInt(fd, 'durationMinutes');
		const notes = getFormField(fd, 'notes');
		const catsObserved = getFormInt(fd, 'catsObserved');
		const latitude = getFormNumber(fd, 'latitude');
		const longitude = getFormNumber(fd, 'longitude');
		const foodProvided = getFormBool(fd, 'foodProvided');
		const waterProvided = getFormBool(fd, 'waterProvided');
		const incidentDetected = getFormBool(fd, 'incidentDetected');
		const foodQuantityKg = getFormNumber(fd, 'foodQuantityKg');
		const foodType = getFormField(fd, 'foodType');
		const waterQuantityL = getFormNumber(fd, 'waterQuantityL');
		const feedingCostEur = getFormNumber(fd, 'feedingCostEur');
		const specialNeeds = getFormField(fd, 'specialNeeds');

		const visitId = await guardedInsert(visits, {
			organizationId: ctx.organizationId,
			colonyId,
			userId: ctx.userId,
			type,
			durationMinutes,
			notes: notes || null,
			catsObserved,
			latitude,
			longitude,
			foodProvided,
			waterProvided,
			foodQuantityKg,
			foodType: foodType || null,
			waterQuantityL,
			feedingCostEur,
			specialNeeds: specialNeeds || null,
			incidentDetected
		}, ctx, 'visit', 'create', { colonyId, type, durationMinutes });

		if (durationMinutes && durationMinutes > 0) {
			await db.insert(volunteerHours).values({
				organizationId: ctx.organizationId,
				userId: ctx.userId,
				colonyId,
				visitId,
				hours: durationMinutes / 60,
				activityType: type,
				date: toDateString()
			});
		}

		return { success: true };
	},

	edit: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const id = requireField(fd, 'id', 'El ID');

		const colonyId = getFormField(fd, 'colonyId');
		const type = getFormField(fd, 'type');
		const durationMinutes = getFormInt(fd, 'durationMinutes');
		const notes = getFormField(fd, 'notes');
		const catsObserved = getFormInt(fd, 'catsObserved');

		await guardedUpdate(visits, {
			...(colonyId && { colonyId }), ...(type && { type }),
			...(durationMinutes !== null && { durationMinutes }), notes: notes || null,
			...(catsObserved !== null && { catsObserved })
		}, and(eq(visits.id, id), orgScope(visits.organizationId, ctx.organizationId)),
			ctx, 'visit', id, 'update', { colonyId, type });
		return { edited: true };
	},

	delete: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const id = requireField(fd, 'id', 'El ID');

		await guardedDelete(visits, and(eq(visits.id, id), orgScope(visits.organizationId, ctx.organizationId)),
			ctx, 'visit', id, 'delete');
		return { deleted: true };
	}
};

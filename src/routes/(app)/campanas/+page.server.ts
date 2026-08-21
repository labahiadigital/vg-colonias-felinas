import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { trappingCampaigns, trappingEvents, colonies, equipment, users } from '$lib/server/db/schema.js';
import { eq, sql, desc, and, inArray } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { requireAuthContext, getFormField, requireFields } from '$lib/server/action-helpers.js';
import { orgScope, verifyOrgOwnership, loadOrgColonies } from '$lib/server/tenant.js';
import { guardedUpdate, guardedInsert } from '$lib/server/db-helpers.js';
import { parsePagination, paginateWithCount } from '$lib/server/pagination.js';
import { groupByKey } from '$lib/index.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const orgId = locals.organizationId;
	const pagination = parsePagination(url);
	const whereCamp = orgScope(trappingCampaigns.organizationId, orgId);

	const baseSelect = db.select({
		id: trappingCampaigns.id,
		name: trappingCampaigns.name,
		colonyId: trappingCampaigns.colonyId,
		colonyName: colonies.name,
		startDate: trappingCampaigns.startDate,
		endDate: trappingCampaigns.endDate,
		status: trappingCampaigns.status,
		notes: trappingCampaigns.notes,
		createdAt: trappingCampaigns.createdAt,
		eventCount: sql<number>`(SELECT count(*) FROM trapping_events WHERE trapping_events.campaign_id = ${trappingCampaigns.id})`
	})
		.from(trappingCampaigns)
		.leftJoin(colonies, eq(trappingCampaigns.colonyId, colonies.id))
		.where(whereCamp)
		.orderBy(desc(trappingCampaigns.createdAt))
		.$dynamic();

	const campaignIdsSubquery = db.select({ id: trappingCampaigns.id }).from(trappingCampaigns).where(whereCamp);

	const [paginated, allColonies, allEquipment, allEvents] = await Promise.all([
		paginateWithCount(baseSelect, trappingCampaigns, whereCamp, pagination),
		loadOrgColonies(orgId),
		db.select({ id: equipment.id, name: equipment.name, type: equipment.type }).from(equipment).where(orgScope(equipment.organizationId, orgId)),
		db.select({
			id: trappingEvents.id,
			campaignId: trappingEvents.campaignId,
			eventType: trappingEvents.eventType,
			notes: trappingEvents.notes,
			performedAt: trappingEvents.performedAt,
			performedByName: users.name
		})
			.from(trappingEvents)
			.leftJoin(users, eq(trappingEvents.performedBy, users.id))
			.where(inArray(trappingEvents.campaignId, campaignIdsSubquery))
			.orderBy(trappingEvents.performedAt)
	]);

	const eventsByCampaign = groupByKey(allEvents, ev => ev.campaignId);

	return {
		locale: locals.locale,
		...paginated,
		colonies: allColonies,
		equipment: allEquipment,
		eventsByCampaign
	};
};

export const actions = {
	create: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const { name, startDate } = requireFields(fd, {
			name: 'El nombre', startDate: 'La fecha de inicio'
		});

		const colonyId = getFormField(fd, 'colonyId');
		if (colonyId && !await verifyOrgOwnership(colonies, colonyId, ctx.organizationId)) {
			return fail(404, { error: 'Colonia no encontrada' });
		}

		const endDate = getFormField(fd, 'endDate');
		const notes = getFormField(fd, 'notes');

		await guardedInsert(trappingCampaigns, {
			organizationId: ctx.organizationId,
			name,
			colonyId: colonyId || null,
			startDate,
			endDate: endDate || null,
			status: 'planned',
			notes: notes || null,
			createdBy: ctx.userId
		}, ctx, 'trapping_campaign', 'create', { name, colonyId });

		return { success: true };
	},

	updateStatus: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const { id, status } = requireFields(fd, { id: 'El ID', status: 'El estado' });

		await guardedUpdate(trappingCampaigns, { status, updatedAt: new Date() },
			and(eq(trappingCampaigns.id, id), orgScope(trappingCampaigns.organizationId, ctx.organizationId)),
			ctx, 'trapping_campaign', id, 'change_status', { status });
		return { success: true };
	},

	addEvent: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const { campaignId, eventType } = requireFields(fd, {
			campaignId: 'La campaña', eventType: 'El tipo de evento'
		});

		const [campaign] = await db.select({ id: trappingCampaigns.id }).from(trappingCampaigns)
			.where(and(eq(trappingCampaigns.id, campaignId), orgScope(trappingCampaigns.organizationId, ctx.organizationId)))
			.limit(1);
		if (!campaign) return fail(404, { error: 'Campaña no encontrada' });

		const notes = getFormField(fd, 'notes');

		await guardedInsert(trappingEvents, {
			campaignId,
			eventType,
			notes: notes || null,
			performedBy: ctx.userId
		}, ctx, 'trapping_event', 'create', { campaignId, eventType });

		return { success: true };
	}
} satisfies Actions;

import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { trappingCampaigns, trappingEvents, colonies, equipment, users, auditLogs } from '$lib/server/db/schema.js';
import { eq, sql, desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const [campaigns, allColonies, allEquipment, allEvents] = await Promise.all([
		db.select({
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
			.orderBy(desc(trappingCampaigns.createdAt)),
		db.select({ id: colonies.id, name: colonies.name }).from(colonies),
		db.select({ id: equipment.id, name: equipment.name, type: equipment.type }).from(equipment).where(eq(equipment.status, 'available')),
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
			.orderBy(trappingEvents.performedAt)
	]);

	const eventsByCampaign: Record<string, typeof allEvents> = {};
	for (const ev of allEvents) {
		if (!eventsByCampaign[ev.campaignId]) eventsByCampaign[ev.campaignId] = [];
		eventsByCampaign[ev.campaignId].push(ev);
	}

	return {
		locale: locals.locale,
		campaigns,
		colonies: allColonies,
		equipment: allEquipment,
		eventsByCampaign
	};
};

export const actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const form = await request.formData();
		const name = form.get('name') as string;
		const colonyId = form.get('colonyId') as string;
		const startDate = form.get('startDate') as string;
		const endDate = form.get('endDate') as string;
		const notes = form.get('notes') as string;

		if (!name || !startDate) return fail(400, { error: 'Nombre y fecha de inicio son obligatorios' });

		await db.insert(trappingCampaigns).values({
			name,
			colonyId: colonyId || null,
			startDate,
			endDate: endDate || null,
			status: 'planned',
			notes: notes || null,
			createdBy: locals.user.id
		});

		await db.insert(auditLogs).values({
			userId: locals.user.id,
			entity: 'trapping_campaign',
			entityId: name,
			action: 'create',
			details: { name, colonyId }
		});

		return { success: true };
	},
	updateStatus: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const form = await request.formData();
		const id = form.get('id') as string;
		const status = form.get('status') as string;
		if (!id || !status) return fail(400);

		await db.update(trappingCampaigns).set({ status, updatedAt: new Date() }).where(eq(trappingCampaigns.id, id));
		return { success: true };
	},
	addEvent: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const form = await request.formData();
		const campaignId = form.get('campaignId') as string;
		const eventType = form.get('eventType') as string;
		const notes = form.get('notes') as string;

		if (!campaignId || !eventType) return fail(400);

		await db.insert(trappingEvents).values({
			campaignId,
			eventType,
			notes: notes || null,
			performedBy: locals.user.id
		});

		return { success: true };
	}
} satisfies Actions;

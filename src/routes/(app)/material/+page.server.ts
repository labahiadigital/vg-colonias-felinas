import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { equipment, equipmentHistory, users, auditLogs } from '$lib/server/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const [allEquipment, allHistory] = await Promise.all([
		db.select({
			id: equipment.id,
			name: equipment.name,
			type: equipment.type,
			serialNumber: equipment.serialNumber,
			status: equipment.status,
			loanedTo: equipment.loanedTo,
			loanedUserName: users.name,
			loanedAt: equipment.loanedAt,
			dueDate: equipment.dueDate,
			notes: equipment.notes,
			createdAt: equipment.createdAt
		})
			.from(equipment)
			.leftJoin(users, eq(equipment.loanedTo, users.id))
			.orderBy(desc(equipment.createdAt)),
		db.select({
			id: equipmentHistory.id,
			equipmentId: equipmentHistory.equipmentId,
			action: equipmentHistory.action,
			notes: equipmentHistory.notes,
			createdAt: equipmentHistory.createdAt,
			userName: users.name
		})
			.from(equipmentHistory)
			.leftJoin(users, eq(equipmentHistory.userId, users.id))
			.orderBy(desc(equipmentHistory.createdAt))
	]);

	const historyByEquipment: Record<string, typeof allHistory> = {};
	for (const h of allHistory) {
		if (!historyByEquipment[h.equipmentId]) historyByEquipment[h.equipmentId] = [];
		historyByEquipment[h.equipmentId].push(h);
	}

	return {
		locale: locals.locale,
		equipment: allEquipment,
		historyByEquipment
	};
};

export const actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const form = await request.formData();
		const name = form.get('name') as string;
		const type = form.get('type') as string;
		const serialNumber = form.get('serialNumber') as string;
		if (!name) return fail(400, { error: 'Nombre obligatorio' });

		await db.insert(equipment).values({
			name,
			type: type || 'trap',
			serialNumber: serialNumber || null,
			status: 'available'
		});

		await db.insert(auditLogs).values({
			userId: locals.user.id,
			entity: 'equipment',
			entityId: name,
			action: 'create',
			details: { name, type }
		});

		return { success: true };
	},
	updateStatus: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const form = await request.formData();
		const id = form.get('id') as string;
		const status = form.get('status') as string;
		if (!id || !status) return fail(400);

		const updates: Record<string, unknown> = { status, updatedAt: new Date() };
		if (status === 'available') {
			updates.loanedTo = null;
			updates.loanedAt = null;
			updates.dueDate = null;
		}

		await db.update(equipment).set(updates).where(eq(equipment.id, id));
		await db.insert(equipmentHistory).values({
			equipmentId: id,
			action: status === 'available' ? 'returned' : `status_${status}`,
			userId: locals.user.id
		});

		return { success: true };
	},
	loan: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const form = await request.formData();
		const id = form.get('id') as string;
		const dueDate = form.get('dueDate') as string;
		if (!id) return fail(400);

		await db.update(equipment).set({
			status: 'loaned',
			loanedTo: locals.user.id,
			loanedAt: new Date(),
			dueDate: dueDate ? new Date(dueDate) : null,
			updatedAt: new Date()
		}).where(eq(equipment.id, id));

		await db.insert(equipmentHistory).values({
			equipmentId: id,
			action: 'loaned',
			userId: locals.user.id,
			notes: dueDate ? `Devolución: ${dueDate}` : null
		});

		return { success: true };
	}
} satisfies Actions;

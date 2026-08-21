import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { equipment, equipmentHistory, users } from '$lib/server/db/schema.js';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { audit } from '$lib/server/audit.js';
import { guardedInsert } from '$lib/server/db-helpers.js';
import { requireAuthContext, getFormField, requireField, requireFields } from '$lib/server/action-helpers.js';
import { orgScope } from '$lib/server/tenant.js';
import { parsePagination, paginateWithCount } from '$lib/server/pagination.js';
import { groupByKey } from '$lib/index.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const orgId = locals.organizationId;
	const pagination = parsePagination(url);
	const whereEq = orgScope(equipment.organizationId, orgId);

	const baseSelect = db.select({
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
		.where(whereEq)
		.orderBy(desc(equipment.createdAt))
		.$dynamic();

	const equipmentIdsSubquery = db.select({ id: equipment.id }).from(equipment).where(whereEq);

	const [paginated, allHistory] = await Promise.all([
		paginateWithCount(baseSelect, equipment, whereEq, pagination),
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
			.where(inArray(equipmentHistory.equipmentId, equipmentIdsSubquery))
			.orderBy(desc(equipmentHistory.createdAt))
	]);

	const historyByEquipment = groupByKey(allHistory, h => h.equipmentId);

	return {
		locale: locals.locale,
		...paginated,
		historyByEquipment
	};
};

export const actions = {
	create: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const name = requireField(fd, 'name', 'El nombre');

		const type = getFormField(fd, 'type') || 'trap';
		const serialNumber = getFormField(fd, 'serialNumber');

		await guardedInsert(equipment, {
			organizationId: ctx.organizationId,
			name,
			type,
			serialNumber: serialNumber || null,
			status: 'available'
		}, ctx, 'equipment', 'create', { name, type });

		return { success: true };
	},

	updateStatus: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const { id, status } = requireFields(fd, { id: 'El ID', status: 'El estado' });

		const ownerWhere = and(eq(equipment.id, id), orgScope(equipment.organizationId, ctx.organizationId));
		const [item] = await db.select({ id: equipment.id }).from(equipment).where(ownerWhere).limit(1);
		if (!item) return fail(404, { error: 'Equipo no encontrado' });

		const updates: Record<string, unknown> = { status, updatedAt: new Date() };
		if (status === 'available') {
			updates.loanedTo = null;
			updates.loanedAt = null;
			updates.dueDate = null;
		}

		const changed = await db.transaction(async (tx) => {
			const rows = await tx.update(equipment).set(updates).where(ownerWhere).returning({ id: equipment.id });
			if (rows.length > 0) {
				await tx.insert(equipmentHistory).values({
					equipmentId: id,
					action: status === 'available' ? 'returned' : `status_${status}`,
					userId: ctx.userId
				});
			}
			return rows;
		});
		if (changed.length > 0) await audit(ctx, 'equipment', id, 'change_status', { status });
		return { success: true };
	},

	loan: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const id = requireField(fd, 'id', 'El ID');

		const ownerWhere = and(eq(equipment.id, id), orgScope(equipment.organizationId, ctx.organizationId));
		const [item] = await db.select({ id: equipment.id }).from(equipment).where(ownerWhere).limit(1);
		if (!item) return fail(404, { error: 'Equipo no encontrado' });

		const dueDate = getFormField(fd, 'dueDate');

		const loaned = await db.transaction(async (tx) => {
			const rows = await tx.update(equipment).set({
				status: 'loaned',
				loanedTo: ctx.userId,
				loanedAt: new Date(),
				dueDate: dueDate ? new Date(dueDate) : null,
				updatedAt: new Date()
			}).where(ownerWhere).returning({ id: equipment.id });

			if (rows.length > 0) {
				await tx.insert(equipmentHistory).values({
					equipmentId: id,
					action: 'loaned',
					userId: ctx.userId,
					notes: dueDate ? `Devolución: ${dueDate}` : null
				});
			}
			return rows;
		});
		if (loaned.length > 0) await audit(ctx, 'equipment', id, 'loan', { dueDate });
		return { success: true };
	}
} satisfies Actions;

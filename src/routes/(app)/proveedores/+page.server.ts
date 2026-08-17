import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { providers, providerInterventions, cats, colonies } from '$lib/server/db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { logAudit } from '$lib/server/audit.js';

export const load: PageServerLoad = async ({ locals }) => {
	const allProviders = await db
		.select({
			id: providers.id,
			name: providers.name,
			type: providers.type,
			contactPerson: providers.contactPerson,
			email: providers.email,
			phone: providers.phone,
			address: providers.address,
			city: providers.city,
			specializations: providers.specializations,
			licenseNumber: providers.licenseNumber,
			contractStart: providers.contractStart,
			contractEnd: providers.contractEnd,
			status: providers.status,
			createdAt: providers.createdAt
		})
		.from(providers)
		.orderBy(desc(providers.createdAt));

	const interventionCounts = await db
		.select({
			providerId: providerInterventions.providerId,
			count: sql<number>`count(*)`,
			totalCost: sql<number>`coalesce(sum(${providerInterventions.cost}), 0)`
		})
		.from(providerInterventions)
		.groupBy(providerInterventions.providerId);

	const countsMap = new Map(interventionCounts.map(c => [c.providerId, { count: c.count, totalCost: c.totalCost }]));

	const providersWithStats = allProviders.map(p => ({
		...p,
		interventionCount: countsMap.get(p.id)?.count ?? 0,
		totalCost: countsMap.get(p.id)?.totalCost ?? 0
	}));

	const allColonies = await db.select({ id: colonies.id, name: colonies.name }).from(colonies);
	const allCats = await db.select({ id: cats.id, name: cats.name }).from(cats);

	return {
		locale: locals.locale,
		providers: providersWithStats,
		colonies: allColonies,
		cats: allCats
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		const fd = await request.formData();

		const name = fd.get('name') as string;
		const type = fd.get('type') as string;
		const contactPerson = fd.get('contactPerson') as string;
		const email = fd.get('email') as string;
		const phone = fd.get('phone') as string;
		const address = fd.get('address') as string;
		const city = fd.get('city') as string;
		const licenseNumber = fd.get('licenseNumber') as string;
		const contractStart = fd.get('contractStart') as string;
		const contractEnd = fd.get('contractEnd') as string;

		if (!name) return fail(400, { error: 'El nombre es obligatorio' });

		const result = await db.insert(providers).values({
			name,
			type: type || 'veterinary',
			contactPerson: contactPerson || null,
			email: email || null,
			phone: phone || null,
			address: address || null,
			city: city || null,
			licenseNumber: licenseNumber || null,
			contractStart: contractStart || null,
			contractEnd: contractEnd || null,
			status: 'active'
		}).returning();

		if (result[0]) {
			await logAudit({ userId: locals.user.id, entity: 'provider', entityId: result[0].id, action: 'create', details: { name, type } });
		}
		return { success: true };
	},

	addIntervention: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		const fd = await request.formData();

		const providerId = fd.get('providerId') as string;
		const catId = fd.get('catId') as string;
		const colonyId = fd.get('colonyId') as string;
		const type = fd.get('interventionType') as string;
		const description = fd.get('description') as string;
		const cost = parseFloat(fd.get('cost') as string);
		const performedAt = fd.get('performedAt') as string;
		const invoiceRef = fd.get('invoiceRef') as string;

		if (!providerId || !type) return fail(400, { error: 'Proveedor y tipo son obligatorios' });

		await db.insert(providerInterventions).values({
			providerId,
			catId: catId || null,
			colonyId: colonyId || null,
			type,
			description: description || null,
			cost: isNaN(cost) ? null : cost,
			performedAt: performedAt ? new Date(performedAt) : new Date(),
			invoiceRef: invoiceRef || null
		});

		await logAudit({ userId: locals.user.id, entity: 'provider_intervention', entityId: providerId, action: 'create', details: { type, cost } });
		return { interventionSuccess: true };
	},

	edit: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		const fd = await request.formData();
		const id = fd.get('id') as string;
		const name = fd.get('name') as string;
		const contactPerson = fd.get('contactPerson') as string;
		const phone = fd.get('phone') as string;
		const email = fd.get('email') as string;

		if (!id) return fail(400, { error: 'ID obligatorio' });

		await db.update(providers).set({
			...(name && { name }),
			contactPerson: contactPerson || null,
			phone: phone || null,
			email: email || null
		}).where(eq(providers.id, id));

		await logAudit({ userId: locals.user.id, entity: 'provider', entityId: id, action: 'update', details: { name } });
		return { edited: true };
	},

	delete: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		const fd = await request.formData();
		const id = fd.get('id') as string;
		if (!id) return fail(400, { error: 'ID obligatorio' });

		await db.delete(providers).where(eq(providers.id, id));
		await logAudit({ userId: locals.user.id, entity: 'provider', entityId: id, action: 'delete', details: {} });
		return { deleted: true };
	}
};

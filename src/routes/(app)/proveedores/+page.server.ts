import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { providers, providerInterventions, cats, colonies } from '$lib/server/db/schema.js';
import { eq, desc, sql, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { requireAuthContext, getFormField, getFormNumber, requireField, requireFields } from '$lib/server/action-helpers.js';
import { orgScope, verifyOrgOwnership, loadOrgColonies, loadOrgCats } from '$lib/server/tenant.js';
import { guardedUpdate, guardedDelete, guardedInsert } from '$lib/server/db-helpers.js';
import { parsePagination, paginateWithCount } from '$lib/server/pagination.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const orgId = locals.organizationId;
	const pagination = parsePagination(url);
	const whereProv = orgScope(providers.organizationId, orgId);

	const baseSelect = db.select({
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
	}).from(providers).where(whereProv).orderBy(desc(providers.createdAt)).$dynamic();

	const [paginated, interventionCounts, allColonies, allCats] = await Promise.all([
		paginateWithCount(baseSelect, providers, whereProv, pagination),
		db.select({
			providerId: providerInterventions.providerId,
			count: sql<number>`count(*)`,
			totalCost: sql<number>`coalesce(sum(${providerInterventions.cost}), 0)`
		}).from(providerInterventions).where(orgScope(providerInterventions.organizationId, orgId)).groupBy(providerInterventions.providerId),
		loadOrgColonies(orgId),
		loadOrgCats(orgId)
	]);

	const countsMap = new Map(interventionCounts.map(c => [c.providerId, { count: c.count, totalCost: c.totalCost }]));
	const items = paginated.items.map(p => ({
		...p,
		interventionCount: countsMap.get(p.id)?.count ?? 0,
		totalCost: countsMap.get(p.id)?.totalCost ?? 0
	}));

	return {
		locale: locals.locale,
		...paginated,
		items,
		colonies: allColonies,
		cats: allCats
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();

		const name = requireField(fd, 'name', 'El nombre');

		const type = getFormField(fd, 'type') || 'veterinary';
		const contactPerson = getFormField(fd, 'contactPerson');
		const email = getFormField(fd, 'email');
		const phone = getFormField(fd, 'phone');
		const address = getFormField(fd, 'address');
		const city = getFormField(fd, 'city');
		const licenseNumber = getFormField(fd, 'licenseNumber');
		const contractStart = getFormField(fd, 'contractStart');
		const contractEnd = getFormField(fd, 'contractEnd');

		await guardedInsert(providers, {
			organizationId: ctx.organizationId,
			name,
			type,
			contactPerson: contactPerson || null,
			email: email || null,
			phone: phone || null,
			address: address || null,
			city: city || null,
			licenseNumber: licenseNumber || null,
			contractStart: contractStart || null,
			contractEnd: contractEnd || null,
			status: 'active'
		}, ctx, 'provider', 'create', { name, type });

		return { success: true };
	},

	addIntervention: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();

		const { providerId, interventionType: type } = requireFields(fd, {
			providerId: 'El proveedor', interventionType: 'El tipo'
		});

		if (!await verifyOrgOwnership(providers, providerId, ctx.organizationId)) {
			return fail(404, { error: 'Proveedor no encontrado' });
		}

		const catId = getFormField(fd, 'catId');
		const colonyId = getFormField(fd, 'colonyId');

		if (catId && !await verifyOrgOwnership(cats, catId, ctx.organizationId)) {
			return fail(404, { error: 'Gato no encontrado' });
		}
		if (colonyId && !await verifyOrgOwnership(colonies, colonyId, ctx.organizationId)) {
			return fail(404, { error: 'Colonia no encontrada' });
		}

		const description = getFormField(fd, 'description');
		const cost = getFormNumber(fd, 'cost');
		const performedAt = getFormField(fd, 'performedAt');
		const invoiceRef = getFormField(fd, 'invoiceRef');

		await guardedInsert(providerInterventions, {
			organizationId: ctx.organizationId,
			providerId,
			catId: catId || null,
			colonyId: colonyId || null,
			type,
			description: description || null,
			cost,
			performedAt: performedAt ? new Date(performedAt) : new Date(),
			invoiceRef: invoiceRef || null
		}, ctx, 'provider_intervention', 'create', { providerId, type, cost });

		return { interventionSuccess: true };
	},

	edit: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const id = requireField(fd, 'id', 'El ID');

		const name = getFormField(fd, 'name');
		const contactPerson = getFormField(fd, 'contactPerson');
		const phone = getFormField(fd, 'phone');
		const email = getFormField(fd, 'email');

		await guardedUpdate(providers, {
			...(name && { name }), contactPerson: contactPerson || null,
			phone: phone || null, email: email || null
		}, and(eq(providers.id, id), orgScope(providers.organizationId, ctx.organizationId)),
			ctx, 'provider', id, 'update', { name });
		return { edited: true };
	},

	delete: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const id = requireField(fd, 'id', 'El ID');

		await guardedDelete(providers, and(eq(providers.id, id), orgScope(providers.organizationId, ctx.organizationId)),
			ctx, 'provider', id, 'delete');
		return { deleted: true };
	}
};

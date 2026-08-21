import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { adoptions, cats, colonies } from '$lib/server/db/schema.js';
import { desc, eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { notify } from '$lib/server/notifications.js';
import { audit } from '$lib/server/audit.js';
import { requireAuthContext, getFormField, getFormBool, requireField, requireFields } from '$lib/server/action-helpers.js';
import { orgScope, verifyOrgOwnership } from '$lib/server/tenant.js';
import { guardedUpdate, guardedDelete, guardedInsert } from '$lib/server/db-helpers.js';
import { parsePagination, paginateWithCount } from '$lib/server/pagination.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const orgId = locals.organizationId;
	const pagination = parsePagination(url);

	const whereAdoptions = orgScope(adoptions.organizationId, orgId);

	const baseSelect = db.select({
		id: adoptions.id,
		catId: adoptions.catId,
		catName: cats.name,
		colonyName: colonies.name,
		adopterInfo: adoptions.adopterInfo,
		consent: adoptions.consent,
		status: adoptions.status,
		adoptedAt: adoptions.adoptedAt,
		documents: adoptions.documents,
		createdAt: adoptions.createdAt
	})
		.from(adoptions)
		.leftJoin(cats, eq(adoptions.catId, cats.id))
		.leftJoin(colonies, eq(cats.colonyId, colonies.id))
		.where(whereAdoptions)
		.orderBy(desc(adoptions.createdAt))
		.$dynamic();

	const [paginated, availableCats] = await Promise.all([
		paginateWithCount(baseSelect, adoptions, whereAdoptions, pagination),
		db.select({ id: cats.id, name: cats.name, colonyName: colonies.name })
			.from(cats)
			.leftJoin(colonies, eq(cats.colonyId, colonies.id))
			.where(and(eq(cats.status, 'in_colony'), orgScope(cats.organizationId, orgId)))
			.orderBy(cats.name)
	]);

	return {
		locale: locals.locale,
		...paginated,
		availableCats
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();

		const { catId, adopterName } = requireFields(fd, {
			catId: 'El gato', adopterName: 'El nombre del adoptante'
		});

		if (!await verifyOrgOwnership(cats, catId, ctx.organizationId)) {
			return fail(404, { error: 'Gato no encontrado' });
		}

		const adopterPhone = getFormField(fd, 'adopterPhone');
		const adopterEmail = getFormField(fd, 'adopterEmail');
		const adopterAddress = getFormField(fd, 'adopterAddress');
		const adopterDocument = getFormField(fd, 'adopterDocument');
		const consentSigned = getFormBool(fd, 'consentSigned');

		await guardedInsert(adoptions, {
			organizationId: ctx.organizationId,
			catId,
			adopterInfo: {
				name: adopterName,
				phone: adopterPhone || null,
				email: adopterEmail || null,
				address: adopterAddress || null,
				document: adopterDocument || null
			},
			consent: { signed: consentSigned, signedAt: consentSigned ? new Date().toISOString() : null },
			status: 'pending'
		}, ctx, 'adoption', 'create', { catId, adopterName });

		return { success: true };
	},

	updateStatus: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const { id, status } = requireFields(fd, { id: 'El ID', status: 'El estado' });

		const updates: Record<string, unknown> = { status };
		if (status === 'completed') updates.adoptedAt = new Date();

		const changed = await db.transaction(async (tx) => {
			const rows = await tx.update(adoptions).set(updates).where(and(eq(adoptions.id, id), orgScope(adoptions.organizationId, ctx.organizationId))).returning({ id: adoptions.id, catId: adoptions.catId });

			const firstRow = rows[0];
			if (firstRow && status === 'completed') {
				await tx.update(cats).set({ status: 'adopted' }).where(and(eq(cats.id, firstRow.catId), orgScope(cats.organizationId, ctx.organizationId)));
			}

			return rows;
		});

		if (changed.length > 0) {
			await audit(ctx, 'adoption', id, 'update_status', { status });
			const statusLabels: Record<string, string> = { pending: 'Pendiente', approved: 'Aprobada', completed: 'Completada', rejected: 'Rechazada' };
			await notify({ organizationId: ctx.organizationId, type: 'adoption_status', title: 'Adopción actualizada', message: `Una adopción ha cambiado a estado: ${statusLabels[status] || status}`, payload: { adoptionId: id, status } });
		}

		return { success: true };
	},

	edit: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const id = requireField(fd, 'id', 'El ID');

		const adopterName = getFormField(fd, 'adopterName');
		const adopterPhone = getFormField(fd, 'adopterPhone');
		const adopterEmail = getFormField(fd, 'adopterEmail');

		const tenantWhere = and(eq(adoptions.id, id), orgScope(adoptions.organizationId, ctx.organizationId));
		const [current] = await db.select().from(adoptions).where(tenantWhere);
		if (!current) return fail(404, { error: 'No encontrado' });

		const adopterInfo: Record<string, unknown> = (typeof current.adopterInfo === 'object' && current.adopterInfo !== null)
			? { ...current.adopterInfo as object }
			: {};
		if (adopterName) adopterInfo.name = adopterName;
		adopterInfo.phone = adopterPhone || null;
		adopterInfo.email = adopterEmail || null;

		await guardedUpdate(adoptions, { adopterInfo }, tenantWhere,
			ctx, 'adoption', id, 'update', { adopterName });
		return { edited: true };
	},

	delete: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const id = requireField(fd, 'id', 'El ID');

		await guardedDelete(adoptions, and(eq(adoptions.id, id), orgScope(adoptions.organizationId, ctx.organizationId)),
			ctx, 'adoption', id, 'delete');
		return { deleted: true };
	}
};

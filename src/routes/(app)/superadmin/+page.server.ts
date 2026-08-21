import type { PageServerLoad, Actions } from './$types.js';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { organizations } from '$lib/server/db/schema.js';
import { eq, sql, desc } from 'drizzle-orm';
import { guardedUpdate } from '$lib/server/db-helpers.js';
import { getTenantContext } from '$lib/server/tenant.js';
import { requireSuperadmin, requireField } from '$lib/server/action-helpers.js';

export const load: PageServerLoad = async ({ locals }) => {
	requireSuperadmin(locals);

	const [orgs, [globalCounts]] = await Promise.all([
		db
			.select({
				id: organizations.id,
				name: organizations.name,
				slug: organizations.slug,
				country: organizations.country,
				plan: organizations.plan,
				isActive: organizations.isActive,
				currency: organizations.currency,
				createdAt: organizations.createdAt,
				memberCount: sql<number>`(select count(*) from organization_members where organization_members.organization_id = organizations.id)`,
				colonyCount: sql<number>`(select count(*) from colonies where colonies.organization_id = organizations.id)`,
				catCount: sql<number>`(select count(*) from cats where cats.organization_id = organizations.id)`
			})
			.from(organizations)
			.orderBy(desc(organizations.createdAt)),
		db.select({
			users: sql<number>`(select count(*) from users)`,
			organizations: sql<number>`(select count(*) from organizations)`,
			colonies: sql<number>`(select count(*) from colonies)`,
			cats: sql<number>`(select count(*) from cats)`
		}).from(sql`(select 1) as _dummy`)
	]);

	return {
		locale: locals.locale,
		organizations: orgs,
		globalStats: {
			users: Number(globalCounts?.users ?? 0),
			organizations: Number(globalCounts?.organizations ?? 0),
			colonies: Number(globalCounts?.colonies ?? 0),
			cats: Number(globalCounts?.cats ?? 0)
		}
	};
};

export const actions: Actions = {
	toggleOrg: async ({ request, locals }) => {
		requireSuperadmin(locals);

		const data = await request.formData();
		const orgId = requireField(data, 'orgId', 'La organización');
		const isActive = data.get('isActive') === 'true';

		const baseCtx = getTenantContext(locals, request);
		const ctx = { ...baseCtx, organizationId: orgId };
		await guardedUpdate(organizations, { isActive: !isActive }, eq(organizations.id, orgId),
			ctx, 'organization', orgId, isActive ? 'deactivate' : 'activate', { previousState: isActive });

		return { success: true };
	},

	updatePlan: async ({ request, locals }) => {
		requireSuperadmin(locals);

		const data = await request.formData();
		const orgId = requireField(data, 'orgId', 'La organización');
		const plan = requireField(data, 'plan', 'El plan');

		const VALID_PLANS = ['free', 'standard', 'professional', 'enterprise'] as const;
		if (!(VALID_PLANS as readonly string[]).includes(plan)) {
			return fail(400, { error: 'Plan no válido' });
		}

		const MAX_USERS_BY_PLAN: Record<string, number> = { free: 5, standard: 50, professional: 200, enterprise: 999 };

		const baseCtx = getTenantContext(locals, request);
		const ctx = { ...baseCtx, organizationId: orgId };
		await guardedUpdate(organizations, { plan, maxUsers: MAX_USERS_BY_PLAN[plan] ?? 50, updatedAt: new Date() },
			eq(organizations.id, orgId), ctx, 'organization', orgId, 'update_plan', { plan, maxUsers: MAX_USERS_BY_PLAN[plan] });

		return { success: true };
	}
};

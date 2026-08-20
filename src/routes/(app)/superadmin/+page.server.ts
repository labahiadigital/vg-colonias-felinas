import type { PageServerLoad, Actions } from './$types.js';
import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { organizations, users, colonies, cats, organizationMembers } from '$lib/server/db/schema.js';
import { eq, sql, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/login');
	if (locals.user.role !== 'superadmin') redirect(302, '/dashboard');

	const orgs = await db
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
		.orderBy(desc(organizations.createdAt));

	const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
	const [totalOrgs] = await db.select({ count: sql<number>`count(*)` }).from(organizations);
	const [totalColonies] = await db.select({ count: sql<number>`count(*)` }).from(colonies);
	const [totalCats] = await db.select({ count: sql<number>`count(*)` }).from(cats);

	return {
		locale: locals.locale,
		organizations: orgs,
		globalStats: {
			users: Number(totalUsers?.count ?? 0),
			organizations: Number(totalOrgs?.count ?? 0),
			colonies: Number(totalColonies?.count ?? 0),
			cats: Number(totalCats?.count ?? 0)
		}
	};
};

export const actions: Actions = {
	toggleOrg: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'superadmin') return fail(403);

		const data = await request.formData();
		const orgId = data.get('orgId') as string;
		const isActive = data.get('isActive') === 'true';

		await db.update(organizations).set({ isActive: !isActive }).where(eq(organizations.id, orgId));
		return { success: true };
	},

	updatePlan: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'superadmin') return fail(403);

		const data = await request.formData();
		const orgId = data.get('orgId') as string;
		const plan = data.get('plan') as string;

		if (!['free', 'standard', 'professional', 'enterprise'].includes(plan)) {
			return fail(400, { error: 'Plan no válido' });
		}

		const maxUsersMap: Record<string, number> = {
			free: 5,
			standard: 50,
			professional: 200,
			enterprise: 999
		};

		await db.update(organizations).set({
			plan,
			maxUsers: maxUsersMap[plan] ?? 50,
			updatedAt: new Date()
		}).where(eq(organizations.id, orgId));

		return { success: true };
	}
};

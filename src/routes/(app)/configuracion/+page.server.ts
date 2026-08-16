import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { users, userRoles, roles } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return { locale: locals.locale, user: null, userRole: null };

	const roleRows = await db.select({ roleName: roles.name })
		.from(userRoles)
		.innerJoin(roles, eq(userRoles.roleId, roles.id))
		.where(eq(userRoles.userId, locals.user.id));

	return {
		locale: locals.locale,
		user: locals.user,
		userRole: roleRows[0]?.roleName ?? null
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		const fd = await request.formData();
		const name = fd.get('name') as string;
		const language = fd.get('language') as string;

		if (!name) return fail(400, { error: 'El nombre es obligatorio' });

		await db.update(users).set({
			name,
			language: language || 'es',
			updatedAt: new Date()
		}).where(eq(users.id, locals.user.id));

		return { success: true };
	}
};

import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { organizations, organizationMembers, users, roles, userRoles } from '$lib/server/db/schema.js';
import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth/index.js';
import { eq } from 'drizzle-orm';
import { logAudit } from '$lib/server/audit.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(302, '/dashboard');
	return { locale: locals.locale };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const fd = await request.formData();
		const orgName = fd.get('orgName') as string;
		const orgSlug = fd.get('orgSlug') as string;
		const orgType = fd.get('orgType') as string;
		const city = fd.get('city') as string;
		const province = fd.get('province') as string;
		const adminName = fd.get('adminName') as string;
		const adminEmail = fd.get('adminEmail') as string;
		const adminPassword = fd.get('adminPassword') as string;

		if (!orgName || !orgSlug || !adminName || !adminEmail || !adminPassword) {
			return fail(400, { error: 'Todos los campos marcados son obligatorios' });
		}

		if (adminPassword.length < 8) {
			return fail(400, { error: 'La contraseña debe tener al menos 8 caracteres' });
		}

		const existing = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.slug, orgSlug));
		if (existing.length > 0) {
			return fail(400, { error: 'Ya existe una organización con ese identificador' });
		}

		const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, adminEmail));
		if (existingUser.length > 0) {
			return fail(400, { error: 'Ya existe un usuario con ese email' });
		}

		const [org] = await db.insert(organizations).values({
			name: orgName,
			slug: orgSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
			type: orgType || 'municipality',
			city: city || null,
			province: province || null,
			plan: 'standard'
		}).returning();

		await auth.api.signUpEmail({
			body: { name: adminName, email: adminEmail, password: adminPassword }
		});

		const [newUser] = await db.select().from(users).where(eq(users.email, adminEmail));
		if (!newUser) return fail(500, { error: 'Error creando el usuario administrador' });

		await db.update(users).set({ activeOrganizationId: org.id }).where(eq(users.id, newUser.id));

		await db.insert(organizationMembers).values({
			organizationId: org.id,
			userId: newUser.id,
			role: 'owner'
		});

		let adminRole = await db.select().from(roles).where(eq(roles.name, 'admin')).limit(1);
		if (adminRole.length === 0) {
			const [newRole] = await db.insert(roles).values({ name: 'admin', description: 'Administrador', organizationId: org.id }).returning();
			adminRole = [newRole];
		}

		await db.insert(userRoles).values({
			userId: newUser.id,
			roleId: adminRole[0].id,
			organizationId: org.id
		});

		await logAudit({
			userId: newUser.id,
			entity: 'organization',
			entityId: org.id,
			action: 'create',
			details: { orgName, orgSlug, plan: 'standard' }
		});

		throw redirect(302, '/login?registered=true');
	}
};

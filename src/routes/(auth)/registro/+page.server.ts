import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { organizations, organizationMembers, users, roles, userRoles } from '$lib/server/db/schema.js';
import { fail, redirect } from '@sveltejs/kit';
import { auth, MIN_PASSWORD_LENGTH } from '$lib/server/auth/index.js';
import { eq } from 'drizzle-orm';
import { audit } from '$lib/server/audit.js';
import { extractIp, type TenantContext } from '$lib/server/tenant.js';
import { requireFields, getFormField } from '$lib/server/action-helpers.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(302, '/dashboard');
	return { locale: locals.locale };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const fd = await request.formData();
		const { orgName, orgSlug, adminName, adminEmail, adminPassword } = requireFields(fd, {
			orgName: 'Nombre de organización',
			orgSlug: 'Identificador de organización',
			adminName: 'Nombre del administrador',
			adminEmail: 'Email del administrador',
			adminPassword: 'Contraseña'
		});
		const orgType = getFormField(fd, 'orgType');
		const city = getFormField(fd, 'city');
		const province = getFormField(fd, 'province');

		if (adminPassword.length < MIN_PASSWORD_LENGTH) {
			return fail(400, { error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` });
		}

		const existing = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.slug, orgSlug));
		if (existing.length > 0) {
			return fail(400, { error: 'Ya existe una organización con ese identificador' });
		}

		const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, adminEmail));
		if (existingUser.length > 0) {
			return fail(400, { error: 'Ya existe un usuario con ese email' });
		}

		await auth.api.signUpEmail({
			body: { name: adminName, email: adminEmail, password: adminPassword }
		});

		const [newUser] = await db.select().from(users).where(eq(users.email, adminEmail));
		if (!newUser) return fail(500, { error: 'Error creando el usuario administrador' });

		const { org } = await db.transaction(async (tx) => {
			const txOrgRows = await tx.insert(organizations).values({
				name: orgName,
				slug: orgSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
				type: orgType || 'municipality',
				city: city || null,
				province: province || null,
				plan: 'standard'
			}).returning();
			const txOrg = txOrgRows[0];
			if (!txOrg) throw new Error('Failed to create organization');

			await tx.update(users).set({ activeOrganizationId: txOrg.id }).where(eq(users.id, newUser.id));

			await tx.insert(organizationMembers).values({
				organizationId: txOrg.id,
				userId: newUser.id,
				role: 'owner'
			});

			const roleRows = await tx.insert(roles).values({ name: 'admin', description: 'Administrador', organizationId: txOrg.id }).returning();
			const newRole = roleRows[0];
			if (!newRole) throw new Error('Failed to create admin role');

			await tx.insert(userRoles).values({
				userId: newUser.id,
				roleId: newRole.id,
				organizationId: txOrg.id
			});

			return { org: txOrg, roleId: newRole.id };
		});

		const ctx: TenantContext = {
			userId: newUser.id,
			organizationId: org.id,
			ipAddress: extractIp(request)
		};

		await audit(ctx, 'organization', org.id, 'create', { orgName, orgSlug, plan: 'standard' });

		throw redirect(302, '/login?registered=true');
	}
};

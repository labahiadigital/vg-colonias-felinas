import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { users, userRoles, roles, permissions, rolePermissions, catalogs, auditLogs, inspectionTemplates, certificateTemplates, emailTemplates, dataRetentionPolicies } from '$lib/server/db/schema.js';
import { eq, desc, asc } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { hasPermission } from '$lib/server/rbac.js';
import { logAudit } from '$lib/server/audit.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');

	const roleRows = await db.select({ roleName: roles.name })
		.from(userRoles)
		.innerJoin(roles, eq(userRoles.roleId, roles.id))
		.where(eq(userRoles.userId, locals.user.id));

	const currentRole = roleRows[0]?.roleName ?? null;
	const isAdmin = currentRole === 'admin';

	let allUsers: Array<{ id: string; name: string; email: string; createdAt: Date | null; roleName: string | null }> = [];
	let allRoles: Array<{ id: number; name: string; description: string | null }> = [];
	let allPermissions: Array<{ id: number; module: string; action: string }> = [];
	let allRolePermissions: Array<{ roleId: number; permissionId: number }> = [];
	let allCatalogs: Array<{ id: string; type: string; key: string; label: string; labelEu: string | null; sortOrder: number | null; isActive: boolean | null }> = [];

	if (isAdmin) {
		const usersWithRoles = await db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				createdAt: users.createdAt,
				roleName: roles.name
			})
			.from(users)
			.leftJoin(userRoles, eq(users.id, userRoles.userId))
			.leftJoin(roles, eq(userRoles.roleId, roles.id))
			.orderBy(asc(users.name));
		allUsers = usersWithRoles;

		allRoles = await db.select().from(roles).orderBy(asc(roles.name));
		allPermissions = await db.select().from(permissions).orderBy(asc(permissions.module), asc(permissions.action));
		allRolePermissions = await db.select().from(rolePermissions);
		allCatalogs = await db.select().from(catalogs).orderBy(asc(catalogs.type), asc(catalogs.sortOrder));
	}

	const allInspectionTemplates = isAdmin
		? await db.select().from(inspectionTemplates).orderBy(asc(inspectionTemplates.name))
		: [];
	const allCertificateTemplates = isAdmin
		? await db.select().from(certificateTemplates).orderBy(asc(certificateTemplates.type))
		: [];
	const allEmailTemplates = isAdmin
		? await db.select().from(emailTemplates).orderBy(asc(emailTemplates.key))
		: [];
	const allRetentionPolicies = isAdmin
		? await db.select().from(dataRetentionPolicies).orderBy(asc(dataRetentionPolicies.entity))
		: [];

	const recentAudit = await db
		.select({
			id: auditLogs.id,
			entity: auditLogs.entity,
			action: auditLogs.action,
			details: auditLogs.details,
			createdAt: auditLogs.createdAt,
			userName: users.name
		})
		.from(auditLogs)
		.leftJoin(users, eq(auditLogs.userId, users.id))
		.orderBy(desc(auditLogs.createdAt))
		.limit(20);

	return {
		locale: locals.locale,
		user: locals.user,
		userRole: currentRole,
		isAdmin,
		allUsers,
		allRoles,
		allPermissions,
		allRolePermissions,
		allCatalogs,
		allInspectionTemplates,
		allCertificateTemplates,
		allEmailTemplates,
		allRetentionPolicies,
		auditLog: recentAudit
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

		await logAudit({ userId: locals.user.id, entity: 'user', entityId: locals.user.id, action: 'update_profile' });
		return { success: true };
	},

	assignRole: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		if (!(await hasPermission(locals.user.id, 'admin', '*'))) return fail(403, { error: 'Sin permisos' });

		const fd = await request.formData();
		const userId = fd.get('userId') as string;
		const roleId = Number(fd.get('roleId'));

		if (!userId || !roleId) return fail(400, { error: 'Datos incompletos' });

		await db.delete(userRoles).where(eq(userRoles.userId, userId));
		await db.insert(userRoles).values({ userId, roleId });

		await logAudit({ userId: locals.user.id, entity: 'user_role', entityId: userId, action: 'assign_role', details: { roleId } });
		return { roleSuccess: true };
	},

	createRole: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		if (!(await hasPermission(locals.user.id, 'admin', '*'))) return fail(403, { error: 'Sin permisos' });

		const fd = await request.formData();
		const name = fd.get('name') as string;
		const description = fd.get('description') as string;

		if (!name) return fail(400, { error: 'Nombre de rol obligatorio' });

		await db.insert(roles).values({ name: name.toLowerCase(), description: description || null });
		await logAudit({ userId: locals.user.id, entity: 'role', entityId: name, action: 'create' });
		return { roleCreated: true };
	},

	togglePermission: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		if (!(await hasPermission(locals.user.id, 'admin', '*'))) return fail(403, { error: 'Sin permisos' });

		const fd = await request.formData();
		const roleId = Number(fd.get('roleId'));
		const permissionId = Number(fd.get('permissionId'));
		const action = fd.get('action') as string;

		if (action === 'add') {
			await db.insert(rolePermissions).values({ roleId, permissionId });
		} else {
			await db.delete(rolePermissions)
				.where(eq(rolePermissions.roleId, roleId));
		}

		return { permUpdated: true };
	},

	createCatalog: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		if (!(await hasPermission(locals.user.id, 'admin', '*'))) return fail(403, { error: 'Sin permisos' });

		const fd = await request.formData();
		const type = fd.get('type') as string;
		const key = fd.get('key') as string;
		const label = fd.get('label') as string;
		const labelEu = fd.get('labelEu') as string;

		if (!type || !key || !label) return fail(400, { error: 'Tipo, clave y etiqueta son obligatorios' });

		await db.insert(catalogs).values({
			type,
			key,
			label,
			labelEu: labelEu || null
		});

		await logAudit({ userId: locals.user.id, entity: 'catalog', entityId: key, action: 'create', details: { type, label } });
		return { catalogCreated: true };
	},

	createInspectionTemplate: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		if (!(await hasPermission(locals.user.id, 'admin', '*'))) return fail(403, { error: 'Sin permisos' });

		const fd = await request.formData();
		const name = fd.get('name') as string;
		const description = fd.get('description') as string;
		const schemaStr = fd.get('schema') as string;

		if (!name || !schemaStr) return fail(400, { error: 'Nombre y esquema son obligatorios' });

		let schema;
		try { schema = JSON.parse(schemaStr); } catch { return fail(400, { error: 'JSON de esquema no válido' }); }

		await db.insert(inspectionTemplates).values({ name, description: description || null, schema });
		await logAudit({ userId: locals.user.id, entity: 'inspection_template', entityId: name, action: 'create' });
		return { templateCreated: true };
	},

	createCertificateTemplate: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		if (!(await hasPermission(locals.user.id, 'admin', '*'))) return fail(403, { error: 'Sin permisos' });

		const fd = await request.formData();
		const type = fd.get('type') as string;
		const name = fd.get('name') as string;
		const headerHtml = fd.get('headerHtml') as string;
		const footerHtml = fd.get('footerHtml') as string;

		if (!type || !name) return fail(400, { error: 'Tipo y nombre son obligatorios' });

		await db.insert(certificateTemplates).values({
			type, name, headerHtml: headerHtml || null, footerHtml: footerHtml || null
		});
		await logAudit({ userId: locals.user.id, entity: 'certificate_template', entityId: name, action: 'create' });
		return { certTemplateCreated: true };
	},

	createEmailTemplate: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		if (!(await hasPermission(locals.user.id, 'admin', '*'))) return fail(403, { error: 'Sin permisos' });

		const fd = await request.formData();
		const key = fd.get('key') as string;
		const subject = fd.get('subject') as string;
		const bodyHtml = fd.get('bodyHtml') as string;

		if (!key || !subject || !bodyHtml) return fail(400, { error: 'Clave, asunto y contenido son obligatorios' });

		await db.insert(emailTemplates).values({ key, subject, bodyHtml });
		await logAudit({ userId: locals.user.id, entity: 'email_template', entityId: key, action: 'create' });
		return { emailTemplateCreated: true };
	},

	saveRetentionPolicy: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		if (!(await hasPermission(locals.user.id, 'admin', '*'))) return fail(403, { error: 'Sin permisos' });

		const fd = await request.formData();
		const entity = fd.get('entity') as string;
		const retentionDays = Number(fd.get('retentionDays'));
		const action = fd.get('retentionAction') as string;

		if (!entity || !retentionDays) return fail(400, { error: 'Datos incompletos' });

		await db.insert(dataRetentionPolicies).values({
			entity, retentionDays, action: action || 'anonymize'
		});
		await logAudit({ userId: locals.user.id, entity: 'retention_policy', entityId: entity, action: 'create', details: { retentionDays, retentionAction: action } });
		return { retentionSaved: true };
	}
};

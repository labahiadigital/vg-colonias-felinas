import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { users, userRoles, roles, permissions, rolePermissions, catalogs, inspectionTemplates, certificateTemplates, emailTemplates, dataRetentionPolicies, organizationMembers } from '$lib/server/db/schema.js';
import { eq, and, asc, inArray } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { requireAuthContext, requirePermissionContext, getFormField, requireField, requireFields, requireInt } from '$lib/server/action-helpers.js';
import { audit } from '$lib/server/audit.js';
import { orgScope, loadRecentAudit } from '$lib/server/tenant.js';
import { guardedUpdate, guardedDelete, guardedInsert } from '$lib/server/db-helpers.js';
import { getUserRole, invalidateRbacCache } from '$lib/server/rbac.js';

export const load: PageServerLoad = async ({ locals }) => {
	const orgId = locals.organizationId;
	if (!locals.user) redirect(302, '/login');

	const currentRole = await getUserRole(locals.user.id, orgId);
	const isAdmin = currentRole === 'admin';

	const orgUserIds = orgId
		? db.select({ id: organizationMembers.userId }).from(organizationMembers).where(eq(organizationMembers.organizationId, orgId))
		: null;

	const [allUsers, allRoles, allPermissions, allRolePermissions, allCatalogs, allInspectionTemplates, allCertificateTemplates, allEmailTemplates, allRetentionPolicies] = isAdmin
		? await Promise.all([
			orgUserIds
				? db.select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt, roleName: roles.name })
					.from(users).leftJoin(userRoles, eq(users.id, userRoles.userId)).leftJoin(roles, eq(userRoles.roleId, roles.id)).where(inArray(users.id, orgUserIds)).orderBy(asc(users.name))
				: db.select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt, roleName: roles.name })
					.from(users).leftJoin(userRoles, eq(users.id, userRoles.userId)).leftJoin(roles, eq(userRoles.roleId, roles.id)).orderBy(asc(users.name)),
			db.select().from(roles).where(orgScope(roles.organizationId, orgId)).orderBy(asc(roles.name)),
			db.select().from(permissions).orderBy(asc(permissions.module), asc(permissions.action)),
			db.select().from(rolePermissions).where(
				inArray(rolePermissions.roleId, db.select({ id: roles.id }).from(roles).where(orgScope(roles.organizationId, orgId)))
			),
			db.select().from(catalogs).where(orgScope(catalogs.organizationId, orgId)).orderBy(asc(catalogs.type), asc(catalogs.sortOrder)),
			db.select().from(inspectionTemplates).where(orgScope(inspectionTemplates.organizationId, orgId)).orderBy(asc(inspectionTemplates.name)),
			db.select().from(certificateTemplates).where(orgScope(certificateTemplates.organizationId, orgId)).orderBy(asc(certificateTemplates.type)),
			db.select().from(emailTemplates).where(orgScope(emailTemplates.organizationId, orgId)).orderBy(asc(emailTemplates.key)),
			db.select().from(dataRetentionPolicies).where(orgScope(dataRetentionPolicies.organizationId, orgId)).orderBy(asc(dataRetentionPolicies.entity))
		])
		: [[], [], [], [], [], [], [], [], []];

	const recentAudit = await loadRecentAudit(orgId, { limit: 20 });

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
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const name = requireField(fd, 'name', 'El nombre');
		const language = getFormField(fd, 'language');

		await guardedUpdate(users, { name, language: language || 'es', updatedAt: new Date() },
			eq(users.id, ctx.userId), ctx, 'user', ctx.userId, 'update_profile');
		return { success: true };
	},

	assignRole: async ({ request, locals }) => {
		const ctx = await requirePermissionContext(locals, 'admin', '*', request);
		const fd = await request.formData();
		const userId = requireField(fd, 'userId', 'El usuario');
		const roleId = requireInt(fd, 'roleId', 'El rol');

		const [ownedRole] = await db.select({ id: roles.id }).from(roles)
			.where(and(eq(roles.id, roleId), orgScope(roles.organizationId, ctx.organizationId)))
			.limit(1);
		if (!ownedRole) return fail(403, { error: 'Rol no pertenece a la organización' });

		await db.transaction(async (tx) => {
			await tx.delete(userRoles).where(and(eq(userRoles.userId, userId), orgScope(userRoles.organizationId, ctx.organizationId)));
			await tx.insert(userRoles).values({ userId, roleId, organizationId: ctx.organizationId });
		});
		invalidateRbacCache(userId);

		await audit(ctx, 'user_role', userId, 'assign_role', { roleId });
		return { roleSuccess: true };
	},

	createRole: async ({ request, locals }) => {
		const ctx = await requirePermissionContext(locals, 'admin', '*', request);
		const fd = await request.formData();
		const name = requireField(fd, 'name', 'El nombre del rol');
		const description = getFormField(fd, 'description');

		await guardedInsert(roles, { name: name.toLowerCase(), description: description || null, organizationId: ctx.organizationId }, ctx, 'role', 'create', { name });

		return { roleCreated: true };
	},

	togglePermission: async ({ request, locals }) => {
		const ctx = await requirePermissionContext(locals, 'admin', '*', request);
		const fd = await request.formData();
		const roleId = requireInt(fd, 'roleId', 'El rol');
		const permissionId = requireInt(fd, 'permissionId', 'El permiso');
		const permAction = getFormField(fd, 'permAction');

		const [ownedRole] = await db.select({ id: roles.id }).from(roles)
			.where(and(eq(roles.id, roleId), orgScope(roles.organizationId, ctx.organizationId)))
			.limit(1);
		if (!ownedRole) return fail(403, { error: 'Rol no pertenece a la organización' });

		await db.transaction(async (tx) => {
			if (permAction === 'add') {
				const existing = await tx.select().from(rolePermissions)
					.where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)))
					.limit(1);
				if (existing.length === 0) {
					await tx.insert(rolePermissions).values({ roleId, permissionId });
				}
			} else {
				await tx.delete(rolePermissions)
					.where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)));
			}
		});

		invalidateRbacCache();

		await audit(ctx, 'role_permission', String(roleId), 'toggle', { permissionId, permAction });
		return { permUpdated: true };
	},

	createCatalog: async ({ request, locals }) => {
		const ctx = await requirePermissionContext(locals, 'admin', '*', request);
		const fd = await request.formData();
		const { type, key, label } = requireFields(fd, {
			type: 'El tipo', key: 'La clave', label: 'La etiqueta'
		});
		const labelEu = getFormField(fd, 'labelEu');
		const labelCa = getFormField(fd, 'labelCa');
		const labelEn = getFormField(fd, 'labelEn');

		await guardedInsert(catalogs, {
			organizationId: ctx.organizationId,
			type, key, label,
			labelEu: labelEu || null,
			labelCa: labelCa || null,
			labelEn: labelEn || null
		}, ctx, 'catalog', 'create', { type, label });

		return { catalogCreated: true };
	},

	editCatalog: async ({ request, locals }) => {
		const ctx = await requirePermissionContext(locals, 'admin', '*', request);
		const fd = await request.formData();
		const id = requireField(fd, 'id', 'El ID');

		const label = getFormField(fd, 'label');
		const labelEu = getFormField(fd, 'labelEu');
		const labelCa = getFormField(fd, 'labelCa');
		const labelEn = getFormField(fd, 'labelEn');

		await guardedUpdate(catalogs, {
			...(label && { label }), labelEu: labelEu || null, labelCa: labelCa || null, labelEn: labelEn || null
		}, and(eq(catalogs.id, id), orgScope(catalogs.organizationId, ctx.organizationId)),
			ctx, 'catalog', id, 'update', { label });
		return { catalogEdited: true };
	},

	deleteCatalog: async ({ request, locals }) => {
		const ctx = await requirePermissionContext(locals, 'admin', '*', request);
		const fd = await request.formData();
		const id = requireField(fd, 'id', 'El ID');

		await guardedDelete(catalogs, and(eq(catalogs.id, id), orgScope(catalogs.organizationId, ctx.organizationId)),
			ctx, 'catalog', id, 'delete');
		return { catalogDeleted: true };
	},

	createInspectionTemplate: async ({ request, locals }) => {
		const ctx = await requirePermissionContext(locals, 'admin', '*', request);
		const fd = await request.formData();
		const { name, schema: schemaStr } = requireFields(fd, {
			name: 'El nombre', schema: 'El esquema'
		});
		const description = getFormField(fd, 'description');

		let schema;
		try { schema = JSON.parse(schemaStr); } catch { return fail(400, { error: 'JSON de esquema no válido' }); }

		await guardedInsert(inspectionTemplates, { organizationId: ctx.organizationId, name, description: description || null, schema }, ctx, 'inspection_template', 'create', { name });

		return { templateCreated: true };
	},

	createCertificateTemplate: async ({ request, locals }) => {
		const ctx = await requirePermissionContext(locals, 'admin', '*', request);
		const fd = await request.formData();
		const { type, name } = requireFields(fd, {
			type: 'El tipo', name: 'El nombre'
		});
		const headerHtml = getFormField(fd, 'headerHtml');
		const footerHtml = getFormField(fd, 'footerHtml');

		await guardedInsert(certificateTemplates, {
			organizationId: ctx.organizationId, type, name, headerHtml: headerHtml || null, footerHtml: footerHtml || null
		}, ctx, 'certificate_template', 'create', { type, name });

		return { certTemplateCreated: true };
	},

	createEmailTemplate: async ({ request, locals }) => {
		const ctx = await requirePermissionContext(locals, 'admin', '*', request);
		const fd = await request.formData();
		const { key, subject, bodyHtml } = requireFields(fd, {
			key: 'La clave', subject: 'El asunto', bodyHtml: 'El contenido'
		});

		await guardedInsert(emailTemplates, { organizationId: ctx.organizationId, key, subject, bodyHtml }, ctx, 'email_template', 'create', { key, subject });

		return { emailTemplateCreated: true };
	},

	saveRetentionPolicy: async ({ request, locals }) => {
		const ctx = await requirePermissionContext(locals, 'admin', '*', request);
		const fd = await request.formData();
		const entity = requireField(fd, 'entity', 'La entidad');
		const retentionDays = requireInt(fd, 'retentionDays', 'Los días de retención');
		const action = getFormField(fd, 'retentionAction');

		await guardedInsert(dataRetentionPolicies, {
			organizationId: ctx.organizationId, entity, retentionDays, action: action || 'anonymize'
		}, ctx, 'retention_policy', 'create', { entity, retentionDays, retentionAction: action });

		return { retentionSaved: true };
	}
};

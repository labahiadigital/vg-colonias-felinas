import { db } from './db/index.js';
import { userRoles, roles, rolePermissions, permissions } from './db/schema.js';
import { eq, and } from 'drizzle-orm';

export async function getUserRole(userId: string): Promise<string | null> {
	const result = await db
		.select({ roleName: roles.name })
		.from(userRoles)
		.innerJoin(roles, eq(userRoles.roleId, roles.id))
		.where(eq(userRoles.userId, userId))
		.limit(1);

	return result[0]?.roleName ?? null;
}

export async function getUserPermissions(userId: string): Promise<Array<{ module: string; action: string }>> {
	const result = await db
		.select({ module: permissions.module, action: permissions.action })
		.from(userRoles)
		.innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
		.innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
		.where(eq(userRoles.userId, userId));

	return result;
}

export async function hasPermission(userId: string, module: string, action: string): Promise<boolean> {
	const role = await getUserRole(userId);
	if (role === 'admin') return true;

	const perms = await getUserPermissions(userId);
	return perms.some(p => p.module === module && (p.action === action || p.action === '*'));
}

export function requireAuth(locals: App.Locals): asserts locals is App.Locals & { user: NonNullable<App.Locals['user']> } {
	if (!locals.user) {
		throw new Error('Not authenticated');
	}
}

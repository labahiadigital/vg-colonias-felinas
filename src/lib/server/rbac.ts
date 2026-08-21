import { db } from './db/index.js';
import { userRoles, roles, rolePermissions, permissions } from './db/schema.js';
import { eq, and } from 'drizzle-orm';
import { orgScope } from './tenant.js';

interface RbacProfile {
	role: string | null;
	perms: Array<{ module: string; action: string }>;
}

const profileCache = new Map<string, { profile: RbacProfile; ts: number }>();
const CACHE_TTL_MS = 30_000;

export function cacheKey(userId: string, orgId: string | null | undefined): string {
	return `${userId}:${orgId ?? '_'}`;
}

async function loadProfile(userId: string, orgId?: string | null): Promise<RbacProfile> {
	const key = cacheKey(userId, orgId);
	const cached = profileCache.get(key);
	if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
		return cached.profile;
	}

	const orgFilter = orgScope(userRoles.organizationId, orgId);

	const [roleResult, permsResult] = await Promise.all([
		db.select({ roleName: roles.name })
			.from(userRoles)
			.innerJoin(roles, eq(userRoles.roleId, roles.id))
			.where(orgFilter ? and(eq(userRoles.userId, userId), orgFilter) : eq(userRoles.userId, userId))
			.limit(1),
		db.select({ module: permissions.module, action: permissions.action })
			.from(userRoles)
			.innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
			.innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
			.where(orgFilter ? and(eq(userRoles.userId, userId), orgFilter) : eq(userRoles.userId, userId))
	]);

	const profile: RbacProfile = {
		role: roleResult[0]?.roleName ?? null,
		perms: permsResult
	};

	profileCache.set(key, { profile, ts: Date.now() });

	if (profileCache.size > 500) {
		const cutoff = Date.now() - CACHE_TTL_MS;
		for (const [k, entry] of profileCache) {
			if (entry.ts < cutoff) profileCache.delete(k);
		}
		if (profileCache.size > 500) {
			let toRemove = profileCache.size - 400;
			for (const k of profileCache.keys()) {
				if (toRemove-- <= 0) break;
				profileCache.delete(k);
			}
		}
	}

	return profile;
}

export async function getUserRole(userId: string, orgId?: string | null): Promise<string | null> {
	const { role } = await loadProfile(userId, orgId);
	return role;
}

export async function getUserPermissions(userId: string, orgId?: string | null): Promise<Array<{ module: string; action: string }>> {
	const { perms } = await loadProfile(userId, orgId);
	return perms;
}

export function checkPermissionMatch(
	role: string | null,
	perms: Array<{ module: string; action: string }>,
	module: string,
	action: string
): boolean {
	if (role === 'admin') return true;
	return perms.some(p => p.module === module && (p.action === action || p.action === '*'));
}

export async function hasPermission(userId: string, module: string, action: string, orgId?: string | null): Promise<boolean> {
	const { role, perms } = await loadProfile(userId, orgId);
	return checkPermissionMatch(role, perms, module, action);
}

export function invalidateRbacCache(userId?: string): void {
	if (userId) {
		for (const key of profileCache.keys()) {
			if (key.startsWith(`${userId}:`)) profileCache.delete(key);
		}
	} else {
		profileCache.clear();
	}
}


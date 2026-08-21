import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDbSelect = vi.fn();
const mockDbFrom = vi.fn();
const mockDbInnerJoin = vi.fn();
const mockDbWhere = vi.fn();
const mockDbLimit = vi.fn();

vi.mock('$lib/server/db/index.js', () => ({
	db: {
		select: (...args: unknown[]) => {
			mockDbSelect(...args);
			return {
				from: (...a: unknown[]) => {
					mockDbFrom(...a);
					return {
						innerJoin: (...j: unknown[]) => {
							mockDbInnerJoin(...j);
							return {
								innerJoin: (...j2: unknown[]) => {
									mockDbInnerJoin(...j2);
									return {
										where: (...w: unknown[]) => {
											mockDbWhere(...w);
											return Promise.resolve([]);
										}
									};
								},
								where: (...w: unknown[]) => {
									mockDbWhere(...w);
									return {
										limit: (...l: unknown[]) => {
											mockDbLimit(...l);
											return Promise.resolve([]);
										}
									};
								}
							};
						},
						where: (...w: unknown[]) => {
							mockDbWhere(...w);
							return {
								limit: (...l: unknown[]) => {
									mockDbLimit(...l);
									return Promise.resolve([]);
								}
							};
						}
					};
				}
			};
		}
	}
}));

vi.mock('$lib/server/db/schema.js', () => ({
	userRoles: { userId: 'userId', roleId: 'roleId', organizationId: 'orgId' },
	roles: { id: 'id', name: 'name' },
	rolePermissions: { roleId: 'roleId', permissionId: 'permId' },
	permissions: { id: 'id', module: 'module', action: 'action' }
}));

vi.mock('$lib/server/tenant.js', () => ({
	orgScope: (col: unknown, orgId: unknown) => orgId ? `scope:${orgId}` : undefined
}));

import { getUserRole, getUserPermissions, hasPermission, invalidateRbacCache } from '../../src/lib/server/rbac.js';

beforeEach(() => {
	vi.clearAllMocks();
	invalidateRbacCache();
});

describe('getUserRole', () => {
	it('returns null when no role found', async () => {
		const role = await getUserRole('user-1', 'org-1');
		expect(role).toBeNull();
	});

	it('caches results on repeated calls', async () => {
		await getUserRole('user-2', 'org-1');
		const callCount = mockDbSelect.mock.calls.length;
		await getUserRole('user-2', 'org-1');
		expect(mockDbSelect.mock.calls.length).toBe(callCount);
	});
});

describe('getUserPermissions', () => {
	it('returns empty array when no permissions found', async () => {
		const perms = await getUserPermissions('user-3', 'org-1');
		expect(perms).toEqual([]);
	});
});

describe('hasPermission', () => {
	it('returns false when user has no role or permissions', async () => {
		const allowed = await hasPermission('user-4', 'colonies', 'read', 'org-1');
		expect(allowed).toBe(false);
	});
});

describe('invalidateRbacCache', () => {
	it('clears cache for specific user', async () => {
		await getUserRole('user-5', 'org-1');
		invalidateRbacCache('user-5');
		const callsBefore = mockDbSelect.mock.calls.length;
		await getUserRole('user-5', 'org-1');
		expect(mockDbSelect.mock.calls.length).toBeGreaterThan(callsBefore);
	});

	it('clears entire cache when no userId', async () => {
		await getUserRole('user-6', 'org-1');
		invalidateRbacCache();
		const callsBefore = mockDbSelect.mock.calls.length;
		await getUserRole('user-6', 'org-1');
		expect(mockDbSelect.mock.calls.length).toBeGreaterThan(callsBefore);
	});
});

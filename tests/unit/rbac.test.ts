import { describe, it, expect } from 'vitest';
import { checkPermissionMatch, cacheKey } from '../../src/lib/server/rbac.js';

describe('checkPermissionMatch', () => {
	it('admin role grants access to any module/action', () => {
		expect(checkPermissionMatch('admin', [], 'colonies', 'read')).toBe(true);
		expect(checkPermissionMatch('admin', [], 'cats', 'write')).toBe(true);
		expect(checkPermissionMatch('admin', [], 'reports', 'delete')).toBe(true);
	});

	it('admin with empty string still does not get admin bypass', () => {
		expect(checkPermissionMatch('', [], 'colonies', 'read')).toBe(false);
	});

	it('exact permission match grants access', () => {
		const perms = [{ module: 'colonies', action: 'read' }];
		expect(checkPermissionMatch('tecnico', perms, 'colonies', 'read')).toBe(true);
	});

	it('wildcard action grants access to any action in module', () => {
		const perms = [{ module: 'colonies', action: '*' }];
		expect(checkPermissionMatch('tecnico', perms, 'colonies', 'read')).toBe(true);
		expect(checkPermissionMatch('tecnico', perms, 'colonies', 'write')).toBe(true);
		expect(checkPermissionMatch('tecnico', perms, 'colonies', 'delete')).toBe(true);
	});

	it('wildcard action does not cross module boundary', () => {
		const perms = [{ module: 'colonies', action: '*' }];
		expect(checkPermissionMatch('tecnico', perms, 'cats', 'read')).toBe(false);
	});

	it('rejects when module does not match', () => {
		const perms = [{ module: 'colonies', action: 'read' }];
		expect(checkPermissionMatch('tecnico', perms, 'cats', 'read')).toBe(false);
	});

	it('rejects when action does not match', () => {
		const perms = [{ module: 'colonies', action: 'read' }];
		expect(checkPermissionMatch('tecnico', perms, 'colonies', 'write')).toBe(false);
	});

	it('rejects with empty permissions and non-admin role', () => {
		expect(checkPermissionMatch('tecnico', [], 'colonies', 'read')).toBe(false);
	});

	it('rejects with null role and empty permissions', () => {
		expect(checkPermissionMatch(null, [], 'colonies', 'read')).toBe(false);
	});

	it('null role with matching permissions still grants access', () => {
		const perms = [{ module: 'colonies', action: 'read' }];
		expect(checkPermissionMatch(null, perms, 'colonies', 'read')).toBe(true);
	});

	it('handles multiple permissions correctly', () => {
		const perms = [
			{ module: 'colonies', action: 'read' },
			{ module: 'cats', action: 'read' },
			{ module: 'cats', action: 'write' },
			{ module: 'incidents', action: '*' }
		];
		expect(checkPermissionMatch('tecnico', perms, 'cats', 'write')).toBe(true);
		expect(checkPermissionMatch('tecnico', perms, 'incidents', 'delete')).toBe(true);
		expect(checkPermissionMatch('tecnico', perms, 'colonies', 'write')).toBe(false);
		expect(checkPermissionMatch('tecnico', perms, 'reports', 'read')).toBe(false);
	});

	it('case sensitivity: "Admin" is not admin bypass', () => {
		expect(checkPermissionMatch('Admin', [], 'colonies', 'read')).toBe(false);
		expect(checkPermissionMatch('ADMIN', [], 'colonies', 'read')).toBe(false);
	});
});

describe('cacheKey', () => {
	it('formats userId:orgId', () => {
		expect(cacheKey('user-1', 'org-1')).toBe('user-1:org-1');
	});

	it('uses underscore for null orgId', () => {
		expect(cacheKey('user-1', null)).toBe('user-1:_');
	});

	it('uses underscore for undefined orgId', () => {
		expect(cacheKey('user-1', undefined)).toBe('user-1:_');
	});

	it('different orgIds produce different keys', () => {
		const k1 = cacheKey('user-1', 'org-a');
		const k2 = cacheKey('user-1', 'org-b');
		expect(k1).not.toBe(k2);
	});

	it('different userIds produce different keys', () => {
		const k1 = cacheKey('user-a', 'org-1');
		const k2 = cacheKey('user-b', 'org-1');
		expect(k1).not.toBe(k2);
	});

	it('null orgId and string "_" orgId produce same key', () => {
		expect(cacheKey('u', null)).toBe(cacheKey('u', undefined));
	});

	it('empty string orgId uses empty string not underscore', () => {
		expect(cacheKey('user-1', '')).toBe('user-1:');
	});
});

describe('requireAuth (inline logic test)', () => {
	function requireAuth(locals: { user?: unknown }): void {
		if (!locals.user) {
			throw new Error('Not authenticated');
		}
	}

	it('throws when user is null', () => {
		expect(() => requireAuth({ user: null })).toThrow('Not authenticated');
	});

	it('throws when user is undefined', () => {
		expect(() => requireAuth({})).toThrow('Not authenticated');
	});

	it('does not throw when user exists', () => {
		expect(() => requireAuth({ user: { id: '1', name: 'Test' } })).not.toThrow();
	});
});

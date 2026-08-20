import { describe, it, expect } from 'vitest';
import { checkPermissionMatch } from '../../src/lib/server/rbac.js';

describe('checkPermissionMatch', () => {
	it('admin role grants access to any module/action', () => {
		expect(checkPermissionMatch('admin', [], 'colonies', 'read')).toBe(true);
		expect(checkPermissionMatch('admin', [], 'cats', 'write')).toBe(true);
		expect(checkPermissionMatch('admin', [], 'reports', 'delete')).toBe(true);
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

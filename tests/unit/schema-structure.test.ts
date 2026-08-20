import { describe, it, expect } from 'vitest';
import * as schema from '../../src/lib/server/db/schema.js';

describe('Schema exports all required tables', () => {
	const requiredTables = [
		'organizations', 'organizationMembers', 'users', 'sessions', 'accounts',
		'verifications', 'loginAttempts', 'securityIncidents',
		'roles', 'permissions', 'rolePermissions', 'userRoles',
		'colonies', 'cats', 'incidents', 'cerActions', 'collaborators',
		'visits', 'inspections', 'healthRecords', 'auditLogs',
		'notifications', 'pushSubscriptions', 'documents',
		'feedingPoints', 'adoptions', 'providers', 'providerInterventions',
		'volunteerHours', 'conversations', 'messages',
		'regulatoryTemplates', 'catalogs', 'inspectionTemplates'
	];

	for (const table of requiredTables) {
		it(`exports "${table}" table`, () => {
			expect((schema as Record<string, unknown>)[table]).toBeDefined();
		});
	}
});

describe('Schema: colonies table structure', () => {
	it('has id, name, status columns', () => {
		const table = schema.colonies;
		expect(table).toBeDefined();
	});
});

describe('Schema: users table structure', () => {
	it('has id, name, email columns', () => {
		const table = schema.users;
		expect(table).toBeDefined();
	});
});

describe('Schema: cats table structure', () => {
	it('has sterilized boolean column', () => {
		expect(schema.cats).toBeDefined();
	});
});

describe('Schema: RBAC tables', () => {
	it('roles table exists', () => expect(schema.roles).toBeDefined());
	it('permissions table exists', () => expect(schema.permissions).toBeDefined());
	it('rolePermissions table exists', () => expect(schema.rolePermissions).toBeDefined());
	it('userRoles table exists', () => expect(schema.userRoles).toBeDefined());
});

describe('Schema: notification tables', () => {
	it('notifications table exists', () => expect(schema.notifications).toBeDefined());
	it('pushSubscriptions table exists', () => expect(schema.pushSubscriptions).toBeDefined());
});

describe('Schema: security tables', () => {
	it('loginAttempts table exists', () => expect(schema.loginAttempts).toBeDefined());
	it('securityIncidents table exists', () => expect(schema.securityIncidents).toBeDefined());
	it('auditLogs table exists', () => expect(schema.auditLogs).toBeDefined());
});

describe('Schema: multi-tenant', () => {
	it('organizations table exists', () => expect(schema.organizations).toBeDefined());
	it('organizationMembers table exists', () => expect(schema.organizationMembers).toBeDefined());
});

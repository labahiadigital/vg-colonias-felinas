/**
 * Multi-tenant isolation tests.
 *
 * Validates that orgScope correctly isolates data between organizations
 * at the query composition level. These tests exercise the real Drizzle
 * query builders (without hitting a live DB) to verify that WHERE clauses
 * include the organization_id filter and that two orgs produce distinct
 * SQL for the same logical query.
 */
import { describe, it, expect } from 'vitest';
import { orgScope, buildWhere, escapeLike } from '../../src/lib/server/tenant.js';
import { eq, ilike, type SQL } from 'drizzle-orm';
import { pgTable, text, uuid, boolean } from 'drizzle-orm/pg-core';

const ORG_A = 'org-aaa-111';
const ORG_B = 'org-bbb-222';

const fakeColonies = pgTable('colonies', {
	id: uuid('id').primaryKey(),
	name: text('name').notNull(),
	organizationId: uuid('organization_id'),
	status: text('status'),
	isActive: boolean('is_active')
});

const fakeCats = pgTable('cats', {
	id: uuid('id').primaryKey(),
	name: text('name'),
	colonyId: uuid('colony_id'),
	organizationId: uuid('organization_id'),
	status: text('status')
});

const fakeIncidents = pgTable('incidents', {
	id: uuid('id').primaryKey(),
	description: text('description'),
	colonyId: uuid('colony_id'),
	organizationId: uuid('organization_id'),
	priority: text('priority'),
	status: text('status')
});

const fakeCollaborators = pgTable('collaborators', {
	id: uuid('id').primaryKey(),
	name: text('name'),
	organizationId: uuid('organization_id'),
	status: text('status')
});

const fakeHealthRecords = pgTable('health_records', {
	id: uuid('id').primaryKey(),
	catId: uuid('cat_id'),
	organizationId: uuid('organization_id'),
	type: text('type')
});

const fakeAuditLogs = pgTable('audit_logs', {
	id: uuid('id').primaryKey(),
	userId: text('user_id'),
	organizationId: uuid('organization_id'),
	entity: text('entity'),
	action: text('action')
});

/**
 * Extracts a flat string representation of a Drizzle SQL expression by
 * walking its queryChunks and collecting all string/value literals.
 * Handles circular references from Drizzle's internal PgTable refs.
 */
function extractSqlValues(expression: SQL | undefined): string {
	if (!expression) return '';
	const chunks: string[] = [];
	function walk(obj: unknown): void {
		if (obj === null || obj === undefined) return;
		if (typeof obj === 'string') { chunks.push(obj); return; }
		if (typeof obj === 'number' || typeof obj === 'boolean') { chunks.push(String(obj)); return; }
		if (Array.isArray(obj)) { obj.forEach(walk); return; }
		if (typeof obj === 'object') {
			const record = obj as Record<string, unknown>;
			if ('value' in record && typeof record.value === 'string') { chunks.push(record.value); }
			if ('queryChunks' in record && Array.isArray(record.queryChunks)) {
				record.queryChunks.forEach(walk);
			}
		}
	}
	walk(expression);
	return chunks.join(' ');
}

describe('Multi-tenant isolation — orgScope', () => {
	it('produces different WHERE clauses for different organizations', () => {
		const scopeA = orgScope(fakeColonies.organizationId, ORG_A);
		const scopeB = orgScope(fakeColonies.organizationId, ORG_B);

		expect(scopeA).toBeDefined();
		expect(scopeB).toBeDefined();

		const sqlA = extractSqlValues(scopeA);
		const sqlB = extractSqlValues(scopeB);

		expect(sqlA).toContain(ORG_A);
		expect(sqlB).toContain(ORG_B);
		expect(sqlA).not.toContain(ORG_B);
		expect(sqlB).not.toContain(ORG_A);
	});

	it('returns undefined for null orgId — no tenant filter applied', () => {
		expect(orgScope(fakeColonies.organizationId, null)).toBeUndefined();
		expect(orgScope(fakeColonies.organizationId, undefined)).toBeUndefined();
		expect(orgScope(fakeColonies.organizationId, '')).toBeUndefined();
	});

	it('works consistently across all domain tables', () => {
		const tables = [
			fakeColonies,
			fakeCats,
			fakeIncidents,
			fakeCollaborators,
			fakeHealthRecords,
			fakeAuditLogs
		];

		for (const table of tables) {
			const scope = orgScope(table.organizationId, ORG_A);
			expect(scope).toBeDefined();
			const s = extractSqlValues(scope);
			expect(s).toContain(ORG_A);
		}
	});
});

describe('Multi-tenant isolation — buildWhere composability', () => {
	it('combines orgScope with additional filters', () => {
		const where = buildWhere(
			orgScope(fakeColonies.organizationId, ORG_A),
			eq(fakeColonies.status, 'active')
		);
		expect(where).toBeDefined();
		const s = extractSqlValues(where);
		expect(s).toContain(ORG_A);
		expect(s).toContain('active');
	});

	it('org filter absent when orgId is null — superadmin sees all', () => {
		const where = buildWhere(
			orgScope(fakeColonies.organizationId, null),
			eq(fakeColonies.status, 'active')
		);
		expect(where).toBeDefined();
		const s = extractSqlValues(where);
		expect(s).not.toContain(ORG_A);
		expect(s).not.toContain(ORG_B);
	});

	it('multiple filters all compose with org scope', () => {
		const where = buildWhere(
			orgScope(fakeCats.organizationId, ORG_B),
			eq(fakeCats.status, 'in_colony'),
			eq(fakeCats.colonyId, 'colony-123')
		);
		expect(where).toBeDefined();
		const s = extractSqlValues(where);
		expect(s).toContain(ORG_B);
		expect(s).toContain('in_colony');
		expect(s).toContain('colony-123');
	});

	it('short-circuit filters with falsy values do not break org scope', () => {
		const status = '';
		const where = buildWhere(
			orgScope(fakeIncidents.organizationId, ORG_A),
			status && eq(fakeIncidents.status, status)
		);
		expect(where).toBeDefined();
		const s = extractSqlValues(where);
		expect(s).toContain(ORG_A);
	});
});

describe('Multi-tenant isolation — search scoping', () => {
	it('search query is scoped to organization via orgScope', () => {
		const searchTerm = 'Luna';
		const pattern = `%${escapeLike(searchTerm)}%`;

		const scopeA = buildWhere(
			ilike(fakeCats.name, pattern),
			orgScope(fakeCats.organizationId, ORG_A)
		);
		const scopeB = buildWhere(
			ilike(fakeCats.name, pattern),
			orgScope(fakeCats.organizationId, ORG_B)
		);

		expect(scopeA).toBeDefined();
		expect(scopeB).toBeDefined();

		const sA = extractSqlValues(scopeA);
		const sB = extractSqlValues(scopeB);

		expect(sA).toContain(ORG_A);
		expect(sA).not.toContain(ORG_B);
		expect(sB).toContain(ORG_B);
		expect(sB).not.toContain(ORG_A);
	});

	it('escapeLike prevents wildcard injection in tenant-scoped search', () => {
		const malicious = '%admin%';
		const escaped = escapeLike(malicious);
		expect(escaped).toBe('\\%admin\\%');
		expect(escaped).not.toBe(malicious);
	});
});

describe('Multi-tenant isolation — cross-org data leak prevention', () => {
	it('orgScope for org A never matches org B data', () => {
		const scopeA = orgScope(fakeColonies.organizationId, ORG_A);
		const scopeB = orgScope(fakeColonies.organizationId, ORG_B);

		const sqlA = extractSqlValues(scopeA);
		const sqlB = extractSqlValues(scopeB);

		expect(sqlA).not.toEqual(sqlB);
	});

	it('colony query with org A scope cannot see org B colonies', () => {
		const whereA = buildWhere(
			orgScope(fakeColonies.organizationId, ORG_A),
			eq(fakeColonies.isActive, true)
		);
		const whereB = buildWhere(
			orgScope(fakeColonies.organizationId, ORG_B),
			eq(fakeColonies.isActive, true)
		);

		const sA = extractSqlValues(whereA);
		const sB = extractSqlValues(whereB);

		expect(sA).toContain(ORG_A);
		expect(sA).not.toContain(ORG_B);
		expect(sB).toContain(ORG_B);
		expect(sB).not.toContain(ORG_A);
	});

	it('incident query scoped to org produces org-specific SQL', () => {
		const where = buildWhere(
			orgScope(fakeIncidents.organizationId, ORG_A),
			eq(fakeIncidents.priority, 'high'),
			eq(fakeIncidents.status, 'open')
		);
		const s = extractSqlValues(where);
		expect(s).toContain(ORG_A);
		expect(s).toContain('high');
		expect(s).toContain('open');
	});

	it('health records query scoped per organization', () => {
		const whereA = buildWhere(
			orgScope(fakeHealthRecords.organizationId, ORG_A),
			eq(fakeHealthRecords.type, 'vaccination')
		);
		const whereB = buildWhere(
			orgScope(fakeHealthRecords.organizationId, ORG_B),
			eq(fakeHealthRecords.type, 'vaccination')
		);

		expect(extractSqlValues(whereA)).toContain(ORG_A);
		expect(extractSqlValues(whereB)).toContain(ORG_B);
		expect(extractSqlValues(whereA)).not.toEqual(extractSqlValues(whereB));
	});

	it('audit logs scoped to organization', () => {
		const where = buildWhere(
			orgScope(fakeAuditLogs.organizationId, ORG_A),
			eq(fakeAuditLogs.entity, 'colony')
		);
		const s = extractSqlValues(where);
		expect(s).toContain(ORG_A);
	});
});

describe('Multi-tenant isolation — TenantContext flow', () => {
	it('getTenantContext throws for unauthenticated locals', async () => {
		const { getTenantContext } = await import('../../src/lib/server/tenant.js');
		expect(() => getTenantContext({ user: undefined } as App.Locals)).toThrow('Not authenticated');
	});

	it('getTenantContext returns organizationId from locals', async () => {
		const { getTenantContext } = await import('../../src/lib/server/tenant.js');
		const locals = {
			user: { id: 'user-1', name: 'Test', email: 'test@test.com' },
			organizationId: ORG_A,
			locale: 'es'
		} as unknown as App.Locals;

		const ctx = getTenantContext(locals);
		expect(ctx.userId).toBe('user-1');
		expect(ctx.organizationId).toBe(ORG_A);
	});

	it('getTenantContext extracts IP from request headers', async () => {
		const { getTenantContext } = await import('../../src/lib/server/tenant.js');
		const locals = {
			user: { id: 'user-1', name: 'Test', email: 'test@test.com' },
			organizationId: ORG_A,
			locale: 'es'
		} as unknown as App.Locals;
		const request = new Request('http://localhost', {
			headers: { 'x-forwarded-for': '192.168.1.1' }
		});

		const ctx = getTenantContext(locals, request);
		expect(ctx.ipAddress).toBe('192.168.1.1');
	});
});

describe('Multi-tenant isolation — edge cases', () => {
	it('orgScope is stable: same orgId always produces equivalent SQL', () => {
		const scope1 = orgScope(fakeColonies.organizationId, ORG_A);
		const scope2 = orgScope(fakeColonies.organizationId, ORG_A);
		expect(extractSqlValues(scope1)).toEqual(extractSqlValues(scope2));
	});

	it('orgScope with UUID-like values works correctly', () => {
		const uuidVal = '550e8400-e29b-41d4-a716-446655440000';
		const scope = orgScope(fakeColonies.organizationId, uuidVal);
		expect(scope).toBeDefined();
		expect(extractSqlValues(scope)).toContain(uuidVal);
	});

	it('buildWhere with only org scope produces valid SQL', () => {
		const where = buildWhere(orgScope(fakeCats.organizationId, ORG_A));
		expect(where).toBeDefined();
	});

	it('buildWhere returns undefined when all conditions including orgScope are falsy', () => {
		const where = buildWhere(
			orgScope(fakeColonies.organizationId, null),
			false,
			undefined
		);
		expect(where).toBeUndefined();
	});
});

describe('Multi-tenant isolation — requireAuthContext composition', () => {
	it('requireAuthContext throws for unauthenticated locals', async () => {
		const { requireAuthContext } = await import('../../src/lib/server/action-helpers.js');
		expect(() => requireAuthContext({ user: undefined } as App.Locals)).toThrow();
	});

	it('requireAuthContext returns TenantContext with orgId for authenticated user', async () => {
		const { requireAuthContext } = await import('../../src/lib/server/action-helpers.js');
		const locals = {
			user: { id: 'user-org-a', name: 'UserA', email: 'a@test.com', role: 'admin' },
			organizationId: ORG_A,
			locale: 'es'
		} as unknown as App.Locals;
		const ctx = requireAuthContext(locals);
		expect(ctx.organizationId).toBe(ORG_A);
		expect(ctx.userId).toBe('user-org-a');
	});

	it('requireApiUser throws error(401) for unauthenticated locals', async () => {
		const { requireApiUser } = await import('../../src/lib/server/action-helpers.js');
		expect(() => requireApiUser({ user: undefined } as App.Locals)).toThrow();
	});

	it('requireApiContext returns TenantContext scoped to org', async () => {
		const { requireApiContext } = await import('../../src/lib/server/action-helpers.js');
		const locals = {
			user: { id: 'api-user', name: 'API', email: 'api@test.com' },
			organizationId: ORG_B,
			locale: 'es'
		} as unknown as App.Locals;
		const ctx = requireApiContext(locals);
		expect(ctx.organizationId).toBe(ORG_B);
	});
});

describe('Multi-tenant isolation — full endpoint composition simulation', () => {
	it('two orgs querying colonies get distinct SQL with no org-id overlap', () => {
		const localsA = { organizationId: ORG_A };
		const localsB = { organizationId: ORG_B };

		const queryA = buildWhere(
			orgScope(fakeColonies.organizationId, localsA.organizationId),
			eq(fakeColonies.isActive, true)
		);
		const queryB = buildWhere(
			orgScope(fakeColonies.organizationId, localsB.organizationId),
			eq(fakeColonies.isActive, true)
		);

		const sqlA = extractSqlValues(queryA);
		const sqlB = extractSqlValues(queryB);

		expect(sqlA).toContain(ORG_A);
		expect(sqlA).not.toContain(ORG_B);
		expect(sqlB).toContain(ORG_B);
		expect(sqlB).not.toContain(ORG_A);
	});

	it('two orgs querying cats get independent WHERE clauses', () => {
		const queryA = buildWhere(
			orgScope(fakeCats.organizationId, ORG_A),
			eq(fakeCats.status, 'in_colony'),
			eq(fakeCats.colonyId, 'colony-shared-name')
		);
		const queryB = buildWhere(
			orgScope(fakeCats.organizationId, ORG_B),
			eq(fakeCats.status, 'in_colony'),
			eq(fakeCats.colonyId, 'colony-shared-name')
		);

		const sqlA = extractSqlValues(queryA);
		const sqlB = extractSqlValues(queryB);

		expect(sqlA).toContain(ORG_A);
		expect(sqlB).toContain(ORG_B);
		expect(sqlA).not.toEqual(sqlB);
	});

	it('incident query with priority filter remains scoped per org', () => {
		const forOrgA = buildWhere(
			orgScope(fakeIncidents.organizationId, ORG_A),
			eq(fakeIncidents.priority, 'critical'),
			eq(fakeIncidents.status, 'open')
		);
		const forOrgB = buildWhere(
			orgScope(fakeIncidents.organizationId, ORG_B),
			eq(fakeIncidents.priority, 'critical'),
			eq(fakeIncidents.status, 'open')
		);

		expect(extractSqlValues(forOrgA)).toContain(ORG_A);
		expect(extractSqlValues(forOrgA)).not.toContain(ORG_B);
		expect(extractSqlValues(forOrgB)).toContain(ORG_B);
		expect(extractSqlValues(forOrgB)).not.toContain(ORG_A);
	});

	it('collaborators listed for org A cannot contain org B scoping', () => {
		const query = buildWhere(
			orgScope(fakeCollaborators.organizationId, ORG_A),
			eq(fakeCollaborators.status, 'active')
		);
		const sql = extractSqlValues(query);
		expect(sql).toContain(ORG_A);
		expect(sql).toContain('active');
		expect(sql).not.toContain(ORG_B);
	});

	it('health records export with org filter scopes correctly', () => {
		const query = buildWhere(
			orgScope(fakeHealthRecords.organizationId, ORG_A),
			eq(fakeHealthRecords.type, 'sterilization')
		);
		const sql = extractSqlValues(query);
		expect(sql).toContain(ORG_A);
		expect(sql).toContain('sterilization');
	});

	it('superadmin (null orgId) sees no org filter in query', () => {
		const query = buildWhere(
			orgScope(fakeColonies.organizationId, null),
			eq(fakeColonies.status, 'active')
		);
		const sql = extractSqlValues(query);
		expect(sql).not.toContain(ORG_A);
		expect(sql).not.toContain(ORG_B);
		expect(sql).toContain('active');
	});
});

describe('Multi-tenant isolation — rate limiting is per-user not per-org', () => {
	it('rateLimitKey includes userId, not orgId', async () => {
		const { rateLimitKey } = await import('../../src/lib/server/rate-limit.js');
		const keyA = rateLimitKey('export', 'user-in-org-a', undefined);
		const keyB = rateLimitKey('export', 'user-in-org-b', undefined);
		expect(keyA).toBe('export:user-in-org-a');
		expect(keyB).toBe('export:user-in-org-b');
		expect(keyA).not.toEqual(keyB);
	});

	it('rateLimitKey falls back to IP for unauthenticated users', async () => {
		const { rateLimitKey } = await import('../../src/lib/server/rate-limit.js');
		const key = rateLimitKey('citizenReport', undefined, '10.0.0.1');
		expect(key).toBe('citizenReport:10.0.0.1');
	});

	it('rateLimitKey falls back to anonymous when no userId or IP', async () => {
		const { rateLimitKey } = await import('../../src/lib/server/rate-limit.js');
		const key = rateLimitKey('search', undefined, undefined);
		expect(key).toBe('search:anonymous');
	});
});

const fakeAdoptions = pgTable('adoptions', {
	id: uuid('id').primaryKey(),
	catId: uuid('cat_id'),
	organizationId: uuid('organization_id'),
	status: text('status')
});

const fakeVisits = pgTable('visits', {
	id: uuid('id').primaryKey(),
	colonyId: uuid('colony_id'),
	organizationId: uuid('organization_id'),
	type: text('type')
});

const fakeCerActions = pgTable('cer_actions', {
	id: uuid('id').primaryKey(),
	catId: uuid('cat_id'),
	colonyId: uuid('colony_id'),
	organizationId: uuid('organization_id')
});

const fakeDocuments = pgTable('documents', {
	id: uuid('id').primaryKey(),
	organizationId: uuid('organization_id'),
	filename: text('filename')
});

const fakeEquipment = pgTable('equipment', {
	id: uuid('id').primaryKey(),
	organizationId: uuid('organization_id'),
	name: text('name'),
	status: text('status')
});

const fakeNotifications = pgTable('notifications', {
	id: uuid('id').primaryKey(),
	organizationId: uuid('organization_id'),
	userId: uuid('user_id'),
	type: text('type')
});

describe('Multi-tenant isolation — additional domain tables', () => {
	it('adoption queries scoped by org do not leak across organizations', () => {
		const queryA = buildWhere(
			orgScope(fakeAdoptions.organizationId, ORG_A),
			eq(fakeAdoptions.status, 'completed')
		);
		const queryB = buildWhere(
			orgScope(fakeAdoptions.organizationId, ORG_B),
			eq(fakeAdoptions.status, 'completed')
		);
		expect(extractSqlValues(queryA)).toContain(ORG_A);
		expect(extractSqlValues(queryA)).not.toContain(ORG_B);
		expect(extractSqlValues(queryB)).toContain(ORG_B);
		expect(extractSqlValues(queryB)).not.toContain(ORG_A);
	});

	it('visit queries scoped by org remain isolated', () => {
		const queryA = buildWhere(
			orgScope(fakeVisits.organizationId, ORG_A),
			eq(fakeVisits.type, 'feeding')
		);
		const queryB = buildWhere(
			orgScope(fakeVisits.organizationId, ORG_B),
			eq(fakeVisits.type, 'feeding')
		);
		expect(extractSqlValues(queryA)).toContain(ORG_A);
		expect(extractSqlValues(queryB)).toContain(ORG_B);
		expect(extractSqlValues(queryA)).not.toEqual(extractSqlValues(queryB));
	});

	it('CER actions scoped per organization', () => {
		const query = buildWhere(orgScope(fakeCerActions.organizationId, ORG_A));
		expect(extractSqlValues(query)).toContain(ORG_A);
		expect(extractSqlValues(query)).not.toContain(ORG_B);
	});

	it('document queries scoped per organization', () => {
		const queryA = buildWhere(orgScope(fakeDocuments.organizationId, ORG_A));
		const queryB = buildWhere(orgScope(fakeDocuments.organizationId, ORG_B));
		expect(extractSqlValues(queryA)).toContain(ORG_A);
		expect(extractSqlValues(queryB)).toContain(ORG_B);
		expect(extractSqlValues(queryA)).not.toEqual(extractSqlValues(queryB));
	});

	it('equipment queries isolated between orgs', () => {
		const queryA = buildWhere(
			orgScope(fakeEquipment.organizationId, ORG_A),
			eq(fakeEquipment.status, 'available')
		);
		const queryB = buildWhere(
			orgScope(fakeEquipment.organizationId, ORG_B),
			eq(fakeEquipment.status, 'available')
		);
		expect(extractSqlValues(queryA)).toContain(ORG_A);
		expect(extractSqlValues(queryA)).not.toContain(ORG_B);
		expect(extractSqlValues(queryB)).toContain(ORG_B);
	});

	it('notification queries scoped per organization', () => {
		const queryA = buildWhere(
			orgScope(fakeNotifications.organizationId, ORG_A),
			eq(fakeNotifications.type, 'alert')
		);
		expect(extractSqlValues(queryA)).toContain(ORG_A);
		expect(extractSqlValues(queryA)).not.toContain(ORG_B);
	});
});

describe('Multi-tenant isolation — cross-table join simulation', () => {
	it('cat + colony queries for different orgs produce independent SQL', () => {
		const catQueryA = buildWhere(orgScope(fakeCats.organizationId, ORG_A));
		const colQueryA = buildWhere(orgScope(fakeColonies.organizationId, ORG_A));
		const catQueryB = buildWhere(orgScope(fakeCats.organizationId, ORG_B));
		const colQueryB = buildWhere(orgScope(fakeColonies.organizationId, ORG_B));

		expect(extractSqlValues(catQueryA)).toContain(ORG_A);
		expect(extractSqlValues(colQueryA)).toContain(ORG_A);
		expect(extractSqlValues(catQueryB)).toContain(ORG_B);
		expect(extractSqlValues(colQueryB)).toContain(ORG_B);

		expect(extractSqlValues(catQueryA)).not.toContain(ORG_B);
		expect(extractSqlValues(colQueryB)).not.toContain(ORG_A);
	});

	it('visit + colony linked queries maintain org isolation', () => {
		const visitQuery = buildWhere(
			orgScope(fakeVisits.organizationId, ORG_A),
			eq(fakeVisits.colonyId, 'colony-xyz')
		);
		const colonyQuery = buildWhere(
			orgScope(fakeColonies.organizationId, ORG_A),
			eq(fakeColonies.id, 'colony-xyz')
		);
		expect(extractSqlValues(visitQuery)).toContain(ORG_A);
		expect(extractSqlValues(colonyQuery)).toContain(ORG_A);
	});

	it('health record + cat queries for separate orgs cannot see each other', () => {
		const healthA = buildWhere(
			orgScope(fakeHealthRecords.organizationId, ORG_A),
			eq(fakeHealthRecords.catId, 'cat-shared')
		);
		const healthB = buildWhere(
			orgScope(fakeHealthRecords.organizationId, ORG_B),
			eq(fakeHealthRecords.catId, 'cat-shared')
		);
		expect(extractSqlValues(healthA)).toContain(ORG_A);
		expect(extractSqlValues(healthA)).not.toContain(ORG_B);
		expect(extractSqlValues(healthB)).toContain(ORG_B);
		expect(extractSqlValues(healthB)).not.toContain(ORG_A);
	});
});

describe('Multi-tenant isolation — export scoping', () => {
	it('export query for colonies carries org scope', () => {
		const exportQuery = buildWhere(orgScope(fakeColonies.organizationId, ORG_A));
		expect(extractSqlValues(exportQuery)).toContain(ORG_A);
	});

	it('export query for cats carries org scope', () => {
		const exportQuery = buildWhere(orgScope(fakeCats.organizationId, ORG_B));
		expect(extractSqlValues(exportQuery)).toContain(ORG_B);
	});

	it('export queries for different orgs do not overlap', () => {
		const exportA = buildWhere(orgScope(fakeColonies.organizationId, ORG_A));
		const exportB = buildWhere(orgScope(fakeColonies.organizationId, ORG_B));
		expect(extractSqlValues(exportA)).not.toEqual(extractSqlValues(exportB));
	});
});

describe('Multi-tenant isolation — verifyOrgOwnership concept', () => {
	it('verifyOrgOwnership builds a compound WHERE with id AND orgScope', () => {
		const resourceId = 'resource-123';
		const where = buildWhere(
			eq(fakeColonies.id, resourceId),
			orgScope(fakeColonies.organizationId, ORG_A)
		);
		const sql = extractSqlValues(where);
		expect(sql).toContain(resourceId);
		expect(sql).toContain(ORG_A);
	});

	it('verifyOrgOwnership for wrong org would not match', () => {
		const resourceId = 'resource-123';
		const whereA = buildWhere(
			eq(fakeColonies.id, resourceId),
			orgScope(fakeColonies.organizationId, ORG_A)
		);
		const whereB = buildWhere(
			eq(fakeColonies.id, resourceId),
			orgScope(fakeColonies.organizationId, ORG_B)
		);
		expect(extractSqlValues(whereA)).not.toEqual(extractSqlValues(whereB));
		expect(extractSqlValues(whereA)).toContain(ORG_A);
		expect(extractSqlValues(whereB)).toContain(ORG_B);
	});

	it('verifyOrgOwnership with null org has no org filter', () => {
		const where = buildWhere(
			eq(fakeColonies.id, 'resource-123'),
			orgScope(fakeColonies.organizationId, null)
		);
		const sql = extractSqlValues(where);
		expect(sql).toContain('resource-123');
		expect(sql).not.toContain(ORG_A);
		expect(sql).not.toContain(ORG_B);
	});
});

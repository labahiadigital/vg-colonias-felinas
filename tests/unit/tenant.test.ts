import { describe, it, expect } from 'vitest';
import { orgScope, escapeLike, buildWhere, extractIp } from '../../src/lib/server/tenant.js';
import { eq } from 'drizzle-orm';
import { pgTable, text } from 'drizzle-orm/pg-core';

const fakeTable = pgTable('fake', {
	id: text('id').primaryKey(),
	organizationId: text('organization_id')
});

describe('orgScope', () => {
	it('returns undefined when orgId is null', () => {
		const result = orgScope(fakeTable.organizationId, null);
		expect(result).toBeUndefined();
	});

	it('returns undefined when orgId is undefined', () => {
		const result = orgScope(fakeTable.organizationId, undefined);
		expect(result).toBeUndefined();
	});

	it('returns undefined when orgId is empty string', () => {
		const result = orgScope(fakeTable.organizationId, '');
		expect(result).toBeUndefined();
	});

	it('returns an SQL expression when orgId is provided', () => {
		const result = orgScope(fakeTable.organizationId, 'org-123');
		expect(result).toBeDefined();
	});

	it('returned expression is an SQL object when orgId is provided', () => {
		const result = orgScope(fakeTable.organizationId, 'org-abc');
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
		expect(result).toHaveProperty('queryChunks');
	});

	it('returns distinct SQL expressions for different orgIds', () => {
		const r1 = orgScope(fakeTable.organizationId, 'org-1');
		const r2 = orgScope(fakeTable.organizationId, 'org-2');
		expect(r1).toBeDefined();
		expect(r2).toBeDefined();
		expect(r1).not.toBe(r2);
	});
});

describe('escapeLike', () => {
	it('returns unchanged string when no wildcards present', () => {
		expect(escapeLike('hello world')).toBe('hello world');
	});

	it('escapes percent sign', () => {
		expect(escapeLike('100%')).toBe('100\\%');
	});

	it('escapes underscore', () => {
		expect(escapeLike('user_name')).toBe('user\\_name');
	});

	it('escapes backslash', () => {
		expect(escapeLike('path\\file')).toBe('path\\\\file');
	});

	it('escapes multiple wildcards in same string', () => {
		expect(escapeLike('%admin_user%')).toBe('\\%admin\\_user\\%');
	});

	it('handles empty string', () => {
		expect(escapeLike('')).toBe('');
	});

	it('escapes wildcard in SQL injection attempt', () => {
		const malicious = "'; DROP TABLE cats; --%";
		const escaped = escapeLike(malicious);
		expect(escaped).toBe("'; DROP TABLE cats; --\\%");
		expect(escaped.endsWith('\\%')).toBe(true);
	});

	it('preserves unicode characters', () => {
		expect(escapeLike('gato señal 50%')).toBe('gato señal 50\\%');
	});

	it('escapes consecutive wildcards', () => {
		expect(escapeLike('%%__%%')).toBe('\\%\\%\\_\\_\\%\\%');
	});

	it('handles string with only wildcards', () => {
		expect(escapeLike('%_%')).toBe('\\%\\_\\%');
	});
});

describe('buildWhere', () => {
	it('returns undefined when all conditions are falsy', () => {
		expect(buildWhere(undefined, false, null)).toBeUndefined();
	});

	it('returns undefined when called with no arguments', () => {
		expect(buildWhere()).toBeUndefined();
	});

	it('returns single SQL condition unwrapped by and()', () => {
		const cond = eq(fakeTable.organizationId, 'org1');
		const result = buildWhere(cond);
		expect(result).toBeDefined();
	});

	it('filters out false values from short-circuit expressions', () => {
		const cond = eq(fakeTable.organizationId, 'org1');
		const result = buildWhere(false, cond, undefined, null, false);
		expect(result).toBeDefined();
	});

	it('combines multiple valid conditions', () => {
		const c1 = eq(fakeTable.id, '1');
		const c2 = eq(fakeTable.organizationId, 'org1');
		const result = buildWhere(c1, c2);
		expect(result).toBeDefined();
	});

	it('works with orgScope returning undefined', () => {
		const result = buildWhere(
			orgScope(fakeTable.organizationId, null),
			eq(fakeTable.id, '1')
		);
		expect(result).toBeDefined();
	});

	it('returns undefined when orgScope and all filters are empty', () => {
		const search = '';
		const status = '';
		const result = buildWhere(
			orgScope(fakeTable.organizationId, null),
			search && eq(fakeTable.id, search),
			status && eq(fakeTable.id, status)
		);
		expect(result).toBeUndefined();
	});
});

describe('extractIp', () => {
	function fakeRequest(headers: Record<string, string>): Request {
		return { headers: new Headers(headers) } as unknown as Request;
	}

	it('returns undefined when no request provided', () => {
		expect(extractIp()).toBeUndefined();
		expect(extractIp(undefined)).toBeUndefined();
	});

	it('extracts x-forwarded-for header', () => {
		const req = fakeRequest({ 'x-forwarded-for': '1.2.3.4' });
		expect(extractIp(req)).toBe('1.2.3.4');
	});

	it('extracts x-real-ip when x-forwarded-for is absent', () => {
		const req = fakeRequest({ 'x-real-ip': '5.6.7.8' });
		expect(extractIp(req)).toBe('5.6.7.8');
	});

	it('prefers x-forwarded-for over x-real-ip', () => {
		const req = fakeRequest({ 'x-forwarded-for': '1.1.1.1', 'x-real-ip': '2.2.2.2' });
		expect(extractIp(req)).toBe('1.1.1.1');
	});

	it('returns undefined when no IP headers present', () => {
		const req = fakeRequest({ 'content-type': 'application/json' });
		expect(extractIp(req)).toBeUndefined();
	});

	it('handles comma-separated x-forwarded-for (proxy chain)', () => {
		const req = fakeRequest({ 'x-forwarded-for': '10.0.0.1, 10.0.0.2' });
		expect(extractIp(req)).toBe('10.0.0.1, 10.0.0.2');
	});
});

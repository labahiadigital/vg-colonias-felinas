import { describe, it, expect } from 'vitest';
import {
	getFormField,
	getFormNumber,
	getFormInt,
	getFormBool,
	getFormDate,
	getFormFile,
	getFormStringArray,
	requireSuperadmin,
	requireInt,
	requireField,
	requireFields,
	requireApiUser,
	requireApiContext
} from '../../src/lib/server/action-helpers.js';
import { toStringArray, toDateString, toRecord, formatAuditDetails } from '../../src/lib/index.js';

function fd(entries: Record<string, string>): FormData {
	const f = new FormData();
	for (const [k, v] of Object.entries(entries)) f.append(k, v);
	return f;
}

describe('getFormField', () => {
	it('returns the string value', () => {
		expect(getFormField(fd({ name: 'Luna' }), 'name')).toBe('Luna');
	});

	it('returns empty string for missing key', () => {
		expect(getFormField(fd({}), 'name')).toBe('');
	});

	it('returns empty string when value is a File instead of string', () => {
		const f = new FormData();
		f.append('photo', new File(['data'], 'cat.jpg', { type: 'image/jpeg' }));
		expect(getFormField(f, 'photo')).toBe('');
	});
});

describe('getFormNumber', () => {
	it('parses a valid float', () => {
		expect(getFormNumber(fd({ lat: '42.85' }), 'lat')).toBeCloseTo(42.85);
	});

	it('returns null for non-numeric value', () => {
		expect(getFormNumber(fd({ lat: 'abc' }), 'lat')).toBeNull();
	});

	it('returns null for missing key', () => {
		expect(getFormNumber(fd({}), 'lat')).toBeNull();
	});

	it('parses zero correctly', () => {
		expect(getFormNumber(fd({ val: '0' }), 'val')).toBe(0);
	});

	it('parses negative numbers', () => {
		expect(getFormNumber(fd({ val: '-2.5' }), 'val')).toBeCloseTo(-2.5);
	});
});

describe('getFormInt', () => {
	it('parses a valid integer', () => {
		expect(getFormInt(fd({ count: '42' }), 'count')).toBe(42);
	});

	it('truncates decimal to integer', () => {
		expect(getFormInt(fd({ count: '42.9' }), 'count')).toBe(42);
	});

	it('returns null for non-numeric', () => {
		expect(getFormInt(fd({ count: 'abc' }), 'count')).toBeNull();
	});

	it('returns null for missing key', () => {
		expect(getFormInt(fd({}), 'count')).toBeNull();
	});
});

describe('getFormBool', () => {
	it('returns true for "on" (checkbox)', () => {
		expect(getFormBool(fd({ active: 'on' }), 'active')).toBe(true);
	});

	it('returns true for "true"', () => {
		expect(getFormBool(fd({ active: 'true' }), 'active')).toBe(true);
	});

	it('returns false for "false"', () => {
		expect(getFormBool(fd({ active: 'false' }), 'active')).toBe(false);
	});

	it('returns false for missing key', () => {
		expect(getFormBool(fd({}), 'active')).toBe(false);
	});

	it('returns false for arbitrary string', () => {
		expect(getFormBool(fd({ active: 'yes' }), 'active')).toBe(false);
	});
});

describe('getFormDate', () => {
	it('parses a valid ISO date', () => {
		const result = getFormDate(fd({ date: '2026-08-21' }), 'date');
		expect(result).toBeInstanceOf(Date);
		expect(result!.getFullYear()).toBe(2026);
	});

	it('returns null for empty string', () => {
		expect(getFormDate(fd({ date: '' }), 'date')).toBeNull();
	});

	it('returns null for missing key', () => {
		expect(getFormDate(fd({}), 'date')).toBeNull();
	});

	it('returns null for invalid date string', () => {
		expect(getFormDate(fd({ date: 'not-a-date' }), 'date')).toBeNull();
	});

	it('parses datetime strings', () => {
		const result = getFormDate(fd({ date: '2026-08-21T14:30:00Z' }), 'date');
		expect(result).toBeInstanceOf(Date);
		expect(result!.getUTCHours()).toBe(14);
	});
});

describe('requireSuperadmin', () => {
	function fakeLocals(user?: Partial<App.Locals['user']>): App.Locals {
		return {
			user: user ? { id: 'u1', name: 'Test', email: 'test@x.com', ...user } : undefined,
			locale: 'es',
			organizationId: null,
			correlationId: 'test-cid'
		};
	}

	it('throws redirect when user is undefined', () => {
		expect(() => requireSuperadmin(fakeLocals())).toThrow();
	});

	it('throws redirect when user.role is not superadmin', () => {
		expect(() => requireSuperadmin(fakeLocals({ role: 'admin' }))).toThrow();
	});

	it('throws redirect when user.role is undefined', () => {
		expect(() => requireSuperadmin(fakeLocals({ role: undefined }))).toThrow();
	});

	it('does not throw when user.role is superadmin', () => {
		expect(() => requireSuperadmin(fakeLocals({ role: 'superadmin' }))).not.toThrow();
	});
});

describe('requireField', () => {
	it('returns trimmed value when present', () => {
		expect(requireField(fd({ name: '  Luna  ' }), 'name', 'Nombre')).toBe('Luna');
	});

	it('throws fail when value is empty', () => {
		expect(() => requireField(fd({ name: '' }), 'name', 'Nombre')).toThrow();
	});

	it('throws fail when value is whitespace only', () => {
		expect(() => requireField(fd({ name: '   ' }), 'name', 'Nombre')).toThrow();
	});

	it('throws fail when key is missing', () => {
		expect(() => requireField(fd({}), 'name', 'Nombre')).toThrow();
	});
});

describe('requireInt', () => {
	it('returns parsed integer when present', () => {
		expect(requireInt(fd({ roleId: '42' }), 'roleId', 'El rol')).toBe(42);
	});

	it('truncates decimals', () => {
		expect(requireInt(fd({ roleId: '42.9' }), 'roleId', 'El rol')).toBe(42);
	});

	it('throws fail when value is non-numeric', () => {
		expect(() => requireInt(fd({ roleId: 'abc' }), 'roleId', 'El rol')).toThrow();
	});

	it('throws fail when key is missing', () => {
		expect(() => requireInt(fd({}), 'roleId', 'El rol')).toThrow();
	});

	it('parses zero correctly', () => {
		expect(requireInt(fd({ count: '0' }), 'count', 'El conteo')).toBe(0);
	});

	it('parses negative integers', () => {
		expect(requireInt(fd({ offset: '-3' }), 'offset', 'El offset')).toBe(-3);
	});
});

describe('requireApiUser', () => {
	function fakeLocals(user?: Partial<App.Locals['user']>): App.Locals {
		return {
			user: user ? { id: 'u1', name: 'Test', email: 'test@x.com', ...user } : undefined,
			locale: 'es',
			organizationId: null,
			correlationId: 'test-cid'
		};
	}

	it('returns locals with narrowed user when authenticated', () => {
		const locals = fakeLocals({ id: 'u1', name: 'A' });
		const result = requireApiUser(locals);
		expect(result.user.id).toBe('u1');
	});

	it('throws HttpError(401) when user is undefined', () => {
		expect(() => requireApiUser(fakeLocals())).toThrow();
		try {
			requireApiUser(fakeLocals());
		} catch (e: unknown) {
			expect((e as { status: number }).status).toBe(401);
		}
	});
});

describe('requireApiContext', () => {
	function fakeLocals(user?: Partial<App.Locals['user']>): App.Locals {
		return {
			user: user ? { id: 'u1', name: 'Test', email: 'test@x.com', ...user } : undefined,
			locale: 'es',
			organizationId: 'org-1',
			correlationId: 'test-cid'
		};
	}

	it('returns TenantContext when authenticated', () => {
		const ctx = requireApiContext(fakeLocals({ id: 'u1' }));
		expect(ctx.userId).toBe('u1');
		expect(ctx.organizationId).toBe('org-1');
	});

	it('throws HttpError(401) when user is undefined', () => {
		expect(() => requireApiContext(fakeLocals())).toThrow();
		try {
			requireApiContext(fakeLocals());
		} catch (e: unknown) {
			expect((e as { status: number }).status).toBe(401);
		}
	});
});

describe('getFormFile', () => {
	it('returns File when present and non-empty', () => {
		const f = new FormData();
		const file = new File(['data'], 'test.csv', { type: 'text/csv' });
		f.append('file', file);
		const result = getFormFile(f, 'file');
		expect(result).toBeInstanceOf(File);
		expect(result!.name).toBe('test.csv');
	});

	it('returns null when key is missing', () => {
		expect(getFormFile(fd({}), 'file')).toBeNull();
	});

	it('returns null when value is a string instead of File', () => {
		expect(getFormFile(fd({ file: 'not-a-file' }), 'file')).toBeNull();
	});

	it('returns null when file has zero size', () => {
		const f = new FormData();
		const file = new File([], 'empty.csv', { type: 'text/csv' });
		f.append('file', file);
		expect(getFormFile(f, 'file')).toBeNull();
	});
});

describe('getFormStringArray', () => {
	it('returns array of strings for multiple values', () => {
		const f = new FormData();
		f.append('ids', 'a');
		f.append('ids', 'b');
		f.append('ids', 'c');
		expect(getFormStringArray(f, 'ids')).toEqual(['a', 'b', 'c']);
	});

	it('returns empty array when key is missing', () => {
		expect(getFormStringArray(fd({}), 'ids')).toEqual([]);
	});

	it('filters out empty strings', () => {
		const f = new FormData();
		f.append('ids', 'a');
		f.append('ids', '');
		f.append('ids', '  ');
		f.append('ids', 'b');
		expect(getFormStringArray(f, 'ids')).toEqual(['a', 'b']);
	});
});

describe('toStringArray', () => {
	it('returns string[] from array of strings', () => {
		expect(toStringArray(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
	});

	it('returns empty array for null', () => {
		expect(toStringArray(null)).toEqual([]);
	});

	it('returns empty array for undefined', () => {
		expect(toStringArray(undefined)).toEqual([]);
	});

	it('returns empty array for non-array', () => {
		expect(toStringArray('not-array')).toEqual([]);
		expect(toStringArray(42)).toEqual([]);
		expect(toStringArray({})).toEqual([]);
	});

	it('filters out non-string elements', () => {
		expect(toStringArray(['a', 42, null, 'b', undefined])).toEqual(['a', 'b']);
	});
});

describe('requireFields', () => {
	it('returns all trimmed values when present', () => {
		const result = requireFields(fd({ catId: ' c1 ', type: 'vaccine' }), {
			catId: 'El gato', type: 'El tipo'
		});
		expect(result).toEqual({ catId: 'c1', type: 'vaccine' });
	});

	it('throws when one field is missing', () => {
		expect(() =>
			requireFields(fd({ catId: 'c1' }), { catId: 'El gato', type: 'El tipo' })
		).toThrow();
	});

	it('throws when multiple fields are missing', () => {
		expect(() =>
			requireFields(fd({}), { catId: 'El gato', type: 'El tipo' })
		).toThrow();
	});

	it('throws when a field is whitespace only', () => {
		expect(() =>
			requireFields(fd({ catId: 'c1', type: '   ' }), { catId: 'El gato', type: 'El tipo' })
		).toThrow();
	});

	it('error message uses singular for one missing field', () => {
		try {
			requireFields(fd({ catId: 'c1' }), { catId: 'El gato', type: 'El tipo' });
			expect.fail('should have thrown');
		} catch (e: unknown) {
			const data = (e as { data: { error: string } }).data;
			expect(data.error).toBe('El tipo es obligatorio');
		}
	});

	it('error message uses plural for multiple missing fields', () => {
		try {
			requireFields(fd({}), { catId: 'El gato', type: 'El tipo' });
			expect.fail('should have thrown');
		} catch (e: unknown) {
			const data = (e as { data: { error: string } }).data;
			expect(data.error).toBe('El gato y El tipo son obligatorios');
		}
	});
});

describe('toDateString', () => {
	it('returns YYYY-MM-DD for a known date', () => {
		expect(toDateString(new Date('2026-08-21T14:30:00Z'))).toBe('2026-08-21');
	});

	it('returns today when called without arguments', () => {
		const result = toDateString();
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it('returns exactly 10 characters', () => {
		expect(toDateString(new Date('2000-01-01T00:00:00Z'))).toHaveLength(10);
	});

	it('handles year boundaries', () => {
		expect(toDateString(new Date('2025-12-31T23:59:59Z'))).toBe('2025-12-31');
	});

	it('handles leap day', () => {
		expect(toDateString(new Date('2024-02-29T12:00:00Z'))).toBe('2024-02-29');
	});
});

describe('toRecord', () => {
	it('returns the same object for a plain object', () => {
		const obj = { a: 1, b: 'two' };
		expect(toRecord(obj)).toEqual({ a: 1, b: 'two' });
	});

	it('returns empty object for null', () => {
		expect(toRecord(null)).toEqual({});
	});

	it('returns empty object for undefined', () => {
		expect(toRecord(undefined)).toEqual({});
	});

	it('returns empty object for a string', () => {
		expect(toRecord('hello')).toEqual({});
	});

	it('returns empty object for a number', () => {
		expect(toRecord(42)).toEqual({});
	});

	it('returns empty object for an array', () => {
		expect(toRecord([1, 2, 3])).toEqual({});
	});

	it('returns empty object for boolean', () => {
		expect(toRecord(true)).toEqual({});
	});
});

describe('formatAuditDetails', () => {
	it('returns fallback for null', () => {
		expect(formatAuditDetails(null)).toBe('');
	});

	it('returns custom fallback for empty object', () => {
		expect(formatAuditDetails({}, '-')).toBe('-');
	});

	it('formats name', () => {
		expect(formatAuditDetails({ name: 'Colonia Norte' })).toBe('Colonia Norte');
	});

	it('formats multiple fields with separator', () => {
		expect(formatAuditDetails({ name: 'Misu', type: 'cat', status: 'active' }))
			.toBe('Misu · cat · active');
	});

	it('formats format field in uppercase', () => {
		expect(formatAuditDetails({ format: 'pdf' })).toBe('PDF');
	});

	it('formats newStatus with arrow', () => {
		expect(formatAuditDetails({ newStatus: 'resolved' })).toBe('→ resolved');
	});

	it('handles all known keys', () => {
		const details = { name: 'A', cat: 'B', type: 'C', format: 'csv', status: 'D', newStatus: 'E', category: 'F', colony: 'G', label: 'H', certNumber: 'I', priority: 'J' };
		const result = formatAuditDetails(details);
		expect(result).toContain('A');
		expect(result).toContain('B');
		expect(result).toContain('CSV');
		expect(result).toContain('→ E');
	});

	it('ignores unknown keys', () => {
		expect(formatAuditDetails({ unknownField: 'val', name: 'Test' })).toBe('Test');
	});
});

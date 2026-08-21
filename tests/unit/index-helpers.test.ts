import { describe, it, expect } from 'vitest';
import {
	groupByKey,
	toStringArray,
	toRecord,
	formatAuditDetails,
	toDateString
} from '../../src/lib/index.js';

describe('groupByKey', () => {
	it('groups items by key function', () => {
		const items = [
			{ name: 'a', type: 'x' },
			{ name: 'b', type: 'y' },
			{ name: 'c', type: 'x' }
		];
		const result = groupByKey(items, i => i.type);
		expect(result).toEqual({
			x: [{ name: 'a', type: 'x' }, { name: 'c', type: 'x' }],
			y: [{ name: 'b', type: 'y' }]
		});
	});

	it('returns empty object for empty array', () => {
		expect(groupByKey([], () => 'k')).toEqual({});
	});

	it('all items in one group when same key', () => {
		const items = [{ v: 1 }, { v: 2 }];
		const result = groupByKey(items, () => 'all');
		expect(result).toEqual({ all: [{ v: 1 }, { v: 2 }] });
	});

	it('each item in own group when unique keys', () => {
		const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
		const result = groupByKey(items, i => i.id);
		expect(Object.keys(result)).toHaveLength(3);
		expect(result['a']).toEqual([{ id: 'a' }]);
	});

	it('preserves insertion order within groups', () => {
		const items = [
			{ n: 1, g: 'A' },
			{ n: 2, g: 'A' },
			{ n: 3, g: 'A' }
		];
		const result = groupByKey(items, i => i.g);
		expect(result['A']!.map(i => i.n)).toEqual([1, 2, 3]);
	});
});

describe('toStringArray', () => {
	it('returns string[] from valid array', () => {
		expect(toStringArray(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
	});

	it('filters out non-string values', () => {
		expect(toStringArray(['a', 1, null, 'b', true])).toEqual(['a', 'b']);
	});

	it('returns [] for null', () => {
		expect(toStringArray(null)).toEqual([]);
	});

	it('returns [] for undefined', () => {
		expect(toStringArray(undefined)).toEqual([]);
	});

	it('returns [] for a plain object', () => {
		expect(toStringArray({ a: 1 })).toEqual([]);
	});

	it('returns [] for a number', () => {
		expect(toStringArray(42)).toEqual([]);
	});

	it('returns [] for a string (not an array)', () => {
		expect(toStringArray('hello')).toEqual([]);
	});

	it('handles empty array', () => {
		expect(toStringArray([])).toEqual([]);
	});
});

describe('toRecord', () => {
	it('returns the object itself for a plain object', () => {
		const obj = { a: 1, b: 'two' };
		expect(toRecord(obj)).toBe(obj);
	});

	it('returns {} for null', () => {
		expect(toRecord(null)).toEqual({});
	});

	it('returns {} for undefined', () => {
		expect(toRecord(undefined)).toEqual({});
	});

	it('returns {} for an array', () => {
		expect(toRecord([1, 2, 3])).toEqual({});
	});

	it('returns {} for a number', () => {
		expect(toRecord(42)).toEqual({});
	});

	it('returns {} for a string', () => {
		expect(toRecord('hello')).toEqual({});
	});

	it('returns {} for boolean', () => {
		expect(toRecord(true)).toEqual({});
	});

	it('returns the original reference (not a copy)', () => {
		const obj = { x: 1 };
		const result = toRecord(obj);
		result['y'] = 2;
		expect(obj).toHaveProperty('y', 2);
	});
});

describe('formatAuditDetails', () => {
	it('returns fallback for null details', () => {
		expect(formatAuditDetails(null, 'n/a')).toBe('n/a');
	});

	it('returns fallback for undefined details', () => {
		expect(formatAuditDetails(undefined)).toBe('');
	});

	it('returns fallback for empty object', () => {
		expect(formatAuditDetails({}, 'vacío')).toBe('vacío');
	});

	it('formats name key', () => {
		expect(formatAuditDetails({ name: 'Luna' })).toBe('Luna');
	});

	it('formats format key as uppercase', () => {
		expect(formatAuditDetails({ format: 'csv' })).toBe('CSV');
	});

	it('formats newStatus with arrow prefix', () => {
		expect(formatAuditDetails({ newStatus: 'active' })).toBe('→ active');
	});

	it('joins multiple keys with separator', () => {
		const result = formatAuditDetails({ name: 'Colonia Norte', status: 'active' });
		expect(result).toBe('Colonia Norte · active');
	});

	it('follows key order defined in AUDIT_DETAIL_KEYS', () => {
		const result = formatAuditDetails({
			priority: 'high',
			name: 'Test',
			category: 'health'
		});
		expect(result).toBe('Test · health · high');
	});

	it('ignores unknown keys', () => {
		expect(formatAuditDetails({ unknownKey: 'value', name: 'X' })).toBe('X');
	});

	it('ignores falsy values', () => {
		expect(formatAuditDetails({ name: '', status: null, type: undefined })).toBe('');
	});

	it('returns fallback for non-object details', () => {
		expect(formatAuditDetails(42, 'default')).toBe('default');
		expect(formatAuditDetails('string', 'default')).toBe('default');
	});
});

describe('toDateString', () => {
	it('returns YYYY-MM-DD from a Date', () => {
		const d = new Date('2024-06-15T14:30:00Z');
		expect(toDateString(d)).toBe('2024-06-15');
	});

	it('returns 10-character string', () => {
		expect(toDateString(new Date())).toHaveLength(10);
	});

	it('matches ISO date pattern', () => {
		expect(toDateString(new Date())).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
});

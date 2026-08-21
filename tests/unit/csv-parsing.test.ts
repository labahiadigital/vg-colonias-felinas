import { describe, it, expect } from 'vitest';
import { parseCsv, csvEscape, toCSV, toCsvFromRecords } from '../../src/lib/server/csv.js';

describe('parseCsv', () => {
	it('parses comma-separated CSV', () => {
		const csv = 'name,status,district\nColonia A,active,Centro\nColonia B,inactive,Norte';
		const result = parseCsv(csv);
		expect(result).toHaveLength(2);
		expect(result[0]!.name).toBe('Colonia A');
		expect(result[0]!.status).toBe('active');
		expect(result[1]!.district).toBe('Norte');
	});

	it('parses semicolon-separated CSV', () => {
		const csv = 'name;status;district\nColonia A;active;Centro';
		const result = parseCsv(csv);
		expect(result).toHaveLength(1);
		expect(result[0]!.name).toBe('Colonia A');
	});

	it('handles quoted fields with commas', () => {
		const csv = 'name,description\nColonia A,"Desc with, comma"';
		const result = parseCsv(csv);
		expect(result[0]!.description).toBe('Desc with, comma');
	});

	it('handles empty lines', () => {
		const csv = 'name,status\n\nColonia A,active\n\n';
		const result = parseCsv(csv);
		expect(result.length).toBeGreaterThanOrEqual(1);
	});

	it('returns empty array for header-only CSV', () => {
		const csv = 'name,status';
		const result = parseCsv(csv);
		expect(result).toHaveLength(0);
	});

	it('returns empty array for empty string', () => {
		expect(parseCsv('')).toHaveLength(0);
	});

	it('handles escaped double quotes inside quoted fields', () => {
		const csv = 'name,description\nColonia A,"Has ""escaped"" quotes"';
		const result = parseCsv(csv);
		expect(result[0]!.description).toBe('Has "escaped" quotes');
	});

	it('round-trips fields with embedded quotes through csvEscape/parseCsv', () => {
		const original = [['Say "hello"', 'active']];
		const exported = toCSV(['name', 'status'], original);
		const reimported = parseCsv(exported);
		expect(reimported[0]!.name).toBe('Say "hello"');
	});

	it('handles missing values', () => {
		const csv = 'name,status,district\nColonia A,active';
		const result = parseCsv(csv);
		expect(result[0]!.district).toBe('');
	});

	it('strips quotes from headers', () => {
		const csv = '"name","status"\nTest,active';
		const result = parseCsv(csv);
		expect(result[0]!.name).toBe('Test');
	});

	it('strips BOM from input', () => {
		const csv = '\uFEFFname,status\nColonia A,active';
		const result = parseCsv(csv);
		expect(result).toHaveLength(1);
		expect(result[0]!.name).toBe('Colonia A');
	});

	it('round-trips through toCSV (BOM preserved and stripped)', () => {
		const original = [['Colonia X', 'active'], ['Colonia Y', 'inactive']];
		const exported = toCSV(['name', 'status'], original);
		const reimported = parseCsv(exported);
		expect(reimported).toHaveLength(2);
		expect(reimported[0]!.name).toBe('Colonia X');
		expect(reimported[0]!.status).toBe('active');
		expect(reimported[1]!.name).toBe('Colonia Y');
	});

	it('round-trips through toCsvFromRecords (semicolon)', () => {
		const records = [
			{ name: 'Colonia A', district: 'Centro' },
			{ name: 'Colonia B', district: 'Norte' }
		];
		const exported = toCsvFromRecords(records);
		const reimported = parseCsv(exported);
		expect(reimported).toHaveLength(2);
		expect(reimported[0]!.name).toBe('Colonia A');
		expect(reimported[1]!.district).toBe('Norte');
	});
});

describe('csvEscape', () => {
	it('returns empty string for null', () => {
		expect(csvEscape(null)).toBe('');
	});

	it('returns empty string for undefined', () => {
		expect(csvEscape(undefined)).toBe('');
	});

	it('returns plain string for safe values', () => {
		expect(csvEscape('hello')).toBe('hello');
	});

	it('wraps and escapes strings with commas', () => {
		expect(csvEscape('hello, world')).toBe('"hello, world"');
	});

	it('escapes double quotes', () => {
		expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
	});

	it('wraps strings with newlines', () => {
		expect(csvEscape('line1\nline2')).toBe('"line1\nline2"');
	});

	it('converts numbers to string', () => {
		expect(csvEscape(42)).toBe('42');
	});

	it('wraps strings with semicolons', () => {
		expect(csvEscape('hello; world')).toBe('"hello; world"');
	});
});

describe('toCSV', () => {
	it('generates CSV with BOM', () => {
		const result = toCSV(['Name', 'Age'], [['Alice', 30], ['Bob', 25]]);
		expect(result.startsWith('\uFEFF')).toBe(true);
		expect(result).toContain('Name,Age');
		expect(result).toContain('Alice,30');
	});

	it('handles empty rows', () => {
		const result = toCSV(['A', 'B'], []);
		expect(result).toBe('\uFEFFA,B');
	});

	it('escapes special characters in cells', () => {
		const result = toCSV(['Name'], [['Hello, "World"']]);
		expect(result).toContain('"Hello, ""World"""');
	});
});

describe('toCsvFromRecords', () => {
	it('returns empty for no rows', () => {
		expect(toCsvFromRecords([])).toBe('');
	});

	it('generates semicolon-separated CSV', () => {
		const result = toCsvFromRecords([{ name: 'A', value: 1 }, { name: 'B', value: 2 }]);
		expect(result).toContain('name;value');
		expect(result).toContain('A;1');
	});

	it('handles null/undefined values', () => {
		const result = toCsvFromRecords([{ name: 'A', extra: null }]);
		expect(result).toContain('A;');
	});

	it('serializes nested objects as JSON (escaped in CSV)', () => {
		const result = toCsvFromRecords([{ name: 'A', data: { key: 'val' } }]);
		expect(result).toContain('key');
		expect(result).toContain('val');
	});

	it('escapes semicolons in values', () => {
		const result = toCsvFromRecords([{ name: 'Hello; World' }]);
		expect(result).toContain('"Hello; World"');
	});
});

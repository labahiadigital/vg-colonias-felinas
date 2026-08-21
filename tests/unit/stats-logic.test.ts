import { describe, it, expect } from 'vitest';
import { extractStatValue } from '../../src/lib/server/stats.js';
import { computeRate } from '../../src/lib/index.js';

describe('extractStatValue', () => {
	it('extracts a numeric value from row result', () => {
		const rows = [{ total: 42, active: 10 }];
		expect(extractStatValue(rows, 'total')).toBe(42);
		expect(extractStatValue(rows, 'active')).toBe(10);
	});

	it('returns 0 for null value', () => {
		const rows = [{ total: null }];
		expect(extractStatValue(rows, 'total')).toBe(0);
	});

	it('returns 0 for missing key', () => {
		const rows = [{ total: 5 }];
		expect(extractStatValue(rows, 'missing')).toBe(0);
	});

	it('returns 0 for empty array', () => {
		expect(extractStatValue([], 'total')).toBe(0);
	});

	it('handles string numbers from SQL', () => {
		const rows = [{ count: 15 as unknown as number | null }];
		expect(extractStatValue(rows, 'count')).toBe(15);
	});

	it('handles 0 value correctly (not confused with null)', () => {
		const rows = [{ total: 0 }];
		expect(extractStatValue(rows, 'total')).toBe(0);
	});
});

describe('computeRate', () => {
	it('computes percentage correctly', () => {
		expect(computeRate(7, 10)).toBe(70);
	});

	it('rounds to nearest integer', () => {
		expect(computeRate(1, 3)).toBe(33);
		expect(computeRate(2, 3)).toBe(67);
	});

	it('returns 0 when denominator is 0', () => {
		expect(computeRate(5, 0)).toBe(0);
	});

	it('returns 0 when both are 0', () => {
		expect(computeRate(0, 0)).toBe(0);
	});

	it('returns 100 when numerator equals denominator', () => {
		expect(computeRate(10, 10)).toBe(100);
	});

	it('handles large numbers', () => {
		expect(computeRate(999, 1000)).toBe(100);
		expect(computeRate(1, 1000)).toBe(0);
	});

	it('returns 0 when numerator is 0', () => {
		expect(computeRate(0, 100)).toBe(0);
	});
});

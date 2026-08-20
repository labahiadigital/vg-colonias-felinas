import { describe, it, expect } from 'vitest';
import { formatCurrency, getCurrencySymbol, parseCurrencyAmount, getLocaleForCountry } from '../../src/lib/utils/currency.js';

describe('formatCurrency', () => {
	it('formats EUR amounts with Spanish locale by default', () => {
		const result = formatCurrency(1234.56);
		expect(result).toContain('1234,56');
		expect(result).toContain('€');
	});

	it('formats GBP amounts correctly', () => {
		const result = formatCurrency(99.99, 'GBP');
		expect(result).toContain('£');
		expect(result).toContain('99.99');
	});

	it('handles zero amount', () => {
		const result = formatCurrency(0, 'EUR');
		expect(result).toContain('0,00');
	});

	it('handles negative amounts', () => {
		const result = formatCurrency(-50.25, 'EUR');
		expect(result).toContain('50,25');
	});
});

describe('getCurrencySymbol', () => {
	it('returns € for EUR', () => {
		expect(getCurrencySymbol('EUR')).toBe('€');
	});

	it('returns £ for GBP', () => {
		expect(getCurrencySymbol('GBP')).toBe('£');
	});

	it('returns $ for USD', () => {
		expect(getCurrencySymbol('USD')).toBe('$');
	});

	it('defaults to € for unknown currency', () => {
		expect(getCurrencySymbol()).toBe('€');
	});
});

describe('parseCurrencyAmount', () => {
	it('parses standard decimal notation', () => {
		expect(parseCurrencyAmount('1234.56')).toBe(1234.56);
	});

	it('parses European comma notation', () => {
		expect(parseCurrencyAmount('1234,56')).toBe(1234.56);
	});

	it('strips currency symbols', () => {
		expect(parseCurrencyAmount('€1234.56')).toBe(1234.56);
		expect(parseCurrencyAmount('$99.99')).toBe(99.99);
	});

	it('returns 0 for invalid input', () => {
		expect(parseCurrencyAmount('abc')).toBe(0);
		expect(parseCurrencyAmount('')).toBe(0);
	});
});

describe('getLocaleForCountry', () => {
	it('returns correct locale and currency for Spain', () => {
		const result = getLocaleForCountry('ES');
		expect(result.locale).toBe('es-ES');
		expect(result.currency).toBe('EUR');
	});

	it('returns correct locale and currency for UK', () => {
		const result = getLocaleForCountry('GB');
		expect(result.locale).toBe('en-GB');
		expect(result.currency).toBe('GBP');
	});

	it('returns correct locale and currency for Portugal', () => {
		const result = getLocaleForCountry('PT');
		expect(result.locale).toBe('pt-PT');
		expect(result.currency).toBe('EUR');
	});

	it('defaults to EUR/es-ES for unknown country', () => {
		const result = getLocaleForCountry('ZZ');
		expect(result.locale).toBe('es-ES');
		expect(result.currency).toBe('EUR');
	});
});

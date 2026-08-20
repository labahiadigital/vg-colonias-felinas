import { describe, it, expect } from 'vitest';
import { AVAILABLE_CURRENCIES, getLocaleForCountry, formatCurrency } from '../../src/lib/utils/currency.js';
import type { SupportedCurrency } from '../../src/lib/utils/currency.js';

describe('AVAILABLE_CURRENCIES', () => {
	it('has 10 currencies', () => {
		expect(AVAILABLE_CURRENCIES).toHaveLength(10);
	});

	it('each has code and name', () => {
		for (const c of AVAILABLE_CURRENCIES) {
			expect(c.code).toBeDefined();
			expect(c.name).toBeDefined();
			expect(c.name.length).toBeGreaterThan(3);
		}
	});

	it('includes EUR, GBP, USD', () => {
		const codes = AVAILABLE_CURRENCIES.map(c => c.code);
		expect(codes).toContain('EUR');
		expect(codes).toContain('GBP');
		expect(codes).toContain('USD');
	});
});

describe('formatCurrency for all supported currencies', () => {
	const currencies: SupportedCurrency[] = ['EUR', 'GBP', 'USD', 'BRL', 'CHF', 'PLN', 'CZK', 'SEK', 'NOK', 'DKK'];

	it.each(currencies)('formats 100.50 in %s without throwing', (currency) => {
		const result = formatCurrency(100.50, currency);
		expect(result.length).toBeGreaterThan(0);
	});
});

describe('getLocaleForCountry coverage', () => {
	const countries = ['ES', 'PT', 'IT', 'FR', 'DE', 'GB', 'BR', 'US', 'CH', 'PL', 'CZ', 'SE', 'NO', 'DK'];

	it.each(countries)('returns valid config for %s', (country) => {
		const result = getLocaleForCountry(country);
		expect(result.locale).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
		expect(result.currency).toMatch(/^[A-Z]{3}$/);
	});
});

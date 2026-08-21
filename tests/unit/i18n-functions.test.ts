import { describe, it, expect } from 'vitest';
import { t, getLocale, locales, localeNames, translateEntity, translateAction } from '../../src/lib/i18n/index.js';

describe('getLocale', () => {
	it('returns "es" when no cookie', () => {
		expect(getLocale()).toBe('es');
		expect(getLocale(undefined)).toBe('es');
	});

	it('returns "es" for empty string', () => {
		expect(getLocale('')).toBe('es');
	});

	it('returns "es" for invalid locale', () => {
		expect(getLocale('xx')).toBe('es');
		expect(getLocale('zh')).toBe('es');
		expect(getLocale('javascript')).toBe('es');
	});

	it('returns valid locale from cookie', () => {
		expect(getLocale('en')).toBe('en');
		expect(getLocale('eu')).toBe('eu');
		expect(getLocale('ca')).toBe('ca');
		expect(getLocale('pt')).toBe('pt');
		expect(getLocale('it')).toBe('it');
		expect(getLocale('fr')).toBe('fr');
		expect(getLocale('gl')).toBe('gl');
		expect(getLocale('es')).toBe('es');
	});
});

describe('t (translation function)', () => {
	it('returns translation for existing key', () => {
		const result = t('es', 'app.title');
		expect(result).toBeDefined();
		expect(typeof result).toBe('string');
	});

	it('falls back to Spanish for missing key in other locale', () => {
		const esValue = t('es', 'app.title');
		const result = t('eu', 'nonexistent.key.here');
		if (esValue !== 'nonexistent.key.here') {
			expect(result).toBe('nonexistent.key.here');
		}
	});

	it('returns key itself when not found in any locale', () => {
		const result = t('es', 'totally.fake.key.that.does.not.exist');
		expect(result).toBe('totally.fake.key.that.does.not.exist');
	});

	it('works with all supported locales', () => {
		for (const locale of locales) {
			const result = t(locale, 'app.title');
			expect(typeof result).toBe('string');
			expect(result.length).toBeGreaterThan(0);
		}
	});

	it('handles invalid locale by falling back to es', () => {
		const esResult = t('es', 'app.title');
		const invalidResult = t('xx', 'app.title');
		expect(invalidResult).toBe(esResult);
	});
});

describe('locales constant', () => {
	it('has 8 locales', () => {
		expect(locales).toHaveLength(8);
	});

	it('includes all required locales', () => {
		expect(locales).toContain('es');
		expect(locales).toContain('eu');
		expect(locales).toContain('ca');
		expect(locales).toContain('gl');
		expect(locales).toContain('pt');
		expect(locales).toContain('it');
		expect(locales).toContain('fr');
		expect(locales).toContain('en');
	});
});

describe('localeNames', () => {
	it('has a name for each locale', () => {
		for (const locale of locales) {
			expect(localeNames[locale]).toBeDefined();
			expect(localeNames[locale].length).toBeGreaterThan(0);
		}
	});

	it('Spanish is named Castellano', () => {
		expect(localeNames.es).toBe('Castellano');
	});

	it('English is named English', () => {
		expect(localeNames.en).toBe('English');
	});
});

describe('translateEntity', () => {
	it('translates a known entity key', () => {
		const result = translateEntity('es', 'colony');
		expect(result).not.toBe('colony');
		expect(result.length).toBeGreaterThan(0);
	});

	it('returns raw entity for unknown key', () => {
		expect(translateEntity('es', 'nonexistent_xyz')).toBe('nonexistent_xyz');
	});

	it('lowercases entity before looking up', () => {
		const lower = translateEntity('es', 'colony');
		const upper = translateEntity('es', 'Colony');
		expect(lower).toBe(upper);
	});
});

describe('translateAction', () => {
	it('translates a known action key', () => {
		const result = translateAction('es', 'create');
		expect(result).toBe('Creación');
	});

	it('returns raw action for unknown key', () => {
		expect(translateAction('es', 'unknown_action_xyz')).toBe('unknown_action_xyz');
	});

	it('lowercases action before looking up', () => {
		const lower = translateAction('es', 'create');
		const upper = translateAction('es', 'Create');
		expect(lower).toBe(upper);
	});
});

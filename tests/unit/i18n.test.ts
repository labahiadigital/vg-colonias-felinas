import { describe, it, expect } from 'vitest';
import { t, getLocale, locales, localeNames } from '../../src/lib/i18n/index.js';

describe('t function', () => {
	it('returns Spanish translation for known key', () => {
		expect(t('es', 'app.title')).toBe('Gatopolis');
	});

	it('falls back to Spanish for unknown locale key', () => {
		expect(t('pt', 'nav.dashboard')).toBe('Painel');
	});

	it('falls back to Spanish when key not in target locale', () => {
		const result = t('pt', 'dashboard.recent_activity');
		expect(result).toBe('Atividade recente');
	});

	it('returns key when not found in any locale', () => {
		expect(t('es', 'nonexistent.key')).toBe('nonexistent.key');
	});

	it('returns French translations correctly', () => {
		expect(t('fr', 'nav.dashboard')).toBe('Tableau de bord');
		expect(t('fr', 'common.save')).toBe('Enregistrer');
	});

	it('returns Italian translations correctly', () => {
		expect(t('it', 'nav.dashboard')).toBe('Pannello');
		expect(t('it', 'common.save')).toBe('Salva');
	});

	it('returns Galician translations correctly', () => {
		expect(t('gl', 'nav.dashboard')).toBe('Panel');
		expect(t('gl', 'common.save')).toBe('Gardar');
	});

	it('returns Portuguese translations correctly', () => {
		expect(t('pt', 'common.save')).toBe('Guardar');
		expect(t('pt', 'auth.login')).toBe('Iniciar sessão');
	});
});

describe('getLocale', () => {
	it('returns es by default', () => {
		expect(getLocale()).toBe('es');
		expect(getLocale(undefined)).toBe('es');
	});

	it('returns valid locales from cookie', () => {
		expect(getLocale('es')).toBe('es');
		expect(getLocale('eu')).toBe('eu');
		expect(getLocale('ca')).toBe('ca');
		expect(getLocale('en')).toBe('en');
		expect(getLocale('pt')).toBe('pt');
		expect(getLocale('it')).toBe('it');
		expect(getLocale('fr')).toBe('fr');
		expect(getLocale('gl')).toBe('gl');
	});

	it('returns es for invalid locale', () => {
		expect(getLocale('zz')).toBe('es');
		expect(getLocale('invalid')).toBe('es');
	});
});

describe('locales array', () => {
	it('contains all 8 locales', () => {
		expect(locales).toHaveLength(8);
		expect(locales).toContain('es');
		expect(locales).toContain('eu');
		expect(locales).toContain('ca');
		expect(locales).toContain('en');
		expect(locales).toContain('pt');
		expect(locales).toContain('it');
		expect(locales).toContain('fr');
		expect(locales).toContain('gl');
	});
});

describe('localeNames', () => {
	it('has names for all locales', () => {
		expect(Object.keys(localeNames)).toHaveLength(8);
		expect(localeNames.es).toBe('Castellano');
		expect(localeNames.fr).toBe('Français');
		expect(localeNames.pt).toBe('Português');
	});
});

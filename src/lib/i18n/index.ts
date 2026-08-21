import es from './es.js';
import eu from './eu.js';
import ca from './ca.js';
import en from './en.js';
import pt from './pt.js';
import it from './it.js';
import fr from './fr.js';
import gl from './gl.js';

export type Locale = 'es' | 'eu' | 'ca' | 'en' | 'pt' | 'it' | 'fr' | 'gl';
export type TranslationKey = keyof typeof es;

const translations: Record<Locale, Record<string, string>> = { es, eu, ca, en, pt, it, fr, gl };

export const locales: Locale[] = ['es', 'eu', 'ca', 'gl', 'pt', 'it', 'fr', 'en'];

export function t(locale: Locale | string, key: string): string {
	return translations[locale as Locale]?.[key] ?? translations['es']?.[key] ?? key;
}

export function isLocale(value: unknown): value is Locale {
	return typeof value === 'string' && locales.includes(value as Locale);
}

export function getLocale(cookieValue?: string): Locale {
	if (cookieValue && isLocale(cookieValue)) return cookieValue;
	return 'es';
}

export const localeNames: Record<Locale, string> = {
	es: 'Castellano',
	eu: 'Euskera',
	ca: 'Català',
	gl: 'Galego',
	pt: 'Português',
	it: 'Italiano',
	fr: 'Français',
	en: 'English'
};

/**
 * Translates an audit entity name via i18n, falling back to the raw entity string.
 * Consolidates the translateEntity() function duplicated across dashboard, informes, and configuracion.
 */
export function translateEntity(locale: Locale | string, entity: string): string {
	const key = `activity.entity.${entity.toLowerCase()}`;
	const translated = t(locale, key);
	return translated !== key ? translated : entity;
}

/**
 * Translates an audit action name via i18n, falling back to the raw action string.
 * Consolidates the translateAction() function duplicated across dashboard, informes, and configuracion.
 */
export function translateAction(locale: Locale | string, action: string): string {
	const key = `activity.action.${action.toLowerCase()}`;
	const translated = t(locale, key);
	return translated !== key ? translated : action;
}

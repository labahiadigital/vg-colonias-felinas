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

export function t(locale: Locale | string, key: string): string {
	return translations[locale as Locale]?.[key] ?? translations['es']?.[key] ?? key;
}

export function getLocale(cookieValue?: string): Locale {
	const valid: Locale[] = ['es', 'eu', 'ca', 'en', 'pt', 'it', 'fr', 'gl'];
	if (cookieValue && valid.includes(cookieValue as Locale)) return cookieValue as Locale;
	return 'es';
}

export const locales: Locale[] = ['es', 'eu', 'ca', 'gl', 'pt', 'it', 'fr', 'en'];

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

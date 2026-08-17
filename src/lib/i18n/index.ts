import es from './es.js';
import eu from './eu.js';
import ca from './ca.js';
import en from './en.js';

export type Locale = 'es' | 'eu' | 'ca' | 'en';
export type TranslationKey = keyof typeof es;

const translations: Record<Locale, Record<string, string>> = { es, eu, ca, en };

export function t(locale: Locale, key: string): string {
	return translations[locale]?.[key] ?? translations['es']?.[key] ?? key;
}

export function getLocale(cookieValue?: string): Locale {
	if (cookieValue === 'eu') return 'eu';
	if (cookieValue === 'ca') return 'ca';
	if (cookieValue === 'en') return 'en';
	return 'es';
}

export const locales: Locale[] = ['es', 'eu', 'ca', 'en'];

export const localeNames: Record<Locale, string> = {
	es: 'Castellano',
	eu: 'Euskera',
	ca: 'Català',
	en: 'English'
};

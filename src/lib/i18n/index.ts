import es from './es.js';
import eu from './eu.js';

export type Locale = 'es' | 'eu';
export type TranslationKey = keyof typeof es;

const translations: Record<Locale, Record<string, string>> = { es, eu };

export function t(locale: Locale, key: string): string {
	return translations[locale]?.[key] ?? translations['es']?.[key] ?? key;
}

export function getLocale(cookieValue?: string): Locale {
	if (cookieValue === 'eu') return 'eu';
	return 'es';
}

export const locales: Locale[] = ['es', 'eu'];

export const localeNames: Record<Locale, string> = {
	es: 'Castellano',
	eu: 'Euskera'
};

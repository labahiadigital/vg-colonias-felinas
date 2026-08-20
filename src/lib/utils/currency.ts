export type SupportedCurrency = 'EUR' | 'GBP' | 'USD' | 'BRL' | 'CHF' | 'PLN' | 'CZK' | 'SEK' | 'NOK' | 'DKK';

const CURRENCY_CONFIG: Record<SupportedCurrency, { locale: string; symbol: string; decimals: number }> = {
	EUR: { locale: 'es-ES', symbol: '€', decimals: 2 },
	GBP: { locale: 'en-GB', symbol: '£', decimals: 2 },
	USD: { locale: 'en-US', symbol: '$', decimals: 2 },
	BRL: { locale: 'pt-BR', symbol: 'R$', decimals: 2 },
	CHF: { locale: 'de-CH', symbol: 'CHF', decimals: 2 },
	PLN: { locale: 'pl-PL', symbol: 'zł', decimals: 2 },
	CZK: { locale: 'cs-CZ', symbol: 'Kč', decimals: 2 },
	SEK: { locale: 'sv-SE', symbol: 'kr', decimals: 2 },
	NOK: { locale: 'nb-NO', symbol: 'kr', decimals: 2 },
	DKK: { locale: 'da-DK', symbol: 'kr', decimals: 2 }
};

export function formatCurrency(
	amount: number,
	currency: SupportedCurrency = 'EUR',
	localeOverride?: string
): string {
	const config = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG.EUR;
	const locale = localeOverride ?? config.locale;

	try {
		return new Intl.NumberFormat(locale, {
			style: 'currency',
			currency,
			minimumFractionDigits: config.decimals,
			maximumFractionDigits: config.decimals
		}).format(amount);
	} catch {
		return `${amount.toFixed(config.decimals)} ${config.symbol}`;
	}
}

export function getCurrencySymbol(currency: SupportedCurrency = 'EUR'): string {
	return CURRENCY_CONFIG[currency]?.symbol ?? '€';
}

export function parseCurrencyAmount(value: string): number {
	const cleaned = value.replace(/[^\d.,\-]/g, '').replace(',', '.');
	return parseFloat(cleaned) || 0;
}

export const AVAILABLE_CURRENCIES: Array<{ code: SupportedCurrency; name: string }> = [
	{ code: 'EUR', name: 'Euro (€)' },
	{ code: 'GBP', name: 'British Pound (£)' },
	{ code: 'USD', name: 'US Dollar ($)' },
	{ code: 'BRL', name: 'Real Brasileiro (R$)' },
	{ code: 'CHF', name: 'Swiss Franc (CHF)' },
	{ code: 'PLN', name: 'Złoty (zł)' },
	{ code: 'CZK', name: 'Czech Koruna (Kč)' },
	{ code: 'SEK', name: 'Swedish Krona (kr)' },
	{ code: 'NOK', name: 'Norwegian Krone (kr)' },
	{ code: 'DKK', name: 'Danish Krone (kr)' }
];

export function getLocaleForCountry(country: string): { locale: string; currency: SupportedCurrency } {
	const countryMap: Record<string, { locale: string; currency: SupportedCurrency }> = {
		ES: { locale: 'es-ES', currency: 'EUR' },
		PT: { locale: 'pt-PT', currency: 'EUR' },
		IT: { locale: 'it-IT', currency: 'EUR' },
		FR: { locale: 'fr-FR', currency: 'EUR' },
		DE: { locale: 'de-DE', currency: 'EUR' },
		GB: { locale: 'en-GB', currency: 'GBP' },
		BR: { locale: 'pt-BR', currency: 'BRL' },
		US: { locale: 'en-US', currency: 'USD' },
		CH: { locale: 'de-CH', currency: 'CHF' },
		PL: { locale: 'pl-PL', currency: 'PLN' },
		CZ: { locale: 'cs-CZ', currency: 'CZK' },
		SE: { locale: 'sv-SE', currency: 'SEK' },
		NO: { locale: 'nb-NO', currency: 'NOK' },
		DK: { locale: 'da-DK', currency: 'DKK' }
	};

	return countryMap[country] ?? { locale: 'es-ES', currency: 'EUR' };
}

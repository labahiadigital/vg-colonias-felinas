import { describe, it, expect } from 'vitest';
import es from '../../src/lib/i18n/es.js';
import en from '../../src/lib/i18n/en.js';
import ca from '../../src/lib/i18n/ca.js';
import eu from '../../src/lib/i18n/eu.js';
import pt from '../../src/lib/i18n/pt.js';
import itLocale from '../../src/lib/i18n/it.js';
import fr from '../../src/lib/i18n/fr.js';
import gl from '../../src/lib/i18n/gl.js';

const esKeys = Object.keys(es);

const CRITICAL_KEYS = [
	'app.title',
	'nav.dashboard',
	'nav.map',
	'nav.colonies',
	'nav.cats',
	'nav.incidents',
	'nav.visits',
	'nav.settings',
	'auth.login',
	'auth.logout',
	'common.save',
	'common.cancel',
	'common.delete',
	'common.edit',
	'common.search',
	'ui.offline',
	'ui.online'
];

describe('i18n completeness', () => {
	it('Spanish (es) has the most keys as source locale', () => {
		expect(esKeys.length).toBeGreaterThan(100);
	});

	describe.each([
		['en', en],
		['ca', ca],
		['eu', eu],
		['pt', pt],
		['it', itLocale],
		['fr', fr],
		['gl', gl]
	])('%s locale', (locale, translations) => {
		it('has at least some translations', () => {
			expect(Object.keys(translations).length).toBeGreaterThan(10);
		});

		it.each(CRITICAL_KEYS)('has critical key "%s"', (key) => {
			expect(translations[key]).toBeDefined();
			expect(translations[key].length).toBeGreaterThan(0);
		});

		it('at least 80% of keys also exist in the Spanish source', () => {
			const localeKeys = Object.keys(translations);
			const extraKeys = localeKeys.filter(k => !esKeys.includes(k));
			const overlapRatio = (localeKeys.length - extraKeys.length) / localeKeys.length;
			expect(overlapRatio).toBeGreaterThan(0.8);
		});
	});
});

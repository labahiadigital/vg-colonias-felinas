import { describe, it, expect } from 'vitest';
import { renderTemplate, DEFAULT_TEMPLATES } from '../../src/lib/server/regulatory-templates.js';

describe('renderTemplate', () => {
	it('replaces all template variables', () => {
		const tpl = '<h2>Ejercicio {{year}}</h2><p>{{organizationName}} — {{municipio}}</p><td>{{totalColonies}}</td>';
		const result = renderTemplate(tpl, {
			year: '2026',
			organizationName: 'TestOrg',
			municipio: 'TestCity',
			totalColonies: '15'
		});
		expect(result).toContain('Ejercicio 2026');
		expect(result).toContain('TestOrg');
		expect(result).toContain('TestCity');
		expect(result).toContain('15');
	});

	it('replaces multiple occurrences of same variable', () => {
		const tpl = '{{year}} and {{year}} again';
		expect(renderTemplate(tpl, { year: '2026' })).toBe('2026 and 2026 again');
	});

	it('leaves unmatched templates unchanged', () => {
		const tpl = '{{year}} {{unknown}}';
		expect(renderTemplate(tpl, { year: '2026' })).toBe('2026 {{unknown}}');
	});

	it('handles empty template', () => {
		expect(renderTemplate('', { year: '2026' })).toBe('');
	});

	it('handles empty variables', () => {
		const tpl = '{{year}}';
		expect(renderTemplate(tpl, {})).toBe('{{year}}');
	});

	it('escapes HTML in unsafe keys (year, organizationName, municipio, date)', () => {
		const tpl = '{{organizationName}} — {{municipio}} — {{year}} — {{date}}';
		const result = renderTemplate(tpl, {
			organizationName: 'Org <script>alert(1)</script>',
			municipio: 'City "quoted"',
			year: '2026 & co',
			date: '<b>today</b>'
		});
		expect(result).not.toContain('<script>');
		expect(result).toContain('&lt;script&gt;');
		expect(result).toContain('&quot;quoted&quot;');
		expect(result).toContain('2026 &amp; co');
		expect(result).toContain('&lt;b&gt;today&lt;/b&gt;');
	});

	it('does not escape numeric/safe keys', () => {
		const tpl = '{{totalColonies}} colonies, {{sterilizationRate}}%';
		const result = renderTemplate(tpl, {
			totalColonies: '15',
			sterilizationRate: '85.3'
		});
		expect(result).toBe('15 colonies, 85.3%');
	});
});

describe('DEFAULT_TEMPLATES structure', () => {
	const REQUIRED_COUNTRIES = ['ES', 'PT', 'IT', 'FR'];
	const REQUIRED_FIELDS = ['year', 'organizationName', 'municipio'];

	it('has at least one template per required country', () => {
		for (const country of REQUIRED_COUNTRIES) {
			const countryTemplates = DEFAULT_TEMPLATES.filter(t => t.country === country);
			expect(countryTemplates.length).toBeGreaterThan(0);
		}
	});

	it('all templates have required fields', () => {
		for (const tpl of DEFAULT_TEMPLATES) {
			for (const field of REQUIRED_FIELDS) {
				expect(tpl.requiredFields).toContain(field);
			}
		}
	});

	it('Spain has at least 2 template types', () => {
		const esTemplates = DEFAULT_TEMPLATES.filter(t => t.country === 'ES');
		expect(esTemplates.length).toBeGreaterThanOrEqual(2);
	});

	it('all templates contain year and totalColonies placeholders', () => {
		for (const tpl of DEFAULT_TEMPLATES) {
			expect(tpl.templateHtml).toContain('{{year}}');
			expect(tpl.templateHtml).toContain('{{totalColonies}}');
		}
	});
});

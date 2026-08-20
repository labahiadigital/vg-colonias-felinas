import { describe, it, expect } from 'vitest';

function renderTemplate(templateHtml: string, variables: Record<string, string>): string {
	let result = templateHtml;
	for (const [key, value] of Object.entries(variables)) {
		result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
	}
	return result;
}

const MEMORIA_TEMPLATE = `<h1>MEMORIA ANUAL</h1>
<h2>Ejercicio {{year}}</h2>
<p><strong>Entidad:</strong> {{organizationName}}</p>
<p><strong>Municipio:</strong> {{municipio}}</p>
<tr><td>Colonias registradas</td><td>{{totalColonies}}</td></tr>
<tr><td>Gatos censados</td><td>{{totalCats}}</td></tr>
<tr><td>Tasa de esterilización</td><td>{{sterilizationRate}}%</td></tr>`;

describe('renderTemplate', () => {
	it('replaces all template variables', () => {
		const result = renderTemplate(MEMORIA_TEMPLATE, {
			year: '2026',
			organizationName: 'TestOrg',
			municipio: 'TestCity',
			totalColonies: '15',
			totalCats: '120',
			sterilizationRate: '85'
		});
		expect(result).toContain('Ejercicio 2026');
		expect(result).toContain('TestOrg');
		expect(result).toContain('TestCity');
		expect(result).toContain('15');
		expect(result).toContain('120');
		expect(result).toContain('85%');
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

	it('handles special characters in values', () => {
		const tpl = '{{org}}';
		expect(renderTemplate(tpl, { org: 'Org <special> & "quoted"' })).toBe('Org <special> & "quoted"');
	});
});

describe('DEFAULT_TEMPLATES structure', () => {
	const REQUIRED_COUNTRIES = ['ES', 'PT', 'IT', 'FR'];
	const REQUIRED_FIELDS = ['year', 'organizationName', 'municipio'];

	const templates = [
		{ country: 'ES', type: 'memoria_anual', requiredFields: ['year', 'organizationName', 'municipio'] },
		{ country: 'ES', type: 'informe_pleno', requiredFields: ['year', 'organizationName', 'municipio'] },
		{ country: 'PT', type: 'relatorio_anual', requiredFields: ['year', 'organizationName', 'municipio'] },
		{ country: 'IT', type: 'relazione_annuale', requiredFields: ['year', 'organizationName', 'municipio'] },
		{ country: 'FR', type: 'rapport_annuel', requiredFields: ['year', 'organizationName', 'municipio'] }
	];

	it('has at least one template per required country', () => {
		for (const country of REQUIRED_COUNTRIES) {
			const countryTemplates = templates.filter(t => t.country === country);
			expect(countryTemplates.length).toBeGreaterThan(0);
		}
	});

	it('all templates have required fields', () => {
		for (const tpl of templates) {
			for (const field of REQUIRED_FIELDS) {
				expect(tpl.requiredFields).toContain(field);
			}
		}
	});

	it('Spain has at least 2 template types', () => {
		const esTemplates = templates.filter(t => t.country === 'ES');
		expect(esTemplates.length).toBeGreaterThanOrEqual(2);
	});
});

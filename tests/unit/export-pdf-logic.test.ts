import { describe, it, expect } from 'vitest';

function esc(text: string | null | undefined): string {
	if (!text) return '';
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

interface ComplianceItem { label: string; ok: boolean; detail: string }
interface ComplianceGroup { law: string; items: ComplianceItem[] }

function buildComplianceChecks(s: {
	totalColonies: number; totalCER: number; microchipped: number;
	sterilizationRate: number; totalHealth: number; totalInsp: number;
	totalVisits: number; geoRate: number; incidentResolutionRate: number;
	activeProviders: number; volunteerHours: number;
}): ComplianceGroup[] {
	return [
		{
			law: 'Ley 7/2023 de Protección Animal',
			items: [
				{ label: 'Art. 17 - Registro de colonias', ok: s.totalColonies > 0, detail: `${s.totalColonies} colonias` },
				{ label: 'Art. 18 - CER activo', ok: s.totalCER > 0, detail: `${s.totalCER} acciones CER` },
				{ label: 'Art. 25 - Microchip', ok: s.microchipped > 0, detail: `${s.microchipped} con chip` },
				{ label: 'Art. 37 - Esterilización >=70%', ok: s.sterilizationRate >= 70, detail: `${s.sterilizationRate}%` },
				{ label: 'Art. 44 - Salud', ok: s.totalHealth > 0, detail: `${s.totalHealth} registros` }
			]
		},
		{
			law: 'Directiva 92/43/CEE',
			items: [
				{ label: 'Inspecciones', ok: s.totalInsp > 0, detail: `${s.totalInsp}` },
				{ label: 'Visitas', ok: s.totalVisits > 0, detail: `${s.totalVisits}` },
				{ label: 'Geolocalización >=50%', ok: s.geoRate >= 50, detail: `${s.geoRate}%` }
			]
		}
	];
}

function computeComplianceScore(checks: ComplianceGroup[]): { total: number; passed: number; score: number } {
	let total = 0, passed = 0;
	checks.forEach(g => g.items.forEach(i => { total++; if (i.ok) passed++; }));
	const score = total > 0 ? Math.round((passed / total) * 100) : 0;
	return { total, passed, score };
}

describe('esc (HTML escape)', () => {
	it('returns empty for null', () => expect(esc(null)).toBe(''));
	it('returns empty for undefined', () => expect(esc(undefined)).toBe(''));
	it('returns empty for empty string', () => expect(esc('')).toBe(''));
	it('escapes &', () => expect(esc('A & B')).toBe('A &amp; B'));
	it('escapes <', () => expect(esc('<script>')).toBe('&lt;script&gt;'));
	it('escapes >', () => expect(esc('a > b')).toBe('a &gt; b'));
	it('escapes all together', () => expect(esc('<a href="&">')).toBe('&lt;a href="&amp;"&gt;'));
	it('leaves safe text unchanged', () => expect(esc('Hello World')).toBe('Hello World'));
});

describe('buildComplianceChecks', () => {
	it('returns fully passing checks for compliant data', () => {
		const checks = buildComplianceChecks({
			totalColonies: 10, totalCER: 5, microchipped: 8,
			sterilizationRate: 80, totalHealth: 20, totalInsp: 3,
			totalVisits: 15, geoRate: 60, incidentResolutionRate: 75,
			activeProviders: 2, volunteerHours: 100
		});
		const { score } = computeComplianceScore(checks);
		expect(score).toBe(100);
	});

	it('returns 0% for empty data', () => {
		const checks = buildComplianceChecks({
			totalColonies: 0, totalCER: 0, microchipped: 0,
			sterilizationRate: 0, totalHealth: 0, totalInsp: 0,
			totalVisits: 0, geoRate: 0, incidentResolutionRate: 0,
			activeProviders: 0, volunteerHours: 0
		});
		const { score } = computeComplianceScore(checks);
		expect(score).toBe(0);
	});

	it('calculates partial compliance correctly', () => {
		const checks = buildComplianceChecks({
			totalColonies: 5, totalCER: 0, microchipped: 0,
			sterilizationRate: 50, totalHealth: 0, totalInsp: 2,
			totalVisits: 10, geoRate: 30, incidentResolutionRate: 40,
			activeProviders: 0, volunteerHours: 0
		});
		const { total, passed, score } = computeComplianceScore(checks);
		expect(total).toBe(8);
		expect(passed).toBe(3);
		expect(score).toBe(38);
	});

	it('sterilization at exactly 70% passes', () => {
		const checks = buildComplianceChecks({
			totalColonies: 1, totalCER: 1, microchipped: 1,
			sterilizationRate: 70, totalHealth: 1, totalInsp: 1,
			totalVisits: 1, geoRate: 50, incidentResolutionRate: 50,
			activeProviders: 1, volunteerHours: 10
		});
		const { score } = computeComplianceScore(checks);
		expect(score).toBe(100);
	});

	it('geoRate below 50% fails that check', () => {
		const checks = buildComplianceChecks({
			totalColonies: 10, totalCER: 5, microchipped: 3,
			sterilizationRate: 80, totalHealth: 10, totalInsp: 5,
			totalVisits: 20, geoRate: 49, incidentResolutionRate: 60,
			activeProviders: 2, volunteerHours: 50
		});
		const geo = checks[1].items.find(i => i.label.includes('Geolocalización'));
		expect(geo?.ok).toBe(false);
	});
});

describe('computeComplianceScore', () => {
	it('returns 0 for empty checks', () => {
		expect(computeComplianceScore([])).toEqual({ total: 0, passed: 0, score: 0 });
	});

	it('rounds score properly', () => {
		const checks: ComplianceGroup[] = [{
			law: 'Test',
			items: [
				{ label: 'A', ok: true, detail: '' },
				{ label: 'B', ok: true, detail: '' },
				{ label: 'C', ok: false, detail: '' }
			]
		}];
		const { score } = computeComplianceScore(checks);
		expect(score).toBe(67);
	});
});

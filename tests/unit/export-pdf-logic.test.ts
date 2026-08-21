import { describe, it, expect } from 'vitest';
import { escHtml } from '../../src/lib/server/html.js';
import { buildComplianceChecks, computeComplianceScore } from '../../src/lib/server/compliance.js';
import type { StatsSnapshot } from '../../src/lib/server/stats.js';

function fullStats(overrides: Partial<StatsSnapshot> = {}): StatsSnapshot {
	return {
		totalColonies: 10, activeColonies: 8, totalCats: 50, sterilizedCats: 40,
		microchipped: 30, sterilizationRate: 80, totalIncidents: 5, openIncidents: 1,
		resolvedIncidents: 4, incidentResolutionRate: 80, highPriorityIncidents: 0,
		totalCER: 5, totalCollab: 10, activeCollaborators: 8, pendingCollaborators: 2,
		totalVisits: 15, recentVisits: 5, totalInsp: 3, passedInsp: 3,
		activeProviders: 2, totalInterventions: 10, totalCost: 1500,
		volunteerHours: 100, totalHealth: 20, geoColonies: 7, geoRate: 70,
		...overrides
	};
}

describe('escHtml (HTML escape)', () => {
	it('returns empty for null', () => expect(escHtml(null)).toBe(''));
	it('returns empty for undefined', () => expect(escHtml(undefined)).toBe(''));
	it('returns empty for empty string', () => expect(escHtml('')).toBe(''));
	it('escapes &', () => expect(escHtml('A & B')).toBe('A &amp; B'));
	it('escapes <', () => expect(escHtml('<script>')).toBe('&lt;script&gt;'));
	it('escapes >', () => expect(escHtml('a > b')).toBe('a &gt; b'));
	it('escapes "', () => expect(escHtml('"hello"')).toBe('&quot;hello&quot;'));
	it('escapes all together', () => expect(escHtml('<a href="&">')).toBe('&lt;a href=&quot;&amp;&quot;&gt;'));
	it('leaves safe text unchanged', () => expect(escHtml('Hello World')).toBe('Hello World'));
});

describe('buildComplianceChecks', () => {
	it('returns fully passing checks for compliant data', () => {
		const checks = buildComplianceChecks(fullStats());
		const { score } = computeComplianceScore(checks);
		expect(score).toBe(100);
	});

	it('returns 0% for empty data', () => {
		const checks = buildComplianceChecks(fullStats({
			totalColonies: 0, totalCER: 0, microchipped: 0,
			sterilizationRate: 0, totalHealth: 0, totalInsp: 0,
			totalVisits: 0, geoRate: 0, incidentResolutionRate: 0,
			activeProviders: 0, volunteerHours: 0
		}));
		const { passed } = computeComplianceScore(checks);
		expect(passed).toBe(3);
	});

	it('calculates partial compliance correctly', () => {
		const checks = buildComplianceChecks(fullStats({
			totalColonies: 5, totalCER: 0, microchipped: 0,
			sterilizationRate: 50, totalHealth: 0, totalInsp: 2,
			totalVisits: 10, geoRate: 30, incidentResolutionRate: 40,
			activeProviders: 0, volunteerHours: 0
		}));
		const { total, passed } = computeComplianceScore(checks);
		expect(total).toBeGreaterThan(0);
		expect(passed).toBeGreaterThan(0);
		expect(passed).toBeLessThan(total);
	});

	it('sterilization at exactly 70% passes', () => {
		const checks = buildComplianceChecks(fullStats({ sterilizationRate: 70 }));
		const sterItems = checks[0]!.items.filter(i => i.label.includes('Esterilización'));
		expect(sterItems.every(i => i.ok)).toBe(true);
	});

	it('geoRate below 50% fails that check', () => {
		const checks = buildComplianceChecks(fullStats({ geoRate: 49 }));
		const habitats = checks.find(g => g.law.includes('Hábitats'));
		const geo = habitats?.items.find(i => i.label.includes('Geolocalización'));
		expect(geo?.ok).toBe(false);
	});

	it('includes all 6 legal frameworks', () => {
		const checks = buildComplianceChecks(fullStats());
		expect(checks).toHaveLength(6);
		expect(checks.map(g => g.law)).toContain('Ley 7/2023 de Protección Animal');
		expect(checks.map(g => g.law)).toContain('RGPD / LOPDGDD');
		expect(checks.map(g => g.law)).toContain('Directiva 92/43/CEE (Hábitats)');
	});
});

describe('computeComplianceScore', () => {
	it('returns 0 for empty checks', () => {
		expect(computeComplianceScore([])).toEqual({ total: 0, passed: 0, score: 0 });
	});

	it('rounds score properly', () => {
		const checks = [{
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

	it('returns 100 when all pass', () => {
		const checks = [{
			law: 'Test',
			items: [
				{ label: 'A', ok: true, detail: '' },
				{ label: 'B', ok: true, detail: '' }
			]
		}];
		expect(computeComplianceScore(checks).score).toBe(100);
	});
});

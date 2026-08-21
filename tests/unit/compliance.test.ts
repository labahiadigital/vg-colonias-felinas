import { describe, it, expect } from 'vitest';
import { buildComplianceChecks, computeComplianceScore, type ComplianceGroup } from '../../src/lib/server/compliance.js';
import type { StatsSnapshot } from '../../src/lib/server/stats.js';

function makeStats(overrides: Partial<StatsSnapshot> = {}): StatsSnapshot {
	return {
		totalColonies: 0, activeColonies: 0, totalCats: 0, sterilizedCats: 0,
		microchipped: 0, sterilizationRate: 0, totalIncidents: 0, openIncidents: 0,
		resolvedIncidents: 0, incidentResolutionRate: 0, highPriorityIncidents: 0,
		totalCER: 0, totalCollab: 0, activeCollaborators: 0, pendingCollaborators: 0,
		totalVisits: 0, recentVisits: 0, totalInsp: 0, passedInsp: 0,
		activeProviders: 0, totalInterventions: 0, totalCost: 0,
		volunteerHours: 0, totalHealth: 0, geoColonies: 0, geoRate: 0,
		...overrides
	};
}

describe('buildComplianceChecks', () => {
	it('returns 6 law groups', () => {
		const checks = buildComplianceChecks(makeStats());
		expect(checks).toHaveLength(6);
	});

	it('all data-dependent items fail when stats are zero', () => {
		const checks = buildComplianceChecks(makeStats());
		const dataItems = checks.flatMap(g => g.items).filter(i => !i.detail.includes('implementado') && !i.detail.includes('RBAC') && !i.detail.includes('Datos mínimos'));
		for (const item of dataItems) {
			expect(item.ok).toBe(false);
		}
	});

	it('RGPD items always pass regardless of stats', () => {
		const checks = buildComplianceChecks(makeStats());
		const rgpd = checks.find(g => g.law.includes('RGPD'));
		expect(rgpd).toBeDefined();
		for (const item of rgpd!.items) {
			expect(item.ok).toBe(true);
		}
	});

	it('sterilization check passes at 70%', () => {
		const checks = buildComplianceChecks(makeStats({ sterilizationRate: 70 }));
		const ley = checks.find(g => g.law.includes('Ley 7/2023'));
		const art37 = ley!.items.find(i => i.label.includes('Art. 37'));
		expect(art37!.ok).toBe(true);
	});

	it('sterilization check fails below 70%', () => {
		const checks = buildComplianceChecks(makeStats({ sterilizationRate: 69 }));
		const ley = checks.find(g => g.law.includes('Ley 7/2023'));
		const art37 = ley!.items.find(i => i.label.includes('Art. 37'));
		expect(art37!.ok).toBe(false);
	});

	it('geo check passes at 50%', () => {
		const checks = buildComplianceChecks(makeStats({ geoRate: 50 }));
		const hab = checks.find(g => g.law.includes('Hábitats'));
		const geo = hab!.items.find(i => i.label.includes('Geolocalización'));
		expect(geo!.ok).toBe(true);
	});

	it('incident resolution passes at 50%', () => {
		const checks = buildComplianceChecks(makeStats({ incidentResolutionRate: 50 }));
		const tfue = checks.find(g => g.law.includes('TFUE'));
		const res = tfue!.items.find(i => i.label.includes('Resolución'));
		expect(res!.ok).toBe(true);
	});

	it('all items pass with healthy stats', () => {
		const checks = buildComplianceChecks(makeStats({
			totalColonies: 10, totalCats: 50, sterilizedCats: 40, microchipped: 30,
			sterilizationRate: 80, totalCER: 5, totalHealth: 20, totalInsp: 3,
			totalVisits: 15, geoRate: 60, activeProviders: 2, volunteerHours: 100,
			incidentResolutionRate: 75
		}));
		const allItems = checks.flatMap(g => g.items);
		for (const item of allItems) {
			expect(item.ok).toBe(true);
		}
	});
});

describe('computeComplianceScore', () => {
	it('returns 0 for empty groups', () => {
		const result = computeComplianceScore([]);
		expect(result).toEqual({ total: 0, passed: 0, score: 0 });
	});

	it('returns 100 when all items pass', () => {
		const groups: ComplianceGroup[] = [{
			law: 'Test',
			items: [
				{ label: 'A', ok: true, detail: 'ok' },
				{ label: 'B', ok: true, detail: 'ok' }
			]
		}];
		expect(computeComplianceScore(groups).score).toBe(100);
	});

	it('returns 0 when no items pass', () => {
		const groups: ComplianceGroup[] = [{
			law: 'Test',
			items: [
				{ label: 'A', ok: false, detail: 'fail' },
				{ label: 'B', ok: false, detail: 'fail' }
			]
		}];
		expect(computeComplianceScore(groups).score).toBe(0);
	});

	it('returns rounded percentage for mixed results', () => {
		const groups: ComplianceGroup[] = [{
			law: 'Test',
			items: [
				{ label: 'A', ok: true, detail: 'ok' },
				{ label: 'B', ok: false, detail: 'fail' },
				{ label: 'C', ok: true, detail: 'ok' }
			]
		}];
		const result = computeComplianceScore(groups);
		expect(result).toEqual({ total: 3, passed: 2, score: 67 });
	});

	it('counts items across multiple groups', () => {
		const groups: ComplianceGroup[] = [
			{ law: 'G1', items: [{ label: 'A', ok: true, detail: '' }] },
			{ law: 'G2', items: [{ label: 'B', ok: false, detail: '' }] }
		];
		const result = computeComplianceScore(groups);
		expect(result).toEqual({ total: 2, passed: 1, score: 50 });
	});
});

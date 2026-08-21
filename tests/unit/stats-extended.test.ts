import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/server/db/index.js', () => ({
	db: {
		execute: vi.fn().mockResolvedValue({
			rows: [{ total: 10, active: 8, geo: 6, sterilized: 7, microchipped: 5,
				open: 3, resolved: 4, highPriority: 1, pending: 2,
				totalVisits: 20, recentVisits: 5, totalInsp: 15, passedInsp: 12,
				activeProviders: 3, totalInterventions: 8, totalCost: 5000,
				totalCER: 4, volunteerHours: 120, totalHealth: 30 }]
		})
	}
}));

vi.mock('$lib/server/db/schema.js', () => {
	const col = (name: string) => ({ name, organizationId: `${name}_orgId` });
	return {
		colonies: col('colonies'),
		cats: col('cats'),
		incidents: col('incidents'),
		cerActions: col('cerActions'),
		collaborators: col('collaborators'),
		visits: col('visits'),
		inspections: col('inspections'),
		providers: col('providers'),
		providerInterventions: col('providerInterventions'),
		volunteerHours: col('volunteerHours'),
		healthRecords: col('healthRecords')
	};
});

vi.mock('$lib/index.js', () => ({
	computeRate: (num: number, den: number) => den === 0 ? 0 : Math.round((num / den) * 100)
}));

import { extractStatValue, getStats } from '../../src/lib/server/stats.js';

describe('extractStatValue', () => {
	it('extracts number from first row', () => {
		expect(extractStatValue([{ total: 42 }], 'total')).toBe(42);
	});

	it('returns 0 for missing key', () => {
		expect(extractStatValue([{ total: 42 }], 'missing')).toBe(0);
	});

	it('returns 0 for null value', () => {
		expect(extractStatValue([{ total: null }], 'total')).toBe(0);
	});

	it('returns 0 for empty array', () => {
		expect(extractStatValue([], 'total')).toBe(0);
	});
});

describe('getStats', () => {
	it('returns a complete StatsSnapshot', async () => {
		const stats = await getStats('org-1');
		expect(stats).toHaveProperty('totalColonies');
		expect(stats).toHaveProperty('totalCats');
		expect(stats).toHaveProperty('sterilizationRate');
		expect(stats).toHaveProperty('totalIncidents');
		expect(stats).toHaveProperty('incidentResolutionRate');
		expect(stats).toHaveProperty('geoRate');
	});

	it('works without organizationId', async () => {
		const stats = await getStats();
		expect(stats).toHaveProperty('totalColonies');
	});

	it('works with null organizationId', async () => {
		const stats = await getStats(null);
		expect(stats).toHaveProperty('totalColonies');
	});

	it('all numeric fields are numbers', async () => {
		const stats = await getStats('org-1');
		for (const value of Object.values(stats)) {
			expect(typeof value).toBe('number');
		}
	});
});

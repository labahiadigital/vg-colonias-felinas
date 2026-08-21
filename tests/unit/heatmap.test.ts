import { describe, it, expect } from 'vitest';
import { buildHeatmapData, hasGeo, PRIORITY_WEIGHT } from '../../src/lib/server/heatmap.js';

describe('hasGeo', () => {
	it('returns true when both coordinates are present', () => {
		expect(hasGeo({ latitude: 42.85, longitude: -2.67 })).toBe(true);
	});

	it('returns false when latitude is null', () => {
		expect(hasGeo({ latitude: null, longitude: -2.67 })).toBe(false);
	});

	it('returns false when longitude is null', () => {
		expect(hasGeo({ latitude: 42.85, longitude: null })).toBe(false);
	});

	it('returns false when both are null', () => {
		expect(hasGeo({ latitude: null, longitude: null })).toBe(false);
	});

	it('accepts zero as valid coordinate', () => {
		expect(hasGeo({ latitude: 0, longitude: 0 })).toBe(true);
	});
});

describe('PRIORITY_WEIGHT', () => {
	it('assigns weight 3 to critical', () => {
		expect(PRIORITY_WEIGHT['critical']).toBe(3);
	});

	it('assigns weight 2 to high', () => {
		expect(PRIORITY_WEIGHT['high']).toBe(2);
	});

	it('returns undefined for unknown priorities', () => {
		expect(PRIORITY_WEIGHT['low']).toBeUndefined();
		expect(PRIORITY_WEIGHT['medium']).toBeUndefined();
	});
});

describe('buildHeatmapData', () => {
	const colonies = [
		{ id: 'c1', latitude: 42.85, longitude: -2.67, catCount: 5 },
		{ id: 'c2', latitude: 42.86, longitude: -2.68, catCount: 0 },
		{ id: 'c3', latitude: null, longitude: null, catCount: 3 }
	];

	const incidents = [
		{ latitude: 42.85, longitude: -2.67, priority: 'critical' },
		{ latitude: 42.86, longitude: -2.68, priority: 'low' },
		{ latitude: null, longitude: -2.69, priority: 'high' }
	];

	const visits = [
		{ colonyId: 'c1', visitCount: 10 },
		{ colonyId: 'c2', visitCount: 0 }
	];

	it('generates catDensity filtering out null-geo colonies', () => {
		const result = buildHeatmapData(colonies, [], []);
		expect(result.catDensity).toHaveLength(2);
	});

	it('uses catCount as intensity, defaulting 0 to 1', () => {
		const result = buildHeatmapData(colonies, [], []);
		expect(result.catDensity[0]).toEqual([42.85, -2.67, 5]);
		expect(result.catDensity[1]).toEqual([42.86, -2.68, 1]);
	});

	it('generates incidentFrequency with priority weights', () => {
		const result = buildHeatmapData([], incidents, []);
		expect(result.incidentFrequency).toHaveLength(2);
		expect(result.incidentFrequency[0]).toEqual([42.85, -2.67, 3]);
		expect(result.incidentFrequency[1]).toEqual([42.86, -2.68, 1]);
	});

	it('defaults unknown priority to weight 1', () => {
		const result = buildHeatmapData([], [{ latitude: 1, longitude: 2, priority: 'low' }], []);
		expect(result.incidentFrequency[0]![2]).toBe(1);
	});

	it('handles null priority', () => {
		const result = buildHeatmapData([], [{ latitude: 1, longitude: 2, priority: null }], []);
		expect(result.incidentFrequency[0]![2]).toBe(1);
	});

	it('generates volunteerActivity only for colonies with visits > 0', () => {
		const result = buildHeatmapData(colonies, [], visits);
		expect(result.volunteerActivity).toHaveLength(1);
		expect(result.volunteerActivity[0]).toEqual([42.85, -2.67, 10]);
	});

	it('returns empty arrays when all inputs are empty', () => {
		const result = buildHeatmapData([], [], []);
		expect(result.catDensity).toEqual([]);
		expect(result.incidentFrequency).toEqual([]);
		expect(result.volunteerActivity).toEqual([]);
	});

	it('excludes null-geo items from all layers', () => {
		const nullGeoColonies = [{ id: 'x', latitude: null, longitude: null, catCount: 5 }];
		const nullGeoIncidents = [{ latitude: null, longitude: null, priority: 'critical' as const }];
		const result = buildHeatmapData(nullGeoColonies, nullGeoIncidents, []);
		expect(result.catDensity).toHaveLength(0);
		expect(result.incidentFrequency).toHaveLength(0);
		expect(result.volunteerActivity).toHaveLength(0);
	});
});

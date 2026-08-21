type GeoPoint = { latitude: number | null; longitude: number | null };

export function hasGeo<T extends GeoPoint>(item: T): item is T & { latitude: number; longitude: number } {
	return item.latitude != null && item.longitude != null;
}

export const PRIORITY_WEIGHT: Record<string, number> = { critical: 3, high: 2 };

export function buildHeatmapData(
	allColonies: (GeoPoint & { id: string; catCount: number })[],
	allIncidents: (GeoPoint & { priority: string | null })[],
	visitsByColony: { colonyId: string; visitCount: number }[]
) {
	const visitCountMap = new Map(visitsByColony.map(v => [v.colonyId, Number(v.visitCount)]));

	return {
		catDensity: allColonies
			.filter(hasGeo)
			.map(c => [c.latitude, c.longitude, Number(c.catCount) || 1]),
		incidentFrequency: allIncidents
			.filter(hasGeo)
			.map(i => [i.latitude, i.longitude, PRIORITY_WEIGHT[i.priority ?? ''] ?? 1]),
		volunteerActivity: allColonies
			.filter(hasGeo)
			.map((c): [number, number, number] => [c.latitude, c.longitude, visitCountMap.get(c.id) ?? 0])
			.filter(v => v[2] > 0)
	};
}

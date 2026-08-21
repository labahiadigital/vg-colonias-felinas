/**
 * Typed adapter for Leaflet and its untyped plugins (leaflet.heat, leaflet-draw).
 *
 * Centralizes all `(L as any)` casts in one place so consuming Svelte components
 * work with typed functions and never touch `any` directly.
 *
 * Usage:
 *   import { createMap, addHeatLayer, addDrawControl } from '$lib/leaflet-adapter.js';
 */

import type * as L from 'leaflet';

export type LeafletModule = typeof L;

export interface HeatLayerOptions {
	radius?: number;
	blur?: number;
	maxZoom?: number;
	gradient?: Record<number, string>;
}

export interface DrawControlOptions {
	position?: string;
	draw?: {
		polygon?: { shapeOptions?: Record<string, unknown> } | false;
		polyline?: { shapeOptions?: Record<string, unknown> } | false;
		marker?: boolean;
		circle?: { shapeOptions?: Record<string, unknown> } | false;
		rectangle?: boolean | false;
		circlemarker?: boolean | false;
	};
	edit?: {
		featureGroup: L.FeatureGroup;
	};
}

/**
 * Dynamically imports Leaflet, initializes a map on the given container, and
 * adds the default tile layer. Returns both the module and the map instance.
 */
export async function createMap(
	container: HTMLElement,
	options: { center: [number, number]; zoom: number } = { center: [42.8467, -2.6716], zoom: 13 }
): Promise<{ L: LeafletModule; map: L.Map }> {
	const leaflet = await import('leaflet');
	const map = leaflet.map(container).setView(options.center, options.zoom);
	leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; OpenStreetMap'
	}).addTo(map);
	return { L: leaflet, map };
}

/**
 * Creates a heat layer via the leaflet.heat plugin.
 * Encapsulates the `(L as any).heatLayer(...)` cast.
 * Returns null if the plugin is not available.
 */
export async function addHeatLayer(
	leaflet: LeafletModule,
	group: L.LayerGroup,
	points: ReadonlyArray<readonly [number, number, (number | undefined)?]> | ReadonlyArray<readonly number[]> | Array<[number, number, number?]> | number[][],
	options: HeatLayerOptions = {}
): Promise<L.Layer | null> {
	if (points.length === 0) return null;
	try {
		await import('leaflet.heat');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- leaflet.heat augments L at runtime without types
		const layer = (leaflet as any).heatLayer(points, options);
		layer.addTo(group);
		return layer as L.Layer;
	} catch {
		return null;
	}
}

/**
 * Adds the leaflet-draw control to the map.
 * Encapsulates the `new (L as any).Control.Draw(...)` and event cast.
 * Returns the FeatureGroup that collects drawn items, or null if unavailable.
 */
export async function addDrawControl(
	leaflet: LeafletModule,
	map: L.Map,
	options?: DrawControlOptions
): Promise<L.FeatureGroup | null> {
	try {
		await import('leaflet-draw');
		const drawnItems = new leaflet.FeatureGroup();
		map.addLayer(drawnItems);

		const drawOpts = options ?? {
			position: 'topright',
			draw: {
				polygon: { shapeOptions: { color: '#0f766e', weight: 2, fillOpacity: 0.15 } },
				polyline: { shapeOptions: { color: '#0f766e', weight: 3 } },
				marker: true,
				circle: { shapeOptions: { color: '#f59e0b', weight: 2, fillOpacity: 0.1 } },
				rectangle: false,
				circlemarker: false
			},
			edit: { featureGroup: drawnItems }
		};

		if (!drawOpts.edit) {
			drawOpts.edit = { featureGroup: drawnItems };
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- leaflet-draw augments L.Control at runtime without types
		const drawControl = new (leaflet as any).Control.Draw(drawOpts);
		map.addControl(drawControl);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- leaflet-draw event constant
		map.on((leaflet as any).Draw.Event.CREATED, (e: { layer: L.Layer }) => {
			drawnItems.addLayer(e.layer);
		});

		return drawnItems;
	} catch {
		return null;
	}
}

/**
 * Creates a draggable marker on the map.
 * Returns the marker instance.
 */
export function createDraggableMarker(
	leaflet: LeafletModule,
	map: L.Map,
	position: [number, number],
	onDragEnd: (lat: number, lng: number) => void
): L.Marker {
	const marker = leaflet.marker(position, { draggable: true }).addTo(map);
	marker.on('dragend', () => {
		const pos = marker.getLatLng();
		onDragEnd(pos.lat, pos.lng);
	});
	return marker;
}

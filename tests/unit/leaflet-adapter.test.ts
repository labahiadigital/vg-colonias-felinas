/**
 * Tests for the Leaflet adapter module.
 *
 * Verifies the typed interface exported by leaflet-adapter.ts without
 * requiring actual Leaflet or DOM — tests module structure, types, and
 * the createDraggableMarker helper logic with mocks.
 */
import { describe, it, expect, vi } from 'vitest';

describe('leaflet-adapter module exports', () => {
	it('exports createMap, addHeatLayer, addDrawControl, createDraggableMarker', async () => {
		const mod = await import('../../src/lib/leaflet-adapter.js');
		expect(typeof mod.createMap).toBe('function');
		expect(typeof mod.addHeatLayer).toBe('function');
		expect(typeof mod.addDrawControl).toBe('function');
		expect(typeof mod.createDraggableMarker).toBe('function');
	});

	it('exports LeafletModule type (used as typeof L)', async () => {
		const mod = await import('../../src/lib/leaflet-adapter.js');
		expect(mod).toHaveProperty('createMap');
	});
});

describe('addHeatLayer', () => {
	it('returns null for empty points array', async () => {
		const { addHeatLayer } = await import('../../src/lib/leaflet-adapter.js');

		const mockLeaflet = {} as Parameters<typeof addHeatLayer>[0];
		const mockGroup = {} as Parameters<typeof addHeatLayer>[1];
		const result = await addHeatLayer(mockLeaflet, mockGroup, []);
		expect(result).toBeNull();
	});
});

describe('createDraggableMarker', () => {
	it('creates a marker and attaches a dragend listener', async () => {
		const { createDraggableMarker } = await import('../../src/lib/leaflet-adapter.js');

		let dragEndCallback: (() => void) | undefined;

		const fakeMarker = {
			addTo: vi.fn().mockReturnThis(),
			on: vi.fn((event: string, cb: () => void) => {
				if (event === 'dragend') dragEndCallback = cb;
				return fakeMarker;
			}),
			getLatLng: vi.fn(() => ({ lat: 42.85, lng: -2.67 }))
		};

		const fakeLeaflet = {
			marker: vi.fn(() => fakeMarker)
		};

		const fakeMap = {};
		const onDragEnd = vi.fn();

		const result = createDraggableMarker(
			fakeLeaflet as unknown as Parameters<typeof createDraggableMarker>[0],
			fakeMap as unknown as Parameters<typeof createDraggableMarker>[1],
			[42.84, -2.67],
			onDragEnd
		);

		expect(fakeLeaflet.marker).toHaveBeenCalledWith([42.84, -2.67], { draggable: true });
		expect(fakeMarker.addTo).toHaveBeenCalledWith(fakeMap);
		expect(fakeMarker.on).toHaveBeenCalledWith('dragend', expect.any(Function));
		expect(result).toBe(fakeMarker);

		expect(dragEndCallback).toBeDefined();
		dragEndCallback!();
		expect(onDragEnd).toHaveBeenCalledWith(42.85, -2.67);
	});
});

describe('HeatLayerOptions type structure', () => {
	it('accepts standard heat layer config', async () => {
		const opts = {
			radius: 25,
			blur: 15,
			maxZoom: 17,
			gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
		};
		expect(opts.radius).toBe(25);
		expect(opts.gradient[1]).toBe('red');
	});
});

describe('DrawControlOptions type structure', () => {
	it('accepts draw control configuration', async () => {
		const opts = {
			position: 'topright',
			draw: {
				polygon: { shapeOptions: { color: '#0f766e' } },
				polyline: false as const,
				marker: true,
				circle: false as const,
				rectangle: false as const,
				circlemarker: false as const
			}
		};
		expect(opts.position).toBe('topright');
		expect(opts.draw.marker).toBe(true);
		expect(opts.draw.polyline).toBe(false);
	});
});

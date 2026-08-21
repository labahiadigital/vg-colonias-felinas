import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: true }));

const STORAGE_KEY = 'gatopolis-dashboard-widgets';

const mockStorage: Record<string, string> = {};
const localStorageMock = {
	getItem: vi.fn((k: string) => mockStorage[k] ?? null),
	setItem: vi.fn((k: string, v: string) => { mockStorage[k] = v; }),
	removeItem: vi.fn((k: string) => { delete mockStorage[k]; }),
	clear: vi.fn(() => { for (const k in mockStorage) delete mockStorage[k]; })
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

import {
	getWidgetConfig,
	saveWidgetConfig,
	toggleWidget,
	reorderWidgets,
	type WidgetConfig
} from '../../src/lib/stores/dashboard.js';

beforeEach(() => {
	localStorageMock.getItem.mockClear();
	localStorageMock.setItem.mockClear();
	for (const k in mockStorage) delete mockStorage[k];
});

describe('getWidgetConfig', () => {
	it('returns defaults when localStorage is empty', () => {
		const config = getWidgetConfig();
		expect(config).toHaveLength(6);
		expect(config[0].id).toBe('kpis');
		expect(config[0].visible).toBe(true);
	});

	it('returns parsed data from localStorage', () => {
		const custom = [{ id: 'test', visible: false, order: 0 }];
		mockStorage[STORAGE_KEY] = JSON.stringify(custom);
		const config = getWidgetConfig();
		expect(config).toEqual(custom);
	});

	it('returns defaults for corrupted JSON', () => {
		mockStorage[STORAGE_KEY] = '{invalid json';
		const config = getWidgetConfig();
		expect(config).toHaveLength(6);
	});
});

describe('saveWidgetConfig', () => {
	it('writes to localStorage', () => {
		const widgets: WidgetConfig[] = [{ id: 'a', visible: true, order: 0 }];
		saveWidgetConfig(widgets);
		expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(widgets));
	});
});

describe('toggleWidget', () => {
	it('toggles visibility of target widget', () => {
		const widgets: WidgetConfig[] = [
			{ id: 'a', visible: true, order: 0 },
			{ id: 'b', visible: true, order: 1 }
		];
		const result = toggleWidget(widgets, 'a');
		expect(result[0].visible).toBe(false);
		expect(result[1].visible).toBe(true);
	});

	it('saves to localStorage after toggle', () => {
		const widgets: WidgetConfig[] = [{ id: 'x', visible: false, order: 0 }];
		toggleWidget(widgets, 'x');
		expect(localStorageMock.setItem).toHaveBeenCalled();
	});

	it('does not modify non-matching widgets', () => {
		const widgets: WidgetConfig[] = [
			{ id: 'a', visible: true, order: 0 },
			{ id: 'b', visible: false, order: 1 }
		];
		const result = toggleWidget(widgets, 'nonexistent');
		expect(result[0].visible).toBe(true);
		expect(result[1].visible).toBe(false);
	});
});

describe('reorderWidgets', () => {
	it('moves widget from index 0 to index 2', () => {
		const widgets: WidgetConfig[] = [
			{ id: 'a', visible: true, order: 0 },
			{ id: 'b', visible: true, order: 1 },
			{ id: 'c', visible: true, order: 2 }
		];
		const result = reorderWidgets(widgets, 0, 2);
		expect(result.map(w => w.id)).toEqual(['b', 'c', 'a']);
		expect(result.every((w, i) => w.order === i)).toBe(true);
	});

	it('moves widget from index 2 to index 0', () => {
		const widgets: WidgetConfig[] = [
			{ id: 'a', visible: true, order: 0 },
			{ id: 'b', visible: true, order: 1 },
			{ id: 'c', visible: true, order: 2 }
		];
		const result = reorderWidgets(widgets, 2, 0);
		expect(result.map(w => w.id)).toEqual(['c', 'a', 'b']);
	});

	it('saves to localStorage after reorder', () => {
		const widgets: WidgetConfig[] = [
			{ id: 'a', visible: true, order: 0 },
			{ id: 'b', visible: true, order: 1 }
		];
		reorderWidgets(widgets, 0, 1);
		expect(localStorageMock.setItem).toHaveBeenCalled();
	});

	it('handles invalid index gracefully', () => {
		const widgets: WidgetConfig[] = [{ id: 'a', visible: true, order: 0 }];
		const result = reorderWidgets(widgets, 5, 0);
		expect(result).toHaveLength(1);
	});
});

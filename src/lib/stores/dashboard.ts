import { browser } from '$app/environment';

export interface WidgetConfig {
	id: string;
	visible: boolean;
	order: number;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
	{ id: 'kpis', visible: true, order: 0 },
	{ id: 'recent-activity', visible: true, order: 1 },
	{ id: 'quick-actions', visible: true, order: 2 },
	{ id: 'map-preview', visible: true, order: 3 },
	{ id: 'onboarding', visible: true, order: 4 },
	{ id: 'pending-tasks', visible: true, order: 5 }
];

const STORAGE_KEY = 'gatopolis-dashboard-widgets';

export function getWidgetConfig(): WidgetConfig[] {
	if (!browser) return DEFAULT_WIDGETS;
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored) {
		try {
			return JSON.parse(stored);
		} catch {
			return DEFAULT_WIDGETS;
		}
	}
	return DEFAULT_WIDGETS;
}

export function saveWidgetConfig(widgets: WidgetConfig[]) {
	if (browser) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
	}
}

export function toggleWidget(widgets: WidgetConfig[], widgetId: string): WidgetConfig[] {
	const updated = widgets.map(w =>
		w.id === widgetId ? { ...w, visible: !w.visible } : w
	);
	saveWidgetConfig(updated);
	return updated;
}

export function reorderWidgets(widgets: WidgetConfig[], fromIndex: number, toIndex: number): WidgetConfig[] {
	const arr = [...widgets];
	const removed = arr.splice(fromIndex, 1)[0];
	if (!removed) return arr;
	arr.splice(toIndex, 0, removed);
	const updated = arr.map((w, i) => ({ ...w, order: i }));
	saveWidgetConfig(updated);
	return updated;
}

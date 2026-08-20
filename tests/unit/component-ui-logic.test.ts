import { describe, it, expect } from 'vitest';

interface Option { value: string; label: string; subtitle?: string }

function filterOptions(options: Option[], query: string, limit = 8): Option[] {
	if (query.length === 0) return options.slice(0, limit);
	return options.filter(o =>
		o.label.toLowerCase().includes(query.toLowerCase()) ||
		(o.subtitle?.toLowerCase().includes(query.toLowerCase()) ?? false)
	).slice(0, limit);
}

interface Command {
	id: string;
	label: string;
	section: string;
	href?: string;
	shortcut?: string;
}

function filterCommands(commands: Command[], query: string): Command[] {
	const q = query.toLowerCase().trim();
	if (!q) return commands;
	return commands.filter(c =>
		c.label.toLowerCase().includes(q) ||
		c.section.toLowerCase().includes(q)
	);
}

const statusConfig: Record<string, { dot: string; bg: string }> = {
	success: { dot: 'bg-success', bg: 'bg-success/8 text-success' },
	warning: { dot: 'bg-warning', bg: 'bg-warning/8 text-warning' },
	danger: { dot: 'bg-danger', bg: 'bg-danger/8 text-danger' },
	info: { dot: 'bg-info', bg: 'bg-info/8 text-info' },
	default: { dot: 'bg-primary', bg: 'bg-primary/8 text-primary' },
	muted: { dot: 'bg-text-muted', bg: 'bg-surface-sunken text-text-muted' }
};

function getStatusStyle(status: string): { dot: string; bg: string } {
	return statusConfig[status] ?? statusConfig.default;
}

describe('Autocomplete: filterOptions', () => {
	const options: Option[] = [
		{ value: '1', label: 'Colonia Centro', subtitle: 'Distrito Centro' },
		{ value: '2', label: 'Colonia Norte', subtitle: 'Distrito Norte' },
		{ value: '3', label: 'Gato Luna', subtitle: 'Hembra' },
		{ value: '4', label: 'Gato Sol', subtitle: 'Macho' }
	];

	it('returns first 8 when query is empty', () => {
		const result = filterOptions(options, '');
		expect(result).toHaveLength(4);
	});

	it('filters by label', () => {
		const result = filterOptions(options, 'Luna');
		expect(result).toHaveLength(1);
		expect(result[0].label).toBe('Gato Luna');
	});

	it('filters by subtitle', () => {
		const result = filterOptions(options, 'Macho');
		expect(result).toHaveLength(1);
		expect(result[0].label).toBe('Gato Sol');
	});

	it('is case-insensitive', () => {
		const result = filterOptions(options, 'colonia');
		expect(result).toHaveLength(2);
	});

	it('limits results to 8', () => {
		const many = Array.from({ length: 20 }, (_, i) => ({ value: `${i}`, label: `Item ${i}` }));
		const result = filterOptions(many, 'Item');
		expect(result).toHaveLength(8);
	});

	it('returns empty for no matches', () => {
		const result = filterOptions(options, 'xyz');
		expect(result).toHaveLength(0);
	});
});

describe('CommandPalette: filterCommands', () => {
	const commands: Command[] = [
		{ id: 'dashboard', label: 'Ir al Dashboard', section: 'Navegación', href: '/dashboard' },
		{ id: 'colonias', label: 'Ver Colonias', section: 'Navegación', href: '/colonias' },
		{ id: 'gatos', label: 'Ver Gatos', section: 'Navegación', href: '/gatos' },
		{ id: 'exportar', label: 'Exportar PDF', section: 'Informes', href: '/api/export-pdf' }
	];

	it('returns all commands for empty query', () => {
		const result = filterCommands(commands, '');
		expect(result).toHaveLength(4);
	});

	it('filters by label', () => {
		const result = filterCommands(commands, 'Dashboard');
		expect(result).toHaveLength(1);
	});

	it('filters by section', () => {
		const result = filterCommands(commands, 'Informes');
		expect(result).toHaveLength(1);
	});

	it('is case-insensitive', () => {
		const result = filterCommands(commands, 'gatos');
		expect(result).toHaveLength(1);
	});

	it('returns empty for no match', () => {
		const result = filterCommands(commands, 'zzzzz');
		expect(result).toHaveLength(0);
	});
});

describe('StatusBadge: getStatusStyle', () => {
	it('returns success style', () => {
		const style = getStatusStyle('success');
		expect(style.dot).toBe('bg-success');
	});

	it('returns warning style', () => {
		const style = getStatusStyle('warning');
		expect(style.dot).toBe('bg-warning');
	});

	it('returns danger style', () => {
		const style = getStatusStyle('danger');
		expect(style.dot).toBe('bg-danger');
	});

	it('returns info style', () => {
		const style = getStatusStyle('info');
		expect(style.dot).toBe('bg-info');
	});

	it('returns default style for unknown status', () => {
		const style = getStatusStyle('unknown');
		expect(style.dot).toBe('bg-primary');
	});

	it('returns muted style', () => {
		const style = getStatusStyle('muted');
		expect(style.dot).toBe('bg-text-muted');
	});
});

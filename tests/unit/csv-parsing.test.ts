import { describe, it, expect } from 'vitest';

function parseCsv(text: string): Record<string, string>[] {
	const lines = text.split(/\r?\n/).filter(l => l.trim());
	if (lines.length < 2) return [];
	const sep = lines[0].includes(';') ? ';' : ',';
	const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ''));
	return lines.slice(1).map(line => {
		const values: string[] = [];
		let current = '';
		let inQuotes = false;
		for (const ch of line) {
			if (ch === '"') { inQuotes = !inQuotes; continue; }
			if (ch === sep[0] && !inQuotes) { values.push(current.trim()); current = ''; continue; }
			current += ch;
		}
		values.push(current.trim());
		const row: Record<string, string> = {};
		headers.forEach((h, i) => { row[h] = values[i] || ''; });
		return row;
	});
}

function csvEscape(val: unknown): string {
	if (val === null || val === undefined) return '';
	const str = String(val);
	if (str.includes(',') || str.includes('"') || str.includes('\n')) {
		return '"' + str.replace(/"/g, '""') + '"';
	}
	return str;
}

function toCSV(headers: string[], rows: unknown[][]): string {
	const bom = '\uFEFF';
	const headerLine = headers.map(csvEscape).join(',');
	const dataLines = rows.map(row => row.map(csvEscape).join(','));
	return bom + [headerLine, ...dataLines].join('\r\n');
}

function toCsvSemicolon(rows: Record<string, unknown>[]): string {
	if (rows.length === 0) return '';
	const headers = Object.keys(rows[0]);
	const lines = [
		headers.join(';'),
		...rows.map(row =>
			headers.map(h => {
				const val = row[h];
				if (val === null || val === undefined) return '';
				if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
				const str = String(val);
				if (str.includes(';') || str.includes('"') || str.includes('\n')) {
					return `"${str.replace(/"/g, '""')}"`;
				}
				return str;
			}).join(';')
		)
	];
	return '\uFEFF' + lines.join('\r\n');
}

describe('parseCsv', () => {
	it('parses comma-separated CSV', () => {
		const csv = 'name,status,district\nColonia A,active,Centro\nColonia B,inactive,Norte';
		const result = parseCsv(csv);
		expect(result).toHaveLength(2);
		expect(result[0].name).toBe('Colonia A');
		expect(result[0].status).toBe('active');
		expect(result[1].district).toBe('Norte');
	});

	it('parses semicolon-separated CSV', () => {
		const csv = 'name;status;district\nColonia A;active;Centro';
		const result = parseCsv(csv);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('Colonia A');
	});

	it('handles quoted fields with commas', () => {
		const csv = 'name,description\nColonia A,"Desc with, comma"';
		const result = parseCsv(csv);
		expect(result[0].description).toBe('Desc with, comma');
	});

	it('handles empty lines', () => {
		const csv = 'name,status\n\nColonia A,active\n\n';
		const result = parseCsv(csv);
		expect(result.length).toBeGreaterThanOrEqual(1);
	});

	it('returns empty array for header-only CSV', () => {
		const csv = 'name,status';
		const result = parseCsv(csv);
		expect(result).toHaveLength(0);
	});

	it('returns empty array for empty string', () => {
		expect(parseCsv('')).toHaveLength(0);
	});

	it('handles missing values', () => {
		const csv = 'name,status,district\nColonia A,active';
		const result = parseCsv(csv);
		expect(result[0].district).toBe('');
	});

	it('strips quotes from headers', () => {
		const csv = '"name","status"\nTest,active';
		const result = parseCsv(csv);
		expect(result[0].name).toBe('Test');
	});
});

describe('csvEscape', () => {
	it('returns empty string for null', () => {
		expect(csvEscape(null)).toBe('');
	});

	it('returns empty string for undefined', () => {
		expect(csvEscape(undefined)).toBe('');
	});

	it('returns plain string for safe values', () => {
		expect(csvEscape('hello')).toBe('hello');
	});

	it('wraps and escapes strings with commas', () => {
		expect(csvEscape('hello, world')).toBe('"hello, world"');
	});

	it('escapes double quotes', () => {
		expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
	});

	it('wraps strings with newlines', () => {
		expect(csvEscape('line1\nline2')).toBe('"line1\nline2"');
	});

	it('converts numbers to string', () => {
		expect(csvEscape(42)).toBe('42');
	});
});

describe('toCSV', () => {
	it('generates CSV with BOM', () => {
		const result = toCSV(['Name', 'Age'], [['Alice', 30], ['Bob', 25]]);
		expect(result.startsWith('\uFEFF')).toBe(true);
		expect(result).toContain('Name,Age');
		expect(result).toContain('Alice,30');
	});

	it('handles empty rows', () => {
		const result = toCSV(['A', 'B'], []);
		expect(result).toBe('\uFEFFA,B');
	});

	it('escapes special characters in cells', () => {
		const result = toCSV(['Name'], [['Hello, "World"']]);
		expect(result).toContain('"Hello, ""World"""');
	});
});

describe('toCsvSemicolon (full export)', () => {
	it('returns empty for no rows', () => {
		expect(toCsvSemicolon([])).toBe('');
	});

	it('generates semicolon-separated CSV', () => {
		const result = toCsvSemicolon([{ name: 'A', value: 1 }, { name: 'B', value: 2 }]);
		expect(result).toContain('name;value');
		expect(result).toContain('A;1');
	});

	it('handles null/undefined values', () => {
		const result = toCsvSemicolon([{ name: 'A', extra: null }]);
		expect(result).toContain('A;');
	});

	it('serializes nested objects as JSON (escaped in CSV)', () => {
		const result = toCsvSemicolon([{ name: 'A', data: { key: 'val' } }]);
		expect(result).toContain('key');
		expect(result).toContain('val');
	});

	it('escapes semicolons in values', () => {
		const result = toCsvSemicolon([{ name: 'Hello; World' }]);
		expect(result).toContain('"Hello; World"');
	});
});

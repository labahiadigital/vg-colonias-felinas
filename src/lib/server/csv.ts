const BOM = '\uFEFF';

export function csvEscape(val: unknown): string {
	if (val === null || val === undefined) return '';
	const str = String(val);
	if (str.includes(',') || str.includes(';') || str.includes('"') || str.includes('\n')) {
		return '"' + str.replace(/"/g, '""') + '"';
	}
	return str;
}

export function toCSV(headers: string[], rows: unknown[][], separator = ','): string {
	const headerLine = headers.map(csvEscape).join(separator);
	const dataLines = rows.map(row => row.map(csvEscape).join(separator));
	return BOM + [headerLine, ...dataLines].join('\r\n');
}

export function toCsvFromRecords(rows: Record<string, unknown>[], separator = ';'): string {
	if (rows.length === 0) return '';
	const first = rows[0];
	if (!first) return '';
	const headers = Object.keys(first);
	const lines = [
		headers.join(separator),
		...rows.map(row =>
			headers.map(h => {
				const val = row[h];
				if (val === null || val === undefined) return '';
				if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
				return csvEscape(val);
			}).join(separator)
		)
	];
	return BOM + lines.join('\r\n');
}

export function parseCsv(text: string): Record<string, string>[] {
	const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim());
	if (lines.length < 2) return [];
	const headerLine = lines[0]!;
	const sep = headerLine.includes(';') ? ';' : ',';
	const headers = headerLine.split(sep).map(h => h.trim().replace(/^"|"$/g, ''));
	return lines.slice(1).map(line => {
		const values: string[] = [];
		let current = '';
		let inQuotes = false;
		for (let i = 0; i < line.length; i++) {
			const ch = line[i];
			if (inQuotes) {
				if (ch === '"') {
					if (i + 1 < line.length && line[i + 1] === '"') {
						current += '"';
						i++;
					} else {
						inQuotes = false;
					}
				} else {
					current += ch;
				}
			} else {
				if (ch === '"') {
					inQuotes = true;
				} else if (ch === sep[0]) {
					values.push(current.trim());
					current = '';
				} else {
					current += ch;
				}
			}
		}
		values.push(current.trim());
		const row: Record<string, string> = {};
		headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
		return row;
	});
}

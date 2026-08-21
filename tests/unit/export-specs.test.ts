import { describe, it, expect } from 'vitest';
import { EXPORT_SPECS, EXPORT_TYPES } from '../../src/lib/server/export-specs.js';

const EXPECTED_ENTITIES = ['colonies', 'cats', 'incidents', 'collaborators', 'cer', 'health'];

describe('EXPORT_SPECS coverage', () => {
	it('covers all expected entity types', () => {
		for (const entity of EXPECTED_ENTITIES) {
			expect(EXPORT_SPECS).toHaveProperty(entity);
		}
	});

	it('EXPORT_TYPES matches EXPORT_SPECS keys', () => {
		expect(EXPORT_TYPES.sort()).toEqual(Object.keys(EXPORT_SPECS).sort());
	});

	it('has no unexpected extra entity types', () => {
		for (const key of Object.keys(EXPORT_SPECS)) {
			expect(EXPECTED_ENTITIES).toContain(key);
		}
	});
});

describe('EXPORT_SPECS structure', () => {
	for (const [name, spec] of Object.entries(EXPORT_SPECS)) {
		describe(`${name} spec`, () => {
			it('has a table with organizationId column', () => {
				expect(spec.table).toBeDefined();
				expect(spec.table).toHaveProperty('organizationId');
			});

			it('has non-empty headers array', () => {
				expect(spec.headers.length).toBeGreaterThan(0);
			});

			it('headers always start with ID', () => {
				expect(spec.headers[0]).toBe('ID');
			});

			it('has a row mapper function', () => {
				expect(typeof spec.row).toBe('function');
			});

			it('has a non-empty filename', () => {
				expect(spec.filename.length).toBeGreaterThan(0);
			});
		});
	}
});

describe('EXPORT_SPECS row mappers', () => {
	it('colonies row mapper extracts expected fields', () => {
		const row = {
			id: 'c1', name: 'Norte', status: 'active', classification: 'urban',
			district: 'Centro', description: 'Test', latitude: 42.85, longitude: -2.67,
			createdAt: new Date('2024-01-15')
		};
		const result = EXPORT_SPECS.colonies!.row(row);
		expect(result).toHaveLength(EXPORT_SPECS.colonies!.headers.length);
		expect(result[0]).toBe('c1');
		expect(result[1]).toBe('Norte');
	});

	it('cats row mapper converts boolean sterilized to Sí/No', () => {
		const sterilized = EXPORT_SPECS.cats!.row({ sterilized: true });
		const notSterilized = EXPORT_SPECS.cats!.row({ sterilized: false });
		expect(sterilized).toContain('Sí');
		expect(notSterilized).toContain('No');
	});

	it('collaborators row mapper converts boolean privacyNoticeSigned to Sí/No', () => {
		const signed = EXPORT_SPECS.collaborators!.row({ privacyNoticeSigned: true });
		const unsigned = EXPORT_SPECS.collaborators!.row({ privacyNoticeSigned: false });
		expect(signed).toContain('Sí');
		expect(unsigned).toContain('No');
	});

	it('row mapper output length matches headers for all specs', () => {
		const emptyRow: Record<string, unknown> = {};
		for (const [name, spec] of Object.entries(EXPORT_SPECS)) {
			const result = spec.row(emptyRow);
			expect(result).toHaveLength(spec.headers.length);
		}
	});
});

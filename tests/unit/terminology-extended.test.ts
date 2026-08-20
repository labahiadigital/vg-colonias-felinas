import { describe, it, expect } from 'vitest';
import { getProfileForCountry, term, getTerminology, getAllProfiles } from '../../src/lib/utils/terminology.js';

describe('getAllProfiles', () => {
	it('returns at least 3 profiles (CER, TNR, TNVR)', () => {
		const profiles = getAllProfiles();
		expect(profiles.length).toBeGreaterThanOrEqual(3);
	});

	it('each profile has required fields', () => {
		const profiles = getAllProfiles();
		for (const p of profiles) {
			expect(p.profile).toBeDefined();
			expect(p.label).toBeDefined();
			expect(p.terms.programName).toBeDefined();
			expect(p.terms.capture).toBeDefined();
			expect(p.terms.sterilize).toBeDefined();
		}
	});
});

describe('getProfileForCountry', () => {
	it('ES uses CER', () => {
		expect(getProfileForCountry('ES')).toBe('CER');
	});

	it('PT uses CER', () => {
		expect(getProfileForCountry('PT')).toBe('CER');
	});

	it('IT uses TNR', () => {
		expect(getProfileForCountry('IT')).toBe('TNR');
	});

	it('FR uses TNR', () => {
		expect(getProfileForCountry('FR')).toBe('TNR');
	});

	it('US uses TNVR', () => {
		expect(getProfileForCountry('US')).toBe('TNVR');
	});

	it('returns CER as default for unknown country', () => {
		expect(getProfileForCountry('XX')).toBe('CER');
	});

	it('handles lowercase input', () => {
		expect(getProfileForCountry('es')).toBe('CER');
	});
});

describe('term', () => {
	it('returns Captura for ES capture', () => {
		expect(term('ES', 'capture')).toBe('Captura');
	});

	it('returns CER for ES programName', () => {
		expect(term('ES', 'programName')).toBe('CER');
	});

	it('returns Trap for GB capture', () => {
		expect(term('GB', 'capture')).toBe('Trap');
	});

	it('returns TNR for FR programName', () => {
		expect(term('FR', 'programName')).toBe('TNR');
	});

	it('returns TNVR for US programName', () => {
		expect(term('US', 'programName')).toBe('TNVR');
	});
});

describe('getTerminology', () => {
	it('returns full terms object for ES', () => {
		const t = getTerminology('ES');
		expect(t.programName).toBe('CER');
		expect(t.capture).toBe('Captura');
		expect(t.sterilize).toBe('Esterilización');
		expect(t.return).toBe('Retorno');
		expect(t.colony).toBe('Colonia felina');
		expect(t.feeder).toBe('Alimentador/a');
		expect(t.caretaker).toBe('Persona cuidadora');
	});

	it('returns full terms object for US', () => {
		const t = getTerminology('US');
		expect(t.programName).toBe('TNVR');
		expect(t.capture).toBe('Trap');
		expect(t.colony).toBe('Managed colony');
	});
});

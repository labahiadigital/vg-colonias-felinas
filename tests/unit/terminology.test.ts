import { describe, it, expect } from 'vitest';
import { getTerminology, getProfileForCountry, term, getAllProfiles } from '../../src/lib/utils/terminology.js';

describe('getProfileForCountry', () => {
	it('returns CER for Spain', () => {
		expect(getProfileForCountry('ES')).toBe('CER');
	});

	it('returns CER for Portugal', () => {
		expect(getProfileForCountry('PT')).toBe('CER');
	});

	it('returns TNR for Italy', () => {
		expect(getProfileForCountry('IT')).toBe('TNR');
	});

	it('returns TNR for France', () => {
		expect(getProfileForCountry('FR')).toBe('TNR');
	});

	it('returns TNR for UK', () => {
		expect(getProfileForCountry('GB')).toBe('TNR');
	});

	it('returns TNVR for US', () => {
		expect(getProfileForCountry('US')).toBe('TNVR');
	});

	it('defaults to CER for unknown country', () => {
		expect(getProfileForCountry('ZZ')).toBe('CER');
	});

	it('handles lowercase country codes', () => {
		expect(getProfileForCountry('es')).toBe('CER');
	});
});

describe('getTerminology', () => {
	it('returns Spanish CER terms for Spain', () => {
		const terms = getTerminology('ES');
		expect(terms.programName).toBe('CER');
		expect(terms.capture).toBe('Captura');
		expect(terms.sterilize).toBe('Esterilización');
		expect(terms.return).toBe('Retorno');
		expect(terms.regulatoryLaw).toBe('Ley 7/2023');
	});

	it('returns English TNR terms for UK', () => {
		const terms = getTerminology('GB');
		expect(terms.programName).toBe('TNR');
		expect(terms.capture).toBe('Trap');
		expect(terms.sterilize).toBe('Neuter');
		expect(terms.return).toBe('Return');
	});

	it('returns TNVR terms for US including vaccination', () => {
		const terms = getTerminology('US');
		expect(terms.programName).toBe('TNVR');
		expect(terms.programNameFull).toBe('Trap-Neuter-Vaccinate-Return');
		expect(terms.vaccinate).toContain('rabies');
	});
});

describe('term helper', () => {
	it('returns specific term for a country', () => {
		expect(term('ES', 'programName')).toBe('CER');
		expect(term('US', 'programName')).toBe('TNVR');
		expect(term('IT', 'colony')).toBe('Cat colony');
	});
});

describe('getAllProfiles', () => {
	it('returns 3 profiles', () => {
		const profiles = getAllProfiles();
		expect(profiles).toHaveLength(3);
	});

	it('includes CER, TNR, and TNVR', () => {
		const profiles = getAllProfiles();
		const names = profiles.map(p => p.profile);
		expect(names).toContain('CER');
		expect(names).toContain('TNR');
		expect(names).toContain('TNVR');
	});
});

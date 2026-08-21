import { describe, it, expect } from 'vitest';
import { scoreCat, rankMatches, type CatRecord, type AIAnalysis } from '../../src/lib/server/cat-scoring.js';

describe('Cat identification scoring', () => {
	it('gives 0 for no matches', () => {
		const cat: CatRecord = { id: '1', name: 'Luna', sex: 'female', estimatedAge: 'adulto' };
		const analysis: AIAnalysis = { color: 'verde', pattern: 'unicornio' };
		expect(scoreCat(cat, analysis)).toBe(0);
	});

	it('gives 20 points for color in name', () => {
		const cat: CatRecord = { id: '1', name: 'Negro', sex: null, estimatedAge: null };
		const analysis: AIAnalysis = { color: 'negro' };
		expect(scoreCat(cat, analysis)).toBeGreaterThanOrEqual(20);
	});

	it('gives 15 points for color term match', () => {
		const cat: CatRecord = { id: '1', name: 'Blanco', sex: null, estimatedAge: null };
		const analysis: AIAnalysis = { color: 'blanco', pattern: '' };
		expect(scoreCat(cat, analysis)).toBeGreaterThanOrEqual(15);
	});

	it('gives 10 points for sex match (macho/male)', () => {
		const cat: CatRecord = { id: '1', name: 'Michi', sex: 'male', estimatedAge: null };
		const analysis: AIAnalysis = { color: '', sex_guess: 'macho' };
		expect(scoreCat(cat, analysis)).toBe(10);
	});

	it('gives 10 points for sex match (hembra/female)', () => {
		const cat: CatRecord = { id: '1', name: 'Michi', sex: 'female', estimatedAge: null };
		const analysis: AIAnalysis = { color: '', sex_guess: 'hembra' };
		expect(scoreCat(cat, analysis)).toBe(10);
	});

	it('gives 0 for sex mismatch', () => {
		const cat: CatRecord = { id: '1', name: 'Michi', sex: 'male', estimatedAge: null };
		const analysis: AIAnalysis = { color: '', sex_guess: 'hembra' };
		expect(scoreCat(cat, analysis)).toBe(0);
	});

	it('gives 5 points for age match', () => {
		const cat: CatRecord = { id: '1', name: 'Michi', sex: null, estimatedAge: 'adulto' };
		const analysis: AIAnalysis = { color: '', estimatedAge: 'adulto' };
		expect(scoreCat(cat, analysis)).toBe(5);
	});

	it('ignores indeterminado sex_guess', () => {
		const cat: CatRecord = { id: '1', name: 'Michi', sex: 'male', estimatedAge: null };
		const analysis: AIAnalysis = { color: '', sex_guess: 'indeterminado' };
		expect(scoreCat(cat, analysis)).toBe(0);
	});

	it('accumulates multiple match types', () => {
		const cat: CatRecord = { id: '1', name: 'Negro', sex: 'male', estimatedAge: 'adulto' };
		const analysis: AIAnalysis = { color: 'negro', pattern: '', sex_guess: 'macho', estimatedAge: 'adulto' };
		const score = scoreCat(cat, analysis);
		expect(score).toBeGreaterThanOrEqual(35);
	});

	it('handles null name gracefully', () => {
		const cat: CatRecord = { id: '1', name: null, sex: 'female', estimatedAge: null };
		const analysis: AIAnalysis = { color: 'negro' };
		expect(scoreCat(cat, analysis)).toBe(0);
	});

	it('handles empty analysis', () => {
		const cat: CatRecord = { id: '1', name: 'Negro', sex: 'male', estimatedAge: 'adulto' };
		const analysis: AIAnalysis = {};
		expect(scoreCat(cat, analysis)).toBe(0);
	});

	it('pattern match contributes to score', () => {
		const cat: CatRecord = { id: '1', name: 'Tigre', sex: null, estimatedAge: null };
		const analysis: AIAnalysis = { color: '', pattern: 'atigrado' };
		expect(scoreCat(cat, analysis)).toBeGreaterThanOrEqual(15);
	});
});

describe('rankMatches', () => {
	const cats: CatRecord[] = [
		{ id: '1', name: 'Negro', sex: 'male', estimatedAge: 'adulto' },
		{ id: '2', name: 'Blanco', sex: 'female', estimatedAge: 'joven' },
		{ id: '3', name: 'Luna', sex: 'female', estimatedAge: 'adulto' },
		{ id: '4', name: 'Tigre', sex: 'male', estimatedAge: 'adulto' }
	];

	it('returns top matches sorted by score desc', () => {
		const analysis: AIAnalysis = { color: 'negro', pattern: '', sex_guess: 'macho', estimatedAge: 'adulto' };
		const results = rankMatches(cats, analysis);
		expect(results.length).toBeGreaterThan(0);
		expect(results[0]!.id).toBe('1');
		for (let i = 1; i < results.length; i++) {
			expect(results[i]!.score).toBeLessThanOrEqual(results[i - 1]!.score);
		}
	});

	it('excludes cats with score 0', () => {
		const analysis: AIAnalysis = { color: 'verde' };
		const results = rankMatches(cats, analysis);
		expect(results.length).toBe(0);
	});

	it('respects limit parameter', () => {
		const analysis: AIAnalysis = { color: 'negro', pattern: 'atigrado', sex_guess: 'macho', estimatedAge: 'adulto' };
		const results = rankMatches(cats, analysis, 1);
		expect(results.length).toBeLessThanOrEqual(1);
	});
});

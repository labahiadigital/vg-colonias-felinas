import { describe, it, expect } from 'vitest';

interface CatRecord {
	id: string;
	name: string | null;
	sex: string | null;
	estimatedAge: string | null;
}

interface AIAnalysis {
	color?: string;
	pattern?: string;
	sex_guess?: string;
	estimatedAge?: string;
}

function scoreCat(cat: CatRecord, analysis: AIAnalysis): number {
	let score = 0;
	const colorLower = (analysis.color ?? '').toLowerCase();
	const patternLower = (analysis.pattern ?? '').toLowerCase();
	const name = (cat.name ?? '').toLowerCase();

	if (colorLower && name.includes(colorLower)) score += 20;

	const colorTerms: Record<string, string[]> = {
		negro: ['negro', 'negra', 'black', 'oscuro'],
		blanco: ['blanco', 'blanca', 'white'],
		naranja: ['naranja', 'orange', 'ginger', 'rojo', 'pelirrojo'],
		gris: ['gris', 'grey', 'gray', 'azul'],
		atigrado: ['atigrado', 'tabby', 'rayas', 'tigre'],
		tricolor: ['tricolor', 'calico', 'carey', 'tortoiseshell'],
		siames: ['siames', 'siamese', 'point']
	};

	for (const [, terms] of Object.entries(colorTerms)) {
		const matchesColor = terms.some(t => colorLower.includes(t) || patternLower.includes(t));
		const matchesName = terms.some(t => name.includes(t));
		if (matchesColor && matchesName) score += 15;
	}

	if (analysis.sex_guess && analysis.sex_guess !== 'indeterminado' && cat.sex) {
		const aiSex = analysis.sex_guess.toLowerCase();
		const catSex = cat.sex.toLowerCase();
		if ((aiSex.includes('macho') && catSex === 'male') ||
			(aiSex.includes('hembra') && catSex === 'female')) {
			score += 10;
		}
	}

	if (analysis.estimatedAge && cat.estimatedAge) {
		const aiAge = analysis.estimatedAge.toLowerCase();
		const catAge = cat.estimatedAge.toLowerCase();
		if (aiAge === catAge) score += 5;
	}

	return score;
}

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

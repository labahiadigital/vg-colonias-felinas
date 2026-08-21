export interface CatRecord {
	id: string;
	name: string | null;
	sex: string | null;
	estimatedAge: string | null;
}

export interface AIAnalysis {
	description?: string;
	color?: string;
	pattern?: string;
	distinctiveFeatures?: string[];
	estimatedAge?: string;
	sex_guess?: string;
}

const COLOR_TERMS: Record<string, string[]> = {
	negro: ['negro', 'negra', 'black', 'oscuro'],
	blanco: ['blanco', 'blanca', 'white'],
	naranja: ['naranja', 'orange', 'ginger', 'rojo', 'pelirrojo'],
	gris: ['gris', 'grey', 'gray', 'azul'],
	atigrado: ['atigrado', 'tabby', 'rayas', 'tigre'],
	tricolor: ['tricolor', 'calico', 'carey', 'tortoiseshell'],
	siames: ['siames', 'siamese', 'point']
};

export function scoreCat(cat: CatRecord, analysis: AIAnalysis): number {
	let score = 0;
	const colorLower = (analysis.color ?? '').toLowerCase();
	const patternLower = (analysis.pattern ?? '').toLowerCase();
	const name = (cat.name ?? '').toLowerCase();

	if (colorLower && name.includes(colorLower)) score += 20;

	for (const [, terms] of Object.entries(COLOR_TERMS)) {
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

export function rankMatches<T extends CatRecord>(
	cats: T[],
	analysis: AIAnalysis,
	limit = 5
): (T & { score: number })[] {
	return cats
		.map(cat => ({ ...cat, score: scoreCat(cat, analysis) }))
		.filter(c => c.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit);
}

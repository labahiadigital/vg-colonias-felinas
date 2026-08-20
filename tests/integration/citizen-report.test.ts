import { describe, it, expect } from 'vitest';

const VALID_CATEGORIES = ['abandoned', 'injured', 'new_colony', 'other'];

function validateCitizenReport(data: {
	category?: string;
	description?: string;
	latitude?: number;
	longitude?: number;
	email?: string;
}): { valid: boolean; error?: string } {
	if (!data.description || data.description.length < 5) {
		return { valid: false, error: 'La descripción es obligatoria (mín. 5 caracteres)' };
	}

	if (!VALID_CATEGORIES.includes(data.category ?? '')) {
		return { valid: false, error: 'Categoría no válida' };
	}

	return { valid: true };
}

describe('citizen report validation', () => {
	it('rejects missing description', () => {
		const result = validateCitizenReport({ category: 'abandoned' });
		expect(result.valid).toBe(false);
		expect(result.error).toContain('descripción');
	});

	it('rejects description shorter than 5 chars', () => {
		const result = validateCitizenReport({ category: 'abandoned', description: 'abc' });
		expect(result.valid).toBe(false);
	});

	it('rejects invalid category', () => {
		const result = validateCitizenReport({ category: 'invalid', description: 'A valid description here' });
		expect(result.valid).toBe(false);
		expect(result.error).toContain('Categoría');
	});

	it('accepts valid report with all fields', () => {
		const result = validateCitizenReport({
			category: 'abandoned',
			description: 'Gato abandonado en el parque',
			latitude: 42.84,
			longitude: -2.67,
			email: 'citizen@example.com'
		});
		expect(result.valid).toBe(true);
	});

	it('accepts valid report without optional fields', () => {
		const result = validateCitizenReport({
			category: 'injured',
			description: 'Gato herido en la calle'
		});
		expect(result.valid).toBe(true);
	});

	it.each(VALID_CATEGORIES)('accepts category "%s"', (category) => {
		const result = validateCitizenReport({ category, description: 'A valid description here' });
		expect(result.valid).toBe(true);
	});
});

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { cats, colonies } from '$lib/server/db/schema.js';
import { eq, isNotNull } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'No autenticado' }, { status: 401 });
	}

	const formData = await request.formData();
	const photo = formData.get('photo') as File | null;

	if (!photo || photo.size === 0) {
		return json({ error: 'Se requiere una foto' }, { status: 400 });
	}

	if (photo.size > 10 * 1024 * 1024) {
		return json({ error: 'Imagen demasiado grande (máximo 10MB)' }, { status: 400 });
	}

	const arrayBuffer = await photo.arrayBuffer();
	const base64Image = Buffer.from(arrayBuffer).toString('base64');
	const mimeType = photo.type || 'image/jpeg';

	const catsWithPhotos = await db
		.select({
			id: cats.id,
			name: cats.name,
			colonyId: cats.colonyId,
			sex: cats.sex,
			sterilized: cats.sterilized,
			microchip: cats.microchip,
			status: cats.status,
			photo: cats.photo,
			estimatedAge: cats.estimatedAge,
			colonyName: colonies.name
		})
		.from(cats)
		.leftJoin(colonies, eq(cats.colonyId, colonies.id))
		.where(isNotNull(cats.photo))
		.limit(200);

	const openaiKey = env.OPENAI_API_KEY;

	if (!openaiKey) {
		return json({
			matches: [],
			analysis: {
				description: 'Análisis por IA no disponible (sin API key configurada). Mostrando todos los gatos registrados para comparación manual.',
				color: 'desconocido',
				pattern: 'desconocido',
				distinctiveFeatures: []
			},
			catalogCats: catsWithPhotos.slice(0, 20),
			method: 'manual'
		});
	}

	try {
		const systemPrompt = `Eres un experto en identificación de gatos individuales. Analiza la foto proporcionada y devuelve un JSON con:
{
  "description": "Descripción breve del gato (color, patrón, rasgos faciales distintivos)",
  "color": "color principal del pelaje",
  "pattern": "patrón (atigrado, bicolor, tricolor, liso, siamés, etc.)",
  "distinctiveFeatures": ["lista de rasgos únicos identificables"],
  "estimatedAge": "cachorro/joven/adulto/senior",
  "sex_guess": "posible sexo basado en rasgos faciales si identificable, o 'indeterminado'"
}
Responde SOLO con el JSON, sin texto adicional.`;

		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${openaiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: 'gpt-4o-mini',
				messages: [
					{ role: 'system', content: systemPrompt },
					{
						role: 'user',
						content: [
							{ type: 'text', text: 'Analiza este gato para identificación:' },
							{ type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
						]
					}
				],
				max_tokens: 500
			})
		});

		if (!response.ok) {
			throw new Error(`OpenAI API error: ${response.status}`);
		}

		const aiResult = await response.json();
		const content = aiResult.choices?.[0]?.message?.content ?? '{}';

		let analysis;
		try {
			analysis = JSON.parse(content.replace(/```json\n?/g, '').replace(/```/g, '').trim());
		} catch {
			analysis = {
				description: content,
				color: 'desconocido',
				pattern: 'desconocido',
				distinctiveFeatures: []
			};
		}

		const colorLower = (analysis.color ?? '').toLowerCase();
		const patternLower = (analysis.pattern ?? '').toLowerCase();

		const scored = catsWithPhotos.map((cat) => {
			let score = 0;
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

			return { ...cat, score };
		});

		const matches = scored
			.filter(c => c.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, 5);

		return json({
			matches,
			analysis,
			catalogCats: catsWithPhotos.slice(0, 10),
			method: 'ai'
		});
	} catch (err) {
		console.error('Cat identification error:', err);
		return json({
			matches: [],
			analysis: {
				description: 'Error al analizar la imagen. Mostrando catálogo para comparación manual.',
				color: 'desconocido',
				pattern: 'desconocido',
				distinctiveFeatures: []
			},
			catalogCats: catsWithPhotos.slice(0, 20),
			method: 'fallback'
		});
	}
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { requireApiUser, getFormFile } from '$lib/server/action-helpers.js';
import { db } from '$lib/server/db/index.js';
import { cats, colonies } from '$lib/server/db/schema.js';
import { eq, and, isNotNull } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { orgScope } from '$lib/server/tenant.js';
import { rankMatches, type AIAnalysis } from '$lib/server/cat-scoring.js';
import { rateLimitGuard } from '$lib/server/rate-limit.js';
import { requestLogger } from '$lib/server/logger.js';

const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10 MB

export const POST: RequestHandler = async ({ request, locals }) => {
	requireApiUser(locals);
	const blocked = rateLimitGuard('ai', locals.user?.id, request);
	if (blocked) return blocked;

	const formData = await request.formData();
	const photo = getFormFile(formData, 'photo');

	if (!photo || photo.size === 0) {
		return json({ error: 'Se requiere una foto' }, { status: 400 });
	}

	if (photo.size > MAX_PHOTO_SIZE) {
		return json({ error: 'Imagen demasiado grande (máximo 10MB)' }, { status: 400 });
	}

	const arrayBuffer = await photo.arrayBuffer();
	const base64Image = Buffer.from(arrayBuffer).toString('base64');
	const mimeType = photo.type || 'image/jpeg';

	const orgId = locals.organizationId;
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
		.where(and(isNotNull(cats.photo), orgScope(cats.organizationId, orgId)))
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

		const matches = rankMatches(catsWithPhotos, analysis as AIAnalysis);

		return json({
			matches,
			analysis,
			catalogCats: catsWithPhotos.slice(0, 10),
			method: 'ai'
		});
	} catch (err) {
		requestLogger('cat-identify', request).error('Cat identification error', { error: String(err) });
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

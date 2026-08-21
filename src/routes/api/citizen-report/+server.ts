import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { citizenReports } from '$lib/server/db/schema.js';
import { json } from '@sveltejs/kit';
import { rateLimitGuard } from '$lib/server/rate-limit.js';

export const POST: RequestHandler = async ({ request }) => {
	const blocked = rateLimitGuard('citizenReport', undefined, request);
	if (blocked) return blocked;

	let data: Record<string, unknown>;
	try { data = await request.json(); } catch { return json({ error: 'JSON inválido' }, { status: 400 }); }

	const category = typeof data.category === 'string' ? data.category : undefined;
	const description = typeof data.description === 'string' ? data.description : undefined;
	const latitude = typeof data.latitude === 'number' ? data.latitude : undefined;
	const longitude = typeof data.longitude === 'number' ? data.longitude : undefined;
	const email = typeof data.email === 'string' ? data.email : undefined;

	if (!description || description.length < 5) {
		return json({ error: 'La descripción es obligatoria (mín. 5 caracteres)' }, { status: 400 });
	}

	const validCategories = ['abandoned', 'injured', 'new_colony', 'other'];
	if (!category || !validCategories.includes(category)) {
		return json({ error: 'Categoría no válida' }, { status: 400 });
	}

	try {
		await db.insert(citizenReports).values({
			category,
			description: description.substring(0, 2000),
			latitude: latitude || null,
			longitude: longitude || null,
			email: email ? email.substring(0, 255) : null,
			status: 'pending'
		});

		return json({ success: true });
	} catch {
		return json({ error: 'Error al procesar el reporte' }, { status: 500 });
	}
};

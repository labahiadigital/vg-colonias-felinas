import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { citizenReports } from '$lib/server/db/schema.js';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const { category, description, latitude, longitude, email } = data;

		if (!description || description.length < 5) {
			return json({ error: 'La descripción es obligatoria (mín. 5 caracteres)' }, { status: 400 });
		}

		const validCategories = ['abandoned', 'injured', 'new_colony', 'other'];
		if (!validCategories.includes(category)) {
			return json({ error: 'Categoría no válida' }, { status: 400 });
		}

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

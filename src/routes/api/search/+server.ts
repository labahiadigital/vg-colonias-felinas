import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies, cats, collaborators } from '$lib/server/db/schema.js';
import { ilike, or } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
	const q = url.searchParams.get('q')?.trim();
	if (!q || q.length < 2) {
		return json({ colonies: [], cats: [], collaborators: [] });
	}

	const pattern = `%${q}%`;

	const [foundColonies, foundCats, foundCollaborators] = await Promise.all([
		db.select({ id: colonies.id, name: colonies.name })
			.from(colonies)
			.where(ilike(colonies.name, pattern))
			.limit(5),
		db.select({ id: cats.id, name: cats.name })
			.from(cats)
			.where(or(
				ilike(cats.name, pattern),
				ilike(cats.microchip, pattern)
			))
			.limit(5),
		db.select({ id: collaborators.id, name: collaborators.name })
			.from(collaborators)
			.where(ilike(collaborators.name, pattern))
			.limit(5),
	]);

	return json({
		colonies: foundColonies,
		cats: foundCats,
		collaborators: foundCollaborators
	});
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies, cats, collaborators } from '$lib/server/db/schema.js';
import { and, ilike, or } from 'drizzle-orm';
import { orgScope, escapeLike } from '$lib/server/tenant.js';
import { requireApiUser } from '$lib/server/action-helpers.js';
import { rateLimitGuard } from '$lib/server/rate-limit.js';

export const GET: RequestHandler = async ({ url, locals, request }) => {
	requireApiUser(locals);
	const blocked = rateLimitGuard('search', locals.user?.id, request);
	if (blocked) return blocked;

	const q = url.searchParams.get('q')?.trim();
	if (!q || q.length < 2) {
		return json({ colonies: [], cats: [], collaborators: [] });
	}

	const orgId = locals.organizationId;
	const pattern = `%${escapeLike(q)}%`;

	const [foundColonies, foundCats, foundCollaborators] = await Promise.all([
		db.select({ id: colonies.id, name: colonies.name })
			.from(colonies)
			.where(and(ilike(colonies.name, pattern), orgScope(colonies.organizationId, orgId)))
			.limit(5),
		db.select({ id: cats.id, name: cats.name })
			.from(cats)
			.where(and(or(ilike(cats.name, pattern), ilike(cats.microchip, pattern)), orgScope(cats.organizationId, orgId)))
			.limit(5),
		db.select({ id: collaborators.id, name: collaborators.name })
			.from(collaborators)
			.where(and(ilike(collaborators.name, pattern), orgScope(collaborators.organizationId, orgId)))
			.limit(5),
	]);

	return json({
		colonies: foundColonies,
		cats: foundCats,
		collaborators: foundCollaborators
	});
};

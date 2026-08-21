import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { collaborators, colonies } from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { requireAuthContext } from '$lib/server/action-helpers.js';
import { orgScope, loadOrgColonies } from '$lib/server/tenant.js';
import { guardedUpdate } from '$lib/server/db-helpers.js';
import { toStringArray } from '$lib/index.js';

export const load: PageServerLoad = async ({ locals, params }) => {
	const orgId = locals.organizationId;

	const [col, allColonies] = await Promise.all([
		db.select().from(collaborators).where(and(eq(collaborators.id, params.id), orgScope(collaborators.organizationId, orgId))).limit(1),
		loadOrgColonies(orgId)
	]);

	if (!col[0]) throw error(404, 'Colaborador no encontrado');

	const colonyMap = new Map(allColonies.map(c => [c.id, c.name]));
	const assigned = toStringArray(col[0].assignedColonies).map(id => ({ id, name: colonyMap.get(id) ?? id }));

	return {
		locale: locals.locale,
		collaborator: col[0],
		assignedColonies: assigned
	};
};

export const actions: Actions = {
	signPrivacy: async ({ params, locals, request }) => {
		const ctx = requireAuthContext(locals, request);
		await guardedUpdate(collaborators, { privacyNoticeSigned: true, updatedAt: new Date() },
			and(eq(collaborators.id, params.id), orgScope(collaborators.organizationId, ctx.organizationId)),
			ctx, 'collaborator', params.id, 'sign_privacy');
		return { privacySigned: true };
	}
};

import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { collaborators, colonies, auditLogs } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { error, redirect, fail } from '@sveltejs/kit';
import { logAudit } from '$lib/server/audit.js';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(302, '/login');

	const col = await db.select().from(collaborators).where(eq(collaborators.id, params.id)).limit(1);
	if (!col[0]) throw error(404, 'Colaborador no encontrado');

	const allColonies = await db.select({ id: colonies.id, name: colonies.name }).from(colonies);
	const colonyMap = new Map(allColonies.map(c => [c.id, c.name]));
	const assigned = Array.isArray(col[0].assignedColonies)
		? (col[0].assignedColonies as string[]).map(id => ({ id, name: colonyMap.get(id) ?? id }))
		: [];

	return {
		locale: locals.locale,
		collaborator: col[0],
		assignedColonies: assigned
	};
};

export const actions: Actions = {
	signPrivacy: async ({ params, locals }) => {
		if (!locals.user) return fail(401, { error: 'No autenticado' });
		await db.update(collaborators).set({ privacyNoticeSigned: true, updatedAt: new Date() }).where(eq(collaborators.id, params.id));
		await logAudit({ userId: locals.user.id, entity: 'collaborator', entityId: params.id, action: 'sign_privacy' });
		return { privacySigned: true };
	}
};

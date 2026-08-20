import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { pushSubscriptions } from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'No autenticado' }, { status: 401 });

	const { endpoint, keys } = await request.json();
	if (!endpoint || !keys?.p256dh || !keys?.auth) {
		return json({ error: 'Suscripción inválida' }, { status: 400 });
	}

	const existing = await db
		.select()
		.from(pushSubscriptions)
		.where(and(eq(pushSubscriptions.userId, locals.user.id), eq(pushSubscriptions.endpoint, endpoint)))
		.limit(1);

	if (existing.length > 0) {
		return json({ ok: true, message: 'Ya suscrito' });
	}

	await db.insert(pushSubscriptions).values({
		userId: locals.user.id,
		endpoint,
		p256dh: keys.p256dh,
		auth: keys.auth
	});

	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'No autenticado' }, { status: 401 });

	const { endpoint } = await request.json();
	if (!endpoint) return json({ error: 'Endpoint requerido' }, { status: 400 });

	await db.delete(pushSubscriptions).where(
		and(eq(pushSubscriptions.userId, locals.user.id), eq(pushSubscriptions.endpoint, endpoint))
	);

	return json({ ok: true });
};

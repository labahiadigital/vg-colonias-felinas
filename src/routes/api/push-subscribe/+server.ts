import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { pushSubscriptions } from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { requireApiUser } from '$lib/server/action-helpers.js';
import { rateLimitGuard } from '$lib/server/rate-limit.js';
import { toRecord } from '$lib/index.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { user } = requireApiUser(locals);
	const blocked = rateLimitGuard('general', user.id, request);
	if (blocked) return blocked;

	let body: Record<string, unknown>;
	try { body = await request.json(); } catch { return json({ error: 'JSON inválido' }, { status: 400 }); }

	const endpoint = typeof body.endpoint === 'string' ? body.endpoint : '';
	const rawKeys = toRecord(body.keys);
	const p256dh = typeof rawKeys.p256dh === 'string' ? rawKeys.p256dh : '';
	const authKey = typeof rawKeys.auth === 'string' ? rawKeys.auth : '';
	if (!endpoint || !p256dh || !authKey) {
		return json({ error: 'Suscripción inválida' }, { status: 400 });
	}

	const existing = await db
		.select()
		.from(pushSubscriptions)
		.where(and(eq(pushSubscriptions.userId, user.id), eq(pushSubscriptions.endpoint, endpoint)))
		.limit(1);

	if (existing.length > 0) {
		return json({ ok: true, message: 'Ya suscrito' });
	}

	await db.insert(pushSubscriptions).values({
		userId: user.id,
		endpoint,
		p256dh,
		auth: authKey
	});

	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	const { user } = requireApiUser(locals);

	let body: Record<string, unknown>;
	try { body = await request.json(); } catch { return json({ error: 'JSON inválido' }, { status: 400 }); }

	const endpoint = typeof body.endpoint === 'string' ? body.endpoint : '';
	if (!endpoint) return json({ error: 'Endpoint requerido' }, { status: 400 });

	await db.delete(pushSubscriptions).where(
		and(eq(pushSubscriptions.userId, user.id), eq(pushSubscriptions.endpoint, endpoint))
	);

	return json({ ok: true });
};

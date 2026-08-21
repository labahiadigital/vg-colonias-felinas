import { db } from '$lib/server/db/index.js';
import { pushSubscriptions, organizationMembers } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import webpush from 'web-push';

export function extractStatusCode(err: unknown): number | undefined {
	if (typeof err === 'object' && err !== null && 'statusCode' in err) {
		const code = (err as { statusCode: unknown }).statusCode;
		return typeof code === 'number' ? code : undefined;
	}
	return undefined;
}

export interface PushPayload {
	title: string;
	body: string;
	icon?: string;
	url?: string;
	tag?: string;
}

export function buildPushPayload(payload: PushPayload): string {
	return JSON.stringify({
		title: payload.title,
		body: payload.body,
		icon: payload.icon || '/icon-192.png',
		data: { url: payload.url || '/dashboard' },
		tag: payload.tag
	});
}

export function shouldDeleteSubscription(statusCode: number): boolean {
	return statusCode === 410 || statusCode === 404;
}

let vapidConfigured = false;

function ensureVapid(): boolean {
	if (vapidConfigured) return true;

	const publicKey = env.VAPID_PUBLIC_KEY;
	const privateKey = env.VAPID_PRIVATE_KEY;
	const subject = env.VAPID_SUBJECT || env.BETTER_AUTH_URL || 'mailto:admin@example.com';

	if (!publicKey || !privateKey) return false;

	webpush.setVapidDetails(subject, publicKey, privateKey);
	vapidConfigured = true;
	return true;
}

export async function sendPushNotification(userId: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
	if (!ensureVapid()) return { sent: 0, failed: 0 };

	const subs = await db
		.select()
		.from(pushSubscriptions)
		.where(eq(pushSubscriptions.userId, userId));

	if (subs.length === 0) {
		return { sent: 0, failed: 0 };
	}

	const pushBody = buildPushPayload(payload);

	const results = await Promise.allSettled(
		subs.map(sub =>
			webpush.sendNotification(
				{ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
				pushBody,
				{ TTL: 86400 }
			).catch((err: unknown) => {
				const status = extractStatusCode(err);
				if (status !== undefined && shouldDeleteSubscription(status)) {
					void db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id)).catch(() => {});
				}
				throw err;
			})
		)
	);

	let sent = 0;
	let failed = 0;
	for (const r of results) {
		if (r.status === 'fulfilled') sent++;
		else failed++;
	}

	return { sent, failed };
}

export async function sendPushToAll(organizationId: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
	const orgUsers = await db
		.select({ id: organizationMembers.userId })
		.from(organizationMembers)
		.where(eq(organizationMembers.organizationId, organizationId));

	const results = await Promise.all(
		orgUsers.map(member => sendPushNotification(member.id, payload))
	);

	return results.reduce(
		(acc, r) => ({ sent: acc.sent + r.sent, failed: acc.failed + r.failed }),
		{ sent: 0, failed: 0 }
	);
}

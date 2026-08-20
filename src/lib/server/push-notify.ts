import { db } from '$lib/server/db/index.js';
import { pushSubscriptions, users } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

interface PushPayload {
	title: string;
	body: string;
	icon?: string;
	url?: string;
	tag?: string;
}

export async function sendPushNotification(userId: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
	const subs = await db
		.select()
		.from(pushSubscriptions)
		.where(eq(pushSubscriptions.userId, userId));

	if (subs.length === 0) {
		await sendEmailFallback(userId, payload);
		return { sent: 0, failed: 0 };
	}

	let sent = 0;
	let failed = 0;

	for (const sub of subs) {
		try {
			const vapidPublic = env.VAPID_PUBLIC_KEY;
			const vapidPrivate = env.VAPID_PRIVATE_KEY;

			if (!vapidPublic || !vapidPrivate) {
				failed++;
				continue;
			}

			const pushPayload = JSON.stringify({
				title: payload.title,
				body: payload.body,
				icon: payload.icon || '/icon-192.png',
				data: { url: payload.url || '/dashboard' },
				tag: payload.tag
			});

			const response = await fetch(sub.endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/octet-stream',
					'TTL': '86400'
				},
				body: pushPayload
			});

			if (response.ok || response.status === 201) {
				sent++;
			} else if (response.status === 410 || response.status === 404) {
				await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
				failed++;
			} else {
				failed++;
			}
		} catch {
			failed++;
		}
	}

	if (sent === 0) {
		await sendEmailFallback(userId, payload);
	}

	return { sent, failed };
}

export async function sendPushToAll(organizationId: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
	const orgUsers = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.organizationId, organizationId));

	let totalSent = 0;
	let totalFailed = 0;

	for (const user of orgUsers) {
		const result = await sendPushNotification(user.id, payload);
		totalSent += result.sent;
		totalFailed += result.failed;
	}

	return { sent: totalSent, failed: totalFailed };
}

async function sendEmailFallback(userId: string, payload: PushPayload): Promise<void> {
	const [user] = await db
		.select({ email: users.email, name: users.name })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	if (!user?.email) return;

	console.log(`[Email Fallback] To: ${user.email} | ${payload.title}: ${payload.body}`);
}

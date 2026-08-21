import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { notifications } from '$lib/server/db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { orgScope } from '$lib/server/tenant.js';

const VALID_NOTIFICATION_TYPES = new Set(['info', 'warning', 'success', 'danger'] as const);
type NotificationType = 'info' | 'warning' | 'success' | 'danger';
function toNotificationType(value: unknown): NotificationType {
	return typeof value === 'string' && VALID_NOTIFICATION_TYPES.has(value as NotificationType)
		? (value as NotificationType)
		: 'info';
}

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const orgId = locals.organizationId;
	const userNotifications = await db
		.select()
		.from(notifications)
		.where(and(eq(notifications.userId, locals.user.id), orgScope(notifications.organizationId, orgId)))
		.orderBy(desc(notifications.createdAt))
		.limit(20);

	const headerNotifications = userNotifications.map((n) => ({
		id: n.id,
		type: toNotificationType(n.type),
		title: n.title ?? '',
		message: n.message ?? '',
		time: n.createdAt ? new Date(n.createdAt).toLocaleString(locals.locale ?? 'es') : '',
		read: !!n.readAt
	}));

	return {
		user: locals.user,
		locale: locals.locale,
		headerNotifications
	};
};

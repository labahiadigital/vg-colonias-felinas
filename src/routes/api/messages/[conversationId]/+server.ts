import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { messages, users, conversations } from '$lib/server/db/schema.js';
import { eq, and, asc } from 'drizzle-orm';
import { orgScope } from '$lib/server/tenant.js';
import { requireApiUser } from '$lib/server/action-helpers.js';
import { rateLimitGuard } from '$lib/server/rate-limit.js';

export const GET: RequestHandler = async ({ params, locals, request }) => {
	requireApiUser(locals);
	const blocked = rateLimitGuard('general', locals.user?.id, request);
	if (blocked) return blocked;

	const orgId = locals.organizationId;

	const [conversation] = await db.select({ id: conversations.id })
		.from(conversations)
		.where(and(eq(conversations.id, params.conversationId), orgScope(conversations.organizationId, orgId)))
		.limit(1);

	if (!conversation) return json({ error: 'Conversación no encontrada' }, { status: 404 });

	const allMessages = await db
		.select({
			id: messages.id,
			content: messages.content,
			sentAt: messages.sentAt,
			senderId: messages.senderId,
			senderName: users.name
		})
		.from(messages)
		.leftJoin(users, eq(messages.senderId, users.id))
		.where(eq(messages.conversationId, params.conversationId))
		.orderBy(asc(messages.sentAt));

	return json(allMessages);
};

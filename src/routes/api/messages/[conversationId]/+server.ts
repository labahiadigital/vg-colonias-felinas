import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { messages, users } from '$lib/server/db/schema.js';
import { eq, asc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

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

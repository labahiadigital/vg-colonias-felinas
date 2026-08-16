import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { conversations, messages, notifications, users } from '$lib/server/db/schema.js';
import { desc, eq, and } from 'drizzle-orm';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');

	const allConversations = await db
		.select()
		.from(conversations)
		.orderBy(desc(conversations.createdAt));

	const convosWithLastMessage = [];
	for (const c of allConversations) {
		const participants = Array.isArray(c.participants) ? c.participants as string[] : [];
		if (!participants.includes(locals.user.id) && participants.length > 0) continue;

		const lastMsg = await db
			.select({
				content: messages.content,
				sentAt: messages.sentAt,
				senderName: users.name
			})
			.from(messages)
			.leftJoin(users, eq(messages.senderId, users.id))
			.where(eq(messages.conversationId, c.id))
			.orderBy(desc(messages.sentAt))
			.limit(1);

		convosWithLastMessage.push({
			...c,
			lastMessage: lastMsg[0] || null,
			participantNames: participants
		});
	}

	const userNotifications = await db
		.select()
		.from(notifications)
		.where(eq(notifications.userId, locals.user.id))
		.orderBy(desc(notifications.createdAt))
		.limit(50);

	const allUsers = await db
		.select({ id: users.id, name: users.name })
		.from(users)
		.orderBy(users.name);

	return {
		locale: locals.locale,
		currentUserId: locals.user.id,
		conversations: convosWithLastMessage,
		notifications: userNotifications,
		users: allUsers
	};
};

export const actions: Actions = {
	createConversation: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');
		const fd = await request.formData();

		const title = fd.get('title') as string;
		const participantIds = fd.getAll('participants') as string[];

		if (!title) return fail(400, { error: 'Título obligatorio' });

		const allParticipants = [...new Set([locals.user.id, ...participantIds])];

		await db.insert(conversations).values({
			title,
			participants: allParticipants
		});

		return { success: true };
	},
	sendMessage: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');
		const fd = await request.formData();

		const conversationId = fd.get('conversationId') as string;
		const content = fd.get('content') as string;

		if (!conversationId || !content?.trim()) return fail(400, { error: 'Mensaje vacío' });

		await db.insert(messages).values({
			conversationId,
			senderId: locals.user.id,
			content: content.trim()
		});

		return { messageSent: true };
	},
	markRead: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');
		const fd = await request.formData();
		const id = fd.get('id') as string;

		if (id) {
			await db.update(notifications).set({ readAt: new Date(), delivered: true }).where(
				and(eq(notifications.id, id), eq(notifications.userId, locals.user.id))
			);
		}

		return { success: true };
	},
	markAllRead: async ({ locals }) => {
		if (!locals.user) throw redirect(302, '/login');

		await db.update(notifications).set({ readAt: new Date(), delivered: true }).where(
			eq(notifications.userId, locals.user.id)
		);

		return { success: true };
	}
};

import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { conversations, messages, notifications, users, colonies } from '$lib/server/db/schema.js';
import { desc, eq, and, inArray } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { requireAuthContext, getFormField, requireField, requireFields, getFormStringArray } from '$lib/server/action-helpers.js';
import { orgScope, verifyOrgOwnership, loadOrgColonies, loadOrgUsers } from '$lib/server/tenant.js';
import { toStringArray } from '$lib/index.js';
import { guardedInsert } from '$lib/server/db-helpers.js';

export const load: PageServerLoad = async ({ locals }) => {
	const orgId = locals.organizationId;
	if (!locals.user) redirect(302, '/login');
	const userId = locals.user.id;

	const allConversations = await db
		.select()
		.from(conversations)
		.where(orgScope(conversations.organizationId, orgId))
		.orderBy(desc(conversations.createdAt));

	const userConversations = allConversations.filter(c => {
		const participants = toStringArray(c.participants);
		return participants.length === 0 || participants.includes(userId);
	});

	const conversationIds = userConversations.map(c => c.id);

	let lastMessages: Array<{ conversationId: string; content: string | null; sentAt: Date | null; senderName: string | null }> = [];
	if (conversationIds.length > 0) {
		lastMessages = await db
			.selectDistinctOn([messages.conversationId], {
				conversationId: messages.conversationId,
				content: messages.content,
				sentAt: messages.sentAt,
				senderName: users.name
			})
			.from(messages)
			.leftJoin(users, eq(messages.senderId, users.id))
			.where(inArray(messages.conversationId, conversationIds))
			.orderBy(messages.conversationId, desc(messages.sentAt));
	}

	const lastMsgMap = new Map(lastMessages.map(m => [m.conversationId, m]));

	const convosWithLastMessage = userConversations.map(c => ({
		...c,
		lastMessage: lastMsgMap.get(c.id) ?? null,
		participantNames: toStringArray(c.participants)
	}));

	const [userNotifications, allUsers, allColonies] = await Promise.all([
		db.select().from(notifications)
			.where(and(eq(notifications.userId, userId), orgScope(notifications.organizationId, orgId)))
			.orderBy(desc(notifications.createdAt))
			.limit(50),
		loadOrgUsers(orgId),
		loadOrgColonies(orgId)
	]);

	return {
		locale: locals.locale,
		currentUserId: userId,
		conversations: convosWithLastMessage,
		notifications: userNotifications,
		users: allUsers,
		colonies: allColonies
	};
};

export const actions: Actions = {
	createConversation: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();

		const title = requireField(fd, 'title', 'El título');

		const type = getFormField(fd, 'type') || 'direct';
		const colonyId = getFormField(fd, 'colonyId');
		if (colonyId && !await verifyOrgOwnership(colonies, colonyId, ctx.organizationId)) {
			return fail(404, { error: 'Colonia no encontrada' });
		}

		const zone = getFormField(fd, 'zone');
		const roleFilter = getFormField(fd, 'roleFilter');
		const participantIds = getFormStringArray(fd, 'participants');

		const allParticipants = [...new Set([ctx.userId, ...participantIds])];

		await guardedInsert(conversations, {
			organizationId: ctx.organizationId,
			title,
			type,
			colonyId: colonyId || null,
			zone: zone || null,
			roleFilter: roleFilter || null,
			participants: allParticipants
		}, ctx, 'conversation', 'create', { title, type });

		return { success: true };
	},

	sendMessage: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();

		const { conversationId, content } = requireFields(fd, {
			conversationId: 'La conversación', content: 'El mensaje'
		});

		const [conv] = await db.select({ id: conversations.id }).from(conversations)
			.where(and(eq(conversations.id, conversationId), orgScope(conversations.organizationId, ctx.organizationId)))
			.limit(1);
		if (!conv) return fail(404, { error: 'Conversación no encontrada' });

		await db.insert(messages).values({
			conversationId,
			senderId: ctx.userId,
			content: content.trim()
		});

		return { messageSent: true };
	},

	markRead: async ({ request, locals }) => {
		const ctx = requireAuthContext(locals, request);
		const fd = await request.formData();
		const id = getFormField(fd, 'id');

		if (id) {
			await db.update(notifications).set({ readAt: new Date(), delivered: true }).where(
				and(eq(notifications.id, id), eq(notifications.userId, ctx.userId), orgScope(notifications.organizationId, ctx.organizationId))
			);
		}

		return { success: true };
	},

	markAllRead: async ({ locals }) => {
		const ctx = requireAuthContext(locals);

		await db.update(notifications).set({ readAt: new Date(), delivered: true }).where(
			and(eq(notifications.userId, ctx.userId), orgScope(notifications.organizationId, ctx.organizationId))
		);

		return { success: true };
	}
};

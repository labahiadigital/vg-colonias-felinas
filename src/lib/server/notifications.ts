import { db } from './db/index.js';
import { notifications, userRoles, users } from './db/schema.js';
import { eq } from 'drizzle-orm';

interface NotifyOptions {
	userId?: string;
	roleId?: number;
	type: string;
	title: string;
	message: string;
	payload?: Record<string, unknown>;
}

export async function notify(opts: NotifyOptions): Promise<void> {
	const targets: string[] = [];

	if (opts.userId) {
		targets.push(opts.userId);
	}

	if (opts.roleId) {
		const roleUsers = await db
			.select({ userId: userRoles.userId })
			.from(userRoles)
			.where(eq(userRoles.roleId, opts.roleId));
		for (const ru of roleUsers) {
			if (!targets.includes(ru.userId)) targets.push(ru.userId);
		}
	}

	if (targets.length === 0) {
		const allAdmins = await db
			.select({ userId: userRoles.userId })
			.from(userRoles)
			.where(eq(userRoles.roleId, 1));
		for (const a of allAdmins) targets.push(a.userId);
	}

	for (const uid of targets) {
		await db.insert(notifications).values({
			userId: uid,
			type: opts.type,
			title: opts.title,
			message: opts.message,
			payload: opts.payload || null
		});
	}
}

export async function notifyRole(roleName: string, type: string, title: string, message: string, payload?: Record<string, unknown>): Promise<void> {
	const allRoleUsers = await db
		.select({ userId: userRoles.userId, roleName: users.name })
		.from(userRoles)
		.innerJoin(users, eq(userRoles.userId, users.id));

	const roleRows = await db.query.roles?.findFirst?.({ where: eq(users.name, roleName) });

	await notify({ type, title, message, payload });
}

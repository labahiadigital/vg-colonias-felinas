import { db } from './db/index.js';
import { notifications, userRoles, users, organizationMembers } from './db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { sendEmail } from './email.js';
import { sendPushNotification } from './push-notify.js';
import { escHtml } from './html.js';

export interface NotifyTarget {
	id: string;
	email: string;
	name: string;
}

export interface NotifyOptions {
	userId?: string;
	roleId?: number;
	organizationId?: string | null;
	type: string;
	title: string;
	message: string;
	payload?: Record<string, unknown>;
	sendEmailNotification?: boolean;
	sendPushNotification?: boolean;
}

export async function resolveTargets(opts: Pick<NotifyOptions, 'userId' | 'roleId' | 'organizationId'>): Promise<NotifyTarget[]> {
	const targetIds = new Set<string>();

	const orgMemberIds = opts.organizationId
		? new Set(
			(await db.select({ id: organizationMembers.userId }).from(organizationMembers)
				.where(eq(organizationMembers.organizationId, opts.organizationId))
			).map(m => m.id)
		)
		: null;

	if (opts.userId) {
		targetIds.add(opts.userId);
	}

	if (opts.roleId) {
		const roleUsers = await db
			.select({ userId: userRoles.userId })
			.from(userRoles)
			.where(eq(userRoles.roleId, opts.roleId));
		for (const ru of roleUsers) {
			if (!orgMemberIds || orgMemberIds.has(ru.userId)) {
				targetIds.add(ru.userId);
			}
		}
	}

	if (targetIds.size === 0) {
		const admins = await db
			.select({ userId: userRoles.userId })
			.from(userRoles)
			.where(eq(userRoles.roleId, 1));
		for (const a of admins) {
			if (!orgMemberIds || orgMemberIds.has(a.userId)) {
				targetIds.add(a.userId);
			}
		}
	}

	if (targetIds.size === 0) return [];

	return db
		.select({ id: users.id, email: users.email, name: users.name })
		.from(users)
		.where(inArray(users.id, [...targetIds]));
}

async function deliverToTarget(
	target: NotifyTarget,
	opts: NotifyOptions
): Promise<{ emailSent: boolean }> {
	const emailPromise = opts.sendEmailNotification !== false
		? sendEmail({
			to: target.email,
			subject: `[Colonias Felinas] ${opts.title}`,
			html: buildEmailHtml(opts.title, opts.message, target.name),
			organizationId: opts.organizationId
		}).catch(() => false)
		: Promise.resolve(false);

	const pushPromise = opts.sendPushNotification !== false
		? sendPushNotification(target.id, {
			title: opts.title,
			body: opts.message
		}).catch(() => ({ sent: 0, failed: 0 }))
		: Promise.resolve(null);

	const [emailSent] = await Promise.all([emailPromise, pushPromise]);

	return { emailSent: emailSent === true };
}

export async function notify(opts: NotifyOptions): Promise<void> {
	const targets = await resolveTargets(opts);
	if (targets.length === 0) return;

	const deliveryResults = await Promise.all(
		targets.map(target => deliverToTarget(target, opts))
	);

	const inserts = targets.map((target, i) => ({
		userId: target.id,
		organizationId: opts.organizationId || null,
		type: opts.type,
		title: opts.title,
		message: opts.message,
		payload: opts.payload || null,
		channel: deliveryResults[i]?.emailSent ? 'email+internal' : 'internal',
		emailSent: deliveryResults[i]?.emailSent ?? false
	}));

	await db.insert(notifications).values(inserts);
}

export function buildEmailHtml(title: string, message: string, userName: string): string {
	const safeTitle = escHtml(title);
	const safeMessage = escHtml(message);
	const safeName = escHtml(userName);
	const appUrl = escHtml(process.env.BETTER_AUTH_URL || 'http://localhost:5173');

	return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f7f6;margin:0;padding:20px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
	<div style="background:#005a4d;padding:20px 24px">
		<h1 style="color:#fff;font-size:18px;margin:0">Gestión de Colonias Felinas</h1>
	</div>
	<div style="padding:24px">
		<p style="color:#333;font-size:14px;margin:0 0 8px">Hola ${safeName},</p>
		<h2 style="color:#005a4d;font-size:16px;margin:0 0 12px">${safeTitle}</h2>
		<p style="color:#555;font-size:14px;line-height:1.5;margin:0 0 20px">${safeMessage}</p>
		<a href="${appUrl}/dashboard" style="display:inline-block;background:#005a4d;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">Ir a la aplicación</a>
	</div>
	<div style="background:#f8f9fa;padding:12px 24px;font-size:11px;color:#999;text-align:center">
		Este es un mensaje automático. No respondas a este email.
	</div>
</div>
</body>
</html>`;
}

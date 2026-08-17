import { db } from './db/index.js';
import { notifications, userRoles, users } from './db/schema.js';
import { eq } from 'drizzle-orm';
import { sendEmail } from './email.js';

interface NotifyOptions {
	userId?: string;
	roleId?: number;
	organizationId?: string;
	type: string;
	title: string;
	message: string;
	payload?: Record<string, unknown>;
	sendEmailNotification?: boolean;
}

export async function notify(opts: NotifyOptions): Promise<void> {
	const targets: Array<{ id: string; email: string; name: string }> = [];

	if (opts.userId) {
		const [user] = await db
			.select({ id: users.id, email: users.email, name: users.name })
			.from(users)
			.where(eq(users.id, opts.userId));
		if (user) targets.push(user);
	}

	if (opts.roleId) {
		const roleUsers = await db
			.select({ userId: userRoles.userId })
			.from(userRoles)
			.where(eq(userRoles.roleId, opts.roleId));
		for (const ru of roleUsers) {
			if (!targets.find(t => t.id === ru.userId)) {
				const [user] = await db
					.select({ id: users.id, email: users.email, name: users.name })
					.from(users)
					.where(eq(users.id, ru.userId));
				if (user) targets.push(user);
			}
		}
	}

	if (targets.length === 0) {
		const allAdmins = await db
			.select({ userId: userRoles.userId })
			.from(userRoles)
			.where(eq(userRoles.roleId, 1));
		for (const a of allAdmins) {
			const [user] = await db
				.select({ id: users.id, email: users.email, name: users.name })
				.from(users)
				.where(eq(users.id, a.userId));
			if (user) targets.push(user);
		}
	}

	for (const target of targets) {
		let emailSent = false;

		if (opts.sendEmailNotification !== false) {
			emailSent = await sendEmail({
				to: target.email,
				subject: `[Colonias Felinas] ${opts.title}`,
				html: buildEmailHtml(opts.title, opts.message, target.name),
				organizationId: opts.organizationId
			});
		}

		await db.insert(notifications).values({
			userId: target.id,
			organizationId: opts.organizationId || null,
			type: opts.type,
			title: opts.title,
			message: opts.message,
			payload: opts.payload || null,
			channel: emailSent ? 'email+internal' : 'internal',
			emailSent
		});
	}
}

function buildEmailHtml(title: string, message: string, userName: string): string {
	return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f7f6;margin:0;padding:20px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
	<div style="background:#005a4d;padding:20px 24px">
		<h1 style="color:#fff;font-size:18px;margin:0">Gestión de Colonias Felinas</h1>
	</div>
	<div style="padding:24px">
		<p style="color:#333;font-size:14px;margin:0 0 8px">Hola ${userName},</p>
		<h2 style="color:#005a4d;font-size:16px;margin:0 0 12px">${title}</h2>
		<p style="color:#555;font-size:14px;line-height:1.5;margin:0 0 20px">${message}</p>
		<a href="${process.env.BETTER_AUTH_URL || 'http://localhost:5173'}/dashboard" style="display:inline-block;background:#005a4d;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">Ir a la aplicación</a>
	</div>
	<div style="background:#f8f9fa;padding:12px 24px;font-size:11px;color:#999;text-align:center">
		Este es un mensaje automático. No respondas a este email.
	</div>
</div>
</body>
</html>`;
}

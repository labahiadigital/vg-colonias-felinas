import { db } from './db/index.js';
import { organizations, emailTemplates } from './db/schema.js';
import { eq, and } from 'drizzle-orm';

interface SendEmailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
	organizationId?: string;
}

interface SmtpConfig {
	host: string;
	port: number;
	user: string;
	pass: string;
	from: string;
}

async function getSmtpConfig(organizationId?: string): Promise<SmtpConfig | null> {
	if (!organizationId) return getDefaultSmtp();

	const [org] = await db
		.select({
			smtpHost: organizations.smtpHost,
			smtpPort: organizations.smtpPort,
			smtpUser: organizations.smtpUser,
			smtpPass: organizations.smtpPass,
			smtpFrom: organizations.smtpFrom
		})
		.from(organizations)
		.where(eq(organizations.id, organizationId));

	if (org?.smtpHost && org?.smtpUser && org?.smtpPass) {
		return {
			host: org.smtpHost,
			port: org.smtpPort || 587,
			user: org.smtpUser,
			pass: org.smtpPass,
			from: org.smtpFrom || org.smtpUser
		};
	}

	return getDefaultSmtp();
}

function getDefaultSmtp(): SmtpConfig | null {
	const host = process.env.SMTP_HOST;
	const user = process.env.SMTP_USER;
	const pass = process.env.SMTP_PASS;
	if (!host || !user || !pass) return null;

	return {
		host,
		port: parseInt(process.env.SMTP_PORT || '587'),
		user,
		pass,
		from: process.env.SMTP_FROM || user
	};
}

export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
	const smtp = await getSmtpConfig(opts.organizationId);
	if (!smtp) {
		console.warn('[email] SMTP no configurado, email no enviado:', opts.subject);
		return false;
	}

	try {
		const response = await fetch(`https://${smtp.host}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Basic ${btoa(`${smtp.user}:${smtp.pass}`)}`
			},
			body: JSON.stringify({
				from: smtp.from,
				to: opts.to,
				subject: opts.subject,
				html: opts.html,
				text: opts.text
			})
		});

		if (!response.ok) {
			console.error('[email] Error enviando email:', response.status);
			return false;
		}
		return true;
	} catch (error) {
		console.error('[email] Error de conexión SMTP:', error);
		return false;
	}
}

export async function sendTemplateEmail(
	templateKey: string,
	to: string,
	variables: Record<string, string>,
	organizationId?: string,
	locale = 'es'
): Promise<boolean> {
	const conditions = [eq(emailTemplates.key, templateKey), eq(emailTemplates.isActive, true)];
	if (organizationId) conditions.push(eq(emailTemplates.organizationId, organizationId));
	conditions.push(eq(emailTemplates.locale, locale));

	const [template] = await db
		.select()
		.from(emailTemplates)
		.where(and(...conditions))
		.limit(1);

	if (!template) {
		console.warn(`[email] Template '${templateKey}' no encontrada`);
		return false;
	}

	let subject = template.subject;
	let html = template.bodyHtml;
	let text = template.bodyText || '';

	for (const [key, value] of Object.entries(variables)) {
		const placeholder = `{{${key}}}`;
		subject = subject.replaceAll(placeholder, value);
		html = html.replaceAll(placeholder, value);
		text = text.replaceAll(placeholder, value);
	}

	return sendEmail({ to, subject, html, text, organizationId });
}

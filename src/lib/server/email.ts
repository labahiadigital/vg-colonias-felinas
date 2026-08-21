import { db } from './db/index.js';
import { organizations, emailTemplates } from './db/schema.js';
import { eq, and } from 'drizzle-orm';
import { createTransport, type Transporter } from 'nodemailer';
import { escHtml } from './html.js';
import { createLogger } from './logger.js';

const log = createLogger('email');

interface SendEmailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
	organizationId?: string | null;
}

interface SmtpConfig {
	host: string;
	port: number;
	user: string;
	pass: string;
	from: string;
}

async function getSmtpConfig(organizationId?: string | null): Promise<SmtpConfig | null> {
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

export function getDefaultSmtp(): SmtpConfig | null {
	const host = process.env.SMTP_HOST;
	const user = process.env.SMTP_USER;
	const pass = process.env.SMTP_PASS;
	if (!host || !user || !pass) return null;

	return {
		host,
		port: parseInt(process.env.SMTP_PORT || '587', 10),
		user,
		pass,
		from: process.env.SMTP_FROM || user
	};
}

const transporterCache = new Map<string, Transporter>();

function getOrCreateTransport(smtp: SmtpConfig): Transporter {
	const cacheKey = `${smtp.host}:${smtp.port}:${smtp.user}`;
	let transport = transporterCache.get(cacheKey);
	if (!transport) {
		transport = createTransport({
			host: smtp.host,
			port: smtp.port,
			secure: smtp.port === 465,
			auth: {
				user: smtp.user,
				pass: smtp.pass
			}
		});
		transporterCache.set(cacheKey, transport);
	}
	return transport;
}

export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
	const smtp = await getSmtpConfig(opts.organizationId);
	if (!smtp) {
		log.warn('SMTP no configurado, email no enviado', { subject: opts.subject });
		return false;
	}

	try {
		const transport = getOrCreateTransport(smtp);
		await transport.sendMail({
			from: smtp.from,
			to: opts.to,
			subject: opts.subject,
			html: opts.html,
			text: opts.text
		});
		return true;
	} catch (error) {
		log.error('Error enviando email', { to: opts.to, subject: opts.subject, error: String(error) });
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
		log.warn('Template no encontrada', { templateKey, locale });
		return false;
	}

	const { subject, html, text } = replaceTemplateVariables(
		{ subject: template.subject, bodyHtml: template.bodyHtml, bodyText: template.bodyText || '' },
		variables
	);

	return sendEmail({ to, subject, html, text, organizationId });
}

export function replaceTemplateVariables(
	template: { subject: string; bodyHtml: string; bodyText: string },
	variables: Record<string, string>
): { subject: string; html: string; text: string } {
	let subject = template.subject;
	let html = template.bodyHtml;
	let text = template.bodyText;

	for (const [key, value] of Object.entries(variables)) {
		const placeholder = `{{${key}}}`;
		subject = subject.replaceAll(placeholder, value);
		html = html.replaceAll(placeholder, escHtml(value));
		text = text.replaceAll(placeholder, value);
	}

	return { subject, html, text };
}

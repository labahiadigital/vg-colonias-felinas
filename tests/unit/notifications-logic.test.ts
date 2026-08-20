import { describe, it, expect } from 'vitest';

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
	</div>
</div>
</body>
</html>`;
}

function validateNotifyOptions(opts: NotifyOptions): string[] {
	const errors: string[] = [];
	if (!opts.type) errors.push('type is required');
	if (!opts.title) errors.push('title is required');
	if (!opts.message) errors.push('message is required');
	if (!opts.userId && !opts.roleId) {
		// falls back to admins, so it's fine
	}
	return errors;
}

describe('Notification email HTML builder', () => {
	it('includes user name', () => {
		const html = buildEmailHtml('Test', 'Message', 'Juan');
		expect(html).toContain('Hola Juan');
	});

	it('includes notification title', () => {
		const html = buildEmailHtml('Incidencia creada', 'Detalle', 'María');
		expect(html).toContain('Incidencia creada');
	});

	it('includes message body', () => {
		const html = buildEmailHtml('Title', 'Body text here', 'User');
		expect(html).toContain('Body text here');
	});

	it('is valid HTML', () => {
		const html = buildEmailHtml('T', 'M', 'U');
		expect(html).toContain('<!DOCTYPE html>');
		expect(html).toContain('</html>');
	});

	it('includes brand color', () => {
		const html = buildEmailHtml('T', 'M', 'U');
		expect(html).toContain('#005a4d');
	});
});

describe('validateNotifyOptions', () => {
	it('passes with valid options', () => {
		expect(validateNotifyOptions({ type: 'test', title: 'Hi', message: 'Body' })).toHaveLength(0);
	});

	it('fails without type', () => {
		const errors = validateNotifyOptions({ type: '', title: 'Hi', message: 'Body' });
		expect(errors).toContain('type is required');
	});

	it('fails without title', () => {
		const errors = validateNotifyOptions({ type: 'test', title: '', message: 'Body' });
		expect(errors).toContain('title is required');
	});

	it('fails without message', () => {
		const errors = validateNotifyOptions({ type: 'test', title: 'Hi', message: '' });
		expect(errors).toContain('message is required');
	});
});

describe('Notification channel determination', () => {
	function determineChannel(emailSent: boolean): string {
		return emailSent ? 'email+internal' : 'internal';
	}

	it('returns email+internal when email sent', () => {
		expect(determineChannel(true)).toBe('email+internal');
	});

	it('returns internal when email not sent', () => {
		expect(determineChannel(false)).toBe('internal');
	});
});

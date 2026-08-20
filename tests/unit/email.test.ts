import { describe, it, expect } from 'vitest';

function getDefaultSmtp(): { host: string; port: number; user: string; pass: string; from: string } | null {
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

function replaceTemplateVariables(
	template: { subject: string; bodyHtml: string; bodyText: string },
	variables: Record<string, string>
): { subject: string; html: string; text: string } {
	let subject = template.subject;
	let html = template.bodyHtml;
	let text = template.bodyText;

	for (const [key, value] of Object.entries(variables)) {
		const placeholder = `{{${key}}}`;
		subject = subject.replaceAll(placeholder, value);
		html = html.replaceAll(placeholder, value);
		text = text.replaceAll(placeholder, value);
	}

	return { subject, html, text };
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

describe('getDefaultSmtp', () => {
	const originalEnv = { ...process.env };

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it('returns null when no SMTP vars set', () => {
		delete process.env.SMTP_HOST;
		delete process.env.SMTP_USER;
		delete process.env.SMTP_PASS;
		expect(getDefaultSmtp()).toBeNull();
	});

	it('returns null when host missing', () => {
		delete process.env.SMTP_HOST;
		process.env.SMTP_USER = 'user@test.com';
		process.env.SMTP_PASS = 'pass123';
		expect(getDefaultSmtp()).toBeNull();
	});

	it('returns config when all vars present', () => {
		process.env.SMTP_HOST = 'smtp.test.com';
		process.env.SMTP_USER = 'user@test.com';
		process.env.SMTP_PASS = 'pass123';
		const result = getDefaultSmtp();
		expect(result).not.toBeNull();
		expect(result!.host).toBe('smtp.test.com');
		expect(result!.port).toBe(587);
		expect(result!.from).toBe('user@test.com');
	});

	it('uses custom port when SMTP_PORT set', () => {
		process.env.SMTP_HOST = 'smtp.test.com';
		process.env.SMTP_USER = 'user@test.com';
		process.env.SMTP_PASS = 'pass123';
		process.env.SMTP_PORT = '465';
		const result = getDefaultSmtp();
		expect(result!.port).toBe(465);
	});

	it('uses SMTP_FROM when set', () => {
		process.env.SMTP_HOST = 'smtp.test.com';
		process.env.SMTP_USER = 'user@test.com';
		process.env.SMTP_PASS = 'pass123';
		process.env.SMTP_FROM = 'noreply@gatopolis.app';
		const result = getDefaultSmtp();
		expect(result!.from).toBe('noreply@gatopolis.app');
	});
});

describe('replaceTemplateVariables', () => {
	it('replaces single variable in all fields', () => {
		const template = {
			subject: 'Hola {{name}}',
			bodyHtml: '<p>Bienvenido {{name}}</p>',
			bodyText: 'Bienvenido {{name}}'
		};
		const result = replaceTemplateVariables(template, { name: 'Ana' });
		expect(result.subject).toBe('Hola Ana');
		expect(result.html).toBe('<p>Bienvenido Ana</p>');
		expect(result.text).toBe('Bienvenido Ana');
	});

	it('replaces multiple variables', () => {
		const template = {
			subject: '{{action}} en {{colony}}',
			bodyHtml: '<p>{{user}} realizó {{action}} en {{colony}}</p>',
			bodyText: '{{user}} realizó {{action}} en {{colony}}'
		};
		const result = replaceTemplateVariables(template, {
			action: 'Alimentación',
			colony: 'Parque de la Florida',
			user: 'María'
		});
		expect(result.subject).toBe('Alimentación en Parque de la Florida');
		expect(result.html).toContain('María realizó Alimentación en Parque de la Florida');
	});

	it('replaces repeated variable occurrences', () => {
		const template = {
			subject: '{{name}} - {{name}}',
			bodyHtml: '{{name}} {{name}} {{name}}',
			bodyText: ''
		};
		const result = replaceTemplateVariables(template, { name: 'Test' });
		expect(result.subject).toBe('Test - Test');
		expect(result.html).toBe('Test Test Test');
	});

	it('leaves unmatched placeholders untouched', () => {
		const template = {
			subject: '{{known}} and {{unknown}}',
			bodyHtml: '',
			bodyText: ''
		};
		const result = replaceTemplateVariables(template, { known: 'value' });
		expect(result.subject).toBe('value and {{unknown}}');
	});
});

describe('buildEmailHtml', () => {
	it('includes user name in greeting', () => {
		const html = buildEmailHtml('Test Title', 'Test message', 'María');
		expect(html).toContain('Hola María');
	});

	it('includes title', () => {
		const html = buildEmailHtml('Nueva incidencia', 'Detalles...', 'Admin');
		expect(html).toContain('Nueva incidencia');
	});

	it('includes message body', () => {
		const html = buildEmailHtml('Título', 'Se ha detectado un gato herido', 'Admin');
		expect(html).toContain('Se ha detectado un gato herido');
	});

	it('is valid HTML structure', () => {
		const html = buildEmailHtml('T', 'M', 'U');
		expect(html).toContain('<!DOCTYPE html>');
		expect(html).toContain('<html');
		expect(html).toContain('</html>');
		expect(html).toContain('</body>');
	});

	it('includes brand header', () => {
		const html = buildEmailHtml('T', 'M', 'U');
		expect(html).toContain('Gestión de Colonias Felinas');
	});
});

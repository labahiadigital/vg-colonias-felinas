import { describe, it, expect, afterEach } from 'vitest';
import { getDefaultSmtp, replaceTemplateVariables } from '../../src/lib/server/email.js';
import { buildEmailHtml } from '../../src/lib/server/notifications.js';

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

	it('escapes HTML in variables injected into bodyHtml', () => {
		const template = {
			subject: '{{name}}',
			bodyHtml: '<p>Hola {{name}}</p>',
			bodyText: 'Hola {{name}}'
		};
		const result = replaceTemplateVariables(template, { name: '<script>alert("xss")</script>' });
		expect(result.subject).toBe('<script>alert("xss")</script>');
		expect(result.html).not.toContain('<script>');
		expect(result.html).toContain('&lt;script&gt;');
		expect(result.text).toBe('Hola <script>alert("xss")</script>');
	});

	it('escapes quotes and ampersands in HTML variables', () => {
		const template = {
			subject: '{{val}}',
			bodyHtml: '<div>{{val}}</div>',
			bodyText: '{{val}}'
		};
		const result = replaceTemplateVariables(template, { val: 'A & B "quoted"' });
		expect(result.html).toContain('A &amp; B &quot;quoted&quot;');
		expect(result.text).toBe('A & B "quoted"');
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

	it('escapes HTML in title to prevent XSS', () => {
		const html = buildEmailHtml('<script>alert("xss")</script>', 'msg', 'User');
		expect(html).not.toContain('<script>');
		expect(html).toContain('&lt;script&gt;');
	});

	it('escapes HTML in message to prevent XSS', () => {
		const html = buildEmailHtml('Title', '<img onerror="alert(1)">', 'User');
		expect(html).not.toContain('<img onerror');
		expect(html).toContain('&lt;img');
	});

	it('escapes HTML in userName to prevent XSS', () => {
		const html = buildEmailHtml('Title', 'msg', '"><script>x</script>');
		expect(html).not.toContain('"><script>');
	});

	it('includes call-to-action link', () => {
		const html = buildEmailHtml('T', 'M', 'U');
		expect(html).toContain('Ir a la aplicación');
		expect(html).toContain('/dashboard');
	});
});

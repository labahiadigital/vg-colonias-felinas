import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/db/index.js', () => ({
	db: {
		select: vi.fn().mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([])
				})
			})
		})
	}
}));

vi.mock('$lib/server/db/schema.js', () => ({
	organizations: { id: 'id', smtpHost: 'smtpHost', smtpPort: 'smtpPort', smtpUser: 'smtpUser', smtpPass: 'smtpPass', smtpFrom: 'smtpFrom' },
	emailTemplates: { key: 'key', isActive: 'isActive', organizationId: 'orgId', locale: 'locale', subject: 'subject', bodyHtml: 'bodyHtml', bodyText: 'bodyText' }
}));

const mockSendMail = vi.fn().mockResolvedValue({});
vi.mock('nodemailer', () => ({
	createTransport: vi.fn(() => ({ sendMail: mockSendMail }))
}));

vi.mock('$lib/server/html.js', () => ({
	escHtml: (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}));

vi.mock('$lib/server/logger.js', () => ({
	createLogger: () => ({ warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() })
}));

import { getDefaultSmtp, sendEmail, replaceTemplateVariables } from '../../src/lib/server/email.js';

beforeEach(() => {
	vi.clearAllMocks();
	delete process.env.SMTP_HOST;
	delete process.env.SMTP_USER;
	delete process.env.SMTP_PASS;
	delete process.env.SMTP_PORT;
	delete process.env.SMTP_FROM;
});

describe('getDefaultSmtp', () => {
	it('returns null when env vars not set', () => {
		expect(getDefaultSmtp()).toBeNull();
	});

	it('returns config when env vars are set', () => {
		process.env.SMTP_HOST = 'smtp.test.com';
		process.env.SMTP_USER = 'user@test.com';
		process.env.SMTP_PASS = 'pass123';
		const config = getDefaultSmtp();
		expect(config).toEqual({
			host: 'smtp.test.com',
			port: 587,
			user: 'user@test.com',
			pass: 'pass123',
			from: 'user@test.com'
		});
	});

	it('uses custom port and from', () => {
		process.env.SMTP_HOST = 'smtp.test.com';
		process.env.SMTP_USER = 'user@test.com';
		process.env.SMTP_PASS = 'pass';
		process.env.SMTP_PORT = '465';
		process.env.SMTP_FROM = 'noreply@test.com';
		const config = getDefaultSmtp();
		expect(config?.port).toBe(465);
		expect(config?.from).toBe('noreply@test.com');
	});

	it('returns null when host is missing', () => {
		process.env.SMTP_USER = 'user@test.com';
		process.env.SMTP_PASS = 'pass';
		expect(getDefaultSmtp()).toBeNull();
	});
});

describe('sendEmail', () => {
	it('returns false when SMTP not configured', async () => {
		const result = await sendEmail({
			to: 'test@example.com',
			subject: 'Test',
			html: '<p>Test</p>'
		});
		expect(result).toBe(false);
	});

	it('sends email when SMTP is configured', async () => {
		process.env.SMTP_HOST = 'smtp.test.com';
		process.env.SMTP_USER = 'user@test.com';
		process.env.SMTP_PASS = 'pass';
		const result = await sendEmail({
			to: 'dest@example.com',
			subject: 'Hello',
			html: '<p>Hi</p>'
		});
		expect(result).toBe(true);
		expect(mockSendMail).toHaveBeenCalledWith(
			expect.objectContaining({
				to: 'dest@example.com',
				subject: 'Hello'
			})
		);
	});

	it('returns false on transport error', async () => {
		process.env.SMTP_HOST = 'smtp.test.com';
		process.env.SMTP_USER = 'user@test.com';
		process.env.SMTP_PASS = 'pass';
		mockSendMail.mockRejectedValueOnce(new Error('Connection refused'));
		const result = await sendEmail({
			to: 'dest@example.com',
			subject: 'Fail',
			html: '<p>Fail</p>'
		});
		expect(result).toBe(false);
	});
});

describe('replaceTemplateVariables', () => {
	it('replaces placeholders in subject, html, and text', () => {
		const template = {
			subject: 'Hola {{name}}',
			bodyHtml: '<p>Bienvenido {{name}} a {{org}}</p>',
			bodyText: 'Bienvenido {{name}} a {{org}}'
		};
		const result = replaceTemplateVariables(template, { name: 'Juan', org: 'Gatopolis' });
		expect(result.subject).toBe('Hola Juan');
		expect(result.html).toContain('Juan');
		expect(result.html).toContain('Gatopolis');
		expect(result.text).toBe('Bienvenido Juan a Gatopolis');
	});

	it('escapes HTML in html body but not in subject/text', () => {
		const template = {
			subject: '{{name}}',
			bodyHtml: '<p>{{name}}</p>',
			bodyText: '{{name}}'
		};
		const result = replaceTemplateVariables(template, { name: '<script>alert(1)</script>' });
		expect(result.subject).toContain('<script>');
		expect(result.html).not.toContain('<script>');
		expect(result.html).toContain('&lt;script&gt;');
	});

	it('handles empty variables', () => {
		const template = { subject: 'No vars', bodyHtml: '<p>No vars</p>', bodyText: 'No vars' };
		const result = replaceTemplateVariables(template, {});
		expect(result.subject).toBe('No vars');
	});
});

import { describe, it, expect } from 'vitest';
import { buildEmailHtml } from '../../src/lib/server/notifications.js';

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

	it('includes call-to-action', () => {
		const html = buildEmailHtml('T', 'M', 'U');
		expect(html).toContain('Ir a la aplicación');
	});

	it('escapes user-provided content', () => {
		const html = buildEmailHtml('<script>xss</script>', 'msg', 'User');
		expect(html).not.toContain('<script>xss</script>');
		expect(html).toContain('&lt;script&gt;');
	});
});

import { describe, it, expect } from 'vitest';
import { escHtml, htmlDocHeaders } from '../../src/lib/server/html.js';

describe('escHtml', () => {
	it('returns empty string for null', () => {
		expect(escHtml(null)).toBe('');
	});

	it('returns empty string for undefined', () => {
		expect(escHtml(undefined)).toBe('');
	});

	it('returns empty string for empty string', () => {
		expect(escHtml('')).toBe('');
	});

	it('passes through safe text unchanged', () => {
		expect(escHtml('Hello World 123')).toBe('Hello World 123');
	});

	it('escapes ampersand', () => {
		expect(escHtml('A & B')).toBe('A &amp; B');
	});

	it('escapes less-than sign', () => {
		expect(escHtml('a < b')).toBe('a &lt; b');
	});

	it('escapes greater-than sign', () => {
		expect(escHtml('a > b')).toBe('a &gt; b');
	});

	it('escapes double quotes', () => {
		expect(escHtml('say "hello"')).toBe('say &quot;hello&quot;');
	});

	it('escapes basic XSS script tag', () => {
		const xss = '<script>alert("xss")</script>';
		const escaped = escHtml(xss);
		expect(escaped).not.toContain('<script>');
		expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
	});

	it('escapes event handler injection', () => {
		const xss = '<img onerror="alert(1)" src=x>';
		const escaped = escHtml(xss);
		expect(escaped).not.toContain('<img');
		expect(escaped).toBe('&lt;img onerror=&quot;alert(1)&quot; src=x&gt;');
	});

	it('escapes nested angle brackets', () => {
		expect(escHtml('<<>>')).toBe('&lt;&lt;&gt;&gt;');
	});

	it('handles mixed special characters', () => {
		const input = 'Tom & Jerry <"friends"> since \'99';
		const expected = 'Tom &amp; Jerry &lt;&quot;friends&quot;&gt; since \'99';
		expect(escHtml(input)).toBe(expected);
	});

	it('preserves unicode characters', () => {
		expect(escHtml('gato ñ señal €')).toBe('gato ñ señal €');
	});

	it('escapes ampersand before other entities to prevent double-escaping', () => {
		const result = escHtml('&lt;');
		expect(result).toBe('&amp;lt;');
	});
});

describe('htmlDocHeaders', () => {
	it('includes Content-Type with utf-8', () => {
		const headers = htmlDocHeaders() as Record<string, string>;
		expect(headers['Content-Type']).toBe('text/html; charset=utf-8');
	});

	it('includes CSP header blocking scripts', () => {
		const headers = htmlDocHeaders() as Record<string, string>;
		expect(headers['Content-Security-Policy']).toContain("default-src 'none'");
	});

	it('includes X-Content-Type-Options nosniff', () => {
		const headers = htmlDocHeaders() as Record<string, string>;
		expect(headers['X-Content-Type-Options']).toBe('nosniff');
	});

	it('does not include Content-Disposition when no filename', () => {
		const headers = htmlDocHeaders() as Record<string, string>;
		expect(headers['Content-Disposition']).toBeUndefined();
	});

	it('includes inline Content-Disposition with filename', () => {
		const headers = htmlDocHeaders('report.html') as Record<string, string>;
		expect(headers['Content-Disposition']).toBe('inline; filename="report.html"');
	});

	it('includes attachment Content-Disposition when specified', () => {
		const headers = htmlDocHeaders('cert.html', 'attachment') as Record<string, string>;
		expect(headers['Content-Disposition']).toBe('attachment; filename="cert.html"');
	});

	it('CSP allows inline styles and https images', () => {
		const headers = htmlDocHeaders() as Record<string, string>;
		const csp = headers['Content-Security-Policy'];
		expect(csp).toContain("style-src 'unsafe-inline'");
		expect(csp).toContain('img-src https: data:');
	});
});

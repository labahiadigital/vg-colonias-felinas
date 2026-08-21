import { describe, it, expect } from 'vitest';
import { buildPushPayload, shouldDeleteSubscription, extractStatusCode } from '../../src/lib/server/push-notify.js';

describe('Push notification payload builder', () => {
	it('builds JSON with title and body', () => {
		const result = JSON.parse(buildPushPayload({ title: 'Test', body: 'Body' }));
		expect(result.title).toBe('Test');
		expect(result.body).toBe('Body');
	});

	it('defaults icon to /icon-192.png', () => {
		const result = JSON.parse(buildPushPayload({ title: 'T', body: 'B' }));
		expect(result.icon).toBe('/icon-192.png');
	});

	it('uses custom icon when provided', () => {
		const result = JSON.parse(buildPushPayload({ title: 'T', body: 'B', icon: '/custom.png' }));
		expect(result.icon).toBe('/custom.png');
	});

	it('defaults URL to /dashboard', () => {
		const result = JSON.parse(buildPushPayload({ title: 'T', body: 'B' }));
		expect(result.data.url).toBe('/dashboard');
	});

	it('uses custom URL', () => {
		const result = JSON.parse(buildPushPayload({ title: 'T', body: 'B', url: '/incidencias' }));
		expect(result.data.url).toBe('/incidencias');
	});

	it('includes tag when provided', () => {
		const result = JSON.parse(buildPushPayload({ title: 'T', body: 'B', tag: 'incident-123' }));
		expect(result.tag).toBe('incident-123');
	});
});

describe('Subscription cleanup logic', () => {
	it('deletes on 410 Gone', () => {
		expect(shouldDeleteSubscription(410)).toBe(true);
	});

	it('deletes on 404 Not Found', () => {
		expect(shouldDeleteSubscription(404)).toBe(true);
	});

	it('does not delete on 200', () => {
		expect(shouldDeleteSubscription(200)).toBe(false);
	});

	it('does not delete on 500', () => {
		expect(shouldDeleteSubscription(500)).toBe(false);
	});
});

describe('extractStatusCode', () => {
	it('extracts numeric statusCode from error-like object', () => {
		expect(extractStatusCode({ statusCode: 410, message: 'Gone' })).toBe(410);
	});

	it('returns undefined for null', () => {
		expect(extractStatusCode(null)).toBeUndefined();
	});

	it('returns undefined for string error', () => {
		expect(extractStatusCode('network error')).toBeUndefined();
	});

	it('returns undefined when statusCode is a string', () => {
		expect(extractStatusCode({ statusCode: '404' })).toBeUndefined();
	});

	it('returns undefined for objects without statusCode', () => {
		expect(extractStatusCode({ code: 'ECONNRESET' })).toBeUndefined();
	});

	it('returns undefined for undefined', () => {
		expect(extractStatusCode(undefined)).toBeUndefined();
	});
});

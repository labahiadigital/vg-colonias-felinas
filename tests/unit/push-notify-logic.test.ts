import { describe, it, expect } from 'vitest';

interface PushPayload {
	title: string;
	body: string;
	icon?: string;
	url?: string;
	tag?: string;
}

function buildPushPayload(payload: PushPayload): string {
	return JSON.stringify({
		title: payload.title,
		body: payload.body,
		icon: payload.icon || '/icon-192.png',
		data: { url: payload.url || '/dashboard' },
		tag: payload.tag
	});
}

function shouldDeleteSubscription(statusCode: number): boolean {
	return statusCode === 410 || statusCode === 404;
}

function shouldFallbackToEmail(sent: number): boolean {
	return sent === 0;
}

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

describe('Email fallback logic', () => {
	it('falls back when 0 sent', () => {
		expect(shouldFallbackToEmail(0)).toBe(true);
	});

	it('does not fall back when any sent', () => {
		expect(shouldFallbackToEmail(1)).toBe(false);
		expect(shouldFallbackToEmail(5)).toBe(false);
	});
});

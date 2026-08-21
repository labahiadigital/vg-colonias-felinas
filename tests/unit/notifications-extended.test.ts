import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/server/db/index.js', () => ({
	db: {
		select: vi.fn().mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([])
			})
		}),
		insert: vi.fn().mockReturnValue({
			values: vi.fn().mockResolvedValue(undefined)
		})
	}
}));

vi.mock('$lib/server/db/schema.js', () => ({
	notifications: {},
	userRoles: { userId: 'userId', roleId: 'roleId' },
	users: { id: 'id', email: 'email', name: 'name' },
	organizationMembers: { userId: 'userId', organizationId: 'orgId' }
}));

vi.mock('drizzle-orm', () => ({
	eq: (a: unknown, b: unknown) => ({ eq: [a, b] }),
	inArray: (a: unknown, b: unknown) => ({ inArray: [a, b] })
}));

vi.mock('$lib/server/email.js', () => ({
	sendEmail: vi.fn().mockResolvedValue(true)
}));

vi.mock('$lib/server/push-notify.js', () => ({
	sendPushNotification: vi.fn().mockResolvedValue({ sent: 1, failed: 0 })
}));

vi.mock('$lib/server/html.js', () => ({
	escHtml: (s: string) => s
}));

import { buildEmailHtml, notify } from '../../src/lib/server/notifications.js';

describe('buildEmailHtml', () => {
	it('includes title, message, and userName', () => {
		const html = buildEmailHtml('Test Title', 'Test message', 'Juan');
		expect(html).toContain('Test Title');
		expect(html).toContain('Test message');
		expect(html).toContain('Juan');
	});

	it('includes app URL link', () => {
		const html = buildEmailHtml('T', 'M', 'N');
		expect(html).toContain('/dashboard');
	});

	it('is valid HTML structure', () => {
		const html = buildEmailHtml('T', 'M', 'N');
		expect(html).toContain('<!DOCTYPE html>');
		expect(html).toContain('</html>');
	});

	it('includes brand color', () => {
		const html = buildEmailHtml('T', 'M', 'N');
		expect(html).toContain('#005a4d');
	});
});

describe('notify', () => {
	it('does nothing when no targets found', async () => {
		await expect(notify({
			type: 'test',
			title: 'Test',
			message: 'Test msg',
			userId: 'user-1'
		})).resolves.toBeUndefined();
	});
});

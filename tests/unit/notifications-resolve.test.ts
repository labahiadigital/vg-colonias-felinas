import { describe, it, expect, vi, beforeEach } from 'vitest';

const whereMock = vi.fn();
const fromMock = vi.fn(() => ({ where: whereMock }));
const selectMock = vi.fn(() => ({ from: fromMock }));

vi.mock('../../src/lib/server/db/index.js', () => ({
	db: { select: selectMock }
}));

vi.mock('../../src/lib/server/email.js', () => ({
	sendEmail: vi.fn().mockResolvedValue(true)
}));

vi.mock('../../src/lib/server/push-notify.js', () => ({
	sendPushNotification: vi.fn().mockResolvedValue({ sent: 0, failed: 0 })
}));

vi.mock('../../src/lib/server/html.js', () => ({
	escHtml: (s: string) => s
}));

const { resolveTargets } = await import('../../src/lib/server/notifications.js');

beforeEach(() => {
	vi.clearAllMocks();
});

describe('resolveTargets', () => {
	it('returns the direct user when userId is provided', async () => {
		whereMock
			.mockResolvedValueOnce([{ id: 'org-member-1' }])
			.mockResolvedValueOnce([{ id: 'u1', email: 'u1@test.com', name: 'User 1' }]);

		const result = await resolveTargets({
			userId: 'u1',
			organizationId: 'org1'
		});

		expect(result).toEqual([{ id: 'u1', email: 'u1@test.com', name: 'User 1' }]);
	});

	it('returns users with the specified roleId', async () => {
		whereMock
			.mockResolvedValueOnce([{ id: 'u1' }, { id: 'u2' }])
			.mockResolvedValueOnce([{ userId: 'u1' }, { userId: 'u2' }])
			.mockResolvedValueOnce([
				{ id: 'u1', email: 'u1@test.com', name: 'User 1' },
				{ id: 'u2', email: 'u2@test.com', name: 'User 2' }
			]);

		const result = await resolveTargets({
			roleId: 5,
			organizationId: 'org1'
		});

		expect(result).toHaveLength(2);
		expect(result.map((r: { id: string }) => r.id)).toEqual(['u1', 'u2']);
	});

	it('falls back to admin users (roleId=1) when no userId or roleId match', async () => {
		whereMock
			.mockResolvedValueOnce([{ id: 'admin1' }])
			.mockResolvedValueOnce([{ userId: 'admin1' }])
			.mockResolvedValueOnce([{ id: 'admin1', email: 'admin@test.com', name: 'Admin' }]);

		const result = await resolveTargets({
			organizationId: 'org1'
		});

		expect(result).toEqual([{ id: 'admin1', email: 'admin@test.com', name: 'Admin' }]);
	});

	it('returns empty array when no targets found at all', async () => {
		whereMock
			.mockResolvedValueOnce([])
			.mockResolvedValueOnce([]);

		const result = await resolveTargets({
			organizationId: 'org1'
		});

		expect(result).toEqual([]);
	});

	it('filters role users by org membership when organizationId is set', async () => {
		whereMock
			.mockResolvedValueOnce([{ id: 'u1' }])
			.mockResolvedValueOnce([{ userId: 'u1' }, { userId: 'u-other-org' }])
			.mockResolvedValueOnce([{ id: 'u1', email: 'u1@test.com', name: 'User 1' }]);

		const result = await resolveTargets({
			roleId: 5,
			organizationId: 'org1'
		});

		expect(result).toHaveLength(1);
	});

	it('skips org membership filter when no organizationId', async () => {
		whereMock
			.mockResolvedValueOnce([{ userId: 'u1' }, { userId: 'u2' }])
			.mockResolvedValueOnce([
				{ id: 'u1', email: 'u1@test.com', name: 'User 1' },
				{ id: 'u2', email: 'u2@test.com', name: 'User 2' }
			]);

		const result = await resolveTargets({
			roleId: 5
		});

		expect(result).toHaveLength(2);
	});

	it('deduplicates targets when userId and roleId overlap', async () => {
		whereMock
			.mockResolvedValueOnce([{ id: 'u1' }])
			.mockResolvedValueOnce([{ userId: 'u1' }])
			.mockResolvedValueOnce([{ id: 'u1', email: 'u1@test.com', name: 'User 1' }]);

		const result = await resolveTargets({
			userId: 'u1',
			roleId: 5,
			organizationId: 'org1'
		});

		expect(result).toHaveLength(1);
	});
});

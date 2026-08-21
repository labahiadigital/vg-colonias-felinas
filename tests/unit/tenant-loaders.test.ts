import { describe, it, expect, vi, beforeEach } from 'vitest';

const orderByMock = vi.fn();
const whereMock = vi.fn(() => ({ orderBy: orderByMock }));
const fromMock = vi.fn(() => ({ where: whereMock }));
const selectMock = vi.fn(() => ({ from: fromMock }));

vi.mock('../../src/lib/server/db/index.js', () => ({
	db: { select: selectMock }
}));

const {
	loadOrgColonies,
	loadOrgUsers,
	loadOrgCats,
	verifyOrgOwnership,
	getTenantContext
} = await import('../../src/lib/server/tenant.js');

beforeEach(() => {
	vi.clearAllMocks();
	fromMock.mockReturnValue({ where: whereMock });
	whereMock.mockReturnValue({ orderBy: orderByMock });
});

describe('loadOrgColonies', () => {
	it('calls db.select().from(colonies).where(...)', () => {
		loadOrgColonies('org-1');
		expect(selectMock).toHaveBeenCalled();
		expect(fromMock).toHaveBeenCalled();
		expect(whereMock).toHaveBeenCalled();
	});

	it('passes undefined where when orgId is null', () => {
		loadOrgColonies(null);
		expect(whereMock).toHaveBeenCalledWith(undefined);
	});

	it('passes a SQL condition when orgId is present', () => {
		loadOrgColonies('org-abc');
		const call = whereMock.mock.calls[0]![0];
		expect(call).toBeDefined();
	});
});

describe('loadOrgUsers', () => {
	it('returns all users when orgId is null', async () => {
		const users = [{ id: 'u1', name: 'A' }, { id: 'u2', name: 'B' }];
		fromMock.mockReturnValue({ orderBy: vi.fn().mockResolvedValue(users) });

		const result = await loadOrgUsers(null);
		expect(result).toEqual(users);
	});

	it('filters by org membership when orgId is set', async () => {
		const users = [{ id: 'u1', name: 'Member' }];
		whereMock.mockReturnValue({ orderBy: vi.fn().mockResolvedValue(users) });

		const result = await loadOrgUsers('org-1');
		expect(result).toEqual(users);
		expect(selectMock).toHaveBeenCalled();
	});

	it('returns empty array when no org members', async () => {
		whereMock.mockReturnValue({ orderBy: vi.fn().mockResolvedValue([]) });

		const result = await loadOrgUsers('org-empty');
		expect(result).toEqual([]);
	});
});

describe('loadOrgCats', () => {
	it('calls db.select and returns cats', () => {
		loadOrgCats('org-1');
		expect(selectMock).toHaveBeenCalled();
		expect(fromMock).toHaveBeenCalled();
	});

	it('passes undefined where when orgId is null', () => {
		loadOrgCats(null);
		const call = whereMock.mock.calls[0]![0];
		expect(call).toBeUndefined();
	});
});

describe('verifyOrgOwnership', () => {
	it('returns false when resourceId is empty', async () => {
		const result = await verifyOrgOwnership(
			{ id: 'col', organizationId: 'orgcol' } as never,
			'',
			'org-1'
		);
		expect(result).toBe(false);
	});

	it('returns true when DB returns rows', async () => {
		const limitFn = vi.fn().mockResolvedValue([{ id: 'r1' }]);
		whereMock.mockReturnValue({ limit: limitFn });

		const result = await verifyOrgOwnership(
			{ id: 'col', organizationId: 'orgcol' } as never,
			'res-1',
			'org-1'
		);
		expect(result).toBe(true);
	});

	it('returns false when DB returns no rows', async () => {
		const limitFn = vi.fn().mockResolvedValue([]);
		whereMock.mockReturnValue({ limit: limitFn });

		const result = await verifyOrgOwnership(
			{ id: 'col', organizationId: 'orgcol' } as never,
			'res-1',
			'org-1'
		);
		expect(result).toBe(false);
	});
});

describe('getTenantContext', () => {
	it('throws when user is not authenticated', () => {
		expect(() =>
			getTenantContext({ user: null, organizationId: null } as never)
		).toThrow('Not authenticated');
	});

	it('returns context with userId and organizationId', () => {
		const ctx = getTenantContext({
			user: { id: 'u1' },
			organizationId: 'org-1'
		} as never);
		expect(ctx).toEqual({
			userId: 'u1',
			organizationId: 'org-1',
			ipAddress: undefined
		});
	});

	it('extracts IP from request headers', () => {
		const req = { headers: new Headers({ 'x-forwarded-for': '1.2.3.4' }) } as unknown as Request;
		const ctx = getTenantContext(
			{ user: { id: 'u1' }, organizationId: 'org-1' } as never,
			req
		);
		expect(ctx.ipAddress).toBe('1.2.3.4');
	});
});

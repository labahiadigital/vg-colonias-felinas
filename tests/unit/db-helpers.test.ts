import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TenantContext } from '../../src/lib/server/tenant.js';

const returningMock = vi.fn();
const whereMock = vi.fn(() => ({ returning: returningMock }));
const setMock = vi.fn(() => ({ where: whereMock }));
const updateMock = vi.fn(() => ({ set: setMock }));
const deleteMock = vi.fn(() => ({ where: whereMock }));
const insertReturningMock = vi.fn();
const insertValuesMock = vi.fn(() => ({ returning: insertReturningMock }));
const insertMock = vi.fn(() => ({ values: insertValuesMock }));

vi.mock('../../src/lib/server/db/index.js', () => ({
	db: { update: updateMock, delete: deleteMock, insert: insertMock }
}));

const auditMock = vi.fn();
vi.mock('../../src/lib/server/audit.js', () => ({
	audit: auditMock
}));

const { guardedUpdate, guardedDelete, guardedUpdateWith, guardedInsert } = await import('../../src/lib/server/db-helpers.js');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fakeTable = { id: 'id-col' } as any;
const fakeWhere = {} as never;
const ctx: TenantContext = { userId: 'u1', organizationId: 'org1' };

beforeEach(() => {
	vi.clearAllMocks();
	setMock.mockReturnValue({ where: whereMock });
	whereMock.mockReturnValue({ returning: returningMock });
});

describe('guardedUpdate', () => {
	it('calls audit and returns true when rows affected', async () => {
		returningMock.mockResolvedValue([{ id: 'r1' }]);
		const result = await guardedUpdate(fakeTable, { name: 'x' }, fakeWhere, ctx, 'colony', 'c1', 'update', { name: 'x' });

		expect(result).toBe(true);
		expect(updateMock).toHaveBeenCalledWith(fakeTable);
		expect(auditMock).toHaveBeenCalledOnce();
		expect(auditMock).toHaveBeenCalledWith(ctx, 'colony', 'c1', 'update', { name: 'x' });
	});

	it('skips audit and returns false when no rows affected', async () => {
		returningMock.mockResolvedValue([]);
		const result = await guardedUpdate(fakeTable, { name: 'x' }, fakeWhere, ctx, 'colony', 'c1', 'update');

		expect(result).toBe(false);
		expect(auditMock).not.toHaveBeenCalled();
	});

	it('passes set data and where clause correctly', async () => {
		returningMock.mockResolvedValue([{ id: 'r1' }]);
		const setData = { status: 'active', updatedAt: new Date() };
		await guardedUpdate(fakeTable, setData, fakeWhere, ctx, 'cat', 'cat1', 'change_status');

		expect(setMock).toHaveBeenCalledWith(setData);
		expect(whereMock).toHaveBeenCalledWith(fakeWhere);
	});

	it('works without optional details parameter', async () => {
		returningMock.mockResolvedValue([{ id: 'r1' }]);
		await guardedUpdate(fakeTable, { x: 1 }, fakeWhere, ctx, 'colony', 'c1', 'update');

		expect(auditMock).toHaveBeenCalledWith(ctx, 'colony', 'c1', 'update', undefined);
	});

	it('handles multiple affected rows', async () => {
		returningMock.mockResolvedValue([{ id: 'r1' }, { id: 'r2' }]);
		const result = await guardedUpdate(fakeTable, { x: 1 }, fakeWhere, ctx, 'colony', 'c1', 'update');

		expect(result).toBe(true);
		expect(auditMock).toHaveBeenCalledOnce();
	});
});

describe('guardedDelete', () => {
	it('calls audit and returns true when rows affected', async () => {
		returningMock.mockResolvedValue([{ id: 'r1' }]);
		const result = await guardedDelete(fakeTable, fakeWhere, ctx, 'colony', 'c1', 'delete');

		expect(result).toBe(true);
		expect(deleteMock).toHaveBeenCalledWith(fakeTable);
		expect(auditMock).toHaveBeenCalledOnce();
		expect(auditMock).toHaveBeenCalledWith(ctx, 'colony', 'c1', 'delete', undefined);
	});

	it('skips audit and returns false when no rows affected', async () => {
		returningMock.mockResolvedValue([]);
		const result = await guardedDelete(fakeTable, fakeWhere, ctx, 'colony', 'c1', 'delete');

		expect(result).toBe(false);
		expect(auditMock).not.toHaveBeenCalled();
	});

	it('passes details to audit when provided', async () => {
		returningMock.mockResolvedValue([{ id: 'r1' }]);
		await guardedDelete(fakeTable, fakeWhere, ctx, 'incident', 'i1', 'delete', { reason: 'spam' });

		expect(auditMock).toHaveBeenCalledWith(ctx, 'incident', 'i1', 'delete', { reason: 'spam' });
	});
});

describe('guardedUpdateWith', () => {
	it('calls onSuccess with rows when rows affected', async () => {
		const rows = [{ id: 'r1', userId: 'u1' }];
		returningMock.mockResolvedValue(rows);
		const onSuccess = vi.fn();
		const result = await guardedUpdateWith(fakeTable, { status: 'active' }, fakeWhere,
			{ id: fakeTable.id, userId: 'userId-col' } as any, onSuccess);

		expect(result).toBe(true);
		expect(onSuccess).toHaveBeenCalledOnce();
		expect(onSuccess).toHaveBeenCalledWith(rows);
	});

	it('skips onSuccess and returns false when no rows affected', async () => {
		returningMock.mockResolvedValue([]);
		const onSuccess = vi.fn();
		const result = await guardedUpdateWith(fakeTable, { status: 'active' }, fakeWhere,
			{ id: fakeTable.id }, onSuccess);

		expect(result).toBe(false);
		expect(onSuccess).not.toHaveBeenCalled();
	});

	it('passes custom returning shape to the query', async () => {
		const customReturning = { id: fakeTable.id, userId: 'user-col' } as any;
		returningMock.mockResolvedValue([{ id: 'r1', userId: 'u2' }]);
		await guardedUpdateWith(fakeTable, { x: 1 }, fakeWhere, customReturning, vi.fn());

		expect(returningMock).toHaveBeenCalledWith(customReturning);
	});

	it('propagates errors from onSuccess', async () => {
		returningMock.mockResolvedValue([{ id: 'r1' }]);
		const onSuccess = vi.fn().mockRejectedValue(new Error('notify failed'));

		await expect(guardedUpdateWith(fakeTable, { x: 1 }, fakeWhere,
			{ id: fakeTable.id }, onSuccess))
			.rejects.toThrow('notify failed');
	});
});

describe('guardedInsert', () => {
	beforeEach(() => {
		insertMock.mockReturnValue({ values: insertValuesMock });
		insertValuesMock.mockReturnValue({ returning: insertReturningMock });
	});

	it('inserts, audits, and returns the new id', async () => {
		insertReturningMock.mockResolvedValue([{ id: 'new-1' }]);

		const id = await guardedInsert(fakeTable, { name: 'test' }, ctx, 'colony', 'create', { name: 'test' });

		expect(id).toBe('new-1');
		expect(insertMock).toHaveBeenCalledWith(fakeTable);
		expect(insertValuesMock).toHaveBeenCalledWith({ name: 'test' });
		expect(auditMock).toHaveBeenCalledOnce();
		expect(auditMock).toHaveBeenCalledWith(ctx, 'colony', 'new-1', 'create', { name: 'test' });
	});

	it('calls audit with default action "create" when not specified', async () => {
		insertReturningMock.mockResolvedValue([{ id: 'new-2' }]);

		await guardedInsert(fakeTable, { x: 1 }, ctx, 'cat');

		expect(auditMock).toHaveBeenCalledWith(ctx, 'cat', 'new-2', 'create', undefined);
	});

	it('always calls audit (insert always produces a row)', async () => {
		insertReturningMock.mockResolvedValue([{ id: 'new-3' }]);

		await guardedInsert(fakeTable, { x: 1 }, ctx, 'equipment', 'create');

		expect(auditMock).toHaveBeenCalledOnce();
	});

	it('propagates insert errors', async () => {
		insertReturningMock.mockRejectedValue(new Error('unique constraint'));

		await expect(guardedInsert(fakeTable, { x: 1 }, ctx, 'colony'))
			.rejects.toThrow('unique constraint');
		expect(auditMock).not.toHaveBeenCalled();
	});

	it('throws when returning yields empty array', async () => {
		insertReturningMock.mockResolvedValue([]);

		await expect(guardedInsert(fakeTable, { x: 1 }, ctx, 'colony'))
			.rejects.toThrow('returned no rows');
		expect(auditMock).not.toHaveBeenCalled();
	});
});

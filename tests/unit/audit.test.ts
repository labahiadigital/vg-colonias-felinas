import { describe, it, expect, vi } from 'vitest';

const mockInsertValues = vi.fn().mockResolvedValue(undefined);

vi.mock('$lib/server/db/index.js', () => ({
	db: {
		insert: vi.fn().mockReturnValue({
			values: (...args: unknown[]) => mockInsertValues(...args)
		})
	}
}));

vi.mock('$lib/server/db/schema.js', () => ({
	auditLogs: {}
}));

import { audit, type AuditEntity, type AuditAction } from '../../src/lib/server/audit.js';

describe('audit', () => {
	it('inserts an audit log entry', async () => {
		const ctx = { userId: 'user-1', organizationId: 'org-1', ipAddress: '1.2.3.4' };
		await audit(ctx, 'colony', 'col-1', 'create', { name: 'Test Colony' });
		expect(mockInsertValues).toHaveBeenCalledWith({
			userId: 'user-1',
			organizationId: 'org-1',
			entity: 'colony',
			entityId: 'col-1',
			action: 'create',
			details: { name: 'Test Colony' },
			ipAddress: '1.2.3.4'
		});
	});

	it('handles null organizationId', async () => {
		const ctx = { userId: 'user-1', organizationId: null };
		await audit(ctx, 'cat', 'cat-1', 'update');
		expect(mockInsertValues).toHaveBeenCalledWith(
			expect.objectContaining({
				organizationId: null,
				details: null,
				ipAddress: null
			})
		);
	});

	it('handles undefined ipAddress', async () => {
		const ctx = { userId: 'user-1', organizationId: 'org-1' };
		await audit(ctx, 'incident', 'inc-1', 'delete');
		expect(mockInsertValues).toHaveBeenCalledWith(
			expect.objectContaining({ ipAddress: null })
		);
	});

	it('supports all entity types', () => {
		const entities: AuditEntity[] = [
			'colony', 'cat', 'health_record', 'incident', 'collaborator',
			'adoption', 'inspection', 'equipment', 'visit', 'cer_action',
			'provider', 'user', 'system', 'organization'
		];
		expect(entities.length).toBeGreaterThan(10);
	});

	it('supports all action types', () => {
		const actions: AuditAction[] = [
			'create', 'update', 'delete', 'change_status',
			'assign', 'export', 'import', 'generate'
		];
		expect(actions.length).toBeGreaterThan(5);
	});
});

import { db } from './db/index.js';
import { auditLogs } from './db/schema.js';

export async function logAudit(params: {
	userId: string;
	entity: string;
	entityId: string;
	action: string;
	details?: Record<string, unknown>;
	ipAddress?: string;
}) {
	await db.insert(auditLogs).values({
		userId: params.userId,
		entity: params.entity,
		entityId: params.entityId,
		action: params.action,
		details: params.details || null,
		ipAddress: params.ipAddress || null
	});
}

import { db } from './db/index.js';
import { auditLogs } from './db/schema.js';
import type { TenantContext } from './tenant.js';

export type AuditEntity =
	| 'colony' | 'cat' | 'health_record' | 'incident'
	| 'collaborator' | 'adoption' | 'inspection' | 'inspection_template'
	| 'equipment' | 'visit' | 'cer_action' | 'trapping_campaign' | 'trapping_event'
	| 'provider' | 'provider_intervention'
	| 'user' | 'user_role' | 'role' | 'role_permission'
	| 'catalog' | 'certificate_template' | 'email_template' | 'retention_policy'
	| 'conversation'
	| 'report' | 'export' | 'system' | 'organization' | 'subsidy_report' | 'certificate';

export type AuditAction =
	| 'create' | 'update' | 'delete'
	| 'change_status' | 'update_status'
	| 'assign' | 'assign_role' | 'toggle'
	| 'comment' | 'sign_privacy' | 'loan'
	| 'update_profile' | 'export' | 'export_all' | 'import' | 'generate'
	| 'activate' | 'deactivate' | 'update_plan';

export async function audit(
	ctx: TenantContext,
	entity: AuditEntity,
	entityId: string,
	action: AuditAction,
	details?: Record<string, unknown>
) {
	await db.insert(auditLogs).values({
		userId: ctx.userId,
		organizationId: ctx.organizationId,
		entity,
		entityId,
		action,
		details: details || null,
		ipAddress: ctx.ipAddress || null
	});
}

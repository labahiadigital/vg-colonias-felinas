import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import {
	colonies, cats, healthRecords, cerActions, incidents, inspections,
	collaborators, adoptions, feedingPoints, auditLogs, catalogs,
	conversations, messages, notifications, documents, inspectionTemplates,
	visits, providers, providerInterventions, volunteerHours, equipment
} from '$lib/server/db/schema.js';
import { inArray } from 'drizzle-orm';
import { audit } from '$lib/server/audit.js';
import { orgScope } from '$lib/server/tenant.js';
import { requireApiContext } from '$lib/server/action-helpers.js';
import { toCsvFromRecords } from '$lib/server/csv.js';
import { rateLimitGuard } from '$lib/server/rate-limit.js';
import { toDateString, toRecord } from '$lib/index.js';

export const GET: RequestHandler = async ({ locals, url, request }) => {
	const ctx = requireApiContext(locals, request);
	const blocked = rateLimitGuard('export', ctx.userId, request);
	if (blocked) return blocked;
	const format = url.searchParams.get('format') || 'json';
	const orgId = ctx.organizationId;

	const os = (column: Parameters<typeof orgScope>[0]) => orgScope(column, orgId);

	const orgColonyIds = orgId
		? db.select({ id: colonies.id }).from(colonies).where(orgScope(colonies.organizationId, orgId))
		: undefined;
	const orgConversationIds = orgId
		? db.select({ id: conversations.id }).from(conversations).where(orgScope(conversations.organizationId, orgId))
		: undefined;

	const data: Record<string, unknown[]> = Object.fromEntries(
		await Promise.all(([
			['colonies', db.select().from(colonies).where(os(colonies.organizationId))],
			['cats', db.select().from(cats).where(os(cats.organizationId))],
			['healthRecords', db.select().from(healthRecords).where(os(healthRecords.organizationId))],
			['cerActions', db.select().from(cerActions).where(os(cerActions.organizationId))],
			['incidents', db.select().from(incidents).where(os(incidents.organizationId))],
			['inspections', db.select().from(inspections).where(os(inspections.organizationId))],
			['inspectionTemplates', db.select().from(inspectionTemplates).where(os(inspectionTemplates.organizationId))],
			['collaborators', db.select().from(collaborators).where(os(collaborators.organizationId))],
			['adoptions', db.select().from(adoptions).where(os(adoptions.organizationId))],
			['feedingPoints', db.select().from(feedingPoints).where(orgColonyIds ? inArray(feedingPoints.colonyId, orgColonyIds) : undefined)],
			['documents', db.select().from(documents).where(os(documents.organizationId))],
			['conversations', db.select().from(conversations).where(os(conversations.organizationId))],
			['messages', db.select().from(messages).where(orgConversationIds ? inArray(messages.conversationId, orgConversationIds) : undefined)],
			['notifications', db.select().from(notifications).where(os(notifications.organizationId))],
			['catalogs', db.select().from(catalogs).where(os(catalogs.organizationId))],
			['auditLogs', db.select().from(auditLogs).where(os(auditLogs.organizationId))],
			['visits', db.select().from(visits).where(os(visits.organizationId))],
			['providers', db.select().from(providers).where(os(providers.organizationId))],
			['providerInterventions', db.select().from(providerInterventions).where(os(providerInterventions.organizationId))],
			['volunteerHours', db.select().from(volunteerHours).where(os(volunteerHours.organizationId))],
			['equipment', db.select().from(equipment).where(os(equipment.organizationId))]
		] as [string, Promise<unknown[]>][]).map(async ([key, query]) => [key, await query]))
	);

	await audit(ctx, 'system', 'full-export', 'export_all', {
		format,
		tables: Object.keys(data),
		counts: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length]))
	});

	if (format === 'csv') {
		const parts: string[] = [];
		for (const [table, rows] of Object.entries(data)) {
			if (rows.length === 0) continue;
			parts.push(`=== ${table.toUpperCase()} (${rows.length} registros) ===`);
			parts.push(toCsvFromRecords(rows.map(toRecord)));
			parts.push('');
		}

		return new Response(parts.join('\r\n'), {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': `attachment; filename="export_completa_${toDateString()}.csv"`
			}
		});
	}

	const manifest = {
		exportedAt: new Date().toISOString(),
		version: '2.0.0-saas',
		tables: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])),
		totalRecords: Object.values(data).reduce((a, v) => a + v.length, 0)
	};

	return json({ manifest, data });
};

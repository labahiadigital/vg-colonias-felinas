import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import {
	colonies, cats, healthRecords, cerActions, incidents, inspections,
	collaborators, adoptions, feedingPoints, auditLogs, catalogs,
	conversations, messages, notifications, users, roles, permissions,
	rolePermissions, userRoles, documents, inspectionTemplates
} from '$lib/server/db/schema.js';
import { logAudit } from '$lib/server/audit.js';

function toCsvString(rows: Record<string, unknown>[]): string {
	if (rows.length === 0) return '';
	const headers = Object.keys(rows[0]);
	const lines = [
		headers.join(';'),
		...rows.map(row =>
			headers.map(h => {
				const val = row[h];
				if (val === null || val === undefined) return '';
				if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
				const str = String(val);
				if (str.includes(';') || str.includes('"') || str.includes('\n')) {
					return `"${str.replace(/"/g, '""')}"`;
				}
				return str;
			}).join(';')
		)
	];
	return '\uFEFF' + lines.join('\r\n');
}

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) return json({ error: 'No autenticado' }, { status: 401 });

	const format = url.searchParams.get('format') || 'json';

	const data: Record<string, unknown[]> = {
		colonies: await db.select().from(colonies),
		cats: await db.select().from(cats),
		healthRecords: await db.select().from(healthRecords),
		cerActions: await db.select().from(cerActions),
		incidents: await db.select().from(incidents),
		inspections: await db.select().from(inspections),
		inspectionTemplates: await db.select().from(inspectionTemplates),
		collaborators: await db.select().from(collaborators),
		adoptions: await db.select().from(adoptions),
		feedingPoints: await db.select().from(feedingPoints),
		documents: await db.select().from(documents),
		conversations: await db.select().from(conversations),
		messages: await db.select().from(messages),
		notifications: await db.select().from(notifications),
		catalogs: await db.select().from(catalogs),
		auditLogs: await db.select().from(auditLogs),
		users: (await db.select({ id: users.id, name: users.name, email: users.email, language: users.language, createdAt: users.createdAt }).from(users)),
		roles: await db.select().from(roles),
		permissions: await db.select().from(permissions),
		rolePermissions: await db.select().from(rolePermissions),
		userRoles: await db.select().from(userRoles)
	};

	await logAudit({
		userId: locals.user.id,
		entity: 'system',
		entityId: 'full-export',
		action: 'export_all',
		details: { format, tables: Object.keys(data), counts: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])) }
	});

	if (format === 'csv') {
		const parts: string[] = [];
		for (const [table, rows] of Object.entries(data)) {
			if (rows.length === 0) continue;
			parts.push(`=== ${table.toUpperCase()} (${rows.length} registros) ===`);
			parts.push(toCsvString(rows as Record<string, unknown>[]));
			parts.push('');
		}

		return new Response(parts.join('\r\n'), {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': `attachment; filename="export_completa_${new Date().toISOString().split('T')[0]}.csv"`
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

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { audit } from '$lib/server/audit.js';
import { orgScope } from '$lib/server/tenant.js';
import { requireApiContext } from '$lib/server/action-helpers.js';
import { toCSV } from '$lib/server/csv.js';
import { rateLimitGuard } from '$lib/server/rate-limit.js';
import { toDateString } from '$lib/index.js';
import { EXPORT_SPECS } from '$lib/server/export-specs.js';

export const GET: RequestHandler = async ({ locals, url, request }) => {
	const ctx = requireApiContext(locals, request);
	const blocked = rateLimitGuard('export', ctx.userId, request);
	if (blocked) return blocked;

	const type = url.searchParams.get('type') || 'colonies';
	const spec = EXPORT_SPECS[type];
	if (!spec) throw error(400, 'Tipo de exportación no válido');

	const data = await db.select().from(spec.table).where(orgScope(spec.table.organizationId, ctx.organizationId));
	const csvContent = toCSV(spec.headers, data.map(r => spec.row(r as Record<string, unknown>)));

	await audit(ctx, 'export', type, 'export', { format: 'csv', type });

	const dateStr = toDateString();
	return new Response(csvContent, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${spec.filename}-${dateStr}.csv"`
		}
	});
};

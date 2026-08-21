import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { regulatoryTemplates, colonies, cats, healthRecords, visits, incidents } from '$lib/server/db/schema.js';
import { eq, sql, and } from 'drizzle-orm';
import { orgScope } from '$lib/server/tenant.js';
import { escHtml, htmlDocHeaders } from '$lib/server/html.js';
import { requireApiUser } from '$lib/server/action-helpers.js';
import { renderTemplate, DEFAULT_TEMPLATES } from '$lib/server/regulatory-templates.js';
import { rateLimitGuard } from '$lib/server/rate-limit.js';
import { groupByKey } from '$lib/index.js';

export const GET: RequestHandler = async ({ url, locals, request }) => {
	requireApiUser(locals);
	const blocked = rateLimitGuard('export', locals.user?.id, request);
	if (blocked) return blocked;

	const country = url.searchParams.get('country');
	const type = url.searchParams.get('type');

	if (country && type) {
		const year = url.searchParams.get('year') || String(new Date().getFullYear());
		const orgName = url.searchParams.get('org') || 'Organización';
		const municipio = url.searchParams.get('municipio') || 'Municipio';
		const orgId = locals.organizationId;

		const startDate = new Date(`${year}-01-01`);
		const endDate = new Date(`${year}-12-31`);

		const [colonyAndCatStats, periodStats] = await Promise.all([
			db.select({
				totalColonies: sql<number>`(select count(*) from ${colonies} where ${orgScope(colonies.organizationId, orgId) ?? sql`true`})`,
				totalCats: sql<number>`count(*)`,
				sterilized: sql<number>`count(*) filter (where ${cats.sterilized} = true)`
			}).from(cats).where(orgScope(cats.organizationId, orgId)),
			db.select({
				healthCount: sql<number>`(select count(*) from ${healthRecords} where ${healthRecords.performedAt} >= ${startDate} and ${healthRecords.performedAt} <= ${endDate} and ${orgScope(healthRecords.organizationId, orgId) ?? sql`true`})`,
				visitCount: sql<number>`(select count(*) from ${visits} where ${visits.visitedAt} >= ${startDate} and ${visits.visitedAt} <= ${endDate} and ${orgScope(visits.organizationId, orgId) ?? sql`true`})`,
				incidentCount: sql<number>`(select count(*) from ${incidents} where ${orgScope(incidents.organizationId, orgId) ?? sql`true`})`
			}).from(cats).limit(1)
		]);

		const totalCats = Number(colonyAndCatStats[0]?.totalCats ?? 0);
		const sterilized = Number(colonyAndCatStats[0]?.sterilized ?? 0);
		const rate = totalCats > 0 ? ((sterilized / totalCats) * 100).toFixed(1) : '0';
		const colonyCount = { count: Number(colonyAndCatStats[0]?.totalColonies ?? 0) };
		const healthCount = { count: Number(periodStats[0]?.healthCount ?? 0) };
		const visitCount = { count: Number(periodStats[0]?.visitCount ?? 0) };
		const incidentCount = { count: Number(periodStats[0]?.incidentCount ?? 0) };

		const tplRecord = await db.select().from(regulatoryTemplates)
			.where(and(eq(regulatoryTemplates.country, country), eq(regulatoryTemplates.type, type)))
			.limit(1);

		let templateHtml: string;
		const firstTpl = tplRecord[0];
		if (firstTpl) {
			templateHtml = firstTpl.templateHtml;
		} else {
			const defaultTpl = DEFAULT_TEMPLATES.find(t => t.country === country && t.type === type);
			if (!defaultTpl) return json({ error: 'Plantilla no encontrada' }, { status: 404 });
			templateHtml = defaultTpl.templateHtml;
		}

		const rendered = renderTemplate(templateHtml, {
			year,
			organizationName: orgName,
			municipio,
			totalColonies: String(colonyCount?.count ?? 0),
			totalCats: String(totalCats),
			sterilizedCats: String(sterilized),
			sterilizationRate: rate,
			healthRecordsCount: String(healthCount?.count ?? 0),
			visitsCount: String(visitCount?.count ?? 0),
			incidentsCount: String(incidentCount?.count ?? 0),
			date: new Date().toLocaleDateString('es-ES')
		});

		const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escHtml(orgName)} — Informe</title>
<style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#1a1a1a}
h1{font-size:1.5rem;border-bottom:2px solid #0f766e;padding-bottom:8px}
h2{font-size:1.1rem;color:#555}h3{color:#0f766e;margin-top:24px}
table{width:100%;border-collapse:collapse;margin:12px 0}
th,td{border:1px solid #ddd;padding:8px 12px;text-align:left}
th{background:#f5f5f5;font-weight:600}
@media print{body{margin:0;padding:20px}}</style></head><body>${rendered}</body></html>`;

		return new Response(fullHtml, {
			headers: htmlDocHeaders()
		});
	}

	const dbTemplates = await db.select().from(regulatoryTemplates).where(eq(regulatoryTemplates.isActive, true));
	const all = [
		...DEFAULT_TEMPLATES.map(t => ({ ...t, source: 'default' as const })),
		...dbTemplates.map(t => ({ ...t, source: 'custom' as const }))
	];

	const grouped = groupByKey(all, t => t.country);

	return json({ templates: grouped });
};

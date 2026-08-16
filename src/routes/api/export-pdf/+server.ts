import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies, cats, incidents, cerActions, collaborators, auditLogs } from '$lib/server/db/schema.js';
import { eq, sql } from 'drizzle-orm';

function escapeHtml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return new Response('No autorizado', { status: 401 });
	}

	const reportType = url.searchParams.get('type') || 'general';

	const [
		totalColonies, activeColonies, totalCats, sterilizedCats,
		totalIncidents, openIncidents, totalCER, totalCollaborators
	] = await Promise.all([
		db.select({ count: sql<number>`count(*)` }).from(colonies),
		db.select({ count: sql<number>`count(*)` }).from(colonies).where(eq(colonies.status, 'active')),
		db.select({ count: sql<number>`count(*)` }).from(cats),
		db.select({ count: sql<number>`count(*)` }).from(cats).where(eq(cats.sterilized, true)),
		db.select({ count: sql<number>`count(*)` }).from(incidents),
		db.select({ count: sql<number>`count(*)` }).from(incidents).where(eq(incidents.status, 'open')),
		db.select({ count: sql<number>`count(*)` }).from(cerActions),
		db.select({ count: sql<number>`count(*)` }).from(collaborators)
	]);

	const tc = Number(totalCats[0]?.count ?? 0);
	const sc = Number(sterilizedCats[0]?.count ?? 0);
	const sterilizationRate = tc > 0 ? Math.round((sc / tc) * 100) : 0;

	const now = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

	const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Informe - Colonias Felinas Vitoria-Gasteiz</title>
<style>
  @page { margin: 2cm; size: A4; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; font-size: 12px; line-height: 1.6; }
  h1 { color: #1a5632; font-size: 22px; border-bottom: 3px solid #1a5632; padding-bottom: 8px; }
  h2 { color: #1a5632; font-size: 16px; margin-top: 20px; }
  .header { text-align: center; margin-bottom: 30px; }
  .header p { color: #666; margin: 2px 0; }
  .meta { background: #f4f7f6; padding: 10px 15px; border-radius: 6px; margin-bottom: 20px; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0 20px; }
  th { background: #1a5632; color: white; padding: 8px 12px; text-align: left; font-size: 11px; }
  td { padding: 8px 12px; border-bottom: 1px solid #e0e0e0; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 15px 0; }
  .kpi { background: #f4f7f6; border-radius: 8px; padding: 12px; text-align: center; }
  .kpi .value { font-size: 24px; font-weight: bold; color: #1a5632; }
  .kpi .label { font-size: 10px; color: #666; margin-top: 2px; }
  .footer { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 10px; color: #999; text-align: center; }
</style>
</head>
<body>
<div class="header">
  <h1>INFORME DE GESTIÓN DE COLONIAS FELINAS</h1>
  <p><strong>Ayuntamiento de Vitoria-Gasteiz</strong></p>
  <p>Expediente 2026/CO_ASUM/0013</p>
</div>

<div class="meta">
  <strong>Tipo de informe:</strong> ${escapeHtml(reportType === 'general' ? 'General' : reportType)} |
  <strong>Fecha de generación:</strong> ${now} |
  <strong>Generado por:</strong> ${escapeHtml(locals.user.name)}
</div>

<h2>Indicadores Clave (KPIs)</h2>
<div class="kpi-grid">
  <div class="kpi"><div class="value">${Number(totalColonies[0]?.count ?? 0)}</div><div class="label">Colonias Totales</div></div>
  <div class="kpi"><div class="value">${Number(activeColonies[0]?.count ?? 0)}</div><div class="label">Colonias Activas</div></div>
  <div class="kpi"><div class="value">${tc}</div><div class="label">Gatos Censados</div></div>
  <div class="kpi"><div class="value">${sc}</div><div class="label">Gatos Esterilizados</div></div>
  <div class="kpi"><div class="value">${sterilizationRate}%</div><div class="label">Tasa de Esterilización</div></div>
  <div class="kpi"><div class="value">${Number(totalCER[0]?.count ?? 0)}</div><div class="label">Acciones CER</div></div>
</div>

<h2>Incidencias</h2>
<table>
  <thead><tr><th>Indicador</th><th>Valor</th></tr></thead>
  <tbody>
    <tr><td>Total de incidencias</td><td>${Number(totalIncidents[0]?.count ?? 0)}</td></tr>
    <tr><td>Incidencias abiertas</td><td>${Number(openIncidents[0]?.count ?? 0)}</td></tr>
    <tr><td>Colaboradores registrados</td><td>${Number(totalCollaborators[0]?.count ?? 0)}</td></tr>
  </tbody>
</table>

<div class="footer">
  <p>Documento generado automáticamente por el Sistema de Gestión de Colonias Felinas de Vitoria-Gasteiz</p>
  <p>${now} - ${escapeHtml(locals.user.email)}</p>
</div>
</body>
</html>`;

	await db.insert(auditLogs).values({
		userId: locals.user.id,
		entity: 'report',
		entityId: 'pdf-export',
		action: 'export',
		details: { type: reportType, format: 'pdf' }
	});

	return new Response(html, {
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'Content-Disposition': `attachment; filename="informe-colonias-${new Date().toISOString().slice(0, 10)}.html"`
		}
	});
};

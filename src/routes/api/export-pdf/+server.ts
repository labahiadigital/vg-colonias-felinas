import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies, cats, incidents, cerActions, collaborators, auditLogs, visits, volunteerHours, inspections, providers, providerInterventions, healthRecords } from '$lib/server/db/schema.js';
import { eq, sql } from 'drizzle-orm';

function esc(text: string | null | undefined): string {
	if (!text) return '';
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const CSS = `
  @page { margin: 2cm; size: A4; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; font-size: 12px; line-height: 1.6; }
  h1 { color: #1a5632; font-size: 22px; border-bottom: 3px solid #1a5632; padding-bottom: 8px; }
  h2 { color: #1a5632; font-size: 16px; margin-top: 24px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  h3 { color: #1a5632; font-size: 13px; margin-top: 16px; }
  .header { text-align: center; margin-bottom: 30px; }
  .header p { color: #666; margin: 2px 0; }
  .meta { background: #f4f7f6; padding: 10px 15px; border-radius: 6px; margin-bottom: 20px; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0 20px; }
  th { background: #1a5632; color: white; padding: 8px 12px; text-align: left; font-size: 11px; }
  td { padding: 8px 12px; border-bottom: 1px solid #e0e0e0; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 15px 0; }
  .kpi { background: #f4f7f6; border-radius: 8px; padding: 12px; text-align: center; }
  .kpi .value { font-size: 22px; font-weight: bold; color: #1a5632; }
  .kpi .label { font-size: 10px; color: #666; margin-top: 2px; }
  .badge-ok { background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
  .badge-ko { background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
  .compliance-group { margin: 12px 0; padding: 12px; background: #f9fafb; border-radius: 8px; border-left: 3px solid #1a5632; }
  .compliance-group h3 { margin-top: 0; }
  .footer { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 10px; color: #999; text-align: center; }
  .section { page-break-inside: avoid; }
`;

async function fetchStats() {
	const [
		totalColoniesR, activeColoniesR, totalCatsR, sterilizedCatsR,
		microchippedR, totalIncidentsR, openIncidentsR, resolvedIncidentsR,
		totalCERR, totalCollabR, totalVisitsR, totalInspR,
		passedInspR, activeProvidersR, totalInterventionsR,
		totalCostR, totalVolHoursR, totalHealthR, geoColoniesR
	] = await Promise.all([
		db.select({ c: sql<number>`count(*)` }).from(colonies),
		db.select({ c: sql<number>`count(*)` }).from(colonies).where(eq(colonies.status, 'active')),
		db.select({ c: sql<number>`count(*)` }).from(cats),
		db.select({ c: sql<number>`count(*)` }).from(cats).where(eq(cats.sterilized, true)),
		db.select({ c: sql<number>`count(*)` }).from(cats).where(sql`${cats.microchip} IS NOT NULL AND ${cats.microchip} != ''`),
		db.select({ c: sql<number>`count(*)` }).from(incidents),
		db.select({ c: sql<number>`count(*)` }).from(incidents).where(eq(incidents.status, 'open')),
		db.select({ c: sql<number>`count(*)` }).from(incidents).where(eq(incidents.status, 'resolved')),
		db.select({ c: sql<number>`count(*)` }).from(cerActions),
		db.select({ c: sql<number>`count(*)` }).from(collaborators),
		db.select({ c: sql<number>`count(*)` }).from(visits),
		db.select({ c: sql<number>`count(*)` }).from(inspections),
		db.select({ c: sql<number>`count(*)` }).from(inspections).where(eq(inspections.passed, true)),
		db.select({ c: sql<number>`count(*)` }).from(providers).where(eq(providers.status, 'active')),
		db.select({ c: sql<number>`count(*)` }).from(providerInterventions),
		db.select({ c: sql<number>`coalesce(sum(cost), 0)` }).from(providerInterventions),
		db.select({ c: sql<number>`coalesce(sum(hours), 0)` }).from(volunteerHours),
		db.select({ c: sql<number>`count(*)` }).from(healthRecords),
		db.select({ c: sql<number>`count(*)` }).from(colonies).where(sql`${colonies.latitude} IS NOT NULL`)
	]);

	const n = (r: { c: number }[]) => Number(r[0]?.c ?? 0);
	return {
		totalColonies: n(totalColoniesR), activeColonies: n(activeColoniesR),
		totalCats: n(totalCatsR), sterilizedCats: n(sterilizedCatsR),
		microchipped: n(microchippedR),
		totalIncidents: n(totalIncidentsR), openIncidents: n(openIncidentsR), resolvedIncidents: n(resolvedIncidentsR),
		totalCER: n(totalCERR), totalCollab: n(totalCollabR),
		totalVisits: n(totalVisitsR), totalInsp: n(totalInspR), passedInsp: n(passedInspR),
		activeProviders: n(activeProvidersR), totalInterventions: n(totalInterventionsR),
		totalCost: n(totalCostR), volunteerHours: n(totalVolHoursR),
		totalHealth: n(totalHealthR), geoColonies: n(geoColoniesR),
		sterilizationRate: n(totalCatsR) > 0 ? Math.round((n(sterilizedCatsR) / n(totalCatsR)) * 100) : 0,
		incidentResolutionRate: n(totalIncidentsR) > 0 ? Math.round((n(resolvedIncidentsR) / n(totalIncidentsR)) * 100) : 0,
		geoRate: n(totalColoniesR) > 0 ? Math.round((n(geoColoniesR) / n(totalColoniesR)) * 100) : 0
	};
}

function buildComplianceChecks(s: ReturnType<typeof fetchStats> extends Promise<infer T> ? T : never) {
	return [
		{
			law: 'Ley 7/2023 de Protección Animal',
			items: [
				{ label: 'Art. 17 - Registro e identificación de colonias', ok: s.totalColonies > 0, detail: `${s.totalColonies} colonias registradas` },
				{ label: 'Art. 18 - Programa CER activo', ok: s.totalCER > 0, detail: `${s.totalCER} acciones CER realizadas` },
				{ label: 'Art. 25 - Identificación (microchip)', ok: s.microchipped > 0, detail: `${s.microchipped} gatos con microchip` },
				{ label: 'Art. 37 - Esterilización obligatoria', ok: s.sterilizationRate >= 70, detail: `Tasa: ${s.sterilizationRate}%` },
				{ label: 'Art. 44 - Seguimiento sanitario', ok: s.totalHealth > 0, detail: `${s.totalHealth} registros sanitarios` }
			]
		},
		{
			law: 'RGPD / LOPDGDD',
			items: [
				{ label: 'Registro de actividad de tratamiento', ok: true, detail: 'Audit log implementado' },
				{ label: 'Control de acceso y autenticación', ok: true, detail: 'RBAC con Better Auth' },
				{ label: 'Minimización de datos personales', ok: true, detail: 'Datos mínimos de adoptantes y voluntarios' }
			]
		},
		{
			law: 'Directiva 92/43/CEE (Hábitats)',
			items: [
				{ label: 'Monitorización de impacto ambiental', ok: s.totalInsp > 0, detail: `${s.totalInsp} inspecciones realizadas` },
				{ label: 'Registro de intervenciones en hábitat', ok: s.totalVisits > 0, detail: `${s.totalVisits} visitas registradas` },
				{ label: 'Geolocalización de colonias', ok: s.geoRate >= 50, detail: `${s.geoRate}% colonias geolocalizadas` }
			]
		},
		{
			law: 'Estrategia de Biodiversidad 2030',
			items: [
				{ label: 'Programa CER operativo', ok: s.totalCER > 0, detail: `${s.totalCER} acciones CER` },
				{ label: 'Tasa de esterilización > 70%', ok: s.sterilizationRate >= 70, detail: `${s.sterilizationRate}%` },
				{ label: 'Sistema de seguimiento y datos', ok: s.totalVisits > 0 && s.totalInsp > 0, detail: `${s.totalVisits} visitas, ${s.totalInsp} inspecciones` }
			]
		},
		{
			law: 'Artículo 13 del TFUE',
			items: [
				{ label: 'Bienestar animal en gestión de colonias', ok: s.totalHealth > 0, detail: `${s.totalHealth} registros salud` },
				{ label: 'Proveedores veterinarios acreditados', ok: s.activeProviders > 0, detail: `${s.activeProviders} proveedores activos` },
				{ label: 'Resolución de incidencias', ok: s.incidentResolutionRate >= 50, detail: `Tasa resolución: ${s.incidentResolutionRate}%` }
			]
		},
		{
			law: 'Pacto Verde Europeo / One Health',
			items: [
				{ label: 'Integración salud animal-humana', ok: s.totalHealth > 0 && s.totalVisits > 0, detail: 'Control sanitario y seguimiento activo' },
				{ label: 'Voluntariado comunitario', ok: s.volunteerHours > 0, detail: `${s.volunteerHours}h de voluntariado` },
				{ label: 'Colaboración con proveedores', ok: s.activeProviders > 0, detail: `${s.activeProviders} proveedores` }
			]
		}
	];
}

function renderComplianceHTML(checks: ReturnType<typeof buildComplianceChecks>): string {
	let total = 0, passed = 0;
	checks.forEach(g => g.items.forEach(i => { total++; if (i.ok) passed++; }));
	const score = total > 0 ? Math.round((passed / total) * 100) : 0;

	let html = `<h2>Cumplimiento Normativo</h2>
  <div class="kpi-grid" style="grid-template-columns: repeat(3,1fr);">
    <div class="kpi"><div class="value">${score}%</div><div class="label">Cumplimiento Global</div></div>
    <div class="kpi"><div class="value">${passed}/${total}</div><div class="label">Requisitos Cumplidos</div></div>
    <div class="kpi"><div class="value">${total - passed}</div><div class="label">Pendientes</div></div>
  </div>`;

	for (const group of checks) {
		const gPassed = group.items.filter(i => i.ok).length;
		html += `<div class="compliance-group">
      <h3>${esc(group.law)} (${gPassed}/${group.items.length})</h3>
      <table><thead><tr><th>Requisito</th><th>Estado</th><th>Detalle</th></tr></thead><tbody>`;
		for (const item of group.items) {
			html += `<tr><td>${esc(item.label)}</td><td><span class="${item.ok ? 'badge-ok' : 'badge-ko'}">${item.ok ? 'CUMPLE' : 'PENDIENTE'}</span></td><td>${esc(item.detail)}</td></tr>`;
		}
		html += `</tbody></table></div>`;
	}
	return html;
}

function renderKPIs(s: Awaited<ReturnType<typeof fetchStats>>): string {
	return `<h2>Indicadores Clave (KPIs)</h2>
  <div class="kpi-grid">
    <div class="kpi"><div class="value">${s.totalColonies}</div><div class="label">Colonias Totales</div></div>
    <div class="kpi"><div class="value">${s.activeColonies}</div><div class="label">Colonias Activas</div></div>
    <div class="kpi"><div class="value">${s.totalCats}</div><div class="label">Gatos Censados</div></div>
    <div class="kpi"><div class="value">${s.sterilizedCats}</div><div class="label">Esterilizados</div></div>
    <div class="kpi"><div class="value">${s.sterilizationRate}%</div><div class="label">Tasa Esterilización</div></div>
    <div class="kpi"><div class="value">${s.microchipped}</div><div class="label">Con Microchip</div></div>
    <div class="kpi"><div class="value">${s.totalCER}</div><div class="label">Acciones CER</div></div>
    <div class="kpi"><div class="value">${s.totalIncidents}</div><div class="label">Incidencias</div></div>
    <div class="kpi"><div class="value">${s.incidentResolutionRate}%</div><div class="label">Resolución Inc.</div></div>
    <div class="kpi"><div class="value">${s.totalVisits}</div><div class="label">Visitas</div></div>
    <div class="kpi"><div class="value">${s.volunteerHours}h</div><div class="label">Horas Voluntariado</div></div>
    <div class="kpi"><div class="value">${s.totalInsp}</div><div class="label">Inspecciones</div></div>
    <div class="kpi"><div class="value">${s.activeProviders}</div><div class="label">Proveedores Activos</div></div>
    <div class="kpi"><div class="value">${s.totalInterventions}</div><div class="label">Intervenciones Vet.</div></div>
    <div class="kpi"><div class="value">${Number(s.totalCost).toFixed(2)}€</div><div class="label">Coste Total Vet.</div></div>
    <div class="kpi"><div class="value">${s.totalHealth}</div><div class="label">Registros Salud</div></div>
  </div>`;
}

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return new Response('No autorizado', { status: 401 });
	}

	const reportType = url.searchParams.get('type') || 'general';
	const stats = await fetchStats();
	const compliance = buildComplianceChecks(stats);
	const now = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

	let title = 'INFORME DE GESTIÓN DE COLONIAS FELINAS';
	let body = '';

	switch (reportType) {
		case 'compliance_report': {
			title = 'INFORME DE CUMPLIMIENTO NORMATIVO';
			body = renderKPIs(stats) + renderComplianceHTML(compliance);
			break;
		}
		case 'subsidy_dgda': {
			title = 'MEMORIA JUSTIFICATIVA PARA SUBVENCIÓN DGDA';
			const inspRate = stats.totalInsp > 0 ? Math.round((stats.passedInsp / stats.totalInsp) * 100) : 0;
			body = `
        <div class="section">
        <h2>1. Identificación del Programa</h2>
        <table>
          <tr><td><strong>Programa</strong></td><td>Gestión y Control de Colonias Felinas Urbanas</td></tr>
          <tr><td><strong>Entidad</strong></td><td>Ayuntamiento de Vitoria-Gasteiz</td></tr>
          <tr><td><strong>Referencia expediente</strong></td><td>2026/CO_ASUM/0013</td></tr>
          <tr><td><strong>Período</strong></td><td>Ejercicio ${new Date().getFullYear()}</td></tr>
        </table>
        </div>

        <div class="section">
        <h2>2. Objetivos y Resultados</h2>
        <table>
          <thead><tr><th>Indicador</th><th>Resultado</th><th>Observaciones</th></tr></thead>
          <tbody>
            <tr><td>Colonias gestionadas</td><td>${stats.totalColonies} (${stats.activeColonies} activas)</td><td>${stats.geoRate}% geolocalizadas</td></tr>
            <tr><td>Censo felino</td><td>${stats.totalCats} gatos</td><td>${stats.microchipped} identificados con microchip</td></tr>
            <tr><td>Tasa de esterilización</td><td>${stats.sterilizationRate}%</td><td>${stats.sterilizedCats} gatos esterilizados</td></tr>
            <tr><td>Acciones CER</td><td>${stats.totalCER}</td><td>Captura-Esterilización-Retorno</td></tr>
            <tr><td>Incidencias gestionadas</td><td>${stats.totalIncidents}</td><td>Tasa resolución: ${stats.incidentResolutionRate}%</td></tr>
            <tr><td>Inspecciones realizadas</td><td>${stats.totalInsp}</td><td>${inspRate}% aprobadas</td></tr>
            <tr><td>Registros sanitarios</td><td>${stats.totalHealth}</td><td>Vacunaciones, tratamientos, etc.</td></tr>
          </tbody>
        </table>
        </div>

        <div class="section">
        <h2>3. Recursos Humanos y Voluntariado</h2>
        <table>
          <thead><tr><th>Indicador</th><th>Valor</th></tr></thead>
          <tbody>
            <tr><td>Colaboradores registrados</td><td>${stats.totalCollab}</td></tr>
            <tr><td>Horas de voluntariado</td><td>${stats.volunteerHours}h</td></tr>
            <tr><td>Visitas realizadas</td><td>${stats.totalVisits}</td></tr>
          </tbody>
        </table>
        </div>

        <div class="section">
        <h2>4. Gestión de Hábitat y Monitorización</h2>
        <table>
          <thead><tr><th>Indicador</th><th>Valor</th></tr></thead>
          <tbody>
            <tr><td>Colonias geolocalizadas</td><td>${stats.geoColonies} (${stats.geoRate}%)</td></tr>
            <tr><td>Visitas de campo</td><td>${stats.totalVisits}</td></tr>
            <tr><td>Inspecciones</td><td>${stats.totalInsp} (${stats.passedInsp} aprobadas)</td></tr>
          </tbody>
        </table>
        </div>

        <div class="section">
        <h2>5. Gestión Veterinaria y Costes</h2>
        <table>
          <thead><tr><th>Indicador</th><th>Valor</th></tr></thead>
          <tbody>
            <tr><td>Proveedores activos</td><td>${stats.activeProviders}</td></tr>
            <tr><td>Intervenciones realizadas</td><td>${stats.totalInterventions}</td></tr>
            <tr><td>Coste total veterinario</td><td>${Number(stats.totalCost).toFixed(2)} €</td></tr>
          </tbody>
        </table>
        </div>

        <div class="section">
        <h2>6. Cumplimiento Normativo Acreditado</h2>
        ${renderComplianceHTML(compliance)}
        </div>

        <div class="section">
        <h2>7. Resumen Cuantitativo para Justificación</h2>
        <table>
          <thead><tr><th>Concepto</th><th>Cantidad</th><th>Coste/Valor</th></tr></thead>
          <tbody>
            <tr><td>Esterilizaciones realizadas</td><td>${stats.sterilizedCats}</td><td>Incluido en coste vet.</td></tr>
            <tr><td>Intervenciones veterinarias</td><td>${stats.totalInterventions}</td><td>${Number(stats.totalCost).toFixed(2)} €</td></tr>
            <tr><td>Horas voluntariado</td><td>${stats.volunteerHours}h</td><td>Valoración social</td></tr>
            <tr><td>Visitas de campo</td><td>${stats.totalVisits}</td><td>Seguimiento territorial</td></tr>
            <tr><td>Colaboradores implicados</td><td>${stats.totalCollab}</td><td>Equipo multidisciplinar</td></tr>
          </tbody>
        </table>
        </div>`;
			break;
		}
		default: {
			title = 'INFORME GENERAL DE GESTIÓN DE COLONIAS FELINAS';
			body = renderKPIs(stats);

			body += `<h2>Incidencias</h2>
      <table>
        <thead><tr><th>Indicador</th><th>Valor</th></tr></thead>
        <tbody>
          <tr><td>Total de incidencias</td><td>${stats.totalIncidents}</td></tr>
          <tr><td>Incidencias abiertas</td><td>${stats.openIncidents}</td></tr>
          <tr><td>Incidencias resueltas</td><td>${stats.resolvedIncidents}</td></tr>
          <tr><td>Tasa de resolución</td><td>${stats.incidentResolutionRate}%</td></tr>
        </tbody>
      </table>`;

			body += `<h2>Actividad y Voluntariado</h2>
      <table>
        <thead><tr><th>Indicador</th><th>Valor</th></tr></thead>
        <tbody>
          <tr><td>Visitas realizadas</td><td>${stats.totalVisits}</td></tr>
          <tr><td>Horas de voluntariado</td><td>${stats.volunteerHours}h</td></tr>
          <tr><td>Colaboradores</td><td>${stats.totalCollab}</td></tr>
          <tr><td>Inspecciones</td><td>${stats.totalInsp} (${stats.passedInsp} aprobadas)</td></tr>
        </tbody>
      </table>`;

			body += `<h2>Gestión Veterinaria</h2>
      <table>
        <thead><tr><th>Indicador</th><th>Valor</th></tr></thead>
        <tbody>
          <tr><td>Proveedores activos</td><td>${stats.activeProviders}</td></tr>
          <tr><td>Intervenciones</td><td>${stats.totalInterventions}</td></tr>
          <tr><td>Coste total</td><td>${Number(stats.totalCost).toFixed(2)} €</td></tr>
          <tr><td>Registros sanitarios</td><td>${stats.totalHealth}</td></tr>
        </tbody>
      </table>`;

			body += renderComplianceHTML(compliance);
			break;
		}
	}

	const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<style>${CSS}</style>
</head>
<body>
<div class="header">
  <h1>${esc(title)}</h1>
  <p><strong>Ayuntamiento de Vitoria-Gasteiz</strong></p>
  <p>Expediente 2026/CO_ASUM/0013</p>
</div>
<div class="meta">
  <strong>Tipo de informe:</strong> ${esc(reportType)} |
  <strong>Fecha de generación:</strong> ${now} |
  <strong>Generado por:</strong> ${esc(locals.user.name)}
</div>
${body}
<div class="footer">
  <p>Documento generado automáticamente por Gatopolis</p>
  <p>${now} - ${esc(locals.user.email)}</p>
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

	const filename = reportType === 'subsidy_dgda'
		? `memoria-dgda-${new Date().toISOString().slice(0, 10)}.html`
		: reportType === 'compliance_report'
			? `informe-cumplimiento-${new Date().toISOString().slice(0, 10)}.html`
			: `informe-colonias-${new Date().toISOString().slice(0, 10)}.html`;

	return new Response(html, {
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};

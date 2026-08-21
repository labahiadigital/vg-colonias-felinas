import type { RequestHandler } from './$types.js';
import { getStats, type StatsSnapshot } from '$lib/server/stats.js';
import { audit } from '$lib/server/audit.js';
import { requireApiContext } from '$lib/server/action-helpers.js';
import { escHtml as esc, htmlDocHeaders, REPORT_CSS } from '$lib/server/html.js';
import { computeRate, toDateString } from '$lib/index.js';
import { buildComplianceChecks, computeComplianceScore } from '$lib/server/compliance.js';
import { rateLimitGuard } from '$lib/server/rate-limit.js';

const CSS = REPORT_CSS;

function renderComplianceHTML(checks: ReturnType<typeof buildComplianceChecks>): string {
	const { total, passed, score } = computeComplianceScore(checks);

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

function renderKPIs(s: StatsSnapshot): string {
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

export const GET: RequestHandler = async ({ locals, url, request }) => {
	const ctx = requireApiContext(locals, request);

	const blocked = rateLimitGuard('export', ctx.userId, request);
	if (blocked) return blocked;

	const reportType = url.searchParams.get('type') || 'general';
	const stats = await getStats(ctx.organizationId);
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
			const inspRate = computeRate(stats.passedInsp, stats.totalInsp);
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
      <table><thead><tr><th>Indicador</th><th>Valor</th></tr></thead><tbody>
        <tr><td>Total de incidencias</td><td>${stats.totalIncidents}</td></tr>
        <tr><td>Incidencias abiertas</td><td>${stats.openIncidents}</td></tr>
        <tr><td>Incidencias resueltas</td><td>${stats.resolvedIncidents}</td></tr>
        <tr><td>Tasa de resolución</td><td>${stats.incidentResolutionRate}%</td></tr>
      </tbody></table>`;
			body += `<h2>Actividad y Voluntariado</h2>
      <table><thead><tr><th>Indicador</th><th>Valor</th></tr></thead><tbody>
        <tr><td>Visitas realizadas</td><td>${stats.totalVisits}</td></tr>
        <tr><td>Horas de voluntariado</td><td>${stats.volunteerHours}h</td></tr>
        <tr><td>Colaboradores</td><td>${stats.totalCollab}</td></tr>
        <tr><td>Inspecciones</td><td>${stats.totalInsp} (${stats.passedInsp} aprobadas)</td></tr>
      </tbody></table>`;
			body += `<h2>Gestión Veterinaria</h2>
      <table><thead><tr><th>Indicador</th><th>Valor</th></tr></thead><tbody>
        <tr><td>Proveedores activos</td><td>${stats.activeProviders}</td></tr>
        <tr><td>Intervenciones</td><td>${stats.totalInterventions}</td></tr>
        <tr><td>Coste total</td><td>${Number(stats.totalCost).toFixed(2)} €</td></tr>
        <tr><td>Registros sanitarios</td><td>${stats.totalHealth}</td></tr>
      </tbody></table>`;
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
  <strong>Generado por:</strong> ${esc(locals.user?.name ?? '')}
</div>
${body}
<div class="footer">
  <p>Documento generado automáticamente por Gatopolis</p>
  <p>${now} - ${esc(locals.user?.email ?? '')}</p>
</div>
</body>
</html>`;

	await audit(ctx, 'report', 'pdf-export', 'export', { type: reportType, format: 'pdf' });

	const today = toDateString();
	const filename = reportType === 'subsidy_dgda'
		? `memoria-dgda-${today}.html`
		: reportType === 'compliance_report'
			? `informe-cumplimiento-${today}.html`
			: `informe-colonias-${today}.html`;

	return new Response(html, {
		headers: htmlDocHeaders(filename, 'attachment')
	});
};

import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies, cats, incidents, cerActions, collaborators, visits, volunteerHours, inspections, providers, providerInterventions, healthRecords, adoptions } from '$lib/server/db/schema.js';
import { eq, sql, gte, lte, and } from 'drizzle-orm';
import { orgScope } from '$lib/server/tenant.js';
import { requireApiContext } from '$lib/server/action-helpers.js';
import { audit } from '$lib/server/audit.js';
import { escHtml, htmlDocHeaders, REPORT_CSS } from '$lib/server/html.js';
import { computeRate } from '$lib/index.js';
import { rateLimitGuard } from '$lib/server/rate-limit.js';

async function fetchPeriodStats(periodStart: Date, periodEnd: Date, orgId: string | null | undefined) {
	const os = (column: Parameters<typeof orgScope>[0]) => orgScope(column, orgId);

	const [
		colonyStats, catStats, incidentStats, cerStats,
		collabStats, visitStats, inspStats, providerStats,
		interventionStats, volHoursStats, healthStats, adoptionStats,
		colonyBreakdown, cerByColony, costByColony
	] = await Promise.all([
		db.select({
			total: sql<number>`count(*)`,
			active: sql<number>`count(*) filter (where ${colonies.status} = 'active')`,
			geolocated: sql<number>`count(*) filter (where ${colonies.latitude} is not null)`
		}).from(colonies).where(os(colonies.organizationId)),

		db.select({
			total: sql<number>`count(*)`,
			sterilized: sql<number>`count(*) filter (where ${cats.sterilized} = true)`,
			microchipped: sql<number>`count(*) filter (where ${cats.microchip} is not null and ${cats.microchip} != '')`
		}).from(cats).where(os(cats.organizationId)),

		db.select({
			total: sql<number>`count(*) filter (where ${incidents.createdAt} >= ${periodStart} and ${incidents.createdAt} <= ${periodEnd})`,
			resolved: sql<number>`count(*) filter (where ${incidents.status} = 'resolved' and ${incidents.createdAt} >= ${periodStart} and ${incidents.createdAt} <= ${periodEnd})`
		}).from(incidents).where(os(incidents.organizationId)),

		db.select({
			total: sql<number>`count(*) filter (where ${cerActions.createdAt} >= ${periodStart} and ${cerActions.createdAt} <= ${periodEnd})`
		}).from(cerActions).where(os(cerActions.organizationId)),

		db.select({
			total: sql<number>`count(*)`,
			active: sql<number>`count(*) filter (where ${collaborators.status} = 'active')`
		}).from(collaborators).where(os(collaborators.organizationId)),

		db.select({
			total: sql<number>`count(*) filter (where ${visits.visitedAt} >= ${periodStart} and ${visits.visitedAt} <= ${periodEnd})`
		}).from(visits).where(os(visits.organizationId)),

		db.select({
			total: sql<number>`count(*) filter (where ${inspections.createdAt} >= ${periodStart} and ${inspections.createdAt} <= ${periodEnd})`,
			passed: sql<number>`count(*) filter (where ${inspections.passed} = true and ${inspections.createdAt} >= ${periodStart} and ${inspections.createdAt} <= ${periodEnd})`
		}).from(inspections).where(os(inspections.organizationId)),

		db.select({
			active: sql<number>`count(*) filter (where ${providers.status} = 'active')`
		}).from(providers).where(os(providers.organizationId)),

		db.select({
			total: sql<number>`count(*) filter (where ${providerInterventions.performedAt} >= ${periodStart} and ${providerInterventions.performedAt} <= ${periodEnd})`,
			cost: sql<number>`coalesce(sum(${providerInterventions.cost}) filter (where ${providerInterventions.performedAt} >= ${periodStart} and ${providerInterventions.performedAt} <= ${periodEnd}), 0)`
		}).from(providerInterventions).where(os(providerInterventions.organizationId)),

		db.select({
			total: sql<number>`coalesce(sum(${volunteerHours.hours}) filter (where ${volunteerHours.createdAt} >= ${periodStart} and ${volunteerHours.createdAt} <= ${periodEnd}), 0)`
		}).from(volunteerHours).where(os(volunteerHours.organizationId)),

		db.select({
			total: sql<number>`count(*) filter (where ${healthRecords.createdAt} >= ${periodStart} and ${healthRecords.createdAt} <= ${periodEnd})`
		}).from(healthRecords).where(os(healthRecords.organizationId)),

		db.select({
			total: sql<number>`count(*) filter (where ${adoptions.createdAt} >= ${periodStart} and ${adoptions.createdAt} <= ${periodEnd})`
		}).from(adoptions).where(os(adoptions.organizationId)),

		db.select({
			colonyName: colonies.name,
			district: colonies.district,
			catCount: sql<number>`count(${cats.id})`,
			sterilizedCount: sql<number>`count(case when ${cats.sterilized} = true then 1 end)`
		}).from(colonies).leftJoin(cats, eq(cats.colonyId, colonies.id)).where(os(colonies.organizationId)).groupBy(colonies.name, colonies.district),

		db.select({
			colonyName: colonies.name,
			cerCount: sql<number>`count(${cerActions.id})`
		}).from(cerActions)
			.innerJoin(colonies, eq(cerActions.colonyId, colonies.id))
			.where(and(gte(cerActions.createdAt, periodStart), lte(cerActions.createdAt, periodEnd), os(cerActions.organizationId)))
			.groupBy(colonies.name),

		db.select({
			colonyName: colonies.name,
			totalCost: sql<number>`coalesce(sum(${providerInterventions.cost}), 0)`,
			interventionCount: sql<number>`count(${providerInterventions.id})`
		}).from(providerInterventions)
			.innerJoin(colonies, eq(providerInterventions.colonyId, colonies.id))
			.where(and(gte(providerInterventions.performedAt, periodStart), lte(providerInterventions.performedAt, periodEnd), os(providerInterventions.organizationId)))
			.groupBy(colonies.name)
	]);

	const tc = Number(catStats[0]?.total ?? 0);
	const sc = Number(catStats[0]?.sterilized ?? 0);
	const totalCol = Number(colonyStats[0]?.total ?? 0);
	const geoCol = Number(colonyStats[0]?.geolocated ?? 0);
	const totalInc = Number(incidentStats[0]?.total ?? 0);
	const resolvedInc = Number(incidentStats[0]?.resolved ?? 0);
	const totalCost = Number(interventionStats[0]?.cost ?? 0);

	return {
		totalColonies: totalCol, activeColonies: Number(colonyStats[0]?.active ?? 0),
		totalCats: tc, sterilizedCats: sc, microchipped: Number(catStats[0]?.microchipped ?? 0),
		sterilizationRate: computeRate(sc, tc),
		totalIncidents: totalInc, resolvedIncidents: resolvedInc,
		incidentResolutionRate: computeRate(resolvedInc, totalInc),
		totalCER: Number(cerStats[0]?.total ?? 0),
		totalCollab: Number(collabStats[0]?.total ?? 0), activeCollab: Number(collabStats[0]?.active ?? 0),
		totalVisits: Number(visitStats[0]?.total ?? 0),
		totalInsp: Number(inspStats[0]?.total ?? 0), passedInsp: Number(inspStats[0]?.passed ?? 0),
		activeProviders: Number(providerStats[0]?.active ?? 0),
		totalInterventions: Number(interventionStats[0]?.total ?? 0),
		totalCost, volunteerHours: Number(volHoursStats[0]?.total ?? 0),
		totalHealth: Number(healthStats[0]?.total ?? 0), geoColonies: geoCol,
		geoRate: computeRate(geoCol, totalCol),
		totalAdoptions: Number(adoptionStats[0]?.total ?? 0),
		costPerAnimal: tc > 0 ? Number((totalCost / tc).toFixed(2)) : 0,
		colonyBreakdown,
		cerByColony,
		costByColony
	};
}

const CSS = REPORT_CSS;

export const GET: RequestHandler = async ({ locals, url, request }) => {
	const ctx = requireApiContext(locals, request);
	const blocked = rateLimitGuard('export', ctx.userId, request);
	if (blocked) return blocked;
	const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()), 10);
	const periodStart = new Date(year, 0, 1);
	const periodEnd = new Date(year, 11, 31, 23, 59, 59);
	const orgId = ctx.organizationId;
	const stats = await fetchPeriodStats(periodStart, periodEnd, orgId);
	const now = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

	const cerMap = new Map(stats.cerByColony.map(c => [c.colonyName, Number(c.cerCount)]));
	const costMap = new Map(stats.costByColony.map(c => [c.colonyName, { cost: Number(c.totalCost), count: Number(c.interventionCount) }]));

	let colonyRows = '';
	for (const col of stats.colonyBreakdown) {
		const cer = cerMap.get(col.colonyName) ?? 0;
		const costInfo = costMap.get(col.colonyName) ?? { cost: 0, count: 0 };
		const catCount = Number(col.catCount);
		const sterCount = Number(col.sterilizedCount);
		const rate = computeRate(sterCount, catCount);
		colonyRows += `<tr>
			<td>${escHtml(col.colonyName)}</td>
			<td>${escHtml(col.district ?? '-')}</td>
			<td>${catCount}</td>
			<td>${sterCount} (${rate}%)</td>
			<td>${cer}</td>
			<td>${costInfo.count}</td>
			<td>${costInfo.cost.toFixed(2)} &euro;</td>
		</tr>`;
	}

	const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Memoria Justificativa DGDA - ${year}</title>
<style>${CSS}</style>
</head>
<body>
<div class="header">
	<h1>MEMORIA JUSTIFICATIVA PARA SUBVENCI&Oacute;N</h1>
	<p><strong>Direcci&oacute;n General de Derechos de los Animales (DGDA)</strong></p>
	<p>Ministerio de Derechos Sociales, Consumo y Agenda 2030</p>
	<p>Per&iacute;odo: Ejercicio ${year}</p>
</div>

<div class="meta">
	<span><strong>Generado:</strong> ${now}</span>
	<span><strong>Usuario:</strong> ${escHtml(locals.user?.name ?? '')}</span>
	<span><strong>Plataforma:</strong> Gatopolis v2.0</span>
</div>

<div class="section">
<h2>1. Identificaci&oacute;n del Programa</h2>
<table>
	<tr><td style="width:35%"><strong>Programa</strong></td><td>Gesti&oacute;n y Control de Colonias Felinas Urbanas (M&eacute;todo CER)</td></tr>
	<tr><td><strong>Marco legal</strong></td><td>Ley 7/2023, de 28 de marzo, de protecci&oacute;n de los derechos y el bienestar de los animales</td></tr>
	<tr><td><strong>Per&iacute;odo</strong></td><td>1 de enero a 31 de diciembre de ${year}</td></tr>
	<tr><td><strong>Expediente</strong></td><td>2026/CO_ASUM/0013</td></tr>
</table>
</div>

<div class="section">
<h2>2. Resumen Ejecutivo de Resultados</h2>
<div class="kpi-grid">
	<div class="kpi"><div class="value">${stats.totalColonies}</div><div class="label">Colonias gestionadas</div></div>
	<div class="kpi"><div class="value">${stats.totalCats}</div><div class="label">Gatos censados</div></div>
	<div class="kpi"><div class="value">${stats.sterilizationRate}%</div><div class="label">Tasa esterilizaci&oacute;n</div></div>
	<div class="kpi"><div class="value">${stats.totalCER}</div><div class="label">Acciones CER</div></div>
	<div class="kpi"><div class="value">${stats.totalHealth}</div><div class="label">Registros sanitarios</div></div>
	<div class="kpi"><div class="value">${stats.totalAdoptions}</div><div class="label">Adopciones</div></div>
	<div class="kpi"><div class="value">${stats.totalCost.toFixed(2)}&euro;</div><div class="label">Coste veterinario</div></div>
	<div class="kpi"><div class="value">${stats.costPerAnimal.toFixed(2)}&euro;</div><div class="label">Coste medio/animal</div></div>
</div>
</div>

<div class="section">
<h2>3. Objetivos y Grado de Cumplimiento</h2>
<table>
	<thead><tr><th>Objetivo</th><th>Indicador</th><th>Resultado</th><th>Estado</th></tr></thead>
	<tbody>
		<tr><td>Control poblacional CER</td><td>Tasa de esterilizaci&oacute;n</td><td>${stats.sterilizationRate}%</td><td><span class="${stats.sterilizationRate >= 50 ? 'badge-ok' : 'badge-ko'}">${stats.sterilizationRate >= 50 ? 'CUMPLIDO' : 'EN PROGRESO'}</span></td></tr>
		<tr><td>Censo individualizado</td><td>Gatos registrados</td><td>${stats.totalCats}</td><td><span class="${stats.totalCats > 0 ? 'badge-ok' : 'badge-ko'}">${stats.totalCats > 0 ? 'CUMPLIDO' : 'PENDIENTE'}</span></td></tr>
		<tr><td>Identificaci&oacute;n por microchip</td><td>Gatos identificados</td><td>${stats.microchipped}</td><td><span class="${stats.microchipped > 0 ? 'badge-ok' : 'badge-ko'}">${stats.microchipped > 0 ? 'CUMPLIDO' : 'PENDIENTE'}</span></td></tr>
		<tr><td>Seguimiento sanitario</td><td>Registros sanitarios</td><td>${stats.totalHealth}</td><td><span class="${stats.totalHealth > 0 ? 'badge-ok' : 'badge-ko'}">${stats.totalHealth > 0 ? 'CUMPLIDO' : 'PENDIENTE'}</span></td></tr>
		<tr><td>Red de voluntariado</td><td>Colaboradores activos</td><td>${stats.activeCollab}</td><td><span class="${stats.activeCollab > 0 ? 'badge-ok' : 'badge-ko'}">${stats.activeCollab > 0 ? 'CUMPLIDO' : 'PENDIENTE'}</span></td></tr>
		<tr><td>Gesti&oacute;n de incidencias</td><td>Tasa de resoluci&oacute;n</td><td>${stats.incidentResolutionRate}%</td><td><span class="${stats.incidentResolutionRate >= 60 ? 'badge-ok' : 'badge-ko'}">${stats.incidentResolutionRate >= 60 ? 'CUMPLIDO' : 'EN PROGRESO'}</span></td></tr>
		<tr><td>Programa de adopciones</td><td>Adopciones tramitadas</td><td>${stats.totalAdoptions}</td><td><span class="${stats.totalAdoptions > 0 ? 'badge-ok' : 'badge-ko'}">${stats.totalAdoptions > 0 ? 'CUMPLIDO' : 'PENDIENTE'}</span></td></tr>
	</tbody>
</table>
</div>

<div class="section">
<h2>4. Desglose por Colonia</h2>
<table>
	<thead><tr><th>Colonia</th><th>Distrito</th><th>Gatos</th><th>Esterilizados</th><th>CER</th><th>Intervenciones</th><th>Coste</th></tr></thead>
	<tbody>
		${colonyRows}
		<tr style="font-weight:bold;background:#f0fdf4">
			<td colspan="2">TOTAL</td>
			<td>${stats.totalCats}</td>
			<td>${stats.sterilizedCats} (${stats.sterilizationRate}%)</td>
			<td>${stats.totalCER}</td>
			<td>${stats.totalInterventions}</td>
			<td>${stats.totalCost.toFixed(2)} &euro;</td>
		</tr>
	</tbody>
</table>
</div>

<div class="section">
<h2>5. Recursos Humanos y Voluntariado</h2>
<table>
	<thead><tr><th>Indicador</th><th>Valor</th></tr></thead>
	<tbody>
		<tr><td>Colaboradores registrados</td><td>${stats.totalCollab}</td></tr>
		<tr><td>Colaboradores activos</td><td>${stats.activeCollab}</td></tr>
		<tr><td>Horas de voluntariado documentadas</td><td>${stats.volunteerHours}h</td></tr>
		<tr><td>Visitas de campo realizadas</td><td>${stats.totalVisits}</td></tr>
		<tr><td>Inspecciones t&eacute;cnicas</td><td>${stats.totalInsp} (${stats.passedInsp} aprobadas)</td></tr>
	</tbody>
</table>
</div>

<div class="section">
<h2>6. Gesti&oacute;n Veterinaria y Justificaci&oacute;n Econ&oacute;mica</h2>
<table>
	<thead><tr><th>Concepto</th><th>Cantidad</th><th>Importe</th></tr></thead>
	<tbody>
		<tr><td>Esterilizaciones realizadas</td><td>${stats.sterilizedCats}</td><td>Incluido en coste vet.</td></tr>
		<tr><td>Intervenciones veterinarias</td><td>${stats.totalInterventions}</td><td>${stats.totalCost.toFixed(2)} &euro;</td></tr>
		<tr><td>Coste medio por animal</td><td>${stats.totalCats} gatos</td><td>${stats.costPerAnimal.toFixed(2)} &euro;/animal</td></tr>
		<tr><td>Proveedores veterinarios activos</td><td>${stats.activeProviders}</td><td>-</td></tr>
		<tr style="font-weight:bold;background:#f0fdf4">
			<td>COSTE TOTAL JUSTIFICADO</td><td>-</td><td>${stats.totalCost.toFixed(2)} &euro;</td>
		</tr>
	</tbody>
</table>
</div>

<div class="section">
<h2>7. Cobertura Territorial</h2>
<table>
	<thead><tr><th>Indicador</th><th>Valor</th></tr></thead>
	<tbody>
		<tr><td>Colonias geolocalizadas</td><td>${stats.geoColonies} de ${stats.totalColonies} (${stats.geoRate}%)</td></tr>
		<tr><td>Colonias activas</td><td>${stats.activeColonies}</td></tr>
	</tbody>
</table>
</div>

<div class="section">
<div class="summary-box">
	<h3 style="margin-top:0">Resumen de Justificaci&oacute;n</h3>
	<p>Durante el ejercicio ${year}, se han gestionado <strong>${stats.totalColonies} colonias felinas</strong> con un censo de <strong>${stats.totalCats} gatos</strong>, alcanzando una tasa de esterilizaci&oacute;n del <strong>${stats.sterilizationRate}%</strong>. Se han realizado <strong>${stats.totalCER} acciones CER</strong> completas y <strong>${stats.totalHealth} registros sanitarios</strong>. El coste veterinario total ha sido de <strong>${stats.totalCost.toFixed(2)} &euro;</strong> (media de ${stats.costPerAnimal.toFixed(2)} &euro;/animal). La red de voluntariado ha aportado <strong>${stats.volunteerHours} horas</strong> de trabajo y se han tramitado <strong>${stats.totalAdoptions} adopciones</strong>.</p>
</div>
</div>

<div class="signature-area">
	<div class="signature-box">
		<p>El/La Responsable T&eacute;cnico/a</p>
		<br><br>
		<p>Fdo.: _____________________</p>
	</div>
	<div class="signature-box">
		<p>V&ordm;B&ordm; El/La Concejal/a Delegado/a</p>
		<br><br>
		<p>Fdo.: _____________________</p>
	</div>
</div>

<div class="footer">
	<p>Documento generado autom&aacute;ticamente por Gatopolis - Plataforma de Gesti&oacute;n de Colonias Felinas</p>
	<p>${now} - ${escHtml(locals.user?.email ?? '')}</p>
</div>
</body>
</html>`;

	await audit(ctx, 'subsidy_report', `dgda-${year}`, 'export', { type: 'dgda', year, format: 'html' });

	return new Response(html, {
		headers: htmlDocHeaders(`memoria-dgda-${year}.html`, 'attachment')
	});
};

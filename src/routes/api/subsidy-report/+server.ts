import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies, cats, incidents, cerActions, collaborators, auditLogs, visits, volunteerHours, inspections, providers, providerInterventions, healthRecords, adoptions } from '$lib/server/db/schema.js';
import { eq, sql, gte, lte, and } from 'drizzle-orm';

function esc(text: string | null | undefined): string {
	if (!text) return '';
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function fetchPeriodStats(periodStart: Date, periodEnd: Date) {
	const [
		totalColoniesR, activeColoniesR, totalCatsR, sterilizedCatsR,
		microchippedR, totalIncidentsR, resolvedIncidentsR,
		totalCERR, totalCollabR, activeCollabR, totalVisitsR, totalInspR,
		passedInspR, activeProvidersR, totalInterventionsR,
		totalCostR, totalVolHoursR, totalHealthR, geoColoniesR,
		totalAdoptionsR,
		colonyBreakdown, cerByColony, costByColony
	] = await Promise.all([
		db.select({ c: sql<number>`count(*)` }).from(colonies),
		db.select({ c: sql<number>`count(*)` }).from(colonies).where(eq(colonies.status, 'active')),
		db.select({ c: sql<number>`count(*)` }).from(cats),
		db.select({ c: sql<number>`count(*)` }).from(cats).where(eq(cats.sterilized, true)),
		db.select({ c: sql<number>`count(*)` }).from(cats).where(sql`${cats.microchip} IS NOT NULL AND ${cats.microchip} != ''`),
		db.select({ c: sql<number>`count(*)` }).from(incidents).where(and(gte(incidents.createdAt, periodStart), lte(incidents.createdAt, periodEnd))),
		db.select({ c: sql<number>`count(*)` }).from(incidents).where(and(eq(incidents.status, 'resolved'), gte(incidents.createdAt, periodStart), lte(incidents.createdAt, periodEnd))),
		db.select({ c: sql<number>`count(*)` }).from(cerActions).where(and(gte(cerActions.createdAt, periodStart), lte(cerActions.createdAt, periodEnd))),
		db.select({ c: sql<number>`count(*)` }).from(collaborators),
		db.select({ c: sql<number>`count(*)` }).from(collaborators).where(eq(collaborators.status, 'active')),
		db.select({ c: sql<number>`count(*)` }).from(visits).where(and(gte(visits.visitedAt, periodStart), lte(visits.visitedAt, periodEnd))),
		db.select({ c: sql<number>`count(*)` }).from(inspections).where(and(gte(inspections.createdAt, periodStart), lte(inspections.createdAt, periodEnd))),
		db.select({ c: sql<number>`count(*)` }).from(inspections).where(and(eq(inspections.passed, true), gte(inspections.createdAt, periodStart), lte(inspections.createdAt, periodEnd))),
		db.select({ c: sql<number>`count(*)` }).from(providers).where(eq(providers.status, 'active')),
		db.select({ c: sql<number>`count(*)` }).from(providerInterventions).where(and(gte(providerInterventions.performedAt, periodStart), lte(providerInterventions.performedAt, periodEnd))),
		db.select({ c: sql<number>`coalesce(sum(cost), 0)` }).from(providerInterventions).where(and(gte(providerInterventions.performedAt, periodStart), lte(providerInterventions.performedAt, periodEnd))),
		db.select({ c: sql<number>`coalesce(sum(hours), 0)` }).from(volunteerHours).where(and(gte(volunteerHours.createdAt, periodStart), lte(volunteerHours.createdAt, periodEnd))),
		db.select({ c: sql<number>`count(*)` }).from(healthRecords).where(and(gte(healthRecords.createdAt, periodStart), lte(healthRecords.createdAt, periodEnd))),
		db.select({ c: sql<number>`count(*)` }).from(colonies).where(sql`${colonies.latitude} IS NOT NULL`),
		db.select({ c: sql<number>`count(*)` }).from(adoptions).where(and(gte(adoptions.createdAt, periodStart), lte(adoptions.createdAt, periodEnd))),
		db.select({
			colonyName: colonies.name,
			district: colonies.district,
			catCount: sql<number>`count(${cats.id})`,
			sterilizedCount: sql<number>`count(case when ${cats.sterilized} = true then 1 end)`
		}).from(colonies).leftJoin(cats, eq(cats.colonyId, colonies.id)).groupBy(colonies.name, colonies.district),
		db.select({
			colonyName: colonies.name,
			cerCount: sql<number>`count(${cerActions.id})`
		}).from(cerActions)
			.innerJoin(colonies, eq(cerActions.colonyId, colonies.id))
			.where(and(gte(cerActions.createdAt, periodStart), lte(cerActions.createdAt, periodEnd)))
			.groupBy(colonies.name),
		db.select({
			colonyName: colonies.name,
			totalCost: sql<number>`coalesce(sum(${providerInterventions.cost}), 0)`,
			interventionCount: sql<number>`count(${providerInterventions.id})`
		}).from(providerInterventions)
			.innerJoin(colonies, eq(providerInterventions.colonyId, colonies.id))
			.where(and(gte(providerInterventions.performedAt, periodStart), lte(providerInterventions.performedAt, periodEnd)))
			.groupBy(colonies.name)
	]);

	const n = (r: { c: number }[]) => Number(r[0]?.c ?? 0);
	const tc = n(totalCatsR);
	const sc = n(sterilizedCatsR);
	const totalCol = n(totalColoniesR);
	const geoCol = n(geoColoniesR);
	const totalInc = n(totalIncidentsR);
	const resolvedInc = n(resolvedIncidentsR);
	const totalCost = n(totalCostR);

	return {
		totalColonies: totalCol, activeColonies: n(activeColoniesR),
		totalCats: tc, sterilizedCats: sc, microchipped: n(microchippedR),
		sterilizationRate: tc > 0 ? Math.round((sc / tc) * 100) : 0,
		totalIncidents: totalInc, resolvedIncidents: resolvedInc,
		incidentResolutionRate: totalInc > 0 ? Math.round((resolvedInc / totalInc) * 100) : 0,
		totalCER: n(totalCERR), totalCollab: n(totalCollabR), activeCollab: n(activeCollabR),
		totalVisits: n(totalVisitsR), totalInsp: n(totalInspR), passedInsp: n(passedInspR),
		activeProviders: n(activeProvidersR), totalInterventions: n(totalInterventionsR),
		totalCost, volunteerHours: n(totalVolHoursR),
		totalHealth: n(totalHealthR), geoColonies: geoCol,
		geoRate: totalCol > 0 ? Math.round((geoCol / totalCol) * 100) : 0,
		totalAdoptions: n(totalAdoptionsR),
		costPerAnimal: tc > 0 ? Number((totalCost / tc).toFixed(2)) : 0,
		colonyBreakdown,
		cerByColony,
		costByColony
	};
}

const CSS = `
  @page { margin: 2cm; size: A4; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; font-size: 11px; line-height: 1.5; }
  h1 { color: #1a5632; font-size: 20px; border-bottom: 3px solid #1a5632; padding-bottom: 8px; text-align: center; }
  h2 { color: #1a5632; font-size: 15px; margin-top: 22px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  h3 { color: #1a5632; font-size: 12px; margin-top: 14px; }
  .header { text-align: center; margin-bottom: 24px; border: 2px solid #1a5632; padding: 16px; border-radius: 8px; }
  .header p { color: #666; margin: 2px 0; font-size: 11px; }
  .meta { background: #f4f7f6; padding: 8px 12px; border-radius: 6px; margin-bottom: 16px; font-size: 10px; display: flex; justify-content: space-between; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; font-size: 11px; }
  th { background: #1a5632; color: white; padding: 6px 10px; text-align: left; font-size: 10px; }
  td { padding: 6px 10px; border-bottom: 1px solid #e0e0e0; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0; }
  .kpi { background: #f4f7f6; border-radius: 6px; padding: 10px; text-align: center; }
  .kpi .value { font-size: 20px; font-weight: bold; color: #1a5632; }
  .kpi .label { font-size: 9px; color: #666; margin-top: 2px; }
  .badge-ok { background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; }
  .badge-ko { background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; }
  .section { page-break-inside: avoid; }
  .summary-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 12px; margin: 12px 0; }
  .footer { margin-top: 24px; border-top: 1px solid #ccc; padding-top: 8px; font-size: 9px; color: #999; text-align: center; }
  .signature-area { margin-top: 40px; display: flex; justify-content: space-between; }
  .signature-box { width: 45%; border-top: 1px solid #333; padding-top: 8px; text-align: center; font-size: 10px; }
`;

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return new Response('No autorizado', { status: 401 });
	}

	const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));
	const periodStart = new Date(year, 0, 1);
	const periodEnd = new Date(year, 11, 31, 23, 59, 59);
	const stats = await fetchPeriodStats(periodStart, periodEnd);
	const now = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

	const cerMap = new Map(stats.cerByColony.map(c => [c.colonyName, Number(c.cerCount)]));
	const costMap = new Map(stats.costByColony.map(c => [c.colonyName, { cost: Number(c.totalCost), count: Number(c.interventionCount) }]));

	let colonyRows = '';
	for (const col of stats.colonyBreakdown) {
		const cer = cerMap.get(col.colonyName) ?? 0;
		const costInfo = costMap.get(col.colonyName) ?? { cost: 0, count: 0 };
		const catCount = Number(col.catCount);
		const sterCount = Number(col.sterilizedCount);
		const rate = catCount > 0 ? Math.round((sterCount / catCount) * 100) : 0;
		colonyRows += `<tr>
			<td>${esc(col.colonyName)}</td>
			<td>${esc(col.district ?? '-')}</td>
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
	<span><strong>Usuario:</strong> ${esc(locals.user.name)}</span>
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
	<p>${now} - ${esc(locals.user.email)}</p>
</div>
</body>
</html>`;

	await db.insert(auditLogs).values({
		userId: locals.user.id,
		entity: 'subsidy_report',
		entityId: `dgda-${year}`,
		action: 'export',
		details: { type: 'dgda', year, format: 'html' }
	});

	return new Response(html, {
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'Content-Disposition': `attachment; filename="memoria-dgda-${year}.html"`
		}
	});
};

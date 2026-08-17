import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { cats, colonies, healthRecords, cerActions, auditLogs } from '$lib/server/db/schema.js';
import { eq, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals, url }) => {
	if (!locals.user) return new Response('No autenticado', { status: 401 });

	const type = url.searchParams.get('type') || 'health';
	const catId = params.catId;

	const [cat] = await db.select().from(cats).where(eq(cats.id, catId));
	if (!cat) return new Response('Gato no encontrado', { status: 404 });

	let colonyName = '';
	if (cat.colonyId) {
		const [colony] = await db.select({ name: colonies.name }).from(colonies).where(eq(colonies.id, cat.colonyId));
		colonyName = colony?.name || '';
	}

	const healthRecs = await db.select().from(healthRecords).where(eq(healthRecords.catId, catId)).orderBy(desc(healthRecords.performedAt));
	const cerRecs = await db.select().from(cerActions).where(eq(cerActions.catId, catId)).orderBy(desc(cerActions.capturedAt));

	const now = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
	const certNumber = `CERT-${catId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

	await db.insert(auditLogs).values({
		userId: locals.user.id,
		entity: 'certificate',
		entityId: catId,
		action: 'generate',
		details: { type, certNumber }
	});

	let title = 'Certificado Sanitario';
	if (type === 'sterilization') title = 'Certificado de Esterilización';
	if (type === 'cer') title = 'Certificado de Actuación CER';

	const vaccinations = healthRecs.filter(r => r.type === 'vaccination');
	const dewormings = healthRecs.filter(r => r.type === 'deworming');
	const sterilizationRecord = healthRecs.find(r => r.type === 'sterilization');

	const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
	@page { size: A4; margin: 2cm; }
	body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; }
	.header { text-align: center; border-bottom: 3px solid #005a4d; padding-bottom: 15px; margin-bottom: 25px; }
	.header h1 { color: #005a4d; font-size: 18px; margin: 5px 0; }
	.header p { color: #666; font-size: 12px; margin: 3px 0; }
	.cert-number { color: #005a4d; font-weight: bold; font-size: 13px; }
	.section { margin-bottom: 20px; }
	.section h2 { color: #005a4d; font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
	table { width: 100%; border-collapse: collapse; font-size: 13px; }
	td { padding: 6px 8px; border-bottom: 1px solid #eee; }
	td:first-child { font-weight: 600; color: #555; width: 180px; }
	.records-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
	.records-table th { background: #f8f9fa; padding: 6px 8px; text-align: left; border: 1px solid #ddd; }
	.records-table td { padding: 6px 8px; border: 1px solid #eee; }
	.footer { margin-top: 40px; border-top: 2px solid #005a4d; padding-top: 15px; font-size: 11px; color: #777; text-align: center; }
	.signature { margin-top: 50px; display: flex; justify-content: space-between; }
	.signature-box { width: 45%; text-align: center; }
	.signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; font-size: 12px; }
	.stamp { color: #005a4d; font-weight: bold; font-size: 11px; }
	@media print { body { padding: 0; } }
</style>
</head>
<body>
<div class="header">
	<p style="font-size:14px;font-weight:bold;color:#005a4d">AYUNTAMIENTO DE VITORIA-GASTEIZ</p>
	<p>Departamento de Medio Ambiente y Espacio Público</p>
	<p>Gatopolis — Colonias Felinas Urbanas</p>
	<h1>${title}</h1>
	<p class="cert-number">N.º ${certNumber}</p>
	<p>Expediente: 2026/CO_ASUM/0013</p>
</div>

<div class="section">
	<h2>Datos del Animal</h2>
	<table>
		<tr><td>Nombre/Identificador</td><td>${cat.name || 'Sin nombre'}</td></tr>
		<tr><td>Colonia</td><td>${colonyName || 'No asignada'}</td></tr>
		<tr><td>Sexo</td><td>${cat.sex === 'male' ? 'Macho' : cat.sex === 'female' ? 'Hembra' : 'Desconocido'}</td></tr>
		<tr><td>Edad estimada</td><td>${cat.estimatedAge || 'No determinada'}</td></tr>
		<tr><td>Microchip</td><td>${cat.microchip || 'No identificado'}</td></tr>
		<tr><td>Esterilizado/a</td><td>${cat.sterilized ? 'Sí' : 'No'}${sterilizationRecord?.performedAt ? ' (' + new Date(sterilizationRecord.performedAt).toLocaleDateString('es-ES') + ')' : ''}</td></tr>
		<tr><td>Estado actual</td><td>${cat.status === 'in_colony' ? 'En colonia' : cat.status === 'adopted' ? 'Adoptado/a' : cat.status === 'deceased' ? 'Fallecido/a' : cat.status}</td></tr>
	</table>
</div>

${type === 'health' || type === 'sterilization' ? `
<div class="section">
	<h2>Historial de Vacunaciones</h2>
	${vaccinations.length > 0 ? `
	<table class="records-table">
		<thead><tr><th>Fecha</th><th>Veterinario</th><th>Clínica</th><th>Observaciones</th></tr></thead>
		<tbody>
		${vaccinations.map(v => `<tr><td>${v.performedAt ? new Date(v.performedAt).toLocaleDateString('es-ES') : '-'}</td><td>${v.vetName || '-'}</td><td>${v.vetClinic || '-'}</td><td>${v.notes || '-'}</td></tr>`).join('')}
		</tbody>
	</table>` : '<p style="color:#999;font-size:12px">Sin registros de vacunación.</p>'}
</div>

<div class="section">
	<h2>Desparasitaciones</h2>
	${dewormings.length > 0 ? `
	<table class="records-table">
		<thead><tr><th>Fecha</th><th>Veterinario</th><th>Clínica</th><th>Observaciones</th></tr></thead>
		<tbody>
		${dewormings.map(d => `<tr><td>${d.performedAt ? new Date(d.performedAt).toLocaleDateString('es-ES') : '-'}</td><td>${d.vetName || '-'}</td><td>${d.vetClinic || '-'}</td><td>${d.notes || '-'}</td></tr>`).join('')}
		</tbody>
	</table>` : '<p style="color:#999;font-size:12px">Sin registros de desparasitación.</p>'}
</div>
` : ''}

${type === 'cer' ? `
<div class="section">
	<h2>Actuaciones CER (Captura-Esterilización-Retorno)</h2>
	${cerRecs.length > 0 ? `
	<table class="records-table">
		<thead><tr><th>Captura</th><th>Esterilización</th><th>Retorno</th><th>Colaborador</th><th>Notas</th></tr></thead>
		<tbody>
		${cerRecs.map(c => `<tr><td>${c.capturedAt ? new Date(c.capturedAt).toLocaleDateString('es-ES') : '-'}</td><td>${c.sterilizedAt ? new Date(c.sterilizedAt).toLocaleDateString('es-ES') : '-'}</td><td>${c.returnedAt ? new Date(c.returnedAt).toLocaleDateString('es-ES') : '-'}</td><td>${c.collaboratorName || '-'}</td><td>${c.notes || '-'}</td></tr>`).join('')}
		</tbody>
	</table>` : '<p style="color:#999;font-size:12px">Sin actuaciones CER registradas.</p>'}
</div>
` : ''}

<div class="signature">
	<div class="signature-box">
		<div class="signature-line">Profesional veterinario</div>
	</div>
	<div class="signature-box">
		<div class="signature-line">Responsable municipal</div>
	</div>
</div>

<div class="footer">
	<p class="stamp">[PENDIENTE DE CONFIRMAR: Firma electrónica y validez oficial del certificado]</p>
	<p>Documento generado el ${now} por Gatopolis</p>
	<p>Este documento tiene carácter informativo. La validez oficial queda sujeta a la firma y sello correspondientes.</p>
</div>
</body>
</html>`;

	return new Response(html, {
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'Content-Disposition': `inline; filename="${title.replace(/ /g, '_')}_${cat.name || catId.slice(0, 8)}.html"`
		}
	});
};

import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies, cats, incidents, collaborators, cerActions, healthRecords } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { logAudit } from '$lib/server/audit.js';

function csvEscape(val: unknown): string {
	if (val === null || val === undefined) return '';
	const str = String(val);
	if (str.includes(',') || str.includes('"') || str.includes('\n')) {
		return '"' + str.replace(/"/g, '""') + '"';
	}
	return str;
}

function toCSV(headers: string[], rows: unknown[][]): string {
	const bom = '\uFEFF';
	const headerLine = headers.map(csvEscape).join(',');
	const dataLines = rows.map(row => row.map(csvEscape).join(','));
	return bom + [headerLine, ...dataLines].join('\r\n');
}

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) throw error(401, 'No autenticado');

	const type = url.searchParams.get('type') || 'colonies';

	let csvContent: string;
	let filename: string;

	switch (type) {
		case 'colonies': {
			const data = await db.select().from(colonies);
			csvContent = toCSV(
				['ID', 'Nombre', 'Estado', 'Clasificación', 'Distrito', 'Descripción', 'Latitud', 'Longitud', 'Fecha creación'],
				data.map(c => [c.id, c.name, c.status, c.classification, c.district, c.description, c.latitude, c.longitude, c.createdAt?.toISOString()])
			);
			filename = 'colonias';
			break;
		}
		case 'cats': {
			const data = await db.select().from(cats);
			csvContent = toCSV(
				['ID', 'Nombre', 'Colonia ID', 'Sexo', 'Esterilizado', 'Fecha esterilización', 'Microchip', 'Estado', 'Edad estimada', 'Fecha creación'],
				data.map(c => [c.id, c.name, c.colonyId, c.sex, c.sterilized ? 'Sí' : 'No', c.sterilizationDate, c.microchip, c.status, c.estimatedAge, c.createdAt?.toISOString()])
			);
			filename = 'gatos';
			break;
		}
		case 'incidents': {
			const data = await db.select().from(incidents);
			csvContent = toCSV(
				['ID', 'Categoría', 'Prioridad', 'Estado', 'Descripción', 'Colonia ID', 'Latitud', 'Longitud', 'Fecha creación'],
				data.map(i => [i.id, i.category, i.priority, i.status, i.description, i.colonyId, i.latitude, i.longitude, i.createdAt?.toISOString()])
			);
			filename = 'incidencias';
			break;
		}
		case 'collaborators': {
			const data = await db.select().from(collaborators);
			csvContent = toCSV(
				['ID', 'Nombre', 'DNI/NIE', 'Estado', 'Válido hasta', 'LOPD firmada', 'Fecha creación'],
				data.map(c => [c.id, c.name, c.documentId, c.status, c.validUntil, c.privacyNoticeSigned ? 'Sí' : 'No', c.createdAt?.toISOString()])
			);
			filename = 'colaboradores';
			break;
		}
		case 'cer': {
			const data = await db.select().from(cerActions);
			csvContent = toCSV(
				['ID', 'Gato ID', 'Colonia ID', 'Capturado', 'Esterilizado', 'Retornado', 'Colaborador', 'Notas'],
				data.map(c => [c.id, c.catId, c.colonyId, c.capturedAt?.toISOString(), c.sterilizedAt?.toISOString(), c.returnedAt?.toISOString(), c.collaboratorName, c.notes])
			);
			filename = 'cer';
			break;
		}
		case 'health': {
			const data = await db.select().from(healthRecords);
			csvContent = toCSV(
				['ID', 'Gato ID', 'Tipo', 'Fecha', 'Veterinario', 'Clínica', 'Notas'],
				data.map(h => [h.id, h.catId, h.type, h.performedAt?.toISOString(), h.vetName, h.vetClinic, h.notes])
			);
			filename = 'salud';
			break;
		}
		default:
			throw error(400, 'Tipo de exportación no válido');
	}

	await logAudit({ userId: locals.user.id, entity: 'export', entityId: type, action: 'export', details: { format: 'csv', type } });

	const dateStr = new Date().toISOString().slice(0, 10);
	return new Response(csvContent, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}-${dateStr}.csv"`
		}
	});
};

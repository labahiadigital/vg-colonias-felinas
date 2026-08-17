import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { colonies, cats, collaborators, healthRecords, cerActions, incidents } from '$lib/server/db/schema.js';
import { logAudit } from '$lib/server/audit.js';

function parseCsv(text: string): Record<string, string>[] {
	const lines = text.split(/\r?\n/).filter(l => l.trim());
	if (lines.length < 2) return [];
	const sep = lines[0].includes(';') ? ';' : ',';
	const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ''));
	return lines.slice(1).map(line => {
		const values: string[] = [];
		let current = '';
		let inQuotes = false;
		for (const ch of line) {
			if (ch === '"') { inQuotes = !inQuotes; continue; }
			if (ch === sep[0] && !inQuotes) { values.push(current.trim()); current = ''; continue; }
			current += ch;
		}
		values.push(current.trim());
		const row: Record<string, string> = {};
		headers.forEach((h, i) => { row[h] = values[i] || ''; });
		return row;
	});
}

const ENTITY_MAP: Record<string, { table: any; mapRow: (row: Record<string, string>) => Record<string, unknown> }> = {
	colonies: {
		table: colonies,
		mapRow: (r) => ({
			name: r.name || r.nombre || 'Sin nombre',
			status: r.status || r.estado || 'active',
			classification: r.classification || r.clasificacion || null,
			district: r.district || r.distrito || null,
			description: r.description || r.descripcion || null,
			latitude: r.latitude || r.latitud ? parseFloat(r.latitude || r.latitud) : null,
			longitude: r.longitude || r.longitud ? parseFloat(r.longitude || r.longitud) : null
		})
	},
	cats: {
		table: cats,
		mapRow: (r) => ({
			name: r.name || r.nombre || null,
			sex: r.sex || r.sexo || null,
			sterilized: ['true', 'si', 'sí', '1', 'yes'].includes((r.sterilized || r.esterilizado || '').toLowerCase()),
			microchip: r.microchip || null,
			status: r.status || r.estado || 'in_colony',
			estimatedAge: r.estimatedAge || r.edad_estimada || r.edad || null
		})
	},
	collaborators: {
		table: collaborators,
		mapRow: (r) => ({
			name: r.name || r.nombre || 'Sin nombre',
			documentId: r.documentId || r.dni || r.documento || null,
			status: r.status || r.estado || 'pending'
		})
	},
	health: {
		table: healthRecords,
		mapRow: (r) => ({
			catId: r.catId || r.cat_id,
			type: r.type || r.tipo || 'revision',
			performedAt: r.performedAt || r.fecha ? new Date(r.performedAt || r.fecha) : new Date(),
			vetName: r.vetName || r.veterinario || null,
			vetClinic: r.vetClinic || r.clinica || null,
			notes: r.notes || r.notas || null
		})
	},
	incidents: {
		table: incidents,
		mapRow: (r) => ({
			category: r.category || r.categoria || 'general',
			priority: r.priority || r.prioridad || 'medium',
			status: r.status || r.estado || 'open',
			description: r.description || r.descripcion || '',
			latitude: r.latitude || r.latitud ? parseFloat(r.latitude || r.latitud) : null,
			longitude: r.longitude || r.longitud ? parseFloat(r.longitude || r.longitud) : null
		})
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'No autenticado' }, { status: 401 });

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const entity = formData.get('entity') as string | null;

	if (!file || !entity) {
		return json({ error: 'Se requiere archivo y tipo de entidad' }, { status: 400 });
	}

	const config = ENTITY_MAP[entity];
	if (!config) {
		return json({ error: `Entidad no soportada: ${entity}. Disponibles: ${Object.keys(ENTITY_MAP).join(', ')}` }, { status: 400 });
	}

	const text = await file.text();
	const rows = parseCsv(text);
	if (rows.length === 0) {
		return json({ error: 'Archivo vacío o formato no válido' }, { status: 400 });
	}

	let imported = 0;
	const errors: string[] = [];

	for (let i = 0; i < rows.length; i++) {
		try {
			const mapped = config.mapRow(rows[i]);
			await db.insert(config.table).values(mapped);
			imported++;
		} catch (err) {
			errors.push(`Fila ${i + 2}: ${err instanceof Error ? err.message : 'Error desconocido'}`);
		}
	}

	await logAudit({
		userId: locals.user.id,
		entity: 'system',
		entityId: entity,
		action: 'import',
		details: { entity, totalRows: rows.length, imported, errors: errors.length }
	});

	return json({
		success: true,
		totalRows: rows.length,
		imported,
		errors: errors.slice(0, 20)
	});
};

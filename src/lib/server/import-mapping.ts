export interface ImportMapRow {
	(row: Record<string, string>): Record<string, unknown>;
}

export interface EntityMapping {
	mapRow: ImportMapRow;
}

const STERILIZED_TRUE = new Set(['true', 'si', 'sí', '1', 'yes']);

function safeParseFloat(value: string | undefined): number | null {
	if (!value) return null;
	const n = parseFloat(value);
	return Number.isFinite(n) ? n : null;
}

export const ENTITY_MAPPERS: Record<string, EntityMapping> = {
	colonies: {
		mapRow: (r) => ({
			name: r.name || r.nombre || 'Sin nombre',
			status: r.status || r.estado || 'active',
			classification: r.classification || r.clasificacion || null,
			district: r.district || r.distrito || null,
			description: r.description || r.descripcion || null,
			latitude: safeParseFloat(r.latitude || r.latitud),
			longitude: safeParseFloat(r.longitude || r.longitud)
		})
	},
	cats: {
		mapRow: (r) => ({
			name: r.name || r.nombre || null,
			sex: r.sex || r.sexo || null,
			sterilized: STERILIZED_TRUE.has((r.sterilized || r.esterilizado || '').toLowerCase()),
			microchip: r.microchip || null,
			status: r.status || r.estado || 'in_colony',
			estimatedAge: r.estimatedAge || r.edad_estimada || r.edad || null
		})
	},
	collaborators: {
		mapRow: (r) => ({
			name: r.name || r.nombre || 'Sin nombre',
			documentId: r.documentId || r.dni || r.documento || null,
			status: r.status || r.estado || 'pending'
		})
	},
	health: {
		mapRow: (r) => ({
			catId: r.catId || r.cat_id,
			type: r.type || r.tipo || 'revision',
			performedAt: r.performedAt || r.fecha ? new Date(String(r.performedAt || r.fecha)) : new Date(),
			vetName: r.vetName || r.veterinario || null,
			vetClinic: r.vetClinic || r.clinica || null,
			notes: r.notes || r.notas || null
		})
	},
	incidents: {
		mapRow: (r) => ({
			category: r.category || r.categoria || 'general',
			priority: r.priority || r.prioridad || 'medium',
			status: r.status || r.estado || 'open',
			description: r.description || r.descripcion || '',
			colonyId: r.colonyId || r.colony_id || r.colonia_id || null,
			latitude: safeParseFloat(r.latitude || r.latitud),
			longitude: safeParseFloat(r.longitude || r.longitud)
		})
	}
};

export const SUPPORTED_ENTITIES = Object.keys(ENTITY_MAPPERS);

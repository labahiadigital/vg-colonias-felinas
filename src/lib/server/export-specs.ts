import { colonies, cats, incidents, collaborators, cerActions, healthRecords } from './db/schema.js';
import type { PgColumn } from 'drizzle-orm/pg-core';
import type { db } from './db/index.js';

export interface ExportSpec {
	table: { organizationId: PgColumn } & Parameters<typeof db.select>[0];
	headers: string[];
	row: (r: Record<string, unknown>) => unknown[];
	filename: string;
}

export const EXPORT_SPECS: Record<string, ExportSpec> = {
	colonies: {
		table: colonies,
		headers: ['ID', 'Nombre', 'Estado', 'Clasificación', 'Distrito', 'Descripción', 'Latitud', 'Longitud', 'Fecha creación'],
		row: (c) => [c.id, c.name, c.status, c.classification, c.district, c.description, c.latitude, c.longitude, (c.createdAt as Date)?.toISOString()],
		filename: 'colonias'
	},
	cats: {
		table: cats,
		headers: ['ID', 'Nombre', 'Colonia ID', 'Sexo', 'Esterilizado', 'Fecha esterilización', 'Microchip', 'Estado', 'Edad estimada', 'Fecha creación'],
		row: (c) => [c.id, c.name, c.colonyId, c.sex, c.sterilized ? 'Sí' : 'No', c.sterilizationDate, c.microchip, c.status, c.estimatedAge, (c.createdAt as Date)?.toISOString()],
		filename: 'gatos'
	},
	incidents: {
		table: incidents,
		headers: ['ID', 'Categoría', 'Prioridad', 'Estado', 'Descripción', 'Colonia ID', 'Latitud', 'Longitud', 'Fecha creación'],
		row: (i) => [i.id, i.category, i.priority, i.status, i.description, i.colonyId, i.latitude, i.longitude, (i.createdAt as Date)?.toISOString()],
		filename: 'incidencias'
	},
	collaborators: {
		table: collaborators,
		headers: ['ID', 'Nombre', 'DNI/NIE', 'Estado', 'Válido hasta', 'LOPD firmada', 'Fecha creación'],
		row: (c) => [c.id, c.name, c.documentId, c.status, c.validUntil, c.privacyNoticeSigned ? 'Sí' : 'No', (c.createdAt as Date)?.toISOString()],
		filename: 'colaboradores'
	},
	cer: {
		table: cerActions,
		headers: ['ID', 'Gato ID', 'Colonia ID', 'Capturado', 'Esterilizado', 'Retornado', 'Colaborador', 'Notas'],
		row: (c) => [c.id, c.catId, c.colonyId, (c.capturedAt as Date)?.toISOString(), (c.sterilizedAt as Date)?.toISOString(), (c.returnedAt as Date)?.toISOString(), c.collaboratorName, c.notes],
		filename: 'cer'
	},
	health: {
		table: healthRecords,
		headers: ['ID', 'Gato ID', 'Tipo', 'Fecha', 'Veterinario', 'Clínica', 'Notas'],
		row: (h) => [h.id, h.catId, h.type, (h.performedAt as Date)?.toISOString(), h.vetName, h.vetClinic, h.notes],
		filename: 'salud'
	}
};

export const EXPORT_TYPES = Object.keys(EXPORT_SPECS);

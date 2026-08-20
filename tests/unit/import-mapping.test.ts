import { describe, it, expect } from 'vitest';

const ENTITY_MAP: Record<string, { mapRow: (row: Record<string, string>) => Record<string, unknown> }> = {
	colonies: {
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
		mapRow: (r) => ({
			name: r.name || r.nombre || 'Sin nombre',
			documentId: r.documentId || r.dni || r.documento || null,
			status: r.status || r.estado || 'pending'
		})
	},
	incidents: {
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

describe('Import mapRow: colonies', () => {
	const { mapRow } = ENTITY_MAP.colonies;

	it('maps English field names', () => {
		const result = mapRow({ name: 'TestColony', status: 'active', district: 'Centro' });
		expect(result.name).toBe('TestColony');
		expect(result.status).toBe('active');
		expect(result.district).toBe('Centro');
	});

	it('maps Spanish field names', () => {
		const result = mapRow({ nombre: 'Colonia A', estado: 'inactive', distrito: 'Norte' });
		expect(result.name).toBe('Colonia A');
		expect(result.status).toBe('inactive');
		expect(result.district).toBe('Norte');
	});

	it('defaults name to "Sin nombre"', () => {
		const result = mapRow({});
		expect(result.name).toBe('Sin nombre');
	});

	it('defaults status to "active"', () => {
		const result = mapRow({ nombre: 'Test' });
		expect(result.status).toBe('active');
	});

	it('parses latitude/longitude', () => {
		const result = mapRow({ name: 'Test', latitude: '42.85', longitude: '-2.67' });
		expect(result.latitude).toBeCloseTo(42.85);
		expect(result.longitude).toBeCloseTo(-2.67);
	});

	it('handles Spanish lat/long fields', () => {
		const result = mapRow({ nombre: 'Test', latitud: '42.0', longitud: '-2.5' });
		expect(result.latitude).toBeCloseTo(42.0);
		expect(result.longitude).toBeCloseTo(-2.5);
	});

	it('sets null for missing optional fields', () => {
		const result = mapRow({ name: 'Test' });
		expect(result.classification).toBeNull();
		expect(result.description).toBeNull();
	});
});

describe('Import mapRow: cats', () => {
	const { mapRow } = ENTITY_MAP.cats;

	it('maps English field names', () => {
		const result = mapRow({ name: 'Michi', sex: 'male', microchip: 'ABC123' });
		expect(result.name).toBe('Michi');
		expect(result.sex).toBe('male');
		expect(result.microchip).toBe('ABC123');
	});

	it('maps Spanish field names', () => {
		const result = mapRow({ nombre: 'Luna', sexo: 'hembra', edad: 'adulto' });
		expect(result.name).toBe('Luna');
		expect(result.sex).toBe('hembra');
		expect(result.estimatedAge).toBe('adulto');
	});

	it('parses sterilized "si" as true', () => {
		expect(ENTITY_MAP.cats.mapRow({ esterilizado: 'si' }).sterilized).toBe(true);
	});

	it('parses sterilized "sí" as true', () => {
		expect(ENTITY_MAP.cats.mapRow({ esterilizado: 'Sí' }).sterilized).toBe(true);
	});

	it('parses sterilized "yes" as true', () => {
		expect(ENTITY_MAP.cats.mapRow({ sterilized: 'yes' }).sterilized).toBe(true);
	});

	it('parses sterilized "1" as true', () => {
		expect(ENTITY_MAP.cats.mapRow({ sterilized: '1' }).sterilized).toBe(true);
	});

	it('parses sterilized "no" as false', () => {
		expect(ENTITY_MAP.cats.mapRow({ sterilized: 'no' }).sterilized).toBe(false);
	});

	it('parses empty sterilized as false', () => {
		expect(ENTITY_MAP.cats.mapRow({}).sterilized).toBe(false);
	});

	it('defaults status to "in_colony"', () => {
		expect(ENTITY_MAP.cats.mapRow({}).status).toBe('in_colony');
	});
});

describe('Import mapRow: collaborators', () => {
	const { mapRow } = ENTITY_MAP.collaborators;

	it('maps English names', () => {
		const result = mapRow({ name: 'Juan', documentId: '12345678A' });
		expect(result.name).toBe('Juan');
		expect(result.documentId).toBe('12345678A');
	});

	it('maps Spanish names', () => {
		const result = mapRow({ nombre: 'María', dni: '87654321B' });
		expect(result.name).toBe('María');
		expect(result.documentId).toBe('87654321B');
	});

	it('defaults status to "pending"', () => {
		expect(ENTITY_MAP.collaborators.mapRow({ name: 'Test' }).status).toBe('pending');
	});
});

describe('Import mapRow: incidents', () => {
	const { mapRow } = ENTITY_MAP.incidents;

	it('maps English names', () => {
		const result = mapRow({ category: 'health', priority: 'high', description: 'Cat injured' });
		expect(result.category).toBe('health');
		expect(result.priority).toBe('high');
		expect(result.description).toBe('Cat injured');
	});

	it('maps Spanish names', () => {
		const result = mapRow({ categoria: 'salud', prioridad: 'alta', descripcion: 'Gato herido' });
		expect(result.category).toBe('salud');
		expect(result.priority).toBe('alta');
		expect(result.description).toBe('Gato herido');
	});

	it('defaults to general/medium/open', () => {
		const result = mapRow({});
		expect(result.category).toBe('general');
		expect(result.priority).toBe('medium');
		expect(result.status).toBe('open');
	});
});

describe('ENTITY_MAP supported entities', () => {
	it('supports colonies', () => expect(ENTITY_MAP.colonies).toBeDefined());
	it('supports cats', () => expect(ENTITY_MAP.cats).toBeDefined());
	it('supports collaborators', () => expect(ENTITY_MAP.collaborators).toBeDefined());
	it('supports incidents', () => expect(ENTITY_MAP.incidents).toBeDefined());
	it('does not support unknown entity', () => expect(ENTITY_MAP['unknown']).toBeUndefined());
});

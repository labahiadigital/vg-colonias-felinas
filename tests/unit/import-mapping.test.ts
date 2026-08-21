import { describe, it, expect } from 'vitest';
import { ENTITY_MAPPERS, SUPPORTED_ENTITIES } from '../../src/lib/server/import-mapping.js';

describe('Import mapRow: colonies', () => {
	const { mapRow } = ENTITY_MAPPERS['colonies']!;

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

	it('returns null for non-numeric latitude/longitude', () => {
		const result = mapRow({ name: 'Test', latitude: 'abc', longitude: 'xyz' });
		expect(result.latitude).toBeNull();
		expect(result.longitude).toBeNull();
	});

	it('returns null for empty latitude/longitude', () => {
		const result = mapRow({ name: 'Test', latitude: '', longitude: '' });
		expect(result.latitude).toBeNull();
		expect(result.longitude).toBeNull();
	});

	it('returns null for Infinity latitude', () => {
		const result = mapRow({ name: 'Test', latitude: 'Infinity' });
		expect(result.latitude).toBeNull();
	});
});

describe('Import mapRow: cats', () => {
	const { mapRow } = ENTITY_MAPPERS['cats']!;

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
		expect(mapRow({ esterilizado: 'si' }).sterilized).toBe(true);
	});

	it('parses sterilized "sí" as true', () => {
		expect(mapRow({ esterilizado: 'Sí' }).sterilized).toBe(true);
	});

	it('parses sterilized "yes" as true', () => {
		expect(mapRow({ sterilized: 'yes' }).sterilized).toBe(true);
	});

	it('parses sterilized "1" as true', () => {
		expect(mapRow({ sterilized: '1' }).sterilized).toBe(true);
	});

	it('parses sterilized "no" as false', () => {
		expect(mapRow({ sterilized: 'no' }).sterilized).toBe(false);
	});

	it('parses empty sterilized as false', () => {
		expect(mapRow({}).sterilized).toBe(false);
	});

	it('defaults status to "in_colony"', () => {
		expect(mapRow({}).status).toBe('in_colony');
	});
});

describe('Import mapRow: collaborators', () => {
	const { mapRow } = ENTITY_MAPPERS['collaborators']!;

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
		expect(mapRow({ name: 'Test' }).status).toBe('pending');
	});
});

describe('Import mapRow: incidents', () => {
	const { mapRow } = ENTITY_MAPPERS['incidents']!;

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

	it('maps colonyId fields', () => {
		expect(mapRow({ colonyId: 'c1' }).colonyId).toBe('c1');
		expect(mapRow({ colony_id: 'c2' }).colonyId).toBe('c2');
		expect(mapRow({ colonia_id: 'c3' }).colonyId).toBe('c3');
	});
});

describe('Import mapRow: health', () => {
	const { mapRow } = ENTITY_MAPPERS['health']!;

	it('maps English field names', () => {
		const result = mapRow({ catId: 'cat1', type: 'surgery', vetName: 'Dr. Smith' });
		expect(result.catId).toBe('cat1');
		expect(result.type).toBe('surgery');
		expect(result.vetName).toBe('Dr. Smith');
	});

	it('maps Spanish field names', () => {
		const result = mapRow({ cat_id: 'cat2', tipo: 'vacunacion', veterinario: 'Dr. García' });
		expect(result.catId).toBe('cat2');
		expect(result.type).toBe('vacunacion');
		expect(result.vetName).toBe('Dr. García');
	});

	it('defaults type to "revision"', () => {
		expect(mapRow({ catId: 'c1' }).type).toBe('revision');
	});
});

describe('SUPPORTED_ENTITIES', () => {
	it('includes colonies', () => expect(SUPPORTED_ENTITIES).toContain('colonies'));
	it('includes cats', () => expect(SUPPORTED_ENTITIES).toContain('cats'));
	it('includes collaborators', () => expect(SUPPORTED_ENTITIES).toContain('collaborators'));
	it('includes health', () => expect(SUPPORTED_ENTITIES).toContain('health'));
	it('includes incidents', () => expect(SUPPORTED_ENTITIES).toContain('incidents'));
	it('has 5 entities', () => expect(SUPPORTED_ENTITIES).toHaveLength(5));
});

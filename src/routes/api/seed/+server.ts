import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { auth } from '$lib/server/auth/index.js';
import {
	colonies,
	cats,
	healthRecords,
	cerActions,
	incidents,
	collaborators,
	adoptions,
	feedingPoints,
	auditLogs,
	userRoles,
	roles
} from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, url }) => {
	const secret = url.searchParams.get('key');
	if (secret !== 'seed-2026-vg') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const baseUrl = url.origin;

		const adminRes = await auth.api.signUpEmail({
			body: {
				name: 'Admin VG',
				email: 'admin@vitoria-gasteiz.org',
				password: 'Admin2026!'
			}
		});

		const tecnicoRes = await auth.api.signUpEmail({
			body: {
				name: 'María López',
				email: 'tecnico@vitoria-gasteiz.org',
				password: 'Tecnico2026!'
			}
		});

		const vetRes = await auth.api.signUpEmail({
			body: {
				name: 'Dr. Iñaki Arteaga',
				email: 'vet@vitoria-gasteiz.org',
				password: 'Vet2026!'
			}
		});

		const adminId = adminRes.user?.id;
		const tecnicoId = tecnicoRes.user?.id;
		const vetId = vetRes.user?.id;

		if (!adminId || !tecnicoId || !vetId) {
			return json({ error: 'Failed to create users', details: { adminRes, tecnicoRes, vetRes } }, { status: 500 });
		}

		const allRoles = await db.select().from(roles);
		const adminRole = allRoles.find(r => r.name === 'admin');
		const tecnicoRole = allRoles.find(r => r.name === 'tecnico');
		const vetRole = allRoles.find(r => r.name === 'veterinario');

		if (adminRole) {
			await db.insert(userRoles).values({ userId: adminId, roleId: adminRole.id });
		}
		if (tecnicoRole) {
			await db.insert(userRoles).values({ userId: tecnicoId, roleId: tecnicoRole.id });
		}
		if (vetRole) {
			await db.insert(userRoles).values({ userId: vetId, roleId: vetRole.id });
		}

		const colony1Id = crypto.randomUUID();
		const colony2Id = crypto.randomUUID();
		const colony3Id = crypto.randomUUID();
		const colony4Id = crypto.randomUUID();
		const colony5Id = crypto.randomUUID();

		await db.insert(colonies).values([
			{ id: colony1Id, name: 'Parque de la Florida', status: 'active', classification: 'Parque urbano', district: 'Centro', description: 'Colonia estable en el Parque de la Florida, con alimentadores regulares', latitude: 42.8469, longitude: -2.6727 },
			{ id: colony2Id, name: 'Judimendi', status: 'active', classification: 'Residencial', district: 'Judimendi', description: 'Colonia en zona residencial de Judimendi, bien gestionada', latitude: 42.8510, longitude: -2.6780 },
			{ id: colony3Id, name: 'Salburua', status: 'active', classification: 'Zona verde', district: 'Salburua', description: 'Colonia en el humedal de Salburua con alto control CER', latitude: 42.8430, longitude: -2.6450 },
			{ id: colony4Id, name: 'Zaramaga', status: 'monitoring', classification: 'Industrial', district: 'Zaramaga', description: 'Colonia en transición, requiere monitorización', latitude: 42.8600, longitude: -2.6750 },
			{ id: colony5Id, name: 'Lakua-Arriaga', status: 'active', classification: 'Residencial', district: 'Lakua', description: 'Colonia estable en zona Lakua-Arriaga', latitude: 42.8650, longitude: -2.6800 }
		]);

		await db.insert(feedingPoints).values([
			{ colonyId: colony1Id, latitude: 42.8470, longitude: -2.6730, notes: 'Punto principal junto al quiosco' },
			{ colonyId: colony1Id, latitude: 42.8468, longitude: -2.6725, notes: 'Punto secundario zona arbolada' },
			{ colonyId: colony2Id, latitude: 42.8512, longitude: -2.6782, notes: 'Punto de alimentación calle principal' },
			{ colonyId: colony3Id, latitude: 42.8432, longitude: -2.6452, notes: 'Punto junto al observatorio de aves' },
			{ colonyId: colony4Id, latitude: 42.8602, longitude: -2.6752, notes: 'Punto temporal en nave industrial' }
		]);

		const cat1 = crypto.randomUUID();
		const cat2 = crypto.randomUUID();
		const cat3 = crypto.randomUUID();
		const cat4 = crypto.randomUUID();
		const cat5 = crypto.randomUUID();
		const cat6 = crypto.randomUUID();
		const cat7 = crypto.randomUUID();
		const cat8 = crypto.randomUUID();

		await db.insert(cats).values([
			{ id: cat1, name: 'Luna', colonyId: colony1Id, sex: 'female', sterilized: true, sterilizationDate: '2024-03-15', microchip: '941000024681234', status: 'in_colony', estimatedAge: '3 años' },
			{ id: cat2, name: 'Tigre', colonyId: colony1Id, sex: 'male', sterilized: true, sterilizationDate: '2024-05-20', microchip: '941000024681235', status: 'in_colony', estimatedAge: '5 años' },
			{ id: cat3, name: 'Misi', colonyId: colony2Id, sex: 'female', sterilized: true, sterilizationDate: '2023-11-10', microchip: '941000024681236', status: 'in_colony', estimatedAge: '2 años' },
			{ id: cat4, name: 'Negro', colonyId: colony2Id, sex: 'male', sterilized: false, microchip: null, status: 'in_colony', estimatedAge: '1 año' },
			{ id: cat5, name: 'Canela', colonyId: colony3Id, sex: 'female', sterilized: true, sterilizationDate: '2025-01-08', microchip: '941000024681238', status: 'in_colony', estimatedAge: '4 años' },
			{ id: cat6, name: 'Blanca', colonyId: colony3Id, sex: 'female', sterilized: true, sterilizationDate: '2024-09-22', microchip: '941000024681239', status: 'adopted', estimatedAge: '2 años' },
			{ id: cat7, name: 'Garfield', colonyId: colony4Id, sex: 'male', sterilized: true, sterilizationDate: '2025-06-15', microchip: '941000024681240', status: 'in_colony', estimatedAge: '6 años' },
			{ id: cat8, name: 'Sombra', colonyId: colony5Id, sex: 'male', sterilized: false, microchip: null, status: 'in_colony', estimatedAge: '1 año' }
		]);

		await db.insert(healthRecords).values([
			{ catId: cat1, type: 'vaccination', performedAt: new Date('2024-03-15'), vetName: 'Dr. Arteaga', vetClinic: 'Clínica Veterinaria Gasteiz', notes: 'Vacunación trivalente' },
			{ catId: cat1, type: 'sterilization', performedAt: new Date('2024-03-15'), vetName: 'Dr. Arteaga', vetClinic: 'Clínica Veterinaria Gasteiz', notes: 'Esterilización sin complicaciones' },
			{ catId: cat2, type: 'vaccination', performedAt: new Date('2024-05-20'), vetName: 'Dra. Fernández', vetClinic: 'Centro Veterinario Álava', notes: 'Vacunación completa' },
			{ catId: cat2, type: 'treatment', performedAt: new Date('2025-02-10'), vetName: 'Dr. Arteaga', vetClinic: 'Clínica Veterinaria Gasteiz', notes: 'Tratamiento antiparasitario' },
			{ catId: cat5, type: 'checkup', performedAt: new Date('2025-06-01'), vetName: 'Dr. Arteaga', vetClinic: 'Clínica Veterinaria Gasteiz', notes: 'Revisión general - buen estado' }
		]);

		await db.insert(cerActions).values([
			{ catId: cat1, colonyId: colony1Id, capturedAt: new Date('2024-03-14'), sterilizedAt: new Date('2024-03-15'), returnedAt: new Date('2024-03-17'), collaboratorName: 'Ana García', notes: 'CER completado sin incidencias' },
			{ catId: cat2, colonyId: colony1Id, capturedAt: new Date('2024-05-19'), sterilizedAt: new Date('2024-05-20'), returnedAt: new Date('2024-05-22'), collaboratorName: 'Ana García', notes: 'CER completado, macho adulto' },
			{ catId: cat5, colonyId: colony3Id, capturedAt: new Date('2025-01-07'), sterilizedAt: new Date('2025-01-08'), returnedAt: new Date('2025-01-10'), collaboratorName: 'Pedro Martínez', notes: 'CER completado en Salburua' },
			{ catId: cat7, colonyId: colony4Id, capturedAt: new Date('2025-06-14'), sterilizedAt: new Date('2025-06-15'), returnedAt: new Date('2025-06-17'), collaboratorName: 'Laura Sánchez', notes: 'CER en zona Zaramaga' }
		]);

		await db.insert(incidents).values([
			{ colonyId: colony1Id, catId: cat1, category: 'health', priority: 'high', status: 'open', description: 'Gata Luna presenta cojera en pata trasera derecha', latitude: 42.8469, longitude: -2.6727, reportedBy: adminId },
			{ colonyId: colony4Id, category: 'environmental', priority: 'medium', status: 'in_progress', description: 'Punto de alimentación dañado por obras', latitude: 42.8600, longitude: -2.6750, reportedBy: tecnicoId },
			{ colonyId: colony3Id, category: 'complaint', priority: 'low', status: 'resolved', description: 'Queja vecinal sobre ruidos nocturnos - se ha mediado con vecinos', latitude: 42.8430, longitude: -2.6450, reportedBy: adminId }
		]);

		await db.insert(collaborators).values([
			{ name: 'Ana García Martínez', documentId: '12345678A', status: 'active', validUntil: '2027-01-31', assignedColonies: [colony1Id, colony2Id], privacyNoticeSigned: true },
			{ name: 'Pedro Martínez López', documentId: '23456789B', status: 'active', validUntil: '2027-01-31', assignedColonies: [colony3Id], privacyNoticeSigned: true },
			{ name: 'Laura Sánchez Ruiz', documentId: '34567890C', status: 'active', validUntil: '2026-12-31', assignedColonies: [colony4Id, colony5Id], privacyNoticeSigned: true },
			{ name: 'Joseba Etxeberria', documentId: '45678901D', status: 'pending', assignedColonies: [], privacyNoticeSigned: false }
		]);

		await db.insert(adoptions).values([
			{
				catId: cat6,
				adopterInfo: { name: 'Elena Rodríguez', phone: '600123456', address: 'C/ Dato 15, Vitoria-Gasteiz' },
				consent: { signed: true, date: '2025-03-01' },
				status: 'completed',
				adoptedAt: new Date('2025-03-01')
			}
		]);

		await db.insert(auditLogs).values([
			{ userId: adminId, entity: 'colony', entityId: colony1Id, action: 'create', details: { name: 'Parque de la Florida' } },
			{ userId: adminId, entity: 'cat', entityId: cat1, action: 'create', details: { name: 'Luna', colony: 'Parque de la Florida' } },
			{ userId: tecnicoId, entity: 'incident', entityId: 'seed', action: 'create', details: { category: 'environmental', priority: 'medium' } },
			{ userId: adminId, entity: 'collaborator', entityId: 'seed', action: 'create', details: { name: 'Ana García Martínez' } },
			{ userId: vetId, entity: 'health_record', entityId: 'seed', action: 'create', details: { cat: 'Luna', type: 'vaccination' } }
		]);

		return json({
			success: true,
			message: 'Database seeded successfully',
			credentials: {
				admin: { email: 'admin@vitoria-gasteiz.org', password: 'Admin2026!' },
				tecnico: { email: 'tecnico@vitoria-gasteiz.org', password: 'Tecnico2026!' },
				veterinario: { email: 'vet@vitoria-gasteiz.org', password: 'Vet2026!' }
			}
		});
	} catch (error) {
		console.error('Seed error:', error);
		return json({ error: 'Seed failed', details: String(error) }, { status: 500 });
	}
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { auth } from '$lib/server/auth/index.js';
import { createLogger } from '$lib/server/logger.js';

const log = createLogger('seed');
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
	roles,
	permissions,
	rolePermissions,
	catalogs
} from '$lib/server/db/schema.js';

export const POST: RequestHandler = async ({ url }) => {
	if (process.env.NODE_ENV === 'production') {
		return json({ error: 'Seed endpoint disabled in production' }, { status: 403 });
	}

	const secret = url.searchParams.get('key');
	if (secret !== 'seed-2026-vg') {
		return json({ error: 'No autorizado' }, { status: 401 });
	}

	try {
		// ─── 1. Roles ────────────────────────────────────────────────
		const roleDefs = [
			{ name: 'admin', description: 'Administrador municipal - acceso total' },
			{ name: 'tecnico', description: 'Personal técnico municipal' },
			{ name: 'veterinario', description: 'Personal veterinario o sanitario autorizado' },
			{ name: 'entidad_gestora', description: 'Entidad gestora o coordinadora' },
			{ name: 'colaborador', description: 'Persona colaboradora o alimentadora autorizada' }
		];
		const insertedRoles = await db.insert(roles).values(roleDefs).onConflictDoNothing().returning();
		const allRoles = insertedRoles.length > 0 ? insertedRoles : await db.select().from(roles);
		const roleMap = new Map(allRoles.map(r => [r.name, r.id]));

		// ─── 2. Permissions (module x action matrix) ─────────────────
		const modules = ['colonias', 'gatos', 'salud', 'cer', 'incidencias', 'inspecciones', 'colaboradores', 'adopciones', 'mensajes', 'informes', 'admin'];
		const actions = ['view', 'create', 'edit', 'validate', 'close', 'export', 'admin', 'access_personal_data', 'access_health_data', 'access_geo_sensitive'];

		const permValues = modules.flatMap(m => actions.map(a => ({ module: m, action: a })));
		await db.insert(permissions).values(permValues).onConflictDoNothing();
		const allPerms = await db.select().from(permissions);

		// ─── 3. Assign full permissions to admin ─────────────────────
		const adminRoleId = roleMap.get('admin');
		const tecnicoRoleId = roleMap.get('tecnico');
		const vetRoleId = roleMap.get('veterinario');
		const gestorRoleId = roleMap.get('entidad_gestora');
		const colabRoleId = roleMap.get('colaborador');

		if (!adminRoleId || !tecnicoRoleId || !vetRoleId || !gestorRoleId || !colabRoleId) {
			return json({ error: 'Failed to resolve role IDs' }, { status: 500 });
		}

		const rpValues = allPerms.map(p => ({ roleId: adminRoleId, permissionId: p.id }));
		await db.insert(rolePermissions).values(rpValues).onConflictDoNothing();

		const tecnicoPerms = allPerms.filter(p =>
			p.module !== 'admin' && ['view', 'create', 'edit', 'validate', 'close', 'export', 'access_personal_data', 'access_health_data', 'access_geo_sensitive'].includes(p.action)
		);
		await db.insert(rolePermissions).values(tecnicoPerms.map(p => ({ roleId: tecnicoRoleId, permissionId: p.id }))).onConflictDoNothing();

		const vetPerms = allPerms.filter(p =>
			['salud', 'gatos', 'cer'].includes(p.module) && ['view', 'create', 'edit', 'access_health_data'].includes(p.action)
		);
		await db.insert(rolePermissions).values(vetPerms.map(p => ({ roleId: vetRoleId, permissionId: p.id }))).onConflictDoNothing();

		const gestorPerms = allPerms.filter(p =>
			p.module !== 'admin' && ['view', 'create', 'edit', 'export'].includes(p.action)
		);
		await db.insert(rolePermissions).values(gestorPerms.map(p => ({ roleId: gestorRoleId, permissionId: p.id }))).onConflictDoNothing();
		const colabPerms = allPerms.filter(p =>
			(p.module === 'colonias' && p.action === 'view') ||
			(p.module === 'gatos' && p.action === 'view') ||
			(p.module === 'incidencias' && ['view', 'create'].includes(p.action)) ||
			(p.module === 'mensajes' && ['view', 'create'].includes(p.action))
		);
		await db.insert(rolePermissions).values(colabPerms.map(p => ({ roleId: colabRoleId, permissionId: p.id }))).onConflictDoNothing();

		// ─── 4. Users ────────────────────────────────────────────────
		const adminRes = await auth.api.signUpEmail({ body: { name: 'Admin VG', email: 'admin@vitoria-gasteiz.org', password: 'Admin2026!' } });
		const tecnicoRes = await auth.api.signUpEmail({ body: { name: 'María López', email: 'tecnico@vitoria-gasteiz.org', password: 'Tecnico2026!' } });
		const vetRes = await auth.api.signUpEmail({ body: { name: 'Dr. Iñaki Arteaga', email: 'vet@vitoria-gasteiz.org', password: 'Vet2026!' } });
		const gestorRes = await auth.api.signUpEmail({ body: { name: 'Asociación Gatalde', email: 'gestor@vitoria-gasteiz.org', password: 'Gestor2026!' } });
		const colabRes = await auth.api.signUpEmail({ body: { name: 'Ana García', email: 'colaborador@vitoria-gasteiz.org', password: 'Colab2026!' } });

		const adminId = adminRes.user?.id;
		const tecnicoId = tecnicoRes.user?.id;
		const vetId = vetRes.user?.id;
		const gestorId = gestorRes.user?.id;
		const colabId = colabRes.user?.id;

		if (!adminId || !tecnicoId || !vetId) {
			return json({ error: 'Failed to create core users' }, { status: 500 });
		}

		await db.insert(userRoles).values([
			{ userId: adminId, roleId: adminRoleId },
			{ userId: tecnicoId, roleId: tecnicoRoleId },
			{ userId: vetId, roleId: vetRoleId },
			...(gestorId ? [{ userId: gestorId, roleId: gestorRoleId }] : []),
			...(colabId ? [{ userId: colabId, roleId: colabRoleId }] : [])
		]).onConflictDoNothing();

		// ─── 5. Catalogs ─────────────────────────────────────────────
		const catalogData = [
			{ type: 'colony_status', key: 'active', label: 'Activa', labelEu: 'Aktiboa', sortOrder: 1 },
			{ type: 'colony_status', key: 'monitoring', label: 'En seguimiento', labelEu: 'Jarraipenean', sortOrder: 2 },
			{ type: 'colony_status', key: 'inactive', label: 'Inactiva', labelEu: 'Ez-aktiboa', sortOrder: 3 },
			{ type: 'colony_status', key: 'relocating', label: 'En reubicación', labelEu: 'Birkokatzen', sortOrder: 4 },
			{ type: 'colony_classification', key: 'park', label: 'Parque urbano', labelEu: 'Hiri-parkea', sortOrder: 1 },
			{ type: 'colony_classification', key: 'residential', label: 'Zona residencial', labelEu: 'Bizitegi-gunea', sortOrder: 2 },
			{ type: 'colony_classification', key: 'industrial', label: 'Zona industrial', labelEu: 'Industria-gunea', sortOrder: 3 },
			{ type: 'colony_classification', key: 'green', label: 'Zona verde', labelEu: 'Gune berdea', sortOrder: 4 },
			{ type: 'cat_status', key: 'in_colony', label: 'En colonia', labelEu: 'Kolonian', sortOrder: 1 },
			{ type: 'cat_status', key: 'adopted', label: 'Adoptado', labelEu: 'Adoptatua', sortOrder: 2 },
			{ type: 'cat_status', key: 'transferred', label: 'Trasladado', labelEu: 'Lekualdatua', sortOrder: 3 },
			{ type: 'cat_status', key: 'deceased', label: 'Fallecido', labelEu: 'Hildakoa', sortOrder: 4 },
			{ type: 'cat_status', key: 'lost', label: 'Desaparecido', labelEu: 'Desagertua', sortOrder: 5 },
			{ type: 'incident_category', key: 'health', label: 'Sanitaria', labelEu: 'Osasuna', sortOrder: 1 },
			{ type: 'incident_category', key: 'environmental', label: 'Ambiental', labelEu: 'Ingurumena', sortOrder: 2 },
			{ type: 'incident_category', key: 'complaint', label: 'Queja vecinal', labelEu: 'Auzokoen kexa', sortOrder: 3 },
			{ type: 'incident_category', key: 'abuse', label: 'Maltrato', labelEu: 'Tratu txarra', sortOrder: 4 },
			{ type: 'incident_category', key: 'infrastructure', label: 'Infraestructura', labelEu: 'Azpiegitura', sortOrder: 5 },
			{ type: 'incident_priority', key: 'low', label: 'Baja', labelEu: 'Baxua', sortOrder: 1 },
			{ type: 'incident_priority', key: 'medium', label: 'Media', labelEu: 'Ertaina', sortOrder: 2 },
			{ type: 'incident_priority', key: 'high', label: 'Alta', labelEu: 'Altua', sortOrder: 3 },
			{ type: 'incident_priority', key: 'critical', label: 'Crítica', labelEu: 'Kritikoa', sortOrder: 4 },
			{ type: 'health_type', key: 'sterilization', label: 'Esterilización', labelEu: 'Esterilizazioa', sortOrder: 1 },
			{ type: 'health_type', key: 'vaccination', label: 'Vacunación', labelEu: 'Txertaketa', sortOrder: 2 },
			{ type: 'health_type', key: 'deworming', label: 'Desparasitación', labelEu: 'Desparasitazioa', sortOrder: 3 },
			{ type: 'health_type', key: 'microchip', label: 'Microchip', labelEu: 'Mikrotxipa', sortOrder: 4 },
			{ type: 'health_type', key: 'checkup', label: 'Revisión', labelEu: 'Azterketa', sortOrder: 5 },
			{ type: 'health_type', key: 'surgery', label: 'Cirugía', labelEu: 'Kirurgia', sortOrder: 6 },
			{ type: 'health_type', key: 'treatment', label: 'Tratamiento', labelEu: 'Tratamendua', sortOrder: 7 },
			{ type: 'adoption_status', key: 'available', label: 'Disponible', labelEu: 'Eskuragarria', sortOrder: 1 },
			{ type: 'adoption_status', key: 'pending', label: 'En proceso', labelEu: 'Prozesuan', sortOrder: 2 },
			{ type: 'adoption_status', key: 'completed', label: 'Completada', labelEu: 'Osatua', sortOrder: 3 },
			{ type: 'adoption_status', key: 'returned', label: 'Devuelto', labelEu: 'Itzulia', sortOrder: 4 },
			{ type: 'collaborator_status', key: 'active', label: 'Activo', labelEu: 'Aktiboa', sortOrder: 1 },
			{ type: 'collaborator_status', key: 'pending', label: 'Pendiente', labelEu: 'Zain', sortOrder: 2 },
			{ type: 'collaborator_status', key: 'inactive', label: 'Inactivo', labelEu: 'Ez-aktiboa', sortOrder: 3 },
			{ type: 'collaborator_status', key: 'suspended', label: 'Suspendido', labelEu: 'Etena', sortOrder: 4 }
		];
		await db.insert(catalogs).values(catalogData).onConflictDoNothing();

		// ─── 6. Demo Data ────────────────────────────────────────────
		const colony1Id = crypto.randomUUID();
		const colony2Id = crypto.randomUUID();
		const colony3Id = crypto.randomUUID();
		const colony4Id = crypto.randomUUID();
		const colony5Id = crypto.randomUUID();

		await db.insert(colonies).values([
			{ id: colony1Id, name: 'Parque de la Florida', status: 'active', classification: 'Parque urbano', district: 'Centro', description: 'Colonia estable en el Parque de la Florida, con alimentadores regulares', latitude: 42.8469, longitude: -2.6727 },
			{ id: colony2Id, name: 'Judimendi', status: 'active', classification: 'Residencial', district: 'Judimendi', description: 'Colonia en zona residencial, bien gestionada', latitude: 42.8510, longitude: -2.6780 },
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
			message: 'Database seeded with roles, permissions, catalogs, users and demo data',
			credentials: {
				admin: { email: 'admin@vitoria-gasteiz.org', password: 'Admin2026!', role: 'admin' },
				tecnico: { email: 'tecnico@vitoria-gasteiz.org', password: 'Tecnico2026!', role: 'tecnico' },
				veterinario: { email: 'vet@vitoria-gasteiz.org', password: 'Vet2026!', role: 'veterinario' },
				entidad_gestora: { email: 'gestor@vitoria-gasteiz.org', password: 'Gestor2026!', role: 'entidad_gestora' },
				colaborador: { email: 'colaborador@vitoria-gasteiz.org', password: 'Colab2026!', role: 'colaborador' }
			}
		});
	} catch (error) {
		log.error('Seed failed', { error: String(error) });
		return json({ error: 'Seed failed', details: String(error) }, { status: 500 });
	}
};

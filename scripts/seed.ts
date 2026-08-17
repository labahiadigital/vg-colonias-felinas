import { neon } from '@neondatabase/serverless';
import { scryptSync, randomBytes } from 'crypto';

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = neon(DATABASE_URL);

function hashPassword(password: string): string {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(password, salt, 64).toString('hex');
	return `${salt}:${hash}`;
}

async function seed() {
	console.log('Seeding database...');

	const existingUsers = await sql`SELECT id, email FROM users LIMIT 10`;
	let adminId: string, tecnicoId: string, vetId: string;

	const admin = existingUsers.find((u: { email: string }) => u.email === 'admin@vitoria-gasteiz.org');
	const tecnico = existingUsers.find((u: { email: string }) => u.email === 'tecnico@vitoria-gasteiz.org');
	const vet = existingUsers.find((u: { email: string }) => u.email === 'vet@vitoria-gasteiz.org');

	if (admin && tecnico && vet) {
		adminId = admin.id;
		tecnicoId = tecnico.id;
		vetId = vet.id;
		console.log('Using existing users');
	} else {
		adminId = crypto.randomUUID();
		tecnicoId = crypto.randomUUID();
		vetId = crypto.randomUUID();

		await sql`
			INSERT INTO users (id, name, email, email_verified, language)
			VALUES
				(${adminId}, 'Admin VG', 'admin@vitoria-gasteiz.org', true, 'es'),
				(${tecnicoId}, 'María López', 'tecnico@vitoria-gasteiz.org', true, 'es'),
				(${vetId}, 'Dr. Iñaki Arteaga', 'vet@vitoria-gasteiz.org', true, 'eu')
			ON CONFLICT (email) DO NOTHING
		`;

		const adminPasswordHash = hashPassword('Admin2026!');
		const tecnicoPasswordHash = hashPassword('Tecnico2026!');
		const vetPasswordHash = hashPassword('Vet2026!');

		await sql`
			INSERT INTO accounts (id, user_id, account_id, provider_id, password)
			VALUES
				(${crypto.randomUUID()}, ${adminId}, ${adminId}, 'credential', ${adminPasswordHash}),
				(${crypto.randomUUID()}, ${tecnicoId}, ${tecnicoId}, 'credential', ${tecnicoPasswordHash}),
				(${crypto.randomUUID()}, ${vetId}, ${vetId}, 'credential', ${vetPasswordHash})
			ON CONFLICT DO NOTHING
		`;
	}

	const roles = await sql`SELECT id, name FROM roles`;
	const adminRole = roles.find((r: { name: string }) => r.name === 'admin');
	const tecnicoRole = roles.find((r: { name: string }) => r.name === 'tecnico');
	const vetRole = roles.find((r: { name: string }) => r.name === 'veterinario');

	if (adminRole && tecnicoRole && vetRole) {
		await sql`
			INSERT INTO user_roles (user_id, role_id)
			VALUES
				(${adminId}, ${adminRole.id}),
				(${tecnicoId}, ${tecnicoRole.id}),
				(${vetId}, ${vetRole.id})
			ON CONFLICT DO NOTHING
		`;
	}

	const existingColonies = await sql`SELECT id, name FROM colonies LIMIT 10`;
	let colony1Id: string, colony2Id: string, colony3Id: string, colony4Id: string, colony5Id: string;

	if (existingColonies.length >= 5) {
		colony1Id = existingColonies[0].id;
		colony2Id = existingColonies[1].id;
		colony3Id = existingColonies[2].id;
		colony4Id = existingColonies[3].id;
		colony5Id = existingColonies[4].id;
		console.log(`Using ${existingColonies.length} existing colonies`);
	} else {
		colony1Id = crypto.randomUUID();
		colony2Id = crypto.randomUUID();
		colony3Id = crypto.randomUUID();
		colony4Id = crypto.randomUUID();
		colony5Id = crypto.randomUUID();

		await sql`
			INSERT INTO colonies (id, name, status, classification, district, description, latitude, longitude)
			VALUES
				(${colony1Id}, 'Parque de la Florida', 'active', 'Parque urbano', 'Centro', 'Colonia estable en el Parque de la Florida, con alimentadores regulares', 42.8469, -2.6727),
				(${colony2Id}, 'Judimendi', 'active', 'Residencial', 'Judimendi', 'Colonia en zona residencial de Judimendi, bien gestionada', 42.8510, -2.6780),
				(${colony3Id}, 'Salburua', 'active', 'Zona verde', 'Salburua', 'Colonia en el humedal de Salburua con alto control CER', 42.8430, -2.6450),
				(${colony4Id}, 'Zaramaga', 'monitoring', 'Industrial', 'Zaramaga', 'Colonia en transición, requiere monitorización', 42.8600, -2.6750),
				(${colony5Id}, 'Lakua-Arriaga', 'active', 'Residencial', 'Lakua', 'Colonia estable en zona Lakua-Arriaga', 42.8650, -2.6800)
			ON CONFLICT DO NOTHING
		`;
	}

	const existingFP = await sql`SELECT id FROM feeding_points LIMIT 1`;
	if (existingFP.length === 0) {
		await sql`
			INSERT INTO feeding_points (id, colony_id, latitude, longitude, notes)
			VALUES
				(${crypto.randomUUID()}, ${colony1Id}, 42.8470, -2.6730, 'Punto principal junto al quiosco'),
				(${crypto.randomUUID()}, ${colony1Id}, 42.8468, -2.6725, 'Punto secundario zona arbolada'),
				(${crypto.randomUUID()}, ${colony2Id}, 42.8512, -2.6782, 'Punto de alimentación calle principal'),
				(${crypto.randomUUID()}, ${colony3Id}, 42.8432, -2.6452, 'Punto junto al observatorio de aves'),
				(${crypto.randomUUID()}, ${colony4Id}, 42.8602, -2.6752, 'Punto temporal en nave industrial')
		`;
	}

	const existingCats = await sql`SELECT id, name FROM cats LIMIT 10`;
	let cat1: string, cat2: string, cat3: string, cat4: string, cat5: string, cat6: string, cat7: string, cat8: string;

	if (existingCats.length >= 8) {
		cat1 = existingCats[0].id;
		cat2 = existingCats[1].id;
		cat3 = existingCats[2].id;
		cat4 = existingCats[3].id;
		cat5 = existingCats[4].id;
		cat6 = existingCats[5].id;
		cat7 = existingCats[6].id;
		cat8 = existingCats[7].id;
		console.log(`Using ${existingCats.length} existing cats`);
	} else {
		cat1 = crypto.randomUUID();
		cat2 = crypto.randomUUID();
		cat3 = crypto.randomUUID();
		cat4 = crypto.randomUUID();
		cat5 = crypto.randomUUID();
		cat6 = crypto.randomUUID();
		cat7 = crypto.randomUUID();
		cat8 = crypto.randomUUID();

		await sql`
			INSERT INTO cats (id, name, colony_id, sex, sterilized, sterilization_date, microchip, status, estimated_age)
			VALUES
				(${cat1}, 'Luna', ${colony1Id}, 'female', true, '2024-03-15', '941000024681234', 'in_colony', '3 años'),
				(${cat2}, 'Tigre', ${colony1Id}, 'male', true, '2024-05-20', '941000024681235', 'in_colony', '5 años'),
				(${cat3}, 'Misi', ${colony2Id}, 'female', true, '2023-11-10', '941000024681236', 'in_colony', '2 años'),
				(${cat4}, 'Negro', ${colony2Id}, 'male', false, null, null, 'in_colony', '1 año'),
				(${cat5}, 'Canela', ${colony3Id}, 'female', true, '2025-01-08', '941000024681238', 'in_colony', '4 años'),
				(${cat6}, 'Blanca', ${colony3Id}, 'female', true, '2024-09-22', '941000024681239', 'adopted', '2 años'),
				(${cat7}, 'Garfield', ${colony4Id}, 'male', true, '2025-06-15', '941000024681240', 'in_colony', '6 años'),
				(${cat8}, 'Sombra', ${colony5Id}, 'male', false, null, null, 'in_colony', '1 año')
		`;
	}

	const existingHR = await sql`SELECT id FROM health_records LIMIT 1`;
	if (existingHR.length === 0) {
		await sql`
			INSERT INTO health_records (id, cat_id, type, performed_at, vet_name, vet_clinic, notes)
			VALUES
				(${crypto.randomUUID()}, ${cat1}, 'vaccination', '2024-03-15', 'Dr. Arteaga', 'Clínica Veterinaria Gasteiz', 'Vacunación trivalente'),
				(${crypto.randomUUID()}, ${cat1}, 'sterilization', '2024-03-15', 'Dr. Arteaga', 'Clínica Veterinaria Gasteiz', 'Esterilización sin complicaciones'),
				(${crypto.randomUUID()}, ${cat2}, 'vaccination', '2024-05-20', 'Dra. Fernández', 'Centro Veterinario Álava', 'Vacunación completa'),
				(${crypto.randomUUID()}, ${cat2}, 'treatment', '2025-02-10', 'Dr. Arteaga', 'Clínica Veterinaria Gasteiz', 'Tratamiento antiparasitario'),
				(${crypto.randomUUID()}, ${cat5}, 'checkup', '2025-06-01', 'Dr. Arteaga', 'Clínica Veterinaria Gasteiz', 'Revisión general - buen estado')
		`;
	}

	const existingCER = await sql`SELECT id FROM cer_actions LIMIT 1`;
	if (existingCER.length === 0) {
		await sql`
			INSERT INTO cer_actions (id, cat_id, colony_id, captured_at, sterilized_at, returned_at, collaborator_name, notes)
			VALUES
				(${crypto.randomUUID()}, ${cat1}, ${colony1Id}, '2024-03-14', '2024-03-15', '2024-03-17', 'Ana García', 'CER completado sin incidencias'),
				(${crypto.randomUUID()}, ${cat2}, ${colony1Id}, '2024-05-19', '2024-05-20', '2024-05-22', 'Ana García', 'CER completado, macho adulto'),
				(${crypto.randomUUID()}, ${cat5}, ${colony3Id}, '2025-01-07', '2025-01-08', '2025-01-10', 'Pedro Martínez', 'CER completado en Salburua'),
				(${crypto.randomUUID()}, ${cat7}, ${colony4Id}, '2025-06-14', '2025-06-15', '2025-06-17', 'Laura Sánchez', 'CER en zona Zaramaga')
		`;
	}

	const existingInc = await sql`SELECT id FROM incidents LIMIT 1`;
	let inc1: string, inc2: string, inc3: string;

	if (existingInc.length > 0) {
		inc1 = existingInc[0].id;
		inc2 = existingInc.length > 1 ? existingInc[1].id : existingInc[0].id;
		inc3 = existingInc.length > 2 ? existingInc[2].id : existingInc[0].id;
		console.log('Using existing incidents');
	} else {
		inc1 = crypto.randomUUID();
		inc2 = crypto.randomUUID();
		inc3 = crypto.randomUUID();

		await sql`
			INSERT INTO incidents (id, colony_id, cat_id, category, priority, status, description, latitude, longitude, reported_by)
			VALUES
				(${inc1}, ${colony1Id}, ${cat1}, 'health', 'high', 'open', 'Gata Luna presenta cojera en pata trasera derecha', 42.8469, -2.6727, ${adminId}),
				(${inc2}, ${colony4Id}, null, 'environmental', 'medium', 'in_progress', 'Punto de alimentación dañado por obras', 42.8600, -2.6750, ${tecnicoId}),
				(${inc3}, ${colony3Id}, null, 'complaint', 'low', 'resolved', 'Queja vecinal sobre ruidos nocturnos - se ha mediado con vecinos', 42.8430, -2.6450, ${adminId})
		`;
	}

	const existingCollab = await sql`SELECT id FROM collaborators LIMIT 1`;
	if (existingCollab.length === 0) {
		await sql`
			INSERT INTO collaborators (id, user_id, name, document_id, status, valid_until, assigned_colonies, privacy_notice_signed)
			VALUES
				(${crypto.randomUUID()}, null, 'Ana García Martínez', '12345678A', 'active', '2027-01-31', ${JSON.stringify([colony1Id, colony2Id])}, true),
				(${crypto.randomUUID()}, null, 'Pedro Martínez López', '23456789B', 'active', '2027-01-31', ${JSON.stringify([colony3Id])}, true),
				(${crypto.randomUUID()}, null, 'Laura Sánchez Ruiz', '34567890C', 'active', '2026-12-31', ${JSON.stringify([colony4Id, colony5Id])}, true),
				(${crypto.randomUUID()}, null, 'Joseba Etxeberria', '45678901D', 'pending', null, ${JSON.stringify([])}, false)
		`;
	}

	const existingAdopt = await sql`SELECT id FROM adoptions LIMIT 1`;
	if (existingAdopt.length === 0) {
		await sql`
			INSERT INTO adoptions (id, cat_id, adopter_info, consent, status, adopted_at)
			VALUES
				(${crypto.randomUUID()}, ${cat6}, ${JSON.stringify({ name: 'Elena Rodríguez', phone: '600123456', address: 'C/ Dato 15, Vitoria-Gasteiz' })}, ${JSON.stringify({ signed: true, date: '2025-03-01' })}, 'completed', '2025-03-01')
		`;
	}

	const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

	const existingVisits = await sql`SELECT id FROM visits LIMIT 1`;
	if (existingVisits.length === 0) {
		await sql`
			INSERT INTO visits (id, colony_id, user_id, type, duration_minutes, cats_observed, notes, food_provided, water_provided, incident_detected, visited_at)
			VALUES
				(${crypto.randomUUID()}, ${colony1Id}, ${adminId}, 'feeding', 45, 6, 'Alimentación rutinaria, todos los gatos presentes', true, true, false, ${daysAgo(1)}),
				(${crypto.randomUUID()}, ${colony1Id}, ${tecnicoId}, 'health_check', 60, 5, 'Control sanitario mensual, un gato con conjuntivitis leve', true, true, true, ${daysAgo(3)}),
				(${crypto.randomUUID()}, ${colony2Id}, ${adminId}, 'feeding', 30, 4, 'Alimentación sin novedad', true, true, false, ${daysAgo(2)}),
				(${crypto.randomUUID()}, ${colony2Id}, ${tecnicoId}, 'census', 90, 7, 'Censo trimestral - detectados 2 gatos nuevos', false, false, false, ${daysAgo(7)}),
				(${crypto.randomUUID()}, ${colony3Id}, ${vetId}, 'health_check', 120, 8, 'Revisión veterinaria completa de la colonia', true, true, false, ${daysAgo(5)}),
				(${crypto.randomUUID()}, ${colony3Id}, ${adminId}, 'cleaning', 45, 3, 'Limpieza de zona de alimentación', false, false, false, ${daysAgo(10)}),
				(${crypto.randomUUID()}, ${colony4Id}, ${tecnicoId}, 'monitoring', 60, 4, 'Monitorización de la zona en obras', false, false, true, ${daysAgo(4)}),
				(${crypto.randomUUID()}, ${colony5Id}, ${adminId}, 'feeding', 35, 5, 'Alimentación regular', true, true, false, ${daysAgo(1)}),
				(${crypto.randomUUID()}, ${colony1Id}, ${adminId}, 'feeding', 40, 7, 'Alimentación con nuevo pienso hipoalergénico', true, true, false, ${daysAgo(14)}),
				(${crypto.randomUUID()}, ${colony3Id}, ${tecnicoId}, 'capture', 180, 2, 'Captura de 2 gatos para esterilización CER', false, false, false, ${daysAgo(20)})
		`;
	}

	const existingVH = await sql`SELECT id FROM volunteer_hours LIMIT 1`;
	if (existingVH.length === 0) {
		await sql`
			INSERT INTO volunteer_hours (id, user_id, colony_id, hours, activity_type, date)
			VALUES
				(${crypto.randomUUID()}, ${adminId}, ${colony1Id}, 0.75, 'feeding', ${daysAgo(1).split('T')[0]}),
				(${crypto.randomUUID()}, ${tecnicoId}, ${colony1Id}, 1.0, 'health_check', ${daysAgo(3).split('T')[0]}),
				(${crypto.randomUUID()}, ${adminId}, ${colony2Id}, 0.5, 'feeding', ${daysAgo(2).split('T')[0]}),
				(${crypto.randomUUID()}, ${tecnicoId}, ${colony2Id}, 1.5, 'census', ${daysAgo(7).split('T')[0]}),
				(${crypto.randomUUID()}, ${vetId}, ${colony3Id}, 2.0, 'health_check', ${daysAgo(5).split('T')[0]}),
				(${crypto.randomUUID()}, ${adminId}, ${colony3Id}, 0.75, 'cleaning', ${daysAgo(10).split('T')[0]})
		`;
	}

	const existingProv = await sql`SELECT id, name FROM providers LIMIT 3`;
	let prov1: string, prov2: string, prov3: string;

	if (existingProv.length >= 3) {
		prov1 = existingProv[0].id;
		prov2 = existingProv[1].id;
		prov3 = existingProv[2].id;
		console.log('Using existing providers');
	} else {
		prov1 = crypto.randomUUID();
		prov2 = crypto.randomUUID();
		prov3 = crypto.randomUUID();

		await sql`
			INSERT INTO providers (id, name, type, contact_person, email, phone, address, city, license_number, status, contract_start, contract_end)
			VALUES
				(${prov1}, 'Clínica Veterinaria Gasteiz', 'veterinary', 'Dr. Iñaki Arteaga', 'clinica@vetgasteiz.com', '945 123 456', 'C/ Postas 12', 'Vitoria-Gasteiz', 'VET-01-2024', 'active', '2024-01-01', '2026-12-31'),
				(${prov2}, 'Centro Veterinario Álava', 'veterinary', 'Dra. Elena Fernández', 'info@vetalava.com', '945 234 567', 'C/ Dato 8', 'Vitoria-Gasteiz', 'VET-02-2024', 'active', '2024-03-01', '2027-02-28'),
				(${prov3}, 'PetFood Distribuciones', 'supplier', 'Carlos Ruiz', 'pedidos@petfood.es', '945 345 678', 'Pol. Ind. Jundiz, Nave 14', 'Vitoria-Gasteiz', null, 'active', '2025-01-01', '2025-12-31')
		`;
	}

	const existingPI = await sql`SELECT id FROM provider_interventions LIMIT 1`;
	if (existingPI.length === 0) {
		await sql`
			INSERT INTO provider_interventions (id, provider_id, cat_id, colony_id, type, description, cost, performed_at, invoice_ref)
			VALUES
				(${crypto.randomUUID()}, ${prov1}, ${cat1}, ${colony1Id}, 'sterilization', 'Esterilización felina - hembra', 120.00, ${daysAgo(90)}, 'FAC-2024-0045'),
				(${crypto.randomUUID()}, ${prov1}, ${cat2}, ${colony1Id}, 'vaccination', 'Vacunación trivalente', 35.00, ${daysAgo(85)}, 'FAC-2024-0046'),
				(${crypto.randomUUID()}, ${prov2}, ${cat5}, ${colony3Id}, 'sterilization', 'Esterilización felina - hembra', 115.00, ${daysAgo(60)}, 'CVA-2025-012'),
				(${crypto.randomUUID()}, ${prov2}, ${cat7}, ${colony4Id}, 'checkup', 'Revisión general post-CER', 45.00, ${daysAgo(30)}, 'CVA-2025-018'),
				(${crypto.randomUUID()}, ${prov1}, ${cat3}, ${colony2Id}, 'deworming', 'Desparasitación interna y externa', 25.00, ${daysAgo(15)}, 'FAC-2025-0078'),
				(${crypto.randomUUID()}, ${prov3}, null, ${colony1Id}, 'food_supply', 'Pienso hipoalergénico 20kg', 42.50, ${daysAgo(14)}, 'PF-2025-0234'),
				(${crypto.randomUUID()}, ${prov3}, null, ${colony3Id}, 'food_supply', 'Pienso estándar adulto 25kg', 38.00, ${daysAgo(14)}, 'PF-2025-0235')
		`;
	}

	const existingInsp = await sql`SELECT id FROM inspections LIMIT 1`;
	if (existingInsp.length === 0) {
		await sql`
			INSERT INTO inspections (id, colony_id, inspector_id, notes, score, passed, follow_up_required, follow_up_date, results)
			VALUES
				(${crypto.randomUUID()}, ${colony1Id}, ${adminId}, 'Inspección rutinaria - colonia en buen estado general', 85, true, false, null, ${JSON.stringify({ estado_general: 'Bueno', agua_disponible: 'Sí', comida_disponible: 'Sí', refugios: 'Sí', gatos_vistos: 6, limpieza: 'Buena' })}),
				(${crypto.randomUUID()}, ${colony2Id}, ${tecnicoId}, 'Zona limpia, gatos en buen estado. Se detectan 2 nuevos.', 78, true, false, null, ${JSON.stringify({ estado_general: 'Bueno', agua_disponible: 'Sí', comida_disponible: 'Sí', refugios: 'Parcial', gatos_vistos: 7, limpieza: 'Aceptable' })}),
				(${crypto.randomUUID()}, ${colony3Id}, ${vetId}, 'Humedal de Salburua - excelente hábitat natural', 92, true, false, null, ${JSON.stringify({ estado_general: 'Bueno', agua_disponible: 'Sí', comida_disponible: 'Sí', refugios: 'Sí', gatos_vistos: 8, limpieza: 'Buena' })}),
				(${crypto.randomUUID()}, ${colony4Id}, ${tecnicoId}, 'Zona afectada por obras. Refugios dañados.', 45, false, true, ${daysAgo(-30).split('T')[0]}, ${JSON.stringify({ estado_general: 'Malo', agua_disponible: 'No', comida_disponible: 'Sí', refugios: 'No', gatos_vistos: 4, limpieza: 'Mala' })}),
				(${crypto.randomUUID()}, ${colony5Id}, ${adminId}, 'Inspección inicial Lakua-Arriaga', 70, true, false, null, ${JSON.stringify({ estado_general: 'Aceptable', agua_disponible: 'Sí', comida_disponible: 'Sí', refugios: 'Parcial', gatos_vistos: 5, limpieza: 'Aceptable' })})
		`;
	}

	const existingAudit = await sql`SELECT id FROM audit_logs WHERE entity_id = 'seed' LIMIT 1`;
	if (existingAudit.length === 0) {
		await sql`
			INSERT INTO audit_logs (id, user_id, entity, entity_id, action, details)
			VALUES
				(${crypto.randomUUID()}, ${adminId}, 'colony', ${colony1Id}, 'create', ${JSON.stringify({ name: 'Parque de la Florida' })}),
				(${crypto.randomUUID()}, ${adminId}, 'cat', ${cat1}, 'create', ${JSON.stringify({ name: 'Luna', colony: 'Parque de la Florida' })}),
				(${crypto.randomUUID()}, ${tecnicoId}, 'incident', ${inc2}, 'create', ${JSON.stringify({ category: 'environmental', priority: 'medium' })}),
				(${crypto.randomUUID()}, ${adminId}, 'collaborator', 'seed', 'create', ${JSON.stringify({ name: 'Ana García Martínez' })}),
				(${crypto.randomUUID()}, ${vetId}, 'health_record', 'seed', 'create', ${JSON.stringify({ cat: 'Luna', type: 'vaccination' })}),
				(${crypto.randomUUID()}, ${adminId}, 'visit', 'seed', 'create', ${JSON.stringify({ colonyId: colony1Id, type: 'feeding' })}),
				(${crypto.randomUUID()}, ${tecnicoId}, 'inspection', 'seed', 'create', ${JSON.stringify({ colonyId: colony2Id })}),
				(${crypto.randomUUID()}, ${adminId}, 'provider', ${prov1}, 'create', ${JSON.stringify({ name: 'Clínica Veterinaria Gasteiz', type: 'veterinary' })})
		`;
	}

	console.log('Seed completed successfully!');
	console.log('\n--- Login Credentials ---');
	console.log('Admin: admin@vitoria-gasteiz.org / Admin2026!');
	console.log('Técnico: tecnico@vitoria-gasteiz.org / Tecnico2026!');
	console.log('Veterinario: vet@vitoria-gasteiz.org / Vet2026!');
}

seed().catch(console.error);

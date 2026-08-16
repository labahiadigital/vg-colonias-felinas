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

	const adminId = crypto.randomUUID();
	const tecnicoId = crypto.randomUUID();
	const vetId = crypto.randomUUID();

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

	const colony1Id = crypto.randomUUID();
	const colony2Id = crypto.randomUUID();
	const colony3Id = crypto.randomUUID();
	const colony4Id = crypto.randomUUID();
	const colony5Id = crypto.randomUUID();

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

	await sql`
		INSERT INTO feeding_points (id, colony_id, latitude, longitude, notes)
		VALUES
			(${crypto.randomUUID()}, ${colony1Id}, 42.8470, -2.6730, 'Punto principal junto al quiosco'),
			(${crypto.randomUUID()}, ${colony1Id}, 42.8468, -2.6725, 'Punto secundario zona arbolada'),
			(${crypto.randomUUID()}, ${colony2Id}, 42.8512, -2.6782, 'Punto de alimentación calle principal'),
			(${crypto.randomUUID()}, ${colony3Id}, 42.8432, -2.6452, 'Punto junto al observatorio de aves'),
			(${crypto.randomUUID()}, ${colony4Id}, 42.8602, -2.6752, 'Punto temporal en nave industrial')
	`;

	const cat1 = crypto.randomUUID();
	const cat2 = crypto.randomUUID();
	const cat3 = crypto.randomUUID();
	const cat4 = crypto.randomUUID();
	const cat5 = crypto.randomUUID();
	const cat6 = crypto.randomUUID();
	const cat7 = crypto.randomUUID();
	const cat8 = crypto.randomUUID();

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

	await sql`
		INSERT INTO health_records (id, cat_id, type, performed_at, vet_name, vet_clinic, notes)
		VALUES
			(${crypto.randomUUID()}, ${cat1}, 'vaccination', '2024-03-15', 'Dr. Arteaga', 'Clínica Veterinaria Gasteiz', 'Vacunación trivalente'),
			(${crypto.randomUUID()}, ${cat1}, 'sterilization', '2024-03-15', 'Dr. Arteaga', 'Clínica Veterinaria Gasteiz', 'Esterilización sin complicaciones'),
			(${crypto.randomUUID()}, ${cat2}, 'vaccination', '2024-05-20', 'Dra. Fernández', 'Centro Veterinario Álava', 'Vacunación completa'),
			(${crypto.randomUUID()}, ${cat2}, 'treatment', '2025-02-10', 'Dr. Arteaga', 'Clínica Veterinaria Gasteiz', 'Tratamiento antiparasitario'),
			(${crypto.randomUUID()}, ${cat5}, 'checkup', '2025-06-01', 'Dr. Arteaga', 'Clínica Veterinaria Gasteiz', 'Revisión general - buen estado')
	`;

	await sql`
		INSERT INTO cer_actions (id, cat_id, colony_id, captured_at, sterilized_at, returned_at, collaborator_name, notes)
		VALUES
			(${crypto.randomUUID()}, ${cat1}, ${colony1Id}, '2024-03-14', '2024-03-15', '2024-03-17', 'Ana García', 'CER completado sin incidencias'),
			(${crypto.randomUUID()}, ${cat2}, ${colony1Id}, '2024-05-19', '2024-05-20', '2024-05-22', 'Ana García', 'CER completado, macho adulto'),
			(${crypto.randomUUID()}, ${cat5}, ${colony3Id}, '2025-01-07', '2025-01-08', '2025-01-10', 'Pedro Martínez', 'CER completado en Salburua'),
			(${crypto.randomUUID()}, ${cat7}, ${colony4Id}, '2025-06-14', '2025-06-15', '2025-06-17', 'Laura Sánchez', 'CER en zona Zaramaga')
	`;

	const inc1 = crypto.randomUUID();
	const inc2 = crypto.randomUUID();
	const inc3 = crypto.randomUUID();

	await sql`
		INSERT INTO incidents (id, colony_id, cat_id, category, priority, status, description, latitude, longitude, reported_by)
		VALUES
			(${inc1}, ${colony1Id}, ${cat1}, 'health', 'high', 'open', 'Gata Luna presenta cojera en pata trasera derecha', 42.8469, -2.6727, ${adminId}),
			(${inc2}, ${colony4Id}, null, 'environmental', 'medium', 'in_progress', 'Punto de alimentación dañado por obras', 42.8600, -2.6750, ${tecnicoId}),
			(${inc3}, ${colony3Id}, null, 'complaint', 'low', 'resolved', 'Queja vecinal sobre ruidos nocturnos - se ha mediado con vecinos', 42.8430, -2.6450, ${adminId})
	`;

	await sql`
		INSERT INTO collaborators (id, user_id, name, document_id, status, valid_until, assigned_colonies, privacy_notice_signed)
		VALUES
			(${crypto.randomUUID()}, null, 'Ana García Martínez', '12345678A', 'active', '2027-01-31', ${JSON.stringify([colony1Id, colony2Id])}, true),
			(${crypto.randomUUID()}, null, 'Pedro Martínez López', '23456789B', 'active', '2027-01-31', ${JSON.stringify([colony3Id])}, true),
			(${crypto.randomUUID()}, null, 'Laura Sánchez Ruiz', '34567890C', 'active', '2026-12-31', ${JSON.stringify([colony4Id, colony5Id])}, true),
			(${crypto.randomUUID()}, null, 'Joseba Etxeberria', '45678901D', 'pending', null, ${JSON.stringify([])}, false)
	`;

	await sql`
		INSERT INTO adoptions (id, cat_id, adopter_info, consent, status, adopted_at)
		VALUES
			(${crypto.randomUUID()}, ${cat6}, ${JSON.stringify({ name: 'Elena Rodríguez', phone: '600123456', address: 'C/ Dato 15, Vitoria-Gasteiz' })}, ${JSON.stringify({ signed: true, date: '2025-03-01' })}, 'completed', '2025-03-01')
	`;

	await sql`
		INSERT INTO audit_logs (id, user_id, entity, entity_id, action, details)
		VALUES
			(${crypto.randomUUID()}, ${adminId}, 'colony', ${colony1Id}, 'create', ${JSON.stringify({ name: 'Parque de la Florida' })}),
			(${crypto.randomUUID()}, ${adminId}, 'cat', ${cat1}, 'create', ${JSON.stringify({ name: 'Luna', colony: 'Parque de la Florida' })}),
			(${crypto.randomUUID()}, ${tecnicoId}, 'incident', ${inc2}, 'create', ${JSON.stringify({ category: 'environmental', priority: 'medium' })}),
			(${crypto.randomUUID()}, ${adminId}, 'collaborator', 'seed', 'create', ${JSON.stringify({ name: 'Ana García Martínez' })}),
			(${crypto.randomUUID()}, ${vetId}, 'health_record', 'seed', 'create', ${JSON.stringify({ cat: 'Luna', type: 'vaccination' })})
	`;

	console.log('Seed completed successfully!');
	console.log('\n--- Login Credentials ---');
	console.log('Admin: admin@vitoria-gasteiz.org / Admin2026!');
	console.log('Técnico: tecnico@vitoria-gasteiz.org / Tecnico2026!');
	console.log('Veterinario: vet@vitoria-gasteiz.org / Vet2026!');
}

seed().catch(console.error);

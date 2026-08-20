import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = neon(DATABASE_URL);

const TEST_EMAIL = 'test@gatopolis.app';
const TEST_PASSWORD = 'Gatopolis2026!';
const TEST_NAME = 'Admin Test';

async function createTestUser() {
	console.log('Creating test user via Better Auth signUp API...');
	console.log('Starting dev server first is required.\n');

	const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:5173';

	try {
		const signUpRes = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: TEST_NAME,
				email: TEST_EMAIL,
				password: TEST_PASSWORD
			})
		});

		if (!signUpRes.ok) {
			const text = await signUpRes.text();
			if (text.includes('already') || text.includes('exists')) {
				console.log('User already exists, proceeding...');
			} else {
				console.error('SignUp failed:', signUpRes.status, text);
				console.log('\nFallback: creating user directly in DB with Better Auth compatible hash...');
				await createUserDirectly();
				return;
			}
		} else {
			console.log('User created successfully via Better Auth API');
		}
	} catch (e) {
		console.log('Server not running. Creating user directly in DB...');
		await createUserDirectly();
	}

	await assignAdminRole();
	printCredentials();
}

async function createUserDirectly() {
	const { hashPassword } = await import('better-auth/crypto');

	const hashedPwd = await hashPassword(TEST_PASSWORD);
	const userId = crypto.randomUUID();

	const existing = await sql`SELECT id FROM users WHERE email = ${TEST_EMAIL}`;
	if (existing.length > 0) {
		console.log('User already exists in DB');
		return;
	}

	await sql`
		INSERT INTO users (id, name, email, email_verified, language)
		VALUES (${userId}, ${TEST_NAME}, ${TEST_EMAIL}, true, 'es')
		ON CONFLICT (email) DO NOTHING
	`;

	await sql`
		INSERT INTO accounts (id, user_id, account_id, provider_id, password)
		VALUES (${crypto.randomUUID()}, ${userId}, ${userId}, 'credential', ${hashedPwd})
		ON CONFLICT DO NOTHING
	`;

	console.log('User created directly in DB with Better Auth compatible password hash');
}

async function assignAdminRole() {
	const [user] = await sql`SELECT id FROM users WHERE email = ${TEST_EMAIL}`;
	if (!user) {
		console.error('User not found after creation');
		return;
	}

	const existingOrg = await sql`SELECT id FROM organizations LIMIT 1`;
	let orgId: string;

	if (existingOrg.length > 0) {
		orgId = existingOrg[0].id;
	} else {
		orgId = crypto.randomUUID();
		await sql`
			INSERT INTO organizations (id, name, slug, type, city, province, plan)
			VALUES (${orgId}, 'Gatopolis Demo', 'gatopolis-demo', 'municipality', 'Vitoria-Gasteiz', 'Álava', 'premium')
		`;
		console.log('Created demo organization');
	}

	await sql`
		UPDATE users SET active_organization_id = ${orgId} WHERE id = ${user.id}
	`;

	await sql`
		INSERT INTO organization_members (id, organization_id, user_id, role)
		VALUES (${crypto.randomUUID()}, ${orgId}, ${user.id}, 'owner')
		ON CONFLICT DO NOTHING
	`;

	const adminRole = await sql`SELECT id FROM roles WHERE name = 'admin' LIMIT 1`;
	let roleId: string;
	if (adminRole.length > 0) {
		roleId = adminRole[0].id;
	} else {
		roleId = crypto.randomUUID();
		await sql`
			INSERT INTO roles (id, name, description, organization_id)
			VALUES (${roleId}, 'admin', 'Administrador', ${orgId})
		`;
	}

	await sql`
		INSERT INTO user_roles (user_id, role_id, organization_id)
		VALUES (${user.id}, ${roleId}, ${orgId})
		ON CONFLICT DO NOTHING
	`;

	console.log('Admin role assigned');
}

function printCredentials() {
	console.log('\n═══════════════════════════════════════════');
	console.log('  CREDENCIALES DE ACCESO');
	console.log('═══════════════════════════════════════════');
	console.log(`  URL:        http://localhost:5173/login`);
	console.log(`  Email:      ${TEST_EMAIL}`);
	console.log(`  Contraseña: ${TEST_PASSWORD}`);
	console.log('═══════════════════════════════════════════\n');
}

createTestUser().catch(console.error);

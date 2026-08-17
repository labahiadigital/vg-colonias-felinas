import { randomUUID } from 'crypto';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { env } from '$env/dynamic/private';

export const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL || 'http://localhost:5173',
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			user: schema.users,
			session: schema.sessions,
			account: schema.accounts,
			verification: schema.verifications
		}
	}),
	secret: env.BETTER_AUTH_SECRET!,
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
		minPasswordLength: 8,
		maxPasswordLength: 128
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24
	},
	rateLimit: {
		window: 60,
		max: 10
	},
	advanced: {
		database: {
			generateId: () => randomUUID()
		}
	}
});

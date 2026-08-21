import { randomUUID } from 'crypto';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { twoFactor } from 'better-auth/plugins';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { loginAttempts } from '../db/schema.js';
import { env } from '$env/dynamic/private';
import { createLogger } from '../logger.js';

const log = createLogger('auth');

const PASSWORD_ROTATION_DAYS = parseInt(env.PASSWORD_ROTATION_DAYS || '90', 10);
const MAX_FAILED_ATTEMPTS = parseInt(env.MAX_FAILED_ATTEMPTS || '5', 10);
const LOCKOUT_DURATION_MINUTES = parseInt(env.LOCKOUT_DURATION_MINUTES || '30', 10);
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;

export { PASSWORD_ROTATION_DAYS, MAX_FAILED_ATTEMPTS, LOCKOUT_DURATION_MINUTES, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH };

async function logLoginAttempt(email: string, success: boolean, ipAddress?: string, userAgent?: string, failureReason?: string) {
	try {
		await db.insert(loginAttempts).values({
			email,
			ipAddress: ipAddress ?? null,
			userAgent: userAgent ?? null,
			success,
			failureReason: failureReason ?? null
		});
	} catch {
		log.error('Failed to log login attempt', { email });
	}
}

export { logLoginAttempt };

export const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL || 'http://localhost:5173',
	trustedOrigins: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178'],
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			user: schema.users,
			session: schema.sessions,
			account: schema.accounts,
			verification: schema.verifications
		}
	}),
	secret: env.BETTER_AUTH_SECRET ?? (() => { throw new Error('BETTER_AUTH_SECRET environment variable is required'); })(),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
		minPasswordLength: MIN_PASSWORD_LENGTH,
		maxPasswordLength: MAX_PASSWORD_LENGTH
	},
	plugins: [
		twoFactor({
			issuer: 'Gatopolis',
			totpOptions: {
				period: 30,
				digits: 6
			}
		})
	],
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24
	},
	rateLimit: {
		window: 60,
		max: MAX_FAILED_ATTEMPTS
	},
	advanced: {
		database: {
			generateId: () => randomUUID()
		}
	}
});

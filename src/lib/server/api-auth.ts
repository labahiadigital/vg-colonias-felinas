import { db } from '$lib/server/db/index.js';
import { apiKeys } from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { createHash } from 'crypto';

interface ApiAuthResult {
	valid: boolean;
	error?: string;
	organizationId?: string;
	remaining?: number;
}

export async function validateApiKey(request: Request, requiredScope?: string): Promise<ApiAuthResult> {
	const authHeader = request.headers.get('Authorization');

	if (!authHeader?.startsWith('Bearer gtp_')) {
		return { valid: false, error: 'Missing or invalid API key. Use: Authorization: Bearer gtp_...' };
	}

	const rawKey = authHeader.replace('Bearer ', '');
	const keyHash = createHash('sha256').update(rawKey).digest('hex');
	const prefix = rawKey.substring(0, 8);

	const [key] = await db
		.select()
		.from(apiKeys)
		.where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.active, true)))
		.limit(1);

	if (!key) {
		return { valid: false, error: 'Invalid API key' };
	}

	if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
		return { valid: false, error: 'API key expired' };
	}

	if (requiredScope && key.scopes) {
		const scopes = key.scopes as string[];
		const hasScope = scopes.includes('*') || scopes.includes(requiredScope);
		if (!hasScope) {
			return { valid: false, error: `Insufficient scope. Required: ${requiredScope}` };
		}
	}

	await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, key.id));

	return {
		valid: true,
		organizationId: key.organizationId ?? undefined,
		remaining: key.rateLimit ?? 1000
	};
}

export function generateApiKey(): { key: string; hash: string; prefix: string } {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let randomPart = '';
	for (let i = 0; i < 40; i++) {
		randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	const key = `gtp_${randomPart}`;
	const hash = createHash('sha256').update(key).digest('hex');
	const prefix = key.substring(0, 8);
	return { key, hash, prefix };
}

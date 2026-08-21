import { db } from '$lib/server/db/index.js';
import { apiKeys } from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';

interface ApiAuthResult {
	valid: boolean;
	error?: string;
	organizationId?: string | null;
	remaining?: number;
}

export async function validateApiKey(request: Request, requiredScope?: string): Promise<ApiAuthResult> {
	const authHeader = request.headers.get('Authorization');

	if (!authHeader?.startsWith('Bearer gtp_')) {
		return { valid: false, error: 'Missing or invalid API key. Use: Authorization: Bearer gtp_...' };
	}

	const rawKey = authHeader.replace('Bearer ', '');
	const keyHash = createHash('sha256').update(rawKey).digest('hex');

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
		const scopes = Array.isArray(key.scopes) ? key.scopes.filter((s): s is string => typeof s === 'string') : [];
		const hasScope = scopes.includes('*') || scopes.includes(requiredScope);
		if (!hasScope) {
			return { valid: false, error: `Insufficient scope. Required: ${requiredScope}` };
		}
	}

	await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, key.id));

	return {
		valid: true,
		organizationId: key.organizationId,
		remaining: key.rateLimit ?? 1000
	};
}

/**
 * Combined guard for public API endpoints: validates API key + rate limit in one call.
 * Returns the authenticated org context or a ready-to-return error Response.
 */
export async function requireApiAuth(
	request: Request,
	scope: string
): Promise<{ organizationId: string | null; remaining: number } | Response> {
	const auth = await validateApiKey(request, scope);
	if (!auth.valid) {
		return new Response(JSON.stringify({ error: auth.error }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const { rateLimitGuard } = await import('./rate-limit.js');
	const blocked = rateLimitGuard('publicApi', auth.organizationId ?? undefined, request);
	if (blocked) return blocked;

	return {
		organizationId: auth.organizationId ?? null,
		remaining: auth.remaining ?? 1000
	};
}

export function generateApiKey(): { key: string; hash: string; prefix: string } {
	const randomPart = randomBytes(30).toString('base64url');
	const key = `gtp_${randomPart}`;
	const hash = createHash('sha256').update(key).digest('hex');
	const prefix = key.substring(0, 8);
	return { key, hash, prefix };
}

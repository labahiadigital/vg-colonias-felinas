import { error, fail, redirect } from '@sveltejs/kit';
import { hasPermission } from './rbac.js';
import { getTenantContext, type TenantContext } from './tenant.js';

export function requireAuthContext(
	locals: App.Locals,
	request?: Request
): TenantContext {
	if (!locals.user) {
		throw fail(401, { error: 'No autenticado' });
	}
	return getTenantContext(locals, request);
}

/**
 * Guards a +server.ts handler: throws a SvelteKit `error(401)` when unauthenticated.
 * Returns `locals` narrowed to `{ user: NonNullable<App.Locals['user']> }`.
 */
export function requireApiUser(locals: App.Locals): App.Locals & { user: NonNullable<App.Locals['user']> } {
	if (!locals.user) throw error(401, 'No autenticado');
	return locals as App.Locals & { user: NonNullable<App.Locals['user']> };
}

/**
 * Guards a +server.ts handler: throws `error(401)` when unauthenticated,
 * then builds a `TenantContext` from the authenticated locals.
 */
export function requireApiContext(locals: App.Locals, request?: Request): TenantContext {
	if (!locals.user) throw error(401, 'No autenticado');
	return getTenantContext(locals, request);
}

export function requireSuperadmin(locals: App.Locals): asserts locals is App.Locals & { user: NonNullable<App.Locals['user']> } {
	if (!locals.user) redirect(302, '/login');
	if (locals.user.role !== 'superadmin') redirect(302, '/dashboard');
}

export async function requirePermissionContext(
	locals: App.Locals,
	module: string,
	action: string,
	request?: Request
): Promise<TenantContext> {
	const ctx = requireAuthContext(locals, request);
	const allowed = await hasPermission(ctx.userId, module, action, ctx.organizationId);
	if (!allowed) {
		throw fail(403, { error: 'Sin permisos para esta acción' });
	}
	return ctx;
}

function formString(fd: FormData, key: string): string {
	const raw = fd.get(key);
	return typeof raw === 'string' ? raw : '';
}

export function getFormField(fd: FormData, key: string): string {
	return formString(fd, key);
}

export function getFormNumber(fd: FormData, key: string): number | null {
	const val = parseFloat(formString(fd, key));
	return isNaN(val) ? null : val;
}

export function getFormInt(fd: FormData, key: string): number | null {
	const val = parseInt(formString(fd, key), 10);
	return isNaN(val) ? null : val;
}

export function getFormBool(fd: FormData, key: string): boolean {
	const raw = fd.get(key);
	return raw === 'on' || raw === 'true';
}

export function getFormDate(fd: FormData, key: string): Date | null {
	const val = formString(fd, key);
	if (!val) return null;
	const d = new Date(val);
	return isNaN(d.getTime()) ? null : d;
}

export function requireInt(fd: FormData, key: string, label: string): number {
	const val = parseInt(formString(fd, key), 10);
	if (isNaN(val)) {
		throw fail(400, { error: `${label} es obligatorio` });
	}
	return val;
}

export function requireField(fd: FormData, key: string, label: string): string {
	const val = formString(fd, key).trim();
	if (!val) {
		throw fail(400, { error: `${label} es obligatorio` });
	}
	return val;
}

export function requireFields<K extends string>(
	fd: FormData,
	spec: Record<K, string>
): Record<K, string> {
	const missing: string[] = [];
	const result = {} as Record<K, string>;
	for (const key of Object.keys(spec) as K[]) {
		const val = formString(fd, key).trim();
		if (!val) {
			missing.push(spec[key]);
		} else {
			result[key] = val;
		}
	}
	if (missing.length > 0) {
		throw fail(400, {
			error: missing.length === 1
				? `${missing[0]} es obligatorio`
				: `${missing.join(' y ')} son obligatorios`
		});
	}
	return result;
}

export function getFormFile(fd: FormData, key: string): File | null {
	const val = fd.get(key);
	if (val instanceof File && val.size > 0) return val;
	return null;
}

export function getFormStringArray(fd: FormData, key: string): string[] {
	return fd.getAll(key).filter((v): v is string => typeof v === 'string' && v.trim() !== '');
}

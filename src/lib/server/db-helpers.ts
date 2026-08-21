import { db } from './db/index.js';
import { audit, type AuditEntity, type AuditAction } from './audit.js';
import type { TenantContext } from './tenant.js';
import type { PgTable, PgColumn } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';

type TableWithId = PgTable & { id: PgColumn };

/**
 * Executes an UPDATE with `.returning({id})`, then calls `audit()` only when rows were affected.
 * Eliminates the repeated `.returning() + if (rows.length > 0) audit(...)` pattern.
 */
export async function guardedUpdate(
	table: TableWithId,
	set: Record<string, unknown>,
	where: SQL | undefined,
	ctx: TenantContext,
	entity: AuditEntity,
	entityId: string,
	action: AuditAction,
	details?: Record<string, unknown>
): Promise<boolean> {
	const rows = await db.update(table).set(set).where(where).returning({ id: table.id }) as { id: string }[];
	if (rows.length > 0) {
		await audit(ctx, entity, entityId, action, details);
		return true;
	}
	return false;
}

/**
 * Like `guardedUpdate`, but accepts a custom `returning` shape and an `onSuccess` callback
 * that runs only when rows were affected. Use for call sites that need post-update
 * side effects (notifications, extra writes) that depend on the returned data.
 */
export async function guardedUpdateWith<T extends Record<string, unknown>>(
	table: TableWithId,
	set: Record<string, unknown>,
	where: SQL | undefined,
	returning: Record<string, PgColumn>,
	onSuccess: (rows: T[]) => Promise<void>
): Promise<boolean> {
	const rows = await db.update(table).set(set).where(where).returning(returning) as T[];
	if (rows.length > 0) {
		await onSuccess(rows);
		return true;
	}
	return false;
}

/**
 * Executes an INSERT with `.returning({id})`, then calls `audit()` with the new ID.
 * Replaces the repeated `const [row] = await db.insert(t).values(v).returning({id}); await audit(...)` pattern.
 */
export async function guardedInsert(
	table: TableWithId,
	values: Record<string, unknown>,
	ctx: TenantContext,
	entity: AuditEntity,
	action: AuditAction = 'create',
	details?: Record<string, unknown>
): Promise<string> {
	const rows = await db.insert(table).values(values).returning({ id: table.id }) as { id: string }[];
	const row = rows[0];
	if (!row) throw new Error(`Insert into ${entity} returned no rows`);
	await audit(ctx, entity, row.id, action, details);
	return row.id;
}

/**
 * Executes a DELETE with `.returning({id})`, then calls `audit()` only when rows were affected.
 */
export async function guardedDelete(
	table: TableWithId,
	where: SQL | undefined,
	ctx: TenantContext,
	entity: AuditEntity,
	entityId: string,
	action: AuditAction,
	details?: Record<string, unknown>
): Promise<boolean> {
	const rows = await db.delete(table).where(where).returning({ id: table.id }) as { id: string }[];
	if (rows.length > 0) {
		await audit(ctx, entity, entityId, action, details);
		return true;
	}
	return false;
}

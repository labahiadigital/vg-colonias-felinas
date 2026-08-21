import { db } from './db/index.js';
import { organizationMembers, colonies, cats, users } from './db/schema.js';
import { eq, and, inArray, type SQL } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';

export async function getOrganizationId(userId: string): Promise<string | null> {
	const [membership] = await db
		.select({ organizationId: organizationMembers.organizationId })
		.from(organizationMembers)
		.where(eq(organizationMembers.userId, userId))
		.limit(1);

	return membership?.organizationId ?? null;
}

export interface TenantContext {
	userId: string;
	organizationId: string | null;
	ipAddress?: string;
}

export function orgScope(column: PgColumn, orgId: string | null | undefined): SQL | undefined {
	if (!orgId) return undefined;
	return eq(column, orgId);
}

export function escapeLike(value: string): string {
	return value.replace(/[%_\\]/g, '\\$&');
}

export async function verifyOrgOwnership(
	table: PgTable & { id: PgColumn; organizationId: PgColumn },
	resourceId: string,
	orgId: string | null | undefined
): Promise<boolean> {
	if (!resourceId) return false;
	const rows = await db
		.select({ id: table.id })
		.from(table)
		.where(and(eq(table.id, resourceId), orgScope(table.organizationId, orgId)))
		.limit(1);
	return rows.length > 0;
}

export function buildWhere(...conditions: (SQL | undefined | false | null | '' | 0)[]): SQL | undefined {
	const valid = conditions.filter((c): c is SQL => !!c);
	return valid.length > 0 ? and(...valid) : undefined;
}

/**
 * Most page loaders need the colony list for their org (for dropdowns/filters).
 * This absorbs the repeated `db.select({id,name}).from(colonies).where(orgScope(...))` pattern.
 */
export function loadOrgColonies(orgId: string | null | undefined) {
	return db
		.select({ id: colonies.id, name: colonies.name })
		.from(colonies)
		.where(orgScope(colonies.organizationId, orgId));
}

/**
 * Loads users scoped to the current organization (for dropdowns, assignment lists).
 * When no orgId is set, returns all users.
 */
export async function loadOrgUsers(orgId: string | null | undefined) {
	if (orgId) {
		const memberIds = db
			.select({ id: organizationMembers.userId })
			.from(organizationMembers)
			.where(eq(organizationMembers.organizationId, orgId));
		return db
			.select({ id: users.id, name: users.name })
			.from(users)
			.where(inArray(users.id, memberIds))
			.orderBy(users.name);
	}
	return db.select({ id: users.id, name: users.name }).from(users).orderBy(users.name);
}

/**
 * Loads cats scoped to the current organization (for dropdowns/selectors).
 */
export function loadOrgCats(orgId: string | null | undefined) {
	return db
		.select({ id: cats.id, name: cats.name })
		.from(cats)
		.where(orgScope(cats.organizationId, orgId))
		.orderBy(cats.name);
}

/**
 * Loads the full detail for a single colony page: colony record + all related entities.
 * Encapsulates the 7 parallel queries that the colonias/[id] loader needs.
 */
export async function loadColonyDetail(colonyId: string, orgId: string | null | undefined) {
	const { feedingPoints, incidents, cerActions, visits, inspections, providerInterventions, providers, users: usersTable } = await import('./db/schema.js').then(m => m);
	const { desc } = await import('drizzle-orm');

	const colonyWhere = (table: { colonyId: PgColumn; organizationId: PgColumn }) =>
		and(eq(table.colonyId, colonyId), orgScope(table.organizationId, orgId));

	const [colonyCats, colonyFPs, colonyIncidents, colonyCER, colonyVisits, colonyInspections, colonyInterventions] = await Promise.all([
		db.select().from(cats).where(and(eq(cats.colonyId, colonyId), orgScope(cats.organizationId, orgId))),
		db.select().from(feedingPoints).where(eq(feedingPoints.colonyId, colonyId)),
		db.select().from(incidents).where(colonyWhere(incidents)),
		db.select().from(cerActions).where(colonyWhere(cerActions)),
		db.select({
			id: visits.id, type: visits.type, visitedAt: visits.visitedAt,
			durationMinutes: visits.durationMinutes, catsObserved: visits.catsObserved,
			foodProvided: visits.foodProvided, notes: visits.notes, userName: usersTable.name
		}).from(visits).leftJoin(usersTable, eq(visits.userId, usersTable.id))
			.where(colonyWhere(visits)).orderBy(desc(visits.visitedAt)).limit(20),
		db.select({
			id: inspections.id, score: inspections.score, passed: inspections.passed,
			notes: inspections.notes, followUpRequired: inspections.followUpRequired, createdAt: inspections.createdAt
		}).from(inspections).where(colonyWhere(inspections)).orderBy(desc(inspections.createdAt)).limit(10),
		db.select({
			id: providerInterventions.id, type: providerInterventions.type, cost: providerInterventions.cost,
			performedAt: providerInterventions.performedAt, invoiceRef: providerInterventions.invoiceRef, providerName: providers.name
		}).from(providerInterventions).leftJoin(providers, eq(providerInterventions.providerId, providers.id))
			.where(colonyWhere(providerInterventions)).orderBy(desc(providerInterventions.performedAt)).limit(10)
	]);

	return { cats: colonyCats, feedingPoints: colonyFPs, incidents: colonyIncidents, cerActions: colonyCER, visits: colonyVisits, inspections: colonyInspections, interventions: colonyInterventions };
}

/**
 * Loads recent audit log entries with user names joined.
 * Replaces the repeated pattern found in dashboard, informes, configuracion, incidencias.
 */
export async function loadRecentAudit(
	orgId: string | null | undefined,
	options?: { entity?: string; limit?: number }
) {
	const { auditLogs, users: usersTable } = await import('./db/schema.js');
	const { desc } = await import('drizzle-orm');

	const limit = options?.limit ?? 10;

	return db.select({
		id: auditLogs.id,
		entity: auditLogs.entity,
		entityId: auditLogs.entityId,
		action: auditLogs.action,
		details: auditLogs.details,
		createdAt: auditLogs.createdAt,
		userName: usersTable.name
	})
		.from(auditLogs)
		.leftJoin(usersTable, eq(auditLogs.userId, usersTable.id))
		.where(buildWhere(
			orgScope(auditLogs.organizationId, orgId),
			options?.entity ? eq(auditLogs.entity, options.entity) : undefined
		))
		.orderBy(desc(auditLogs.createdAt))
		.limit(limit);
}

/**
 * Loads the full detail for a single cat page: cat record + related entities.
 * Encapsulates the 4 parallel queries that the gatos/[id] loader needs.
 */
export async function loadCatDetail(catId: string, orgId: string | null | undefined) {
	const { healthRecords, cerActions, adoptions } = await import('./db/schema.js');
	const { desc } = await import('drizzle-orm');

	const catWhere = (table: { catId: PgColumn; organizationId: PgColumn }) =>
		and(eq(table.catId, catId), orgScope(table.organizationId, orgId));

	const [health, cer, adoption] = await Promise.all([
		db.select().from(healthRecords).where(catWhere(healthRecords)).orderBy(desc(healthRecords.performedAt)),
		db.select().from(cerActions).where(catWhere(cerActions)),
		db.select().from(adoptions).where(catWhere(adoptions))
	]);

	return { healthRecords: health, cerActions: cer, adoptions: adoption };
}

export function extractIp(request?: Request): string | undefined {
	return request?.headers.get('x-forwarded-for') ?? request?.headers.get('x-real-ip') ?? undefined;
}

export function getTenantContext(locals: App.Locals, request?: Request): TenantContext {
	if (!locals.user) {
		throw new Error('Not authenticated');
	}

	return {
		userId: locals.user.id,
		organizationId: locals.organizationId,
		ipAddress: extractIp(request)
	};
}

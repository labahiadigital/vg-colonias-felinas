import { db } from './db/index.js';
import {
	colonies, cats, incidents, cerActions, collaborators,
	visits, inspections, providers, providerInterventions,
	volunteerHours, healthRecords
} from './db/schema.js';
import { sql, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { computeRate } from '$lib/index.js';

export interface StatsSnapshot {
	totalColonies: number;
	activeColonies: number;
	totalCats: number;
	sterilizedCats: number;
	microchipped: number;
	sterilizationRate: number;
	totalIncidents: number;
	openIncidents: number;
	resolvedIncidents: number;
	incidentResolutionRate: number;
	highPriorityIncidents: number;
	totalCER: number;
	totalCollab: number;
	activeCollaborators: number;
	pendingCollaborators: number;
	totalVisits: number;
	recentVisits: number;
	totalInsp: number;
	passedInsp: number;
	activeProviders: number;
	totalInterventions: number;
	totalCost: number;
	volunteerHours: number;
	totalHealth: number;
	geoColonies: number;
	geoRate: number;
}

export function extractStatValue(r: Record<string, number | null>[], key: string): number {
	return Number(r[0]?.[key] ?? 0);
}

function orgFilter(column: PgColumn, orgId: string | null | undefined): SQL {
	return orgId ? sql` AND ${column} = ${orgId}` : sql``;
}

export async function getStats(organizationId?: string | null): Promise<StatsSnapshot> {
	const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
	const oColony = orgFilter(colonies.organizationId, organizationId);
	const oCat = orgFilter(cats.organizationId, organizationId);
	const oInc = orgFilter(incidents.organizationId, organizationId);
	const oCollab = orgFilter(collaborators.organizationId, organizationId);
	const oVisit = orgFilter(visits.organizationId, organizationId);
	const oInsp = orgFilter(inspections.organizationId, organizationId);
	const oProv = orgFilter(providers.organizationId, organizationId);
	const oPI = orgFilter(providerInterventions.organizationId, organizationId);
	const oCer = orgFilter(cerActions.organizationId, organizationId);
	const oVH = orgFilter(volunteerHours.organizationId, organizationId);
	const oHR = orgFilter(healthRecords.organizationId, organizationId);

	const [colonyR, catR, incidentR, collabR, visitInspR, provR, miscR] = await Promise.all([
		db.execute<Record<string, number | null>>(sql`
			SELECT
				count(*) AS "total",
				count(*) FILTER (WHERE ${colonies.status} = 'active') AS "active",
				count(*) FILTER (WHERE ${colonies.latitude} IS NOT NULL) AS "geo"
			FROM ${colonies}
			WHERE 1=1 ${oColony}
		`),

		db.execute<Record<string, number | null>>(sql`
			SELECT
				count(*) AS "total",
				count(*) FILTER (WHERE ${cats.sterilized} = true) AS "sterilized",
				count(*) FILTER (WHERE ${cats.microchip} IS NOT NULL AND ${cats.microchip} != '') AS "microchipped"
			FROM ${cats}
			WHERE 1=1 ${oCat}
		`),

		db.execute<Record<string, number | null>>(sql`
			SELECT
				count(*) AS "total",
				count(*) FILTER (WHERE ${incidents.status} = 'open') AS "open",
				count(*) FILTER (WHERE ${incidents.status} = 'resolved') AS "resolved",
				count(*) FILTER (WHERE ${incidents.status} = 'open' AND ${incidents.priority} = 'high') AS "highPriority"
			FROM ${incidents}
			WHERE 1=1 ${oInc}
		`),

		db.execute<Record<string, number | null>>(sql`
			SELECT
				count(*) AS "total",
				count(*) FILTER (WHERE ${collaborators.status} = 'active') AS "active",
				count(*) FILTER (WHERE ${collaborators.status} = 'pending') AS "pending"
			FROM ${collaborators}
			WHERE 1=1 ${oCollab}
		`),

		db.execute<Record<string, number | null>>(sql`
			SELECT
				(SELECT count(*) FROM ${visits} WHERE 1=1 ${oVisit}) AS "totalVisits",
				(SELECT count(*) FROM ${visits} WHERE ${visits.visitedAt} >= ${thirtyDaysAgo} ${oVisit}) AS "recentVisits",
				(SELECT count(*) FROM ${inspections} WHERE 1=1 ${oInsp}) AS "totalInsp",
				(SELECT count(*) FROM ${inspections} WHERE ${inspections.passed} = true ${oInsp}) AS "passedInsp"
		`),

		db.execute<Record<string, number | null>>(sql`
			SELECT
				(SELECT count(*) FROM ${providers} WHERE ${providers.status} = 'active' ${oProv}) AS "activeProviders",
				(SELECT count(*) FROM ${providerInterventions} WHERE 1=1 ${oPI}) AS "totalInterventions",
				(SELECT coalesce(sum(cost), 0) FROM ${providerInterventions} WHERE 1=1 ${oPI}) AS "totalCost"
		`),

		db.execute<Record<string, number | null>>(sql`
			SELECT
				(SELECT count(*) FROM ${cerActions} WHERE 1=1 ${oCer}) AS "totalCER",
				(SELECT coalesce(sum(hours), 0) FROM ${volunteerHours} WHERE 1=1 ${oVH}) AS "volunteerHours",
				(SELECT count(*) FROM ${healthRecords} WHERE 1=1 ${oHR}) AS "totalHealth"
		`)
	]);

	const v = extractStatValue;
	const totalColonies = v(colonyR.rows, 'total');
	const geoColonies = v(colonyR.rows, 'geo');
	const totalCats = v(catR.rows, 'total');
	const sterilizedCats = v(catR.rows, 'sterilized');
	const totalIncidents = v(incidentR.rows, 'total');
	const resolvedIncidents = v(incidentR.rows, 'resolved');

	return {
		totalColonies,
		activeColonies: v(colonyR.rows, 'active'),
		totalCats,
		sterilizedCats,
		microchipped: v(catR.rows, 'microchipped'),
		sterilizationRate: computeRate(sterilizedCats, totalCats),
		totalIncidents,
		openIncidents: v(incidentR.rows, 'open'),
		resolvedIncidents,
		incidentResolutionRate: computeRate(resolvedIncidents, totalIncidents),
		highPriorityIncidents: v(incidentR.rows, 'highPriority'),
		totalCER: v(miscR.rows, 'totalCER'),
		totalCollab: v(collabR.rows, 'total'),
		activeCollaborators: v(collabR.rows, 'active'),
		pendingCollaborators: v(collabR.rows, 'pending'),
		totalVisits: v(visitInspR.rows, 'totalVisits'),
		recentVisits: v(visitInspR.rows, 'recentVisits'),
		totalInsp: v(visitInspR.rows, 'totalInsp'),
		passedInsp: v(visitInspR.rows, 'passedInsp'),
		activeProviders: v(provR.rows, 'activeProviders'),
		totalInterventions: v(provR.rows, 'totalInterventions'),
		totalCost: v(provR.rows, 'totalCost'),
		volunteerHours: v(miscR.rows, 'volunteerHours'),
		totalHealth: v(miscR.rows, 'totalHealth'),
		geoColonies,
		geoRate: computeRate(geoColonies, totalColonies)
	};
}

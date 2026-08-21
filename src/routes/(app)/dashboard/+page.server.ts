import type { PageServerLoad } from './$types.js';
import { getStats } from '$lib/server/stats.js';
import { loadRecentAudit } from '$lib/server/tenant.js';

export const load: PageServerLoad = async ({ locals }) => {
	const orgId = locals.organizationId;

	const [stats, recentLogs] = await Promise.all([
		getStats(orgId),
		loadRecentAudit(orgId, { limit: 5 })
	]);

	return {
		user: locals.user,
		locale: locals.locale,
		stats: {
			totalColonies: stats.totalColonies,
			activeColonies: stats.activeColonies,
			totalCats: stats.totalCats,
			sterilized: stats.sterilizedCats,
			microchipped: stats.microchipped,
			sterilizationRate: stats.sterilizationRate,
			openIncidents: stats.openIncidents,
			highPriority: stats.highPriorityIncidents,
			cerTotal: stats.totalCER,
			pendingCollaborators: stats.pendingCollaborators,
			activeCollaborators: stats.activeCollaborators,
			recentVisits: stats.recentVisits,
			totalInspections: stats.totalInsp,
			activeProviders: stats.activeProviders,
			volunteerHours: stats.volunteerHours,
			geolocatedColonies: stats.geoColonies,
			geolocatedPct: stats.geoRate
		},
		recentActivity: recentLogs
	};
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { requireApiAuth } from '$lib/server/api-auth.js';
import { getStats } from '$lib/server/stats.js';

export const GET: RequestHandler = async ({ request }) => {
	const auth = await requireApiAuth(request, 'stats:read');
	if (auth instanceof Response) return auth;

	const s = await getStats(auth.organizationId);

	return json({
		data: {
			colonies: s.totalColonies,
			cats: s.totalCats,
			sterilized: s.sterilizedCats,
			sterilizationRate: s.sterilizationRate,
			visits: s.totalVisits,
			incidents: s.totalIncidents,
			healthRecords: s.totalHealth
		},
		generatedAt: new Date().toISOString()
	});
};

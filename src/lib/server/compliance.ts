import type { StatsSnapshot } from './stats.js';

export interface ComplianceItem {
	label: string;
	ok: boolean;
	detail: string;
}

export interface ComplianceGroup {
	law: string;
	items: ComplianceItem[];
}

export function buildComplianceChecks(s: StatsSnapshot): ComplianceGroup[] {
	return [
		{
			law: 'Ley 7/2023 de Protección Animal',
			items: [
				{ label: 'Art. 17 - Registro e identificación de colonias', ok: s.totalColonies > 0, detail: `${s.totalColonies} colonias registradas` },
				{ label: 'Art. 18 - Programa CER activo', ok: s.totalCER > 0, detail: `${s.totalCER} acciones CER realizadas` },
				{ label: 'Art. 25 - Identificación (microchip)', ok: s.microchipped > 0, detail: `${s.microchipped} gatos con microchip` },
				{ label: 'Art. 37 - Esterilización obligatoria', ok: s.sterilizationRate >= 70, detail: `Tasa: ${s.sterilizationRate}%` },
				{ label: 'Art. 44 - Seguimiento sanitario', ok: s.totalHealth > 0, detail: `${s.totalHealth} registros sanitarios` }
			]
		},
		{
			law: 'RGPD / LOPDGDD',
			items: [
				{ label: 'Registro de actividad de tratamiento', ok: true, detail: 'Audit log implementado' },
				{ label: 'Control de acceso y autenticación', ok: true, detail: 'RBAC con Better Auth' },
				{ label: 'Minimización de datos personales', ok: true, detail: 'Datos mínimos de adoptantes y voluntarios' }
			]
		},
		{
			law: 'Directiva 92/43/CEE (Hábitats)',
			items: [
				{ label: 'Monitorización de impacto ambiental', ok: s.totalInsp > 0, detail: `${s.totalInsp} inspecciones realizadas` },
				{ label: 'Registro de intervenciones en hábitat', ok: s.totalVisits > 0, detail: `${s.totalVisits} visitas registradas` },
				{ label: 'Geolocalización de colonias', ok: s.geoRate >= 50, detail: `${s.geoRate}% colonias geolocalizadas` }
			]
		},
		{
			law: 'Estrategia de Biodiversidad 2030',
			items: [
				{ label: 'Programa CER operativo', ok: s.totalCER > 0, detail: `${s.totalCER} acciones CER` },
				{ label: 'Tasa de esterilización > 70%', ok: s.sterilizationRate >= 70, detail: `${s.sterilizationRate}%` },
				{ label: 'Sistema de seguimiento y datos', ok: s.totalVisits > 0 && s.totalInsp > 0, detail: `${s.totalVisits} visitas, ${s.totalInsp} inspecciones` }
			]
		},
		{
			law: 'Artículo 13 del TFUE',
			items: [
				{ label: 'Bienestar animal en gestión de colonias', ok: s.totalHealth > 0, detail: `${s.totalHealth} registros salud` },
				{ label: 'Proveedores veterinarios acreditados', ok: s.activeProviders > 0, detail: `${s.activeProviders} proveedores activos` },
				{ label: 'Resolución de incidencias', ok: s.incidentResolutionRate >= 50, detail: `Tasa resolución: ${s.incidentResolutionRate}%` }
			]
		},
		{
			law: 'Pacto Verde Europeo / One Health',
			items: [
				{ label: 'Integración salud animal-humana', ok: s.totalHealth > 0 && s.totalVisits > 0, detail: 'Control sanitario y seguimiento activo' },
				{ label: 'Voluntariado comunitario', ok: s.volunteerHours > 0, detail: `${s.volunteerHours}h de voluntariado` },
				{ label: 'Colaboración con proveedores', ok: s.activeProviders > 0, detail: `${s.activeProviders} proveedores` }
			]
		}
	];
}

export function computeComplianceScore(checks: ComplianceGroup[]): { total: number; passed: number; score: number } {
	let total = 0;
	let passed = 0;
	for (const g of checks) {
		for (const i of g.items) {
			total++;
			if (i.ok) passed++;
		}
	}
	const score = total > 0 ? Math.round((passed / total) * 100) : 0;
	return { total, passed, score };
}

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { regulatoryTemplates, colonies, cats, healthRecords, visits, incidents } from '$lib/server/db/schema.js';
import { eq, sql, gte, lte, and } from 'drizzle-orm';

const DEFAULT_TEMPLATES: Array<{
	country: string;
	region: string | null;
	type: string;
	name: string;
	description: string;
	locale: string;
	requiredFields: string[];
	templateHtml: string;
}> = [
	{
		country: 'ES',
		region: null,
		type: 'memoria_anual',
		name: 'Memoria Anual CER — Ley 7/2023',
		description: 'Informe anual de gestión de colonias felinas conforme a la Ley 7/2023 de protección de los derechos y el bienestar de los animales',
		locale: 'es',
		requiredFields: ['year', 'organizationName', 'municipio'],
		templateHtml: `<h1>MEMORIA ANUAL DE GESTIÓN DE COLONIAS FELINAS</h1>
<h2>Ejercicio {{year}}</h2>
<p><strong>Entidad:</strong> {{organizationName}}</p>
<p><strong>Municipio:</strong> {{municipio}}</p>
<hr/>
<h3>1. Datos del censo</h3>
<table><tr><th>Indicador</th><th>Valor</th></tr>
<tr><td>Colonias registradas</td><td>{{totalColonies}}</td></tr>
<tr><td>Gatos censados</td><td>{{totalCats}}</td></tr>
<tr><td>Gatos esterilizados</td><td>{{sterilizedCats}}</td></tr>
<tr><td>Tasa de esterilización</td><td>{{sterilizationRate}}%</td></tr></table>
<h3>2. Actividad CER</h3>
<table><tr><th>Indicador</th><th>Valor</th></tr>
<tr><td>Intervenciones veterinarias</td><td>{{healthRecordsCount}}</td></tr>
<tr><td>Visitas de mantenimiento</td><td>{{visitsCount}}</td></tr>
<tr><td>Incidencias gestionadas</td><td>{{incidentsCount}}</td></tr></table>
<h3>3. Cumplimiento normativo</h3>
<p>La presente memoria se elabora conforme al artículo 18 de la Ley 7/2023 de protección de los derechos y el bienestar de los animales.</p>
<p style="margin-top:40px;"><strong>Firma del responsable:</strong></p><br/><br/><p>Fecha: {{date}}</p>`
	},
	{
		country: 'ES',
		region: null,
		type: 'informe_pleno',
		name: 'Informe para Pleno Municipal',
		description: 'Resumen ejecutivo de gestión CER para presentación en pleno municipal',
		locale: 'es',
		requiredFields: ['year', 'organizationName', 'municipio'],
		templateHtml: `<h1>INFORME DE GESTIÓN DE COLONIAS FELINAS URBANAS</h1>
<h2>Para presentación en Pleno Municipal — {{year}}</h2>
<p><strong>Municipio:</strong> {{municipio}}</p>
<h3>Resumen Ejecutivo</h3>
<p>Se presentan los resultados de la gestión de {{totalColonies}} colonias felinas con {{totalCats}} gatos censados. La tasa de esterilización alcanza el {{sterilizationRate}}%.</p>
<h3>Indicadores ODS</h3>
<ul>
<li>ODS 11 (Ciudades sostenibles): {{totalColonies}} colonias gestionadas</li>
<li>ODS 15 (Vida terrestre): {{sterilizedCats}} esterilizaciones realizadas</li>
<li>ODS 3 (Salud): {{healthRecordsCount}} intervenciones veterinarias</li>
</ul>`
	},
	{
		country: 'PT',
		region: null,
		type: 'relatorio_anual',
		name: 'Relatório Anual ICNF',
		description: 'Relatório anual de gestão de colónias felinas conforme Lei 27/2016',
		locale: 'pt',
		requiredFields: ['year', 'organizationName', 'municipio'],
		templateHtml: `<h1>RELATÓRIO ANUAL DE GESTÃO DE COLÓNIAS FELINAS</h1>
<h2>Exercício {{year}}</h2>
<p><strong>Entidade:</strong> {{organizationName}}</p>
<p><strong>Município:</strong> {{municipio}}</p>
<h3>1. Dados do Censo</h3>
<table><tr><th>Indicador</th><th>Valor</th></tr>
<tr><td>Colónias registadas</td><td>{{totalColonies}}</td></tr>
<tr><td>Gatos recenseados</td><td>{{totalCats}}</td></tr>
<tr><td>Gatos esterilizados</td><td>{{sterilizedCats}}</td></tr>
<tr><td>Taxa de esterilização</td><td>{{sterilizationRate}}%</td></tr></table>
<h3>2. Atividade CER</h3>
<table><tr><th>Indicador</th><th>Valor</th></tr>
<tr><td>Intervenções veterinárias</td><td>{{healthRecordsCount}}</td></tr>
<tr><td>Visitas de manutenção</td><td>{{visitsCount}}</td></tr>
<tr><td>Incidentes geridos</td><td>{{incidentsCount}}</td></tr></table>
<p>Relatório elaborado conforme a Lei 27/2016 de proteção animal.</p>`
	},
	{
		country: 'IT',
		region: null,
		type: 'relazione_annuale',
		name: 'Relazione Annuale ASL',
		description: 'Relazione annuale di gestione colonie feline conforme Legge 281/1991',
		locale: 'it',
		requiredFields: ['year', 'organizationName', 'municipio'],
		templateHtml: `<h1>RELAZIONE ANNUALE GESTIONE COLONIE FELINE</h1>
<h2>Anno {{year}}</h2>
<p><strong>Ente:</strong> {{organizationName}}</p>
<p><strong>Comune:</strong> {{municipio}}</p>
<h3>1. Dati del Censimento</h3>
<table><tr><th>Indicatore</th><th>Valore</th></tr>
<tr><td>Colonie registrate</td><td>{{totalColonies}}</td></tr>
<tr><td>Gatti censiti</td><td>{{totalCats}}</td></tr>
<tr><td>Gatti sterilizzati</td><td>{{sterilizedCats}}</td></tr>
<tr><td>Tasso di sterilizzazione</td><td>{{sterilizationRate}}%</td></tr></table>
<h3>2. Attività TNR</h3>
<table><tr><th>Indicatore</th><th>Valore</th></tr>
<tr><td>Interventi veterinari</td><td>{{healthRecordsCount}}</td></tr>
<tr><td>Visite di manutenzione</td><td>{{visitsCount}}</td></tr>
<tr><td>Incidenti gestiti</td><td>{{incidentsCount}}</td></tr></table>
<p>Relazione redatta ai sensi della Legge 281/1991.</p>`
	},
	{
		country: 'FR',
		region: null,
		type: 'rapport_annuel',
		name: 'Rapport Annuel Préfecture',
		description: 'Rapport annuel de gestion des colonies félines conforme au Code Rural',
		locale: 'fr',
		requiredFields: ['year', 'organizationName', 'municipio'],
		templateHtml: `<h1>RAPPORT ANNUEL DE GESTION DES COLONIES FÉLINES</h1>
<h2>Année {{year}}</h2>
<p><strong>Association:</strong> {{organizationName}}</p>
<p><strong>Commune:</strong> {{municipio}}</p>
<h3>1. Données du Recensement</h3>
<table><tr><th>Indicateur</th><th>Valeur</th></tr>
<tr><td>Colonies enregistrées</td><td>{{totalColonies}}</td></tr>
<tr><td>Chats recensés</td><td>{{totalCats}}</td></tr>
<tr><td>Chats stérilisés</td><td>{{sterilizedCats}}</td></tr>
<tr><td>Taux de stérilisation</td><td>{{sterilizationRate}}%</td></tr></table>
<h3>2. Activité TNR</h3>
<table><tr><th>Indicateur</th><th>Valeur</th></tr>
<tr><td>Interventions vétérinaires</td><td>{{healthRecordsCount}}</td></tr>
<tr><td>Visites d'entretien</td><td>{{visitsCount}}</td></tr>
<tr><td>Incidents gérés</td><td>{{incidentsCount}}</td></tr></table>
<p>Rapport établi conformément au Code Rural (articles L211-27 et suivants).</p>`
	}
];

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) return json({ error: 'No autenticado' }, { status: 401 });

	const country = url.searchParams.get('country');
	const type = url.searchParams.get('type');

	if (country && type) {
		const year = url.searchParams.get('year') || String(new Date().getFullYear());
		const orgName = url.searchParams.get('org') || 'Organización';
		const municipio = url.searchParams.get('municipio') || 'Municipio';

		const startDate = new Date(`${year}-01-01`);
		const endDate = new Date(`${year}-12-31`);

		const [colonyCount] = await db.select({ count: sql<number>`count(*)` }).from(colonies);
		const [catCount] = await db.select({ count: sql<number>`count(*)` }).from(cats);
		const [sterilizedCount] = await db.select({ count: sql<number>`count(*)` }).from(cats).where(eq(cats.sterilized, true));
		const [healthCount] = await db.select({ count: sql<number>`count(*)` }).from(healthRecords)
			.where(and(gte(healthRecords.date, startDate.toISOString().split('T')[0]), lte(healthRecords.date, endDate.toISOString().split('T')[0])));
		const [visitCount] = await db.select({ count: sql<number>`count(*)` }).from(visits)
			.where(and(gte(visits.visitedAt, startDate), lte(visits.visitedAt, endDate)));
		const [incidentCount] = await db.select({ count: sql<number>`count(*)` }).from(incidents);

		const totalCats = Number(catCount?.count ?? 0);
		const sterilized = Number(sterilizedCount?.count ?? 0);
		const rate = totalCats > 0 ? ((sterilized / totalCats) * 100).toFixed(1) : '0';

		const tplRecord = await db.select().from(regulatoryTemplates)
			.where(and(eq(regulatoryTemplates.country, country), eq(regulatoryTemplates.type, type)))
			.limit(1);

		let templateHtml: string;
		if (tplRecord.length > 0) {
			templateHtml = tplRecord[0].templateHtml;
		} else {
			const defaultTpl = DEFAULT_TEMPLATES.find(t => t.country === country && t.type === type);
			if (!defaultTpl) return json({ error: 'Plantilla no encontrada' }, { status: 404 });
			templateHtml = defaultTpl.templateHtml;
		}

		const rendered = templateHtml
			.replace(/\{\{year\}\}/g, year)
			.replace(/\{\{organizationName\}\}/g, orgName)
			.replace(/\{\{municipio\}\}/g, municipio)
			.replace(/\{\{totalColonies\}\}/g, String(colonyCount?.count ?? 0))
			.replace(/\{\{totalCats\}\}/g, String(totalCats))
			.replace(/\{\{sterilizedCats\}\}/g, String(sterilized))
			.replace(/\{\{sterilizationRate\}\}/g, rate)
			.replace(/\{\{healthRecordsCount\}\}/g, String(healthCount?.count ?? 0))
			.replace(/\{\{visitsCount\}\}/g, String(visitCount?.count ?? 0))
			.replace(/\{\{incidentsCount\}\}/g, String(incidentCount?.count ?? 0))
			.replace(/\{\{date\}\}/g, new Date().toLocaleDateString('es-ES'));

		const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${orgName} — Informe</title>
<style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#1a1a1a}
h1{font-size:1.5rem;border-bottom:2px solid #0f766e;padding-bottom:8px}
h2{font-size:1.1rem;color:#555}h3{color:#0f766e;margin-top:24px}
table{width:100%;border-collapse:collapse;margin:12px 0}
th,td{border:1px solid #ddd;padding:8px 12px;text-align:left}
th{background:#f5f5f5;font-weight:600}
@media print{body{margin:0;padding:20px}}</style></head><body>${rendered}</body></html>`;

		return new Response(fullHtml, {
			headers: { 'Content-Type': 'text/html; charset=utf-8' }
		});
	}

	const dbTemplates = await db.select().from(regulatoryTemplates).where(eq(regulatoryTemplates.isActive, true));
	const all = [
		...DEFAULT_TEMPLATES.map(t => ({ ...t, source: 'default' as const })),
		...dbTemplates.map(t => ({ ...t, source: 'custom' as const }))
	];

	const grouped = all.reduce((acc: Record<string, typeof all>, t) => {
		(acc[t.country] = acc[t.country] || []).push(t);
		return acc;
	}, {});

	return json({ templates: grouped });
};

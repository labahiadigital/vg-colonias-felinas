import { escHtml } from './html.js';

export interface TemplateVariables {
	[key: string]: string;
}

/**
 * Replaces {{key}} placeholders in a template string.
 * User-provided values (listed in `unsafeKeys`) are HTML-escaped;
 * numeric/safe values are inserted as-is.
 */
export function renderTemplate(
	templateHtml: string,
	variables: TemplateVariables,
	unsafeKeys: ReadonlySet<string> = UNSAFE_KEYS
): string {
	let result = templateHtml;
	for (const [key, value] of Object.entries(variables)) {
		const escaped = unsafeKeys.has(key) ? escHtml(value) : value;
		result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), escaped);
	}
	return result;
}

const UNSAFE_KEYS = new Set([
	'year',
	'organizationName',
	'municipio',
	'date'
]);

export interface RegulatoryTemplateRecord {
	country: string;
	region: string | null;
	type: string;
	name: string;
	description: string;
	locale: string;
	requiredFields: string[];
	templateHtml: string;
}

export const DEFAULT_TEMPLATES: RegulatoryTemplateRecord[] = [
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

<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	let locale = $derived(data.locale);
	let kpis = $derived(data.kpis);

	function categoryLabel(c: string): string {
		const map: Record<string, string> = {
			health: 'Salud', environmental: 'Medioambiental', complaint: 'Queja',
			infrastructure: 'Infraestructura', abandonment: 'Abandono', other: 'Otro'
		};
		return map[c] ?? c;
	}

	function exportCSV() {
		const rows = [
			['Indicador', 'Valor'],
			['Colonias activas', String(kpis.activeColonies)],
			['Total colonias', String(kpis.totalColonies)],
			['Gatos censados', String(kpis.totalCats)],
			['Gatos esterilizados', String(kpis.sterilizedCats)],
			['Tasa esterilización', `${kpis.sterilizationRate}%`],
			['Incidencias totales', String(kpis.totalIncidents)],
			['Incidencias abiertas', String(kpis.openIncidents)],
			['Incidencias resueltas', String(kpis.resolvedIncidents)],
			['Acciones CER', String(kpis.totalCER)],
			['Colaboradores activos', String(kpis.activeCollaborators)],
			['Total colaboradores', String(kpis.totalCollaborators)]
		];

		rows.push([''], ['Gatos por colonia']);
		data.catsByColony.forEach((c: any) => rows.push([c.colonyName, String(c.catCount)]));

		rows.push([''], ['Incidencias por categoría']);
		data.incidentsByCategory.forEach((c: any) => rows.push([categoryLabel(c.category), String(c.count)]));

		const csv = rows.map(r => r.join(',')).join('\n');
		const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `informe-colonias-${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div>
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h2 class="text-2xl font-bold text-gray-800">{t(locale, 'reports.title')}</h2>
			<p class="text-sm text-gray-500 mt-1">Indicadores y estadísticas del programa</p>
		</div>
		<div class="flex gap-2">
			<button onclick={exportCSV} class="px-4 py-2 bg-accent text-white font-semibold rounded-md hover:bg-green-700 transition-colors text-sm">
				📥 {t(locale, 'reports.export_excel')}
			</button>
			<a href="/api/export-pdf?type=general" target="_blank" class="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors text-sm inline-flex items-center">
				📄 {t(locale, 'reports.export_pdf')}
			</a>
		</div>
	</div>

	<!-- KPIs -->
	<div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
		<div class="bg-white rounded-lg shadow-sm p-4 text-center">
			<div class="text-2xl font-bold text-primary">{kpis.activeColonies}</div>
			<div class="text-xs text-gray-500 mt-1">Colonias activas</div>
		</div>
		<div class="bg-white rounded-lg shadow-sm p-4 text-center">
			<div class="text-2xl font-bold text-primary">{kpis.totalCats}</div>
			<div class="text-xs text-gray-500 mt-1">Gatos censados</div>
		</div>
		<div class="bg-white rounded-lg shadow-sm p-4 text-center">
			<div class="text-2xl font-bold text-accent">{kpis.sterilizationRate}%</div>
			<div class="text-xs text-gray-500 mt-1">Tasa esterilización</div>
		</div>
		<div class="bg-white rounded-lg shadow-sm p-4 text-center">
			<div class="text-2xl font-bold text-warning">{kpis.openIncidents}</div>
			<div class="text-xs text-gray-500 mt-1">Incidencias abiertas</div>
		</div>
		<div class="bg-white rounded-lg shadow-sm p-4 text-center">
			<div class="text-2xl font-bold text-info">{kpis.totalCER}</div>
			<div class="text-xs text-gray-500 mt-1">Acciones CER</div>
		</div>
		<div class="bg-white rounded-lg shadow-sm p-4 text-center">
			<div class="text-2xl font-bold text-primary">{kpis.activeCollaborators}</div>
			<div class="text-xs text-gray-500 mt-1">Colaboradores activos</div>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
		<!-- Cats by colony -->
		<div class="bg-white rounded-lg shadow-sm p-5">
			<h3 class="font-bold text-gray-800 mb-4">🐈 Gatos por colonia</h3>
			{#if data.catsByColony.length > 0}
				<div class="space-y-3">
					{#each data.catsByColony as row}
						{@const max = Math.max(...data.catsByColony.map((r: any) => Number(r.catCount)))}
						{@const pct = max > 0 ? (Number(row.catCount) / max) * 100 : 0}
						<div>
							<div class="flex justify-between text-sm mb-1">
								<span>{row.colonyName}</span>
								<span class="font-bold">{row.catCount}</span>
							</div>
							<div class="h-4 bg-gray-100 rounded-full overflow-hidden">
								<div class="h-full bg-primary rounded-full transition-all" style="width: {pct}%"></div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-gray-400 text-sm">Sin datos</p>
			{/if}
		</div>

		<!-- Incidents by category -->
		<div class="bg-white rounded-lg shadow-sm p-5">
			<h3 class="font-bold text-gray-800 mb-4">⚠️ Incidencias por categoría</h3>
			{#if data.incidentsByCategory.length > 0}
				<div class="space-y-3">
					{#each data.incidentsByCategory as row}
						{@const max = Math.max(...data.incidentsByCategory.map((r: any) => Number(r.count)))}
						{@const pct = max > 0 ? (Number(row.count) / max) * 100 : 0}
						<div>
							<div class="flex justify-between text-sm mb-1">
								<span>{categoryLabel(row.category)}</span>
								<span class="font-bold">{row.count}</span>
							</div>
							<div class="h-4 bg-gray-100 rounded-full overflow-hidden">
								<div class="h-full bg-warning rounded-full transition-all" style="width: {pct}%"></div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-gray-400 text-sm">Sin datos</p>
			{/if}
		</div>
	</div>

	<!-- Sterilization progress -->
	<div class="bg-white rounded-lg shadow-sm p-5 mb-6">
		<h3 class="font-bold text-gray-800 mb-4">✂️ Progreso de Esterilización</h3>
		<div class="flex items-center gap-4">
			<div class="flex-1">
				<div class="flex justify-between text-sm mb-2">
					<span>{kpis.sterilizedCats} de {kpis.totalCats} gatos esterilizados</span>
					<span class="font-bold text-accent">{kpis.sterilizationRate}%</span>
				</div>
				<div class="h-6 bg-gray-100 rounded-full overflow-hidden">
					<div class="h-full bg-accent rounded-full transition-all flex items-center justify-center text-white text-xs font-bold" style="width: {kpis.sterilizationRate}%">
						{kpis.sterilizationRate}%
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Audit log -->
	<div class="bg-white rounded-lg shadow-sm p-5">
		<h3 class="font-bold text-gray-800 mb-4">📋 Registro de Auditoría (últimos 10)</h3>
		{#if data.auditLog.length > 0}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-4 py-2 text-left font-semibold">Fecha</th>
							<th class="px-4 py-2 text-left font-semibold">Usuario</th>
							<th class="px-4 py-2 text-left font-semibold">Entidad</th>
							<th class="px-4 py-2 text-left font-semibold">Acción</th>
							<th class="px-4 py-2 text-left font-semibold">Detalles</th>
						</tr>
					</thead>
					<tbody>
						{#each data.auditLog as log}
							<tr class="border-t hover:bg-gray-50">
								<td class="px-4 py-2 text-xs">{log.createdAt ? new Date(log.createdAt).toLocaleString('es') : '-'}</td>
								<td class="px-4 py-2">{log.userName ?? '-'}</td>
								<td class="px-4 py-2 capitalize">{log.entity}</td>
								<td class="px-4 py-2 capitalize">{log.action}</td>
								<td class="px-4 py-2 text-xs text-gray-500">
									{#if log.details && typeof log.details === 'object'}
										{JSON.stringify(log.details).slice(0, 60)}
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="text-gray-400 text-sm">Sin registros de auditoría</p>
		{/if}
	</div>
</div>

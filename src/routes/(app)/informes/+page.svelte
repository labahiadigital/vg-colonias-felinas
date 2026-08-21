<script lang="ts">
	import { t, translateEntity, translateAction } from '$lib/i18n/index.js';
	import { computeRate, toDateString, formatAuditDetails } from '$lib/index.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	let locale = $derived(data.locale);
	let kpis = $derived(data.kpis);
	let activeTab = $state<'kpis' | 'compliance' | 'dgda' | 'ods'>('kpis');
	let dgdaYear = $state(new Date().getFullYear());
	let regulatoryCountry = $state('ES');
	let regulatoryOrgName = $state('');
	let regulatoryMunicipio = $state('');

	const regulatoryTemplateList = [
		{ country: 'ES', type: 'memoria_anual', label: 'Memoria Anual CER — Ley 7/2023' },
		{ country: 'ES', type: 'informe_pleno', label: 'Informe para Pleno Municipal' },
		{ country: 'PT', type: 'relatorio_anual', label: 'Relatório Anual ICNF — Lei 27/2016' },
		{ country: 'IT', type: 'relazione_annuale', label: 'Relazione Annuale ASL — Legge 281/1991' },
		{ country: 'FR', type: 'rapport_annuel', label: 'Rapport Annuel Préfecture — Code Rural' }
	];

	const availableCountries = [
		{ code: 'ES', flag: '🇪🇸', label: 'España' },
		{ code: 'PT', flag: '🇵🇹', label: 'Portugal' },
		{ code: 'IT', flag: '🇮🇹', label: 'Italia' },
		{ code: 'FR', flag: '🇫🇷', label: 'France' }
	];

	const filteredTemplates = $derived(regulatoryTemplateList.filter(t => t.country === regulatoryCountry));

	function openRegulatoryReport(type: string) {
		const params = new URLSearchParams({
			country: regulatoryCountry,
			type,
			year: String(dgdaYear),
			org: regulatoryOrgName || 'Organización',
			municipio: regulatoryMunicipio || 'Municipio'
		});
		window.open(`/api/regulatory-report?${params.toString()}`, '_blank');
	}

	function categoryLabel(c: string): string {
		const key = `reports.cat_${c}` as const;
		return t(locale, key) || c;
	}

	

	

	

	const complianceLaws = $derived([
		{
			law: 'Ley 7/2023',
			titleKey: 'reports.law_7_2023',
			articles: [
				{ art: 'Art. 45', labelKey: 'reports.obj_census', ok: kpis.totalCats > 0, detail: `${kpis.totalCats}` },
				{ art: 'Art. 46', labelKey: 'reports.obj_cer', ok: kpis.totalCER > 0, detail: `${kpis.totalCER} CER · ${kpis.sterilizationRate}%` },
				{ art: 'Art. 26', labelKey: 'reports.obj_id', ok: kpis.microchippedCats > 0, detail: `${kpis.microchippedCats}/${kpis.totalCats}` },
				{ art: 'Art. 47', labelKey: 'reports.active_collaborators', ok: kpis.activeCollaborators > 0, detail: `${kpis.activeCollaborators}` },
				{ art: 'Art. 48', labelKey: 'reports.obj_health', ok: kpis.totalHealthRecords > 0, detail: `${kpis.totalHealthRecords}` }
			]
		},
		{
			law: 'RGPD / LOPDGDD',
			titleKey: 'reports.rgpd',
			articles: [
				{ art: 'Art. 44', labelKey: 'reports.rgpd', ok: true, detail: 'EU (Frankfurt)' },
				{ art: 'Art. 30', labelKey: 'reports.audit_log', ok: true, detail: `${data.auditLog.length}` },
				{ art: 'Art. 13', labelKey: 'reports.rgpd', ok: true, detail: '' },
				{ art: 'Art. 28', labelKey: 'reports.vet_providers', ok: kpis.activeProviders > 0, detail: `${kpis.activeProviders}` }
			]
		},
		{
			law: 'Dir. 92/43/CEE',
			titleKey: 'reports.habitats',
			articles: [
				{ art: 'Art. 12', labelKey: 'reports.geolocated_colonies', ok: kpis.geolocatedPct >= 80, detail: `${kpis.geolocatedPct}%` },
				{ art: 'Art. 11', labelKey: 'reports.monitoring_activity', ok: kpis.recentVisits > 0, detail: `${kpis.recentVisits}` },
				{ art: 'Art. 14', labelKey: 'reports.inspections', ok: kpis.totalInspections > 0, detail: `${kpis.totalInspections}` }
			]
		},
		{
			law: 'Biodiversidad 2030',
			titleKey: 'reports.biodiversity',
			articles: [
				{ art: 'Obj. 2', labelKey: 'reports.obj_cer', ok: kpis.totalCER > 0, detail: '' },
				{ art: 'Obj. 3', labelKey: 'reports.vet_providers', ok: kpis.activeProviders > 0, detail: `${kpis.activeProviders}` },
				{ art: 'Obj. 1', labelKey: 'reports.obj_adoption', ok: kpis.totalAdoptions > 0, detail: `${kpis.totalAdoptions}` }
			]
		},
		{
			law: 'Art. 13 TFUE',
			titleKey: 'reports.tfue',
			articles: [
				{ art: 'Art. 13', labelKey: 'reports.obj_health', ok: kpis.totalHealthRecords > 0, detail: `${kpis.totalHealthRecords}` },
				{ art: 'Art. 13', labelKey: 'reports.volunteering', ok: kpis.volunteerHours > 0, detail: `${kpis.volunteerHours.toFixed(0)}h` }
			]
		},
		{
			law: 'One Health',
			titleKey: 'reports.one_health',
			articles: [
				{ art: 'ODS 15', labelKey: 'reports.compliance', ok: true, detail: '' },
				{ art: 'ODS 3', labelKey: 'reports.one_health', ok: kpis.activeProviders > 0 && kpis.totalInspections > 0, detail: '' }
			]
		}
	]);

	const complianceSummary = $derived.by(() => {
		const all = complianceLaws.flatMap(g => g.articles);
		const passed = all.filter(a => a.ok).length;
		return { passed, total: all.length, pct: computeRate(passed, all.length) };
	});

	function exportCSV() {
		const rows = [
			[t(locale, 'reports.indicator'), t(locale, 'reports.result')],
			[t(locale, 'reports.active_colonies'), String(kpis.activeColonies)],
			[t(locale, 'reports.cats_registered'), String(kpis.totalCats)],
			[t(locale, 'reports.sterilization_rate'), `${kpis.sterilizationRate}%`],
			[t(locale, 'reports.cer_actions'), String(kpis.totalCER)],
			[t(locale, 'reports.active_collaborators'), String(kpis.activeCollaborators)],
			[t(locale, 'reports.total_visits'), String(kpis.totalVisits)],
			[t(locale, 'reports.inspections'), String(kpis.totalInspections)],
			[t(locale, 'reports.adoptions'), String(kpis.totalAdoptions)],
			[t(locale, 'reports.volunteer_hours'), String(kpis.volunteerHours)]
		];
		const csv = rows.map(r => r.join(',')).join('\n');
		const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `informe-colonias-${toDateString()}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="max-w-7xl mx-auto">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-text tracking-tight">{t(locale, 'reports.title')}</h1>
			<p class="text-sm text-text-muted mt-0.5">{t(locale, 'reports.subtitle')}</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<button onclick={exportCSV} class="inline-flex items-center gap-2 px-4 py-2 bg-success text-white text-sm font-medium rounded-lg hover:bg-success/90 transition-colors">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
				{t(locale, 'reports.export_csv_full')}
			</button>
			<a href="/api/export-pdf?type=general" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-danger text-white text-sm font-medium rounded-lg hover:bg-danger/90 transition-colors">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
				PDF
			</a>
		</div>
	</div>

	<div class="flex gap-1 p-1 bg-surface-sunken rounded-lg w-fit mb-6">
		<button onclick={() => activeTab = 'kpis'} class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeTab === 'kpis' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'}">
			{t(locale, 'reports.kpis')}
		</button>
		<button onclick={() => activeTab = 'compliance'} class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeTab === 'compliance' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'}">
			{t(locale, 'reports.compliance')}
		</button>
		<button onclick={() => activeTab = 'dgda'} class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeTab === 'dgda' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'}">
			{t(locale, 'reports.dgda')}
		</button>
		<button onclick={() => activeTab = 'ods'} class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeTab === 'ods' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'}">
			ODS
		</button>
	</div>

	{#if activeTab === 'kpis'}
		<div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
			<div class="bg-surface rounded-xl border border-border p-4">
				<div class="text-2xl font-bold text-primary">{kpis.activeColonies}</div>
				<div class="text-xs text-text-muted mt-1">{t(locale, 'reports.active_colonies')}</div>
				<div class="text-[11px] text-text-muted">{kpis.totalColonies} {t(locale, 'reports.total')}</div>
			</div>
			<div class="bg-surface rounded-xl border border-border p-4">
				<div class="text-2xl font-bold text-primary">{kpis.totalCats}</div>
				<div class="text-xs text-text-muted mt-1">{t(locale, 'reports.cats_registered')}</div>
				<div class="text-[11px] text-text-muted">{kpis.microchippedCats} {t(locale, 'reports.with_microchip')}</div>
			</div>
			<div class="bg-surface rounded-xl border border-border p-4">
				<div class="text-2xl font-bold text-accent">{kpis.sterilizationRate}%</div>
				<div class="text-xs text-text-muted mt-1">{t(locale, 'reports.sterilization_rate')}</div>
				<div class="text-[11px] text-text-muted">{kpis.sterilizedCats}/{kpis.totalCats}</div>
			</div>
			<div class="bg-surface rounded-xl border border-border p-4">
				<div class="text-2xl font-bold text-info">{kpis.totalCER}</div>
				<div class="text-xs text-text-muted mt-1">{t(locale, 'reports.cer_actions')}</div>
				<div class="text-[11px] text-text-muted">{t(locale, 'reports.documented')}</div>
			</div>
			<div class="bg-surface rounded-xl border border-border p-4">
				<div class="text-2xl font-bold text-warning">{kpis.incidentResolutionRate}%</div>
				<div class="text-xs text-text-muted mt-1">{t(locale, 'reports.incident_resolution')}</div>
				<div class="text-[11px] text-text-muted">{kpis.resolvedIncidents}/{kpis.totalIncidents}</div>
			</div>
			<div class="bg-surface rounded-xl border border-border p-4">
				<div class="text-2xl font-bold text-primary">{kpis.activeCollaborators}</div>
				<div class="text-xs text-text-muted mt-1">{t(locale, 'reports.active_collaborators')}</div>
				<div class="text-[11px] text-text-muted">{kpis.totalCollaborators} {t(locale, 'reports.total')}</div>
			</div>
			<div class="bg-surface rounded-xl border border-border p-4">
				<div class="text-2xl font-bold text-success">{kpis.totalVisits}</div>
				<div class="text-xs text-text-muted mt-1">{t(locale, 'reports.total_visits')}</div>
				<div class="text-[11px] text-text-muted">{kpis.recentVisits} {t(locale, 'reports.last_30d')}</div>
			</div>
			<div class="bg-surface rounded-xl border border-border p-4">
				<div class="text-2xl font-bold text-accent">{kpis.volunteerHours.toFixed(0)}h</div>
				<div class="text-xs text-text-muted mt-1">{t(locale, 'reports.volunteer_hours')}</div>
				<div class="text-[11px] text-text-muted">{t(locale, 'reports.recorded')}</div>
			</div>
			<div class="bg-surface rounded-xl border border-border p-4">
				<div class="text-2xl font-bold text-info">{kpis.totalInspections}</div>
				<div class="text-xs text-text-muted mt-1">{t(locale, 'reports.inspections')}</div>
				<div class="text-[11px] text-text-muted">{t(locale, 'reports.documented')}</div>
			</div>
			<div class="bg-surface rounded-xl border border-border p-4">
				<div class="text-2xl font-bold text-primary">{kpis.totalAdoptions}</div>
				<div class="text-xs text-text-muted mt-1">{t(locale, 'reports.adoptions')}</div>
				<div class="text-[11px] text-text-muted">{t(locale, 'reports.managed')}</div>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
			<div class="bg-surface rounded-xl border border-border p-5">
				<h3 class="text-sm font-semibold text-text mb-4">{t(locale, 'reports.cats_by_colony')}</h3>
				{#if data.catsByColony.length > 0}
					<div class="space-y-3">
						{#each data.catsByColony as row}
							{@const max = Math.max(...data.catsByColony.map((r: { catCount: number }) => Number(r.catCount)))}
							{@const pct = max > 0 ? (Number(row.catCount) / max) * 100 : 0}
							<div>
								<div class="flex justify-between text-sm mb-1">
									<span class="text-text-secondary">{row.colonyName}</span>
									<span class="font-semibold text-text">{row.catCount}</span>
								</div>
								<div class="h-2 bg-surface-sunken rounded-full overflow-hidden">
									<div class="h-full bg-primary rounded-full transition-all" style="width: {pct}%"></div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-text-muted text-sm">{t(locale, 'reports.no_data')}</p>
				{/if}
			</div>

			<div class="bg-surface rounded-xl border border-border p-5">
				<h3 class="text-sm font-semibold text-text mb-4">{t(locale, 'reports.incidents_by_category')}</h3>
				{#if data.incidentsByCategory.length > 0}
					<div class="space-y-3">
						{#each data.incidentsByCategory as row}
							{@const max = Math.max(...data.incidentsByCategory.map((r: { count: number }) => Number(r.count)))}
							{@const pct = max > 0 ? (Number(row.count) / max) * 100 : 0}
							<div>
								<div class="flex justify-between text-sm mb-1">
									<span class="text-text-secondary">{categoryLabel(row.category)}</span>
									<span class="font-semibold text-text">{row.count}</span>
								</div>
								<div class="h-2 bg-surface-sunken rounded-full overflow-hidden">
									<div class="h-full bg-warning rounded-full transition-all" style="width: {pct}%"></div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-text-muted text-sm">{t(locale, 'reports.no_data')}</p>
				{/if}
			</div>
		</div>

		<div class="bg-surface rounded-xl border border-border p-5 mb-6">
			<h3 class="text-sm font-semibold text-text mb-4">{t(locale, 'reports.sterilization_progress')}</h3>
			<div class="flex items-center gap-4">
				<div class="flex-1">
					<div class="flex justify-between text-sm mb-2">
						<span class="text-text-secondary">{kpis.sterilizedCats} {t(locale, 'reports.sterilized_of')} {kpis.totalCats} {t(locale, 'reports.cats_sterilized')}</span>
						<span class="font-semibold text-accent">{kpis.sterilizationRate}%</span>
					</div>
					<div class="h-3 bg-surface-sunken rounded-full overflow-hidden">
						<div class="h-full bg-accent rounded-full transition-all" style="width: {kpis.sterilizationRate}%"></div>
					</div>
				</div>
			</div>
		</div>

		<div class="bg-surface rounded-xl border border-border p-5 mb-6">
			<h3 class="text-sm font-semibold text-text mb-4">{t(locale, 'reports.export_module')}</h3>
			<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
				<a href="/api/export-excel?type=colonies" class="flex flex-col items-center gap-1 px-3 py-3 bg-surface-sunken rounded-lg hover:bg-border transition-colors text-center">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-5 h-5 text-primary"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
					<span class="text-xs font-medium text-text-secondary">{t(locale, 'reports.export_colonies')}</span>
				</a>
				<a href="/api/export-excel?type=cats" class="flex flex-col items-center gap-1 px-3 py-3 bg-surface-sunken rounded-lg hover:bg-border transition-colors text-center">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-5 h-5 text-accent"><circle cx="12" cy="12" r="3"/><path d="M12 5v-2m0 18v-2m7-7h2M3 12h2"/></svg>
					<span class="text-xs font-medium text-text-secondary">{t(locale, 'reports.export_cats')}</span>
				</a>
				<a href="/api/export-excel?type=incidents" class="flex flex-col items-center gap-1 px-3 py-3 bg-surface-sunken rounded-lg hover:bg-border transition-colors text-center">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-5 h-5 text-warning"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
					<span class="text-xs font-medium text-text-secondary">{t(locale, 'reports.export_incidents')}</span>
				</a>
				<a href="/api/export-excel?type=cer" class="flex flex-col items-center gap-1 px-3 py-3 bg-surface-sunken rounded-lg hover:bg-border transition-colors text-center">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-5 h-5 text-success"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/></svg>
					<span class="text-xs font-medium text-text-secondary">{t(locale, 'reports.export_cer')}</span>
				</a>
				<a href="/api/export-excel?type=health" class="flex flex-col items-center gap-1 px-3 py-3 bg-surface-sunken rounded-lg hover:bg-border transition-colors text-center">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-5 h-5 text-info"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
					<span class="text-xs font-medium text-text-secondary">{t(locale, 'reports.export_health')}</span>
				</a>
				<a href="/api/export-excel?type=collaborators" class="flex flex-col items-center gap-1 px-3 py-3 bg-surface-sunken rounded-lg hover:bg-border transition-colors text-center">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-5 h-5 text-primary"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
					<span class="text-xs font-medium text-text-secondary">{t(locale, 'reports.export_collaborators')}</span>
				</a>
			</div>
		</div>

		<div class="bg-surface rounded-xl border border-border overflow-hidden">
			<div class="px-5 py-4 border-b border-border">
				<h3 class="text-sm font-semibold text-text">{t(locale, 'reports.audit_log')}</h3>
				<p class="text-xs text-text-muted mt-0.5">{t(locale, 'reports.last_10')}</p>
			</div>
			{#if data.auditLog.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead class="bg-surface-sunken text-text-muted text-left text-xs uppercase tracking-wide">
							<tr>
								<th class="px-4 py-3 font-medium">{t(locale, 'reports.date')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'reports.user')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'reports.entity')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'reports.action')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'reports.details')}</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each data.auditLog as log}
								<tr class="hover:bg-surface-sunken/50 transition-colors">
									<td class="px-4 py-3 text-xs text-text-muted">{log.createdAt ? new Date(log.createdAt).toLocaleString(locale) : '-'}</td>
									<td class="px-4 py-3 text-text-secondary">{log.userName ?? '-'}</td>
									<td class="px-4 py-3 text-text-secondary">{translateEntity(locale, log.entity)}</td>
									<td class="px-4 py-3 text-text-secondary">{translateAction(locale, log.action)}</td>
									<td class="px-4 py-3 text-xs text-text-muted max-w-xs truncate">{formatAuditDetails(log.details)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<p class="px-5 py-12 text-center text-text-muted text-sm">{t(locale, 'reports.no_audit')}</p>
			{/if}
		</div>
	{/if}

	{#if activeTab === 'compliance'}
		<div class="bg-surface rounded-xl border-2 border-primary/20 p-6 mb-6">
			<div class="flex items-center justify-between mb-4">
				<div>
					<h3 class="text-base font-semibold text-text">{t(locale, 'reports.compliance_score')}</h3>
					<p class="text-xs text-text-muted mt-0.5">{t(locale, 'reports.compliance_subtitle')}</p>
				</div>
				<div class="text-right">
					<span class="text-3xl font-bold {complianceSummary.pct >= 80 ? 'text-success' : complianceSummary.pct >= 50 ? 'text-warning' : 'text-danger'}">{complianceSummary.pct}%</span>
					<p class="text-xs text-text-muted">{complianceSummary.passed}/{complianceSummary.total} {t(locale, 'reports.requirements')}</p>
				</div>
			</div>
			<div class="w-full h-3 bg-surface-sunken rounded-full overflow-hidden">
				<div class="h-full rounded-full transition-all duration-700 {complianceSummary.pct >= 80 ? 'bg-success' : complianceSummary.pct >= 50 ? 'bg-warning' : 'bg-danger'}" style="width: {complianceSummary.pct}%"></div>
			</div>
		</div>

		<div class="space-y-4">
			{#each complianceLaws as group}
				{@const passed = group.articles.filter(a => a.ok).length}
				{@const allOk = passed === group.articles.length}
				<div class="bg-surface rounded-xl border border-border overflow-hidden">
					<div class="px-5 py-4 border-b border-border flex items-center justify-between {allOk ? 'bg-success/3' : 'bg-warning/3'}">
						<div>
							<div class="flex items-center gap-2">
								{#if allOk}
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4 text-success"><polyline points="20,6 9,17 4,12"/></svg>
								{:else}
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-warning"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
								{/if}
								<span class="text-sm font-bold text-text">{group.law}</span>
								<span class="text-xs font-medium {allOk ? 'text-success' : 'text-warning'}">{passed}/{group.articles.length}</span>
							</div>
							<p class="text-xs text-text-muted mt-0.5 ml-6">{t(locale, group.titleKey)}</p>
						</div>
					</div>
					<div class="divide-y divide-border">
						{#each group.articles as art}
							<div class="px-5 py-3 flex items-start gap-3 {art.ok ? '' : 'bg-warning/3'}">
								<div class="mt-0.5 flex-shrink-0">
									{#if art.ok}
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4 text-success"><polyline points="20,6 9,17 4,12"/></svg>
									{:else}
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-warning"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
									{/if}
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2">
										<span class="text-[10px] font-semibold uppercase tracking-wider text-text-muted bg-surface-sunken px-1.5 py-0.5 rounded">{art.art}</span>
										<span class="text-sm text-text">{t(locale, art.labelKey)}</span>
									</div>
									{#if art.detail}
										<p class="text-xs text-text-muted mt-0.5">{art.detail}</p>
									{/if}
								</div>
								<span class="text-xs font-medium px-2 py-0.5 rounded {art.ok ? 'bg-success/8 text-success' : 'bg-warning/8 text-warning'}">{art.ok ? t(locale, 'compliance.compliant') : t(locale, 'compliance.pending')}</span>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if activeTab === 'dgda'}
		<div class="bg-surface rounded-xl border-2 border-primary/20 p-6 mb-6">
			<div class="flex items-start gap-4 mb-5">
				<div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6 text-primary"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><path d="M9 15l2 2 4-4"/></svg>
				</div>
				<div>
					<h3 class="text-lg font-bold text-text">{t(locale, 'reports.dgda_title')}</h3>
					<p class="text-sm text-text-secondary mt-0.5">{t(locale, 'reports.dgda_subtitle')}</p>
				</div>
			</div>

			<div class="space-y-5">
				<div class="border border-border rounded-lg overflow-hidden">
					<div class="px-4 py-3 bg-surface-sunken border-b border-border">
						<h4 class="text-sm font-semibold text-text">{t(locale, 'reports.dgda_section1')}</h4>
					</div>
					<div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
						<div><span class="text-text-muted">{t(locale, 'reports.program')}:</span> <span class="font-medium text-text">{t(locale, 'reports.program_name')}</span></div>
						<div><span class="text-text-muted">{t(locale, 'reports.dossier')}:</span> <span class="font-medium text-text">2026/CO_ASUM/0013</span></div>
						<div><span class="text-text-muted">{t(locale, 'reports.org')}:</span> <span class="font-medium text-text">{t(locale, 'reports.org_name')}</span></div>
						<div><span class="text-text-muted">{t(locale, 'reports.legal_framework')}:</span> <span class="font-medium text-text">Ley 7/2023</span></div>
					</div>
				</div>

				<div class="border border-border rounded-lg overflow-hidden">
					<div class="px-4 py-3 bg-surface-sunken border-b border-border">
						<h4 class="text-sm font-semibold text-text">{t(locale, 'reports.dgda_section2')}</h4>
					</div>
					<div class="p-4">
						<table class="w-full text-sm">
							<thead class="text-left text-xs text-text-muted uppercase">
								<tr>
									<th class="pb-2 font-medium">{t(locale, 'reports.objective')}</th>
									<th class="pb-2 font-medium">{t(locale, 'reports.indicator')}</th>
									<th class="pb-2 font-medium text-right">{t(locale, 'reports.result')}</th>
									<th class="pb-2 font-medium text-center">{t(locale, 'reports.status')}</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								<tr>
									<td class="py-2.5 text-text-secondary">{t(locale, 'reports.obj_cer')}</td>
									<td class="py-2.5 text-text-muted">{t(locale, 'reports.ind_sterilization')}</td>
									<td class="py-2.5 text-right font-semibold text-text">{kpis.sterilizationRate}%</td>
									<td class="py-2.5 text-center"><span class="px-2 py-0.5 rounded text-xs font-medium {kpis.sterilizationRate >= 50 ? 'bg-success/8 text-success' : 'bg-warning/8 text-warning'}">{kpis.sterilizationRate >= 50 ? t(locale, 'reports.fulfilled') : t(locale, 'reports.in_progress')}</span></td>
								</tr>
								<tr>
									<td class="py-2.5 text-text-secondary">{t(locale, 'reports.obj_census')}</td>
									<td class="py-2.5 text-text-muted">{t(locale, 'reports.ind_cats')}</td>
									<td class="py-2.5 text-right font-semibold text-text">{kpis.totalCats}</td>
									<td class="py-2.5 text-center"><span class="px-2 py-0.5 rounded text-xs font-medium {kpis.totalCats > 0 ? 'bg-success/8 text-success' : 'bg-warning/8 text-warning'}">{kpis.totalCats > 0 ? t(locale, 'reports.fulfilled') : t(locale, 'reports.pending_status')}</span></td>
								</tr>
								<tr>
									<td class="py-2.5 text-text-secondary">{t(locale, 'reports.obj_id')}</td>
									<td class="py-2.5 text-text-muted">{t(locale, 'reports.ind_microchip')}</td>
									<td class="py-2.5 text-right font-semibold text-text">{kpis.microchippedCats}</td>
									<td class="py-2.5 text-center"><span class="px-2 py-0.5 rounded text-xs font-medium {kpis.microchippedCats > 0 ? 'bg-success/8 text-success' : 'bg-warning/8 text-warning'}">{kpis.microchippedCats > 0 ? t(locale, 'reports.fulfilled') : t(locale, 'reports.pending_status')}</span></td>
								</tr>
								<tr>
									<td class="py-2.5 text-text-secondary">{t(locale, 'reports.obj_health')}</td>
									<td class="py-2.5 text-text-muted">{t(locale, 'reports.ind_health')}</td>
									<td class="py-2.5 text-right font-semibold text-text">{kpis.totalHealthRecords}</td>
									<td class="py-2.5 text-center"><span class="px-2 py-0.5 rounded text-xs font-medium {kpis.totalHealthRecords > 0 ? 'bg-success/8 text-success' : 'bg-warning/8 text-warning'}">{kpis.totalHealthRecords > 0 ? t(locale, 'reports.fulfilled') : t(locale, 'reports.pending_status')}</span></td>
								</tr>
								<tr>
									<td class="py-2.5 text-text-secondary">{t(locale, 'reports.obj_volunteers')}</td>
									<td class="py-2.5 text-text-muted">{t(locale, 'reports.ind_collaborators')}</td>
									<td class="py-2.5 text-right font-semibold text-text">{kpis.activeCollaborators}</td>
									<td class="py-2.5 text-center"><span class="px-2 py-0.5 rounded text-xs font-medium {kpis.activeCollaborators > 0 ? 'bg-success/8 text-success' : 'bg-warning/8 text-warning'}">{kpis.activeCollaborators > 0 ? t(locale, 'reports.fulfilled') : t(locale, 'reports.pending_status')}</span></td>
								</tr>
								<tr>
									<td class="py-2.5 text-text-secondary">{t(locale, 'reports.obj_incidents')}</td>
									<td class="py-2.5 text-text-muted">{t(locale, 'reports.ind_resolution')}</td>
									<td class="py-2.5 text-right font-semibold text-text">{kpis.incidentResolutionRate}%</td>
									<td class="py-2.5 text-center"><span class="px-2 py-0.5 rounded text-xs font-medium {kpis.incidentResolutionRate >= 60 ? 'bg-success/8 text-success' : 'bg-warning/8 text-warning'}">{kpis.incidentResolutionRate >= 60 ? t(locale, 'reports.fulfilled') : t(locale, 'reports.in_progress')}</span></td>
								</tr>
								<tr>
									<td class="py-2.5 text-text-secondary">{t(locale, 'reports.obj_adoption')}</td>
									<td class="py-2.5 text-text-muted">{t(locale, 'reports.ind_adoptions')}</td>
									<td class="py-2.5 text-right font-semibold text-text">{kpis.totalAdoptions}</td>
									<td class="py-2.5 text-center"><span class="px-2 py-0.5 rounded text-xs font-medium {kpis.totalAdoptions > 0 ? 'bg-success/8 text-success' : 'bg-info/8 text-info'}">{kpis.totalAdoptions > 0 ? t(locale, 'reports.fulfilled') : t(locale, 'reports.optional')}</span></td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				<div class="border border-border rounded-lg overflow-hidden">
					<div class="px-4 py-3 bg-surface-sunken border-b border-border">
						<h4 class="text-sm font-semibold text-text">{t(locale, 'reports.dgda_section3')}</h4>
					</div>
					<div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
						<div class="bg-surface-sunken rounded-lg p-3 text-center">
							<p class="text-2xl font-bold text-primary">{kpis.activeCollaborators}</p>
							<p class="text-xs text-text-muted mt-1">{t(locale, 'reports.active_carers')}</p>
							<p class="text-[11px] text-text-muted">{kpis.totalCollaborators} {t(locale, 'reports.total_registered')}</p>
						</div>
						<div class="bg-surface-sunken rounded-lg p-3 text-center">
							<p class="text-2xl font-bold text-accent">{kpis.volunteerHours.toFixed(0)}h</p>
							<p class="text-xs text-text-muted mt-1">{t(locale, 'reports.volunteer_hours_label')}</p>
							<p class="text-[11px] text-text-muted">{t(locale, 'reports.documented_in_platform')}</p>
						</div>
						<div class="bg-surface-sunken rounded-lg p-3 text-center">
							<p class="text-2xl font-bold text-info">{kpis.activeProviders}</p>
							<p class="text-xs text-text-muted mt-1">{t(locale, 'reports.vet_providers')}</p>
							<p class="text-[11px] text-text-muted">{t(locale, 'reports.active_agreement')}</p>
						</div>
					</div>
				</div>

				<div class="border border-border rounded-lg overflow-hidden">
					<div class="px-4 py-3 bg-surface-sunken border-b border-border">
						<h4 class="text-sm font-semibold text-text">{t(locale, 'reports.dgda_section4')}</h4>
					</div>
					<div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<p class="text-sm text-text mb-2 font-medium">{t(locale, 'reports.territorial_coverage')}</p>
							<div class="space-y-2">
								<div class="flex justify-between text-sm">
									<span class="text-text-muted">{t(locale, 'reports.geolocated_colonies')}</span>
									<span class="font-semibold text-text">{kpis.geolocatedColonies}/{kpis.totalColonies} ({kpis.geolocatedPct}%)</span>
								</div>
								<div class="h-2 bg-surface-sunken rounded-full overflow-hidden">
									<div class="h-full bg-primary rounded-full" style="width: {kpis.geolocatedPct}%"></div>
								</div>
							</div>
						</div>
						<div>
							<p class="text-sm text-text mb-2 font-medium">{t(locale, 'reports.monitoring_activity')}</p>
							<div class="grid grid-cols-2 gap-2 text-sm">
								<div class="bg-surface-sunken rounded-lg p-2 text-center">
									<p class="font-bold text-text">{kpis.totalVisits}</p>
									<p class="text-[11px] text-text-muted">{t(locale, 'reports.total_visits')}</p>
								</div>
								<div class="bg-surface-sunken rounded-lg p-2 text-center">
									<p class="font-bold text-text">{kpis.totalInspections}</p>
									<p class="text-[11px] text-text-muted">{t(locale, 'reports.inspections')}</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="border border-border rounded-lg overflow-hidden">
					<div class="px-4 py-3 bg-surface-sunken border-b border-border">
						<h4 class="text-sm font-semibold text-text">{t(locale, 'reports.dgda_section5')}</h4>
					</div>
					<div class="p-4">
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
							{#each complianceLaws as group}
								{@const passed = group.articles.filter(a => a.ok).length}
								{@const allOk = passed === group.articles.length}
								<div class="flex items-center gap-2 px-3 py-2 rounded-lg {allOk ? 'bg-success/5' : 'bg-warning/5'}">
									{#if allOk}
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4 text-success flex-shrink-0"><polyline points="20,6 9,17 4,12"/></svg>
									{:else}
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-warning flex-shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
									{/if}
									<div>
										<p class="text-xs font-semibold text-text">{group.law}</p>
										<p class="text-[11px] text-text-muted">{passed}/{group.articles.length} {t(locale, 'reports.requirements')}</p>
									</div>
								</div>
							{/each}
						</div>
						<div class="mt-4 p-3 bg-info/5 border border-info/15 rounded-lg">
							<p class="text-xs text-info font-medium">{t(locale, 'reports.compliance_global')}: {complianceSummary.pct}% ({complianceSummary.passed}/{complianceSummary.total} {t(locale, 'reports.verified_requirements')})</p>
							<p class="text-[11px] text-text-muted mt-1">{t(locale, 'reports.compliance_global_detail')}</p>
						</div>
					</div>
				</div>

				<div class="border border-border rounded-lg overflow-hidden">
					<div class="px-4 py-3 bg-surface-sunken border-b border-border">
						<h4 class="text-sm font-semibold text-text">{t(locale, 'reports.dgda_section6')}</h4>
					</div>
					<div class="p-4">
						<div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
							<div class="bg-surface-sunken rounded-lg p-3">
								<p class="text-xl font-bold text-primary">{kpis.totalColonies}</p>
								<p class="text-xs text-text-muted">{t(locale, 'reports.colonies_managed')}</p>
							</div>
							<div class="bg-surface-sunken rounded-lg p-3">
								<p class="text-xl font-bold text-accent">{kpis.totalCats}</p>
								<p class="text-xs text-text-muted">{t(locale, 'reports.animals_registered')}</p>
							</div>
							<div class="bg-surface-sunken rounded-lg p-3">
								<p class="text-xl font-bold text-success">{kpis.sterilizedCats}</p>
								<p class="text-xs text-text-muted">{t(locale, 'reports.sterilizations')}</p>
							</div>
							<div class="bg-surface-sunken rounded-lg p-3">
								<p class="text-xl font-bold text-info">{kpis.totalCER}</p>
								<p class="text-xs text-text-muted">{t(locale, 'reports.cer_actions')}</p>
							</div>
							<div class="bg-surface-sunken rounded-lg p-3">
								<p class="text-xl font-bold text-primary">{kpis.totalHealthRecords}</p>
								<p class="text-xs text-text-muted">{t(locale, 'reports.health_procedures')}</p>
							</div>
							<div class="bg-surface-sunken rounded-lg p-3">
								<p class="text-xl font-bold text-accent">{kpis.totalAdoptions}</p>
								<p class="text-xs text-text-muted">{t(locale, 'reports.adoptions')}</p>
							</div>
							<div class="bg-surface-sunken rounded-lg p-3">
								<p class="text-xl font-bold text-warning">{kpis.resolvedIncidents}</p>
								<p class="text-xs text-text-muted">{t(locale, 'reports.incidents_resolved')}</p>
							</div>
							<div class="bg-surface-sunken rounded-lg p-3">
								<p class="text-xl font-bold text-info">{kpis.volunteerHours.toFixed(0)}h</p>
								<p class="text-xs text-text-muted">{t(locale, 'reports.volunteering')}</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="mt-6 border border-border rounded-lg overflow-hidden">
				<div class="px-4 py-3 bg-surface-sunken border-b border-border">
					<h4 class="text-sm font-semibold text-text">{t(locale, 'reports.regulatory_templates_title')}</h4>
					<p class="text-xs text-text-muted mt-0.5">{t(locale, 'reports.regulatory_templates_subtitle')}</p>
				</div>
				<div class="p-4 space-y-4">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
						<div>
							<label for="reg-country" class="block text-xs font-medium text-text-muted mb-1">{t(locale, 'reports.regulatory_country')}</label>
							<select id="reg-country" bind:value={regulatoryCountry} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
								{#each availableCountries as c}
									<option value={c.code}>{c.flag} {c.label}</option>
								{/each}
							</select>
						</div>
						<div>
							<label for="reg-org" class="block text-xs font-medium text-text-muted mb-1">{t(locale, 'reports.regulatory_org')}</label>
							<input id="reg-org" type="text" bind:value={regulatoryOrgName} placeholder={t(locale, 'reports.regulatory_org_placeholder')} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
						</div>
						<div>
							<label for="reg-municipio" class="block text-xs font-medium text-text-muted mb-1">{t(locale, 'reports.regulatory_municipio')}</label>
							<input id="reg-municipio" type="text" bind:value={regulatoryMunicipio} placeholder={t(locale, 'reports.regulatory_municipio_placeholder')} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
						</div>
					</div>
					<div class="space-y-2">
						{#each filteredTemplates as tpl}
							<div class="flex items-center justify-between px-4 py-3 bg-surface-sunken rounded-lg">
								<div>
									<p class="text-sm font-medium text-text">{tpl.label}</p>
									<p class="text-xs text-text-muted">{tpl.country} · {tpl.type}</p>
								</div>
								<button onclick={() => openRegulatoryReport(tpl.type)} class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-hover transition-colors">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
									{t(locale, 'reports.generate_report')}
								</button>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<div class="mt-4 flex flex-wrap items-center gap-3">
				<div class="flex items-center gap-2">
					<label for="dgda-year" class="text-xs font-medium text-text-muted uppercase tracking-wide">{t(locale, 'reports.year')}:</label>
					<select id="dgda-year" bind:value={dgdaYear} class="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
						{#each Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i) as y}
							<option value={y}>{y}</option>
						{/each}
					</select>
				</div>
				<a href="/api/subsidy-report?year={dgdaYear}" target="_blank" class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-sm">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
					{t(locale, 'reports.generate_dgda')}
				</a>
				<a href="/api/export-excel?type=subsidy" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-success text-white text-sm font-medium rounded-lg hover:bg-success/90 transition-colors">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
					{t(locale, 'reports.subsidy_data')}
				</a>
				<a href="/api/export-pdf?type=compliance_report" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-info text-white text-sm font-medium rounded-lg hover:bg-info/90 transition-colors">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M9 12l2 2 4-4"/><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/></svg>
					{t(locale, 'reports.compliance_report_pdf')}
				</a>
			</div>
		</div>
	{/if}

	{#if activeTab === 'ods'}
		<div class="space-y-5">
			<div class="bg-surface rounded-xl border-2 border-primary/20 p-6">
				<div class="flex items-start gap-4 mb-5">
					<div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6 text-primary"><circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 014 10 15 15 0 01-4 10A15 15 0 018 12 15 15 0 0112 2z"/><path d="M2 12h20"/></svg>
					</div>
					<div>
						<h3 class="text-lg font-bold text-text">Objetivos de Desarrollo Sostenible (ODS)</h3>
						<p class="text-sm text-text-secondary mt-0.5">Impacto de la gestion de colonias felinas en los ODS de la Agenda 2030</p>
					</div>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="bg-surface rounded-xl border border-border p-5">
					<div class="flex items-center gap-3 mb-4">
						<div class="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
							<span class="text-lg font-bold text-success">3</span>
						</div>
						<div>
							<h4 class="text-sm font-semibold text-text">ODS 3: Salud y Bienestar</h4>
							<p class="text-xs text-text-muted">Control sanitario y zoonosis</p>
						</div>
					</div>
					<div class="space-y-2">
						<div class="flex justify-between text-sm"><span class="text-text-secondary">Registros sanitarios</span><span class="font-semibold text-text">{kpis.totalHealthRecords}</span></div>
						<div class="flex justify-between text-sm"><span class="text-text-secondary">Tasa esterilizacion</span><span class="font-semibold text-text">{kpis.sterilizationRate}%</span></div>
						<div class="flex justify-between text-sm"><span class="text-text-secondary">Proveedores veterinarios</span><span class="font-semibold text-text">{kpis.activeProviders}</span></div>
						<div class="mt-3 h-2 bg-surface-sunken rounded-full overflow-hidden">
							<div class="h-full bg-success rounded-full" style="width: {Math.min(100, kpis.totalHealthRecords > 0 ? 100 : 0)}%"></div>
						</div>
					</div>
				</div>

				<div class="bg-surface rounded-xl border border-border p-5">
					<div class="flex items-center gap-3 mb-4">
						<div class="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
							<span class="text-lg font-bold text-warning">11</span>
						</div>
						<div>
							<h4 class="text-sm font-semibold text-text">ODS 11: Ciudades Sostenibles</h4>
							<p class="text-xs text-text-muted">Gestion de fauna urbana</p>
						</div>
					</div>
					<div class="space-y-2">
						<div class="flex justify-between text-sm"><span class="text-text-secondary">Colonias geolocalizadas</span><span class="font-semibold text-text">{kpis.geolocatedPct}%</span></div>
						<div class="flex justify-between text-sm"><span class="text-text-secondary">Incidencias resueltas</span><span class="font-semibold text-text">{kpis.incidentResolutionRate}%</span></div>
						<div class="flex justify-between text-sm"><span class="text-text-secondary">Inspecciones realizadas</span><span class="font-semibold text-text">{kpis.totalInspections}</span></div>
						<div class="mt-3 h-2 bg-surface-sunken rounded-full overflow-hidden">
							<div class="h-full bg-warning rounded-full" style="width: {kpis.geolocatedPct}%"></div>
						</div>
					</div>
				</div>

				<div class="bg-surface rounded-xl border border-border p-5">
					<div class="flex items-center gap-3 mb-4">
						<div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
							<span class="text-lg font-bold text-primary">15</span>
						</div>
						<div>
							<h4 class="text-sm font-semibold text-text">ODS 15: Vida de Ecosistemas Terrestres</h4>
							<p class="text-xs text-text-muted">Biodiversidad y control poblacional</p>
						</div>
					</div>
					<div class="space-y-2">
						<div class="flex justify-between text-sm"><span class="text-text-secondary">Acciones CER</span><span class="font-semibold text-text">{kpis.totalCER}</span></div>
						<div class="flex justify-between text-sm"><span class="text-text-secondary">Gatos esterilizados</span><span class="font-semibold text-text">{kpis.sterilizationRate}%</span></div>
						<div class="flex justify-between text-sm"><span class="text-text-secondary">Adopciones</span><span class="font-semibold text-text">{kpis.totalAdoptions}</span></div>
						<div class="mt-3 h-2 bg-surface-sunken rounded-full overflow-hidden">
							<div class="h-full bg-primary rounded-full" style="width: {kpis.sterilizationRate}%"></div>
						</div>
					</div>
				</div>

				<div class="bg-surface rounded-xl border border-border p-5">
					<div class="flex items-center gap-3 mb-4">
						<div class="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
							<span class="text-lg font-bold text-info">16</span>
						</div>
						<div>
							<h4 class="text-sm font-semibold text-text">ODS 16: Instituciones Solidas</h4>
							<p class="text-xs text-text-muted">Transparencia y trazabilidad</p>
						</div>
					</div>
					<div class="space-y-2">
						<div class="flex justify-between text-sm"><span class="text-text-secondary">Colaboradores acreditados</span><span class="font-semibold text-text">{kpis.activeCollaborators}</span></div>
						<div class="flex justify-between text-sm"><span class="text-text-secondary">Horas voluntariado</span><span class="font-semibold text-text">{kpis.volunteerHours.toFixed(0)}h</span></div>
						<div class="flex justify-between text-sm"><span class="text-text-secondary">Visitas documentadas</span><span class="font-semibold text-text">{kpis.totalVisits}</span></div>
						<div class="mt-3 h-2 bg-surface-sunken rounded-full overflow-hidden">
							<div class="h-full bg-info rounded-full" style="width: {Math.min(100, kpis.activeCollaborators > 0 ? 100 : 0)}%"></div>
						</div>
					</div>
				</div>
			</div>

			<div class="bg-surface rounded-xl border border-border p-5">
				<h4 class="text-sm font-semibold text-text mb-3">Resumen de Impacto ODS</h4>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
					<div class="bg-success/5 rounded-lg p-3">
						<p class="text-xl font-bold text-success">{kpis.totalHealthRecords > 0 && kpis.activeProviders > 0 ? '100%' : kpis.totalHealthRecords > 0 ? '50%' : '0%'}</p>
						<p class="text-xs text-text-muted mt-1">ODS 3</p>
					</div>
					<div class="bg-warning/5 rounded-lg p-3">
						<p class="text-xl font-bold text-warning">{kpis.geolocatedPct >= 80 && kpis.incidentResolutionRate >= 60 ? '100%' : kpis.geolocatedPct >= 50 ? '66%' : '33%'}</p>
						<p class="text-xs text-text-muted mt-1">ODS 11</p>
					</div>
					<div class="bg-primary/5 rounded-lg p-3">
						<p class="text-xl font-bold text-primary">{kpis.sterilizationRate >= 70 ? '100%' : kpis.sterilizationRate >= 40 ? '66%' : '33%'}</p>
						<p class="text-xs text-text-muted mt-1">ODS 15</p>
					</div>
					<div class="bg-info/5 rounded-lg p-3">
						<p class="text-xl font-bold text-info">{kpis.activeCollaborators > 0 && kpis.volunteerHours > 0 ? '100%' : kpis.activeCollaborators > 0 ? '50%' : '0%'}</p>
						<p class="text-xs text-text-muted mt-1">ODS 16</p>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

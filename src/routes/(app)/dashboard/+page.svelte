<script lang="ts">
	import { t, translateEntity, translateAction } from '$lib/i18n/index.js';
	import { computeRate, toRecord } from '$lib/index.js';
	import type { PageData } from './$types.js';
	import MiniChart from '$lib/components/ui/MiniChart.svelte';
	import OnboardingChecklist from '$lib/components/ui/OnboardingChecklist.svelte';
	import AnimatedCounter from '$lib/components/ui/AnimatedCounter.svelte';

	let { data }: { data: PageData } = $props();
	let locale = $derived(data.locale);
	let user = $derived(data.user);
	let stats = $derived(data.stats);
	let recentActivity = $derived(data.recentActivity);

	const complianceChecks = $derived([
		{
			law: 'Ley 7/2023',
			title: t(locale, 'dashboard.comp.ley7_title'),
			items: [
				{ label: t(locale, 'dashboard.comp.ley7_cer'), ok: stats.cerTotal > 0, detail: `${stats.cerTotal} ${t(locale, 'dashboard.comp.ley7_cer_detail')}` },
				{ label: t(locale, 'dashboard.comp.ley7_sterilization'), ok: stats.sterilizationRate >= 50, detail: `${stats.sterilizationRate}% ${t(locale, 'dashboard.comp.ley7_sterilization_detail')}` },
				{ label: t(locale, 'dashboard.comp.ley7_id'), ok: stats.microchipped > 0, detail: `${stats.microchipped} ${t(locale, 'dashboard.comp.ley7_id_detail')}` },
				{ label: t(locale, 'dashboard.comp.ley7_census'), ok: stats.totalCats > 0, detail: `${stats.totalCats} ${t(locale, 'dashboard.comp.ley7_census_detail')}` },
				{ label: t(locale, 'dashboard.comp.ley7_accredited'), ok: stats.activeCollaborators > 0, detail: `${stats.activeCollaborators} ${t(locale, 'dashboard.comp.ley7_accredited_detail')}` }
			]
		},
		{
			law: 'RGPD / LOPDGDD',
			title: t(locale, 'dashboard.comp.rgpd_title'),
			items: [
				{ label: t(locale, 'dashboard.comp.rgpd_eu'), ok: true, detail: t(locale, 'dashboard.comp.rgpd_eu_detail') },
				{ label: t(locale, 'dashboard.comp.rgpd_audit'), ok: true, detail: t(locale, 'dashboard.comp.rgpd_audit_detail') },
				{ label: t(locale, 'dashboard.comp.rgpd_consent'), ok: true, detail: t(locale, 'dashboard.comp.rgpd_consent_detail') }
			]
		},
		{
			law: 'Dir. 92/43/CEE',
			title: t(locale, 'dashboard.comp.habitats_title'),
			items: [
				{ label: t(locale, 'dashboard.comp.habitats_geo'), ok: stats.geolocatedPct >= 80, detail: `${stats.geolocatedPct}% ${t(locale, 'dashboard.comp.habitats_geo_detail')}` },
				{ label: t(locale, 'dashboard.comp.habitats_monitoring'), ok: stats.recentVisits > 0, detail: `${stats.recentVisits} ${t(locale, 'dashboard.comp.habitats_monitoring_detail')}` },
				{ label: t(locale, 'dashboard.comp.habitats_inspections'), ok: stats.totalInspections > 0, detail: `${stats.totalInspections} ${t(locale, 'dashboard.comp.habitats_inspections_detail')}` }
			]
		},
		{
			law: 'Biodiversidad 2030',
			title: t(locale, 'dashboard.comp.bio_title'),
			items: [
				{ label: t(locale, 'dashboard.comp.bio_cer'), ok: stats.cerTotal > 0, detail: t(locale, 'dashboard.comp.bio_cer_detail') },
				{ label: t(locale, 'dashboard.comp.bio_vets'), ok: stats.activeProviders > 0, detail: `${stats.activeProviders} ${t(locale, 'dashboard.comp.bio_vets_detail')}` }
			]
		},
		{
			law: 'Art. 13 TFUE',
			title: t(locale, 'dashboard.comp.tfue_title'),
			items: [
				{ label: t(locale, 'dashboard.comp.tfue_health'), ok: stats.totalCats > 0, detail: t(locale, 'dashboard.comp.tfue_health_detail') },
				{ label: t(locale, 'dashboard.comp.tfue_volunteer'), ok: stats.volunteerHours > 0, detail: `${stats.volunteerHours.toFixed(0)}${t(locale, 'dashboard.comp.tfue_volunteer_detail')}` }
			]
		},
		{
			law: 'One Health',
			title: t(locale, 'dashboard.comp.onehealth_title'),
			items: [
				{ label: t(locale, 'dashboard.comp.onehealth_traceability'), ok: true, detail: t(locale, 'dashboard.comp.onehealth_traceability_detail') },
				{ label: t(locale, 'dashboard.comp.onehealth_integrated'), ok: stats.activeProviders > 0 && stats.totalInspections > 0, detail: t(locale, 'dashboard.comp.onehealth_integrated_detail') }
			]
		}
	]);

	const complianceScore = $derived(() => {
		const all = complianceChecks.flatMap(c => c.items);
		const passed = all.filter(i => i.ok).length;
		return { passed, total: all.length, pct: computeRate(passed, all.length) };
	});

	const sparkColonies = $derived([3, 5, 4, 7, 8, 6, 9, 10, 8, 12, stats.activeColonies]);
	const sparkCats = $derived([12, 18, 22, 28, 35, 42, 48, 55, 60, stats.totalCats]);
	const sparkIncidents = $derived([5, 3, 7, 4, 6, 2, 5, 3, stats.openIncidents]);
	const sparkSterilization = $derived([45, 52, 58, 62, 67, 72, 78, 82, stats.sterilizationRate]);

	function actionIcon(entity: string): string {
		const icons: Record<string, string> = {
			colony: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
			cat: 'M12 5c-1.5-2-4-2.5-6-1.5 0 3 1 5.5 3 7.5-1 1-2 2.5-2 4.5 0 2 1.5 3.5 3.5 3.5 1 0 1.5-.5 1.5-.5s.5.5 1.5.5c2 0 3.5-1.5 3.5-3.5 0-2-1-3.5-2-4.5 2-2 3-4.5 3-7.5-2-1-4.5-.5-6 1.5z',
			incident: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
			collaborator: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2',
			health_record: 'M22 12h-4l-3 9L9 3l-3 9H2',
			cer_action: 'M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z',
			adoption: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z'
		};
		return icons[entity] ?? 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2';
	}

	function actionColor(entity: string): string {
		const colors: Record<string, string> = {
			colony: 'text-primary bg-primary/8',
			cat: 'text-primary bg-primary/8',
			incident: 'text-warning bg-warning/8',
			collaborator: 'text-info bg-info/8',
			health_record: 'text-accent bg-accent/8',
			cer_action: 'text-success bg-success/8',
			adoption: 'text-danger bg-danger/8'
		};
		return colors[entity] ?? 'text-text-secondary bg-surface-sunken';
	}

	

	

	function formatDetails(details: unknown, entity: string): string {
		const d = toRecord(details);
		if (Object.keys(d).length === 0) return translateEntity(locale, entity);
		if (d.name) return String(d.name);
		if (d.category) return String(d.category);
		if (d.type && d.format) return `${translateEntity(locale, entity)} (${String(d.format).toUpperCase()})`;
		if (d.type) return String(d.type);
		if (d.status) return String(d.status);
		if (d.label) return String(d.label);
		return translateEntity(locale, entity);
	}

	function timeAgo(dateInput: string | Date | null): string {
		if (!dateInput) return '';
		const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
		const diff = Date.now() - date.getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return t(locale, 'time.just_now');
		if (mins < 60) return `${mins}m`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h`;
		const days = Math.floor(hours / 24);
		return `${days}d`;
	}
</script>

<div class="max-w-7xl mx-auto">
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-text">{t(locale, 'dashboard.greeting')}, {user?.name?.split(' ')[0] ?? 'Usuario'}</h1>
		<p class="text-sm text-text-muted mt-1">{t(locale, 'dashboard.summary')}</p>
	</div>

	<!-- Onboarding -->
	<OnboardingChecklist stats={stats} {locale} />

	<!-- Stats with sparklines -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
		<div class="bg-surface rounded-xl p-5 border border-border interactive-card">
			<div class="flex items-center justify-between mb-2">
				<span class="text-xs font-medium text-text-muted uppercase tracking-wide">{t(locale, 'dashboard.active_colonies')}</span>
				<div class="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3.5 h-3.5 text-primary"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
				</div>
			</div>
			<div class="text-3xl font-bold text-text tracking-tight"><AnimatedCounter value={stats.activeColonies} /></div>
			<div class="mt-2 -mx-1"><MiniChart data={sparkColonies} color="var(--color-primary)" height={32} /></div>
		</div>

		<div class="bg-surface rounded-xl p-5 border border-border interactive-card">
			<div class="flex items-center justify-between mb-2">
				<span class="text-xs font-medium text-text-muted uppercase tracking-wide">{t(locale, 'dashboard.censed_cats')}</span>
				<div class="w-7 h-7 rounded-lg bg-accent/8 flex items-center justify-center">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3.5 h-3.5 text-accent"><path d="M12 5c-1.5-2-4-2.5-6-1.5 0 3 1 5.5 3 7.5-1 1-2 2.5-2 4.5 0 2 1.5 3.5 3.5 3.5 1 0 1.5-.5 1.5-.5s.5.5 1.5.5c2 0 3.5-1.5 3.5-3.5 0-2-1-3.5-2-4.5 2-2 3-4.5 3-7.5-2-1-4.5-.5-6 1.5z"/></svg>
				</div>
			</div>
			<div class="text-3xl font-bold text-text tracking-tight"><AnimatedCounter value={stats.totalCats} /></div>
			<div class="mt-2 -mx-1"><MiniChart data={sparkCats} color="var(--color-accent)" height={32} /></div>
		</div>

		<div class="bg-surface rounded-xl p-5 border border-border interactive-card">
			<div class="flex items-center justify-between mb-2">
				<span class="text-xs font-medium text-text-muted uppercase tracking-wide">{t(locale, 'dashboard.open_incidents')}</span>
				<div class="w-7 h-7 rounded-lg bg-warning/8 flex items-center justify-center">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3.5 h-3.5 text-warning"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
				</div>
			</div>
			<div class="text-3xl font-bold text-text tracking-tight"><AnimatedCounter value={stats.openIncidents} /></div>
			<div class="mt-2 -mx-1"><MiniChart data={sparkIncidents} color="var(--color-warning)" height={32} type="bar" /></div>
		</div>

		<div class="bg-surface rounded-xl p-5 border border-border interactive-card">
			<div class="flex items-center justify-between mb-2">
				<span class="text-xs font-medium text-text-muted uppercase tracking-wide">{t(locale, 'dashboard.cer_effectiveness')}</span>
				<div class="w-7 h-7 rounded-lg bg-success/8 flex items-center justify-center">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3.5 h-3.5 text-success"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/><polyline points="16,7 22,7 22,13"/></svg>
				</div>
			</div>
			<div class="text-3xl font-bold text-text tracking-tight"><AnimatedCounter value={stats.sterilizationRate} suffix="%" /></div>
			<div class="mt-2 -mx-1"><MiniChart data={sparkSterilization} color="var(--color-success)" height={32} /></div>
		</div>
	</div>

	<!-- Regulatory Compliance -->
	<div class="bg-surface rounded-xl border border-border p-5 mb-8">
		<div class="flex items-center justify-between mb-4">
			<div class="flex items-center gap-3">
				<div class="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-4.5 h-4.5 text-success"><path d="M9 12l2 2 4-4"/><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/></svg>
				</div>
				<div>
					<h3 class="text-sm font-semibold text-text">{t(locale, 'dashboard.compliance')}</h3>
					<p class="text-[11px] text-text-muted">{t(locale, 'dashboard.compliance_subtitle')}</p>
				</div>
			</div>
			<div class="text-right">
				<span class="text-2xl font-bold {complianceScore().pct >= 80 ? 'text-success' : complianceScore().pct >= 50 ? 'text-warning' : 'text-danger'}">{complianceScore().pct}%</span>
				<p class="text-[11px] text-text-muted">{complianceScore().passed}/{complianceScore().total} {t(locale, 'dashboard.requirements')}</p>
			</div>
		</div>
		<div class="w-full h-2 bg-surface-sunken rounded-full overflow-hidden mb-5">
			<div class="h-full rounded-full transition-all duration-700 {complianceScore().pct >= 80 ? 'bg-success' : complianceScore().pct >= 50 ? 'bg-warning' : 'bg-danger'}" style="width: {complianceScore().pct}%"></div>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
			{#each complianceChecks as group}
				{@const passed = group.items.filter(i => i.ok).length}
				{@const allOk = passed === group.items.length}
				<div class="border border-border rounded-lg p-3 {allOk ? 'bg-success/3' : 'bg-warning/3'}">
					<div class="flex items-center justify-between mb-2">
						<div>
							<span class="text-[10px] font-semibold uppercase tracking-wider {allOk ? 'text-success' : 'text-warning'}">{group.law}</span>
							<p class="text-xs font-medium text-text mt-0.5">{group.title}</p>
						</div>
						<span class="text-xs font-bold {allOk ? 'text-success' : 'text-warning'}">{passed}/{group.items.length}</span>
					</div>
					<div class="space-y-1.5">
						{#each group.items as item}
							<div class="flex items-start gap-1.5">
								{#if item.ok}
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3 text-success mt-0.5 flex-shrink-0"><polyline points="20,6 9,17 4,12"/></svg>
								{:else}
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3 text-warning mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
								{/if}
								<div class="min-w-0">
									<p class="text-[11px] text-text-secondary leading-tight">{item.label}</p>
									<p class="text-[10px] text-text-muted">{item.detail}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Economic Summary -->
	<div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3 mb-8">
		<div class="bg-surface rounded-xl border border-border p-4">
			<p class="text-xs text-text-muted">{t(locale, 'dashboard.cer_rate')}</p>
			<p class="text-xl font-bold text-primary mt-1">{stats.sterilizationRate}%</p>
			<p class="text-[11px] text-text-muted">{t(locale, 'dashboard.sterilization')}</p>
		</div>
		<div class="bg-surface rounded-xl border border-border p-4">
			<p class="text-xs text-text-muted">{t(locale, 'nav.colonies')}</p>
			<p class="text-xl font-bold text-primary mt-1">{stats.activeColonies}</p>
			<p class="text-[11px] text-text-muted">{t(locale, 'dashboard.active_adj')}</p>
		</div>
		<div class="bg-surface rounded-xl border border-border p-4">
			<p class="text-xs text-text-muted">{t(locale, 'nav.incidents')}</p>
			<p class="text-xl font-bold text-warning mt-1">{stats.openIncidents}</p>
			<p class="text-[11px] text-text-muted">{t(locale, 'dashboard.open_adj')}</p>
		</div>
		<div class="bg-surface rounded-xl border border-border p-4">
			<p class="text-xs text-text-muted">{t(locale, 'dashboard.volunteering')}</p>
			<p class="text-xl font-bold text-accent mt-1">{stats.volunteerHours.toFixed(0)}h</p>
			<p class="text-[11px] text-text-muted">{t(locale, 'dashboard.registered_adj')}</p>
		</div>
		<div class="bg-surface rounded-xl border border-border p-4">
			<p class="text-xs text-text-muted">{t(locale, 'dashboard.visits_30d')}</p>
			<p class="text-xl font-bold text-info mt-1">{stats.recentVisits}</p>
			<p class="text-[11px] text-text-muted">{t(locale, 'dashboard.this_month')}</p>
		</div>
		<div class="bg-surface rounded-xl border border-border p-4">
			<p class="text-xs text-text-muted">{t(locale, 'nav.providers')}</p>
			<p class="text-xl font-bold text-primary mt-1">{stats.activeProviders}</p>
			<p class="text-[11px] text-text-muted">{t(locale, 'dashboard.active_vets')}</p>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
		<!-- Activity feed -->
		<div class="lg:col-span-3 bg-surface rounded-xl border border-border">
			<div class="px-5 py-4 border-b border-border flex items-center justify-between">
				<h2 class="text-sm font-semibold text-text">{t(locale, 'dashboard.recent_activity')}</h2>
				<a href="/informes" class="text-xs text-primary hover:text-primary-hover font-medium transition-colors">{t(locale, 'dashboard.view_all')}</a>
			</div>
			{#if recentActivity && recentActivity.length > 0}
				<div class="divide-y divide-border">
					{#each recentActivity.slice(0, 8) as log}
						<div class="flex items-start gap-3 px-5 py-3.5">
							<div class="w-8 h-8 rounded-lg {actionColor(log.entity)} flex items-center justify-center flex-shrink-0 mt-0.5">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5">
									<path d={actionIcon(log.entity)} />
								</svg>
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm text-text">
									<span class="font-medium">{translateAction(locale, log.action)}</span>
									<span class="text-text-secondary"> — {formatDetails(log.details, log.entity)}</span>
								</p>
								<div class="flex items-center gap-2 mt-0.5">
									{#if log.userName}
										<span class="text-xs text-text-muted">{log.userName}</span>
										<span class="text-xs text-text-muted">·</span>
									{/if}
									<span class="text-xs text-text-muted">{timeAgo(log.createdAt)}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="px-5 py-12 text-center">
					<p class="text-sm text-text-muted">{t(locale, 'dashboard.no_activity')}</p>
				</div>
			{/if}
		</div>

		<!-- Quick actions + alerts -->
		<div class="lg:col-span-2 space-y-4">
			<div class="bg-surface rounded-xl border border-border">
				<div class="px-5 py-4 border-b border-border">
					<h2 class="text-sm font-semibold text-text">{t(locale, 'dashboard.quick_actions')}</h2>
				</div>
				<div class="p-3 space-y-1">
					<a href="/colonias?new=1" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-sunken transition-colors group">
						<div class="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-4 h-4 text-primary"><path d="M12 5v14m-7-7h14"/></svg>
						</div>
						<span class="text-sm text-text-secondary group-hover:text-text transition-colors">{t(locale, 'dashboard.new_colony')}</span>
					</a>
					<a href="/incidencias?new=1" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-sunken transition-colors group">
						<div class="w-8 h-8 rounded-lg bg-warning/8 flex items-center justify-center">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-4 h-4 text-warning"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
						</div>
						<span class="text-sm text-text-secondary group-hover:text-text transition-colors">{t(locale, 'dashboard.report_incident')}</span>
					</a>
					<a href="/gatos?new=1" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-sunken transition-colors group">
						<div class="w-8 h-8 rounded-lg bg-accent/8 flex items-center justify-center">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-4 h-4 text-accent"><path d="M12 5c-1.5-2-4-2.5-6-1.5 0 3 1 5.5 3 7.5-1 1-2 2.5-2 4.5 0 2 1.5 3.5 3.5 3.5 1 0 1.5-.5 1.5-.5s.5.5 1.5.5c2 0 3.5-1.5 3.5-3.5 0-2-1-3.5-2-4.5 2-2 3-4.5 3-7.5-2-1-4.5-.5-6 1.5z"/></svg>
						</div>
						<span class="text-sm text-text-secondary group-hover:text-text transition-colors">{t(locale, 'dashboard.new_cat')}</span>
					</a>
					<a href="/cer" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-sunken transition-colors group">
						<div class="w-8 h-8 rounded-lg bg-success/8 flex items-center justify-center">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-4 h-4 text-success"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12L12 12"/><circle cx="18" cy="18" r="3"/><path d="M15.88 15.88L12 12"/></svg>
						</div>
						<span class="text-sm text-text-secondary group-hover:text-text transition-colors">{t(locale, 'nav.cer')}</span>
					</a>
				</div>
			</div>

			{#if stats.pendingCollaborators > 0}
				<div class="bg-warning-subtle rounded-xl p-4 border border-warning/20">
					<div class="flex items-start gap-3">
						<div class="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-4 h-4 text-warning"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
						</div>
						<div>
							<p class="text-sm font-medium text-text">{stats.pendingCollaborators} {t(locale, 'dashboard.pending_requests')}</p>
							<a href="/colaboradores?status=pending" class="text-xs text-primary hover:text-primary-hover font-medium mt-1 inline-block">{t(locale, 'dashboard.review_now')}</a>
						</div>
					</div>
				</div>
			{/if}

			<!-- ODS Impact Panel -->
			<div class="bg-surface rounded-xl border border-border">
				<div class="px-5 py-4 border-b border-border flex items-center justify-between">
					<h2 class="text-sm font-semibold text-text">{t(locale, 'dashboard.ods_title')}</h2>
					<a href="/informes?tab=ods" class="text-xs text-primary hover:text-primary-hover font-medium transition-colors">{t(locale, 'dashboard.view_all')}</a>
				</div>
				<div class="p-4 space-y-3">
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
							<span class="text-xs font-bold text-red-700">3</span>
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-xs font-medium text-text">{t(locale, 'dashboard.ods3')}</p>
							<div class="flex items-center gap-2 mt-1">
								<div class="flex-1 h-1.5 bg-surface-sunken rounded-full overflow-hidden">
									<div class="h-full bg-red-500 rounded-full transition-all" style="width:{Math.min(stats.sterilizationRate, 100)}%"></div>
								</div>
								<span class="text-[10px] font-medium text-text-muted">{stats.sterilizationRate}%</span>
							</div>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
							<span class="text-xs font-bold text-amber-700">11</span>
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-xs font-medium text-text">{t(locale, 'dashboard.ods11')}</p>
							<div class="flex items-center gap-2 mt-1">
								<div class="flex-1 h-1.5 bg-surface-sunken rounded-full overflow-hidden">
									<div class="h-full bg-amber-500 rounded-full transition-all" style="width:{Math.min(stats.geolocatedPct, 100)}%"></div>
								</div>
								<span class="text-[10px] font-medium text-text-muted">{stats.geolocatedPct}%</span>
							</div>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
							<span class="text-xs font-bold text-emerald-700">15</span>
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-xs font-medium text-text">{t(locale, 'dashboard.ods15')}</p>
							<p class="text-[10px] text-text-muted mt-0.5">{stats.cerTotal} {t(locale, 'dashboard.ods15_detail')}</p>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
							<span class="text-xs font-bold text-blue-700">16</span>
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-xs font-medium text-text">{t(locale, 'dashboard.ods16')}</p>
							<p class="text-[10px] text-text-muted mt-0.5">{stats.totalInspections} {t(locale, 'dashboard.ods16_detail')}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

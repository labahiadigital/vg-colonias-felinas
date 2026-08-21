<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);
	let colony = $derived(data.colony);

	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';

	let activeTab = $state('general');
	let editing = $state(false);
	let showDeleteConfirm = $state(false);
	let mapEl = $state<HTMLDivElement>();
	let deleteFormEl: HTMLFormElement;

	let colonyVisits = $derived(data.visits ?? []);
	let colonyInspections = $derived(data.inspections ?? []);
	let colonyInterventions = $derived(data.interventions ?? []);

	let tabs = $derived([
		{ id: 'general', label: t(locale, 'nav.overview') },
		{ id: 'map', label: t(locale, 'nav.map') },
		{ id: 'cats', label: `${t(locale, 'nav.cats')} (${data.cats.length})` },
		{ id: 'visits', label: `${t(locale, 'nav.visits')} (${colonyVisits.length})` },
		{ id: 'inspections', label: `${t(locale, 'nav.inspections')} (${colonyInspections.length})` },
		{ id: 'cer', label: `CER (${data.cerActions.length})` },
		{ id: 'incidents', label: `${t(locale, 'nav.incidents')} (${data.incidents.length})` },
		{ id: 'interventions', label: `${t(locale, 'detail.vet_interventions')} (${colonyInterventions.length})` }
	]);

	function statusLabel(status: string): string {
		return t(locale, `colonies.status.${status}`) || status;
	}

	function statusConfig(status: string) {
		const map: Record<string, { dot: string; bg: string }> = {
			active: { dot: 'bg-success', bg: 'bg-success/8 text-success' },
			monitoring: { dot: 'bg-warning', bg: 'bg-warning/8 text-warning' },
			inactive: { dot: 'bg-text-muted', bg: 'bg-surface-sunken text-text-muted' }
		};
		return map[status] ?? { dot: 'bg-text-muted', bg: 'bg-surface-sunken text-text-muted' };
	}

	onMount(async () => {
		if (colony.latitude && colony.longitude) {
			const L = await import('leaflet');
			if (!mapEl) return;
			const map = L.map(mapEl).setView([colony.latitude, colony.longitude], 16);
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; OpenStreetMap'
			}).addTo(map);

			L.marker([colony.latitude, colony.longitude]).addTo(map).bindPopup(colony.name);

			data.feedingPoints.forEach((fp) => {
				if (fp.latitude && fp.longitude) {
					L.circleMarker([fp.latitude, fp.longitude], { radius: 6, color: '#10b981', fillOpacity: 0.8 })
						.addTo(map)
						.bindPopup(fp.notes ?? '');
				}
			});

			setTimeout(() => map.invalidateSize(), 200);
		}
	});
</script>

<svelte:head>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<div class="max-w-7xl mx-auto">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<a href="/colonias" class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-2">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M19 12H5m0 0l7 7m-7-7l7-7"/></svg>
				{t(locale, 'detail.back_to_colonies')}
			</a>
			<div class="flex items-center gap-3">
				<h1 class="text-2xl font-bold text-text tracking-tight">{colony.name}</h1>
				<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium {statusConfig(colony.status).bg}">
					<span class="w-1.5 h-1.5 rounded-full {statusConfig(colony.status).dot}"></span>{statusLabel(colony.status)}
				</span>
			</div>
			<p class="text-sm text-text-muted mt-0.5">{colony.district ?? ''} {colony.classification ? `· ${colony.classification}` : ''}</p>
		</div>
		<div class="flex gap-2">
			<button onclick={() => editing = !editing} class="px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors min-h-[44px]">
				{editing ? t(locale, 'common.cancel') : t(locale, 'common.edit')}
			</button>
			<button onclick={() => showDeleteConfirm = true} class="px-3 py-2.5 bg-danger/8 text-danger border border-danger/20 rounded-lg hover:bg-danger/12 transition-colors min-h-[44px]" aria-label={t(locale, 'common.delete')}>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
			</button>
			<form bind:this={deleteFormEl} method="POST" action="?/delete" use:enhance class="hidden"></form>
		</div>
	</div>

	<div class="flex gap-1 p-1 bg-surface-sunken rounded-lg overflow-x-auto mb-6 w-fit">
		{#each tabs as tab}
			<button
				onclick={() => activeTab = tab.id}
				class="px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap min-h-[40px]
					{activeTab === tab.id ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'}"
			>
				{tab.label}
			</button>
		{/each}
	</div>

	{#if activeTab === 'general'}
		{#if editing}
			<div class="bg-surface rounded-xl border border-border p-6">
				{#if form?.error}
					<div class="bg-danger-subtle text-danger text-sm p-3 rounded-lg mb-4 border border-danger/10">{form.error}</div>
				{/if}
				<form method="POST" action="?/update" use:enhance>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="name" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'common.name')} <span class="text-danger">*</span></label>
							<input type="text" name="name" id="name" value={colony.name} required class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
						</div>
						<div>
							<label for="district" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'colonies.district')}</label>
							<input type="text" name="district" id="district" value={colony.district ?? ''} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
						</div>
						<div>
							<label for="classification" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'colonies.classification')}</label>
							<input type="text" name="classification" id="classification" value={colony.classification ?? ''} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
						</div>
						<div>
							<label for="status" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'common.status')}</label>
							<select name="status" id="status" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
								<option value="active" selected={colony.status === 'active'}>{t(locale, 'colonies.status.active')}</option>
								<option value="monitoring" selected={colony.status === 'monitoring'}>{t(locale, 'colonies.status.monitoring')}</option>
								<option value="inactive" selected={colony.status === 'inactive'}>{t(locale, 'colonies.status.inactive')}</option>
							</select>
						</div>
						<div class="md:col-span-2">
							<label for="description" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'common.description')}</label>
							<textarea name="description" id="description" rows="3" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none">{colony.description ?? ''}</textarea>
						</div>
					</div>
					<div class="flex items-center gap-3 mt-5 pt-5 border-t border-border">
						<button type="submit" class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors">{t(locale, 'common.save')}</button>
						<button type="button" onclick={() => editing = false} class="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text hover:bg-surface-sunken rounded-lg transition-colors">{t(locale, 'common.cancel')}</button>
					</div>
				</form>
			</div>
		{:else}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
				<div class="bg-surface rounded-xl border border-border p-6">
					<h3 class="text-sm font-semibold text-text mb-4">{t(locale, 'detail.general_info')}</h3>
					<dl class="space-y-3">
						<div class="flex justify-between text-sm"><dt class="text-text-muted">{t(locale, 'common.name')}</dt><dd class="font-medium text-text">{colony.name}</dd></div>
						<div class="flex justify-between text-sm"><dt class="text-text-muted">{t(locale, 'colonies.district')}</dt><dd class="font-medium text-text">{colony.district ?? '-'}</dd></div>
						<div class="flex justify-between text-sm"><dt class="text-text-muted">{t(locale, 'colonies.classification')}</dt><dd class="font-medium text-text">{colony.classification ?? '-'}</dd></div>
						<div class="flex justify-between text-sm"><dt class="text-text-muted">{t(locale, 'common.coordinates')}</dt><dd class="font-medium text-text">{colony.latitude?.toFixed(4)}, {colony.longitude?.toFixed(4)}</dd></div>
					</dl>
					{#if colony.description}
						<p class="text-sm text-text-secondary mt-4 pt-4 border-t border-border">{colony.description}</p>
					{/if}
				</div>
				<div class="bg-surface rounded-xl border border-border p-6">
					<h3 class="text-sm font-semibold text-text mb-4">{t(locale, 'detail.statistics')}</h3>
					<div class="grid grid-cols-2 gap-3">
						<div class="p-4 bg-primary/5 rounded-lg border border-primary/10">
							<div class="text-2xl font-bold text-primary">{data.cats.length}</div>
							<div class="text-xs text-text-muted mt-0.5">{t(locale, 'dashboard.censed_cats')}</div>
						</div>
						<div class="p-4 bg-accent/5 rounded-lg border border-accent/10">
							<div class="text-2xl font-bold text-accent">{data.cats.filter((c) => c.sterilized).length}</div>
							<div class="text-xs text-text-muted mt-0.5">{t(locale, 'dashboard.sterilized')}</div>
						</div>
						<div class="p-4 bg-info/5 rounded-lg border border-info/10">
							<div class="text-2xl font-bold text-info">{data.cerActions.length}</div>
							<div class="text-xs text-text-muted mt-0.5">{t(locale, 'cer.total_actions')}</div>
						</div>
						<div class="p-4 bg-warning/5 rounded-lg border border-warning/10">
							<div class="text-2xl font-bold text-warning">{data.incidents.length}</div>
							<div class="text-xs text-text-muted mt-0.5">{t(locale, 'nav.incidents')}</div>
						</div>
						<div class="p-4 bg-success/5 rounded-lg border border-success/10">
							<div class="text-2xl font-bold text-success">{colonyVisits.length}</div>
							<div class="text-xs text-text-muted mt-0.5">{t(locale, 'nav.visits')}</div>
						</div>
						<div class="p-4 bg-primary/5 rounded-lg border border-primary/10">
							<div class="text-2xl font-bold text-primary">{colonyInspections.length}</div>
							<div class="text-xs text-text-muted mt-0.5">{t(locale, 'nav.inspections')}</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	{/if}

	{#if activeTab === 'map'}
		<div class="bg-surface rounded-xl border border-border overflow-hidden">
			<div bind:this={mapEl} class="w-full h-96"></div>
			{#if data.feedingPoints.length > 0}
				<div class="p-5 border-t border-border">
					<h4 class="text-sm font-medium text-text mb-2">{t(locale, 'detail.feeding_points')} ({data.feedingPoints.length})</h4>
					<ul class="space-y-1.5">
						{#each data.feedingPoints as fp}
							<li class="text-sm text-text-secondary flex items-center gap-2">
								<span class="w-2 h-2 rounded-full bg-success"></span>
								{fp.notes ?? `${fp.latitude?.toFixed(4)}, ${fp.longitude?.toFixed(4)}`}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	{/if}

	{#if activeTab === 'cats'}
		<div class="bg-surface rounded-xl border border-border overflow-hidden">
			<div class="px-5 py-4 border-b border-border flex justify-between items-center">
				<h3 class="text-sm font-semibold text-text">{t(locale, 'detail.colony_cats')}</h3>
				<a href="/gatos?colony={colony.id}" class="text-sm text-primary font-medium hover:text-primary-hover transition-colors">{t(locale, 'common.view_all')}</a>
			</div>
			{#if data.cats.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead class="bg-surface-sunken text-text-muted text-left text-xs uppercase tracking-wide">
							<tr>
								<th class="px-4 py-3 font-medium">{t(locale, 'common.name')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'detail.sex')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'detail.sterilized')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'cats.microchip')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'common.status')}</th>
								<th class="px-4 py-3"></th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each data.cats as cat}
								<tr class="hover:bg-surface-sunken/50 transition-colors">
									<td class="px-4 py-3 font-medium text-text">{cat.name ?? t(locale, 'common.unnamed')}</td>
									<td class="px-4 py-3 text-text-secondary">{cat.sex === 'male' ? t(locale, 'common.male') : cat.sex === 'female' ? t(locale, 'common.female') : '-'}</td>
									<td class="px-4 py-3">
										{#if cat.sterilized}
											<span class="text-success"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 inline"><polyline points="20,6 9,17 4,12"/></svg></span>
										{:else}
											<span class="text-danger"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 inline"><path d="M18 6L6 18M6 6l12 12"/></svg></span>
										{/if}
									</td>
									<td class="px-4 py-3 font-mono text-xs text-text-muted">{cat.microchip ?? '-'}</td>
									<td class="px-4 py-3"><span class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-sunken text-text-secondary">{t(locale, `cats.status.${cat.status}`) || cat.status}</span></td>
									<td class="px-4 py-3"><a href="/gatos/{cat.id}" class="text-primary hover:text-primary-hover text-xs font-medium transition-colors">{t(locale, 'common.view')}</a></td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="px-5 py-12 text-center text-text-muted text-sm">{t(locale, 'detail.no_cats')}</div>
			{/if}
		</div>
	{/if}

	{#if activeTab === 'cer'}
		<div class="bg-surface rounded-xl border border-border overflow-hidden">
			<div class="px-5 py-4 border-b border-border"><h3 class="text-sm font-semibold text-text">{t(locale, 'cer.title')}</h3></div>
			{#if data.cerActions.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead class="bg-surface-sunken text-text-muted text-left text-xs uppercase tracking-wide">
							<tr>
								<th class="px-4 py-3 font-medium">{t(locale, 'cer.captured_at')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'cer.sterilized_at')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'cer.returned_at')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'cer.collaborator')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'common.notes')}</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each data.cerActions as cer}
								<tr class="hover:bg-surface-sunken/50 transition-colors">
									<td class="px-4 py-3 text-text-secondary">{cer.capturedAt ? new Date(cer.capturedAt).toLocaleDateString(locale) : '-'}</td>
									<td class="px-4 py-3 text-text-secondary">{cer.sterilizedAt ? new Date(cer.sterilizedAt).toLocaleDateString(locale) : '-'}</td>
									<td class="px-4 py-3 text-text-secondary">{cer.returnedAt ? new Date(cer.returnedAt).toLocaleDateString(locale) : '-'}</td>
									<td class="px-4 py-3 text-text-secondary">{cer.collaboratorName ?? '-'}</td>
									<td class="px-4 py-3 text-text-muted">{cer.notes ?? '-'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="px-5 py-12 text-center text-text-muted text-sm">{t(locale, 'detail.no_cer')}</div>
			{/if}
		</div>
	{/if}

	{#if activeTab === 'incidents'}
		<div class="bg-surface rounded-xl border border-border">
			<div class="px-5 py-4 border-b border-border"><h3 class="text-sm font-semibold text-text">{t(locale, 'nav.incidents')}</h3></div>
			{#if data.incidents.length > 0}
				<div class="divide-y divide-border">
					{#each data.incidents as inc}
						<div class="px-5 py-4 hover:bg-surface-sunken/50 transition-colors">
							<div class="flex items-start justify-between">
								<div>
									<span class="text-sm font-medium text-text capitalize">{inc.category}</span>
									<p class="text-sm text-text-secondary mt-0.5">{inc.description ?? ''}</p>
								</div>
								<div class="flex gap-1.5 flex-shrink-0">
									<span class="px-2 py-0.5 rounded-md text-[11px] font-medium {inc.priority === 'high' || inc.priority === 'critical' ? 'bg-danger/8 text-danger' : inc.priority === 'medium' ? 'bg-warning/8 text-warning' : 'bg-success/8 text-success'}">
										{t(locale, `incidents.priority.${inc.priority}`) || inc.priority}
									</span>
									<span class="px-2 py-0.5 rounded-md text-[11px] font-medium {inc.status === 'open' ? 'bg-danger/8 text-danger' : inc.status === 'in_progress' ? 'bg-warning/8 text-warning' : 'bg-success/8 text-success'}">
										{t(locale, `incidents.status.${inc.status}`) || inc.status}
									</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="px-5 py-12 text-center text-text-muted text-sm">{t(locale, 'detail.no_incidents')}</div>
			{/if}
		</div>
	{/if}

	{#if activeTab === 'visits'}
		<div class="bg-surface rounded-xl border border-border overflow-hidden">
			<div class="px-5 py-4 border-b border-border"><h3 class="text-sm font-semibold text-text">{t(locale, 'detail.recent_visits')}</h3></div>
			{#if colonyVisits.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead class="bg-surface-sunken text-text-muted text-left text-xs uppercase tracking-wide">
							<tr>
								<th class="px-4 py-3 font-medium">{t(locale, 'common.date')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'common.type')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'visits.duration')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'nav.cats')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'visits.volunteer')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'common.notes')}</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each colonyVisits as v}
								<tr class="hover:bg-surface-sunken/50 transition-colors">
									<td class="px-4 py-3 text-text-secondary">{v.visitedAt ? new Date(v.visitedAt).toLocaleDateString(locale, { day: '2-digit', month: 'short' }) : '-'}</td>
									<td class="px-4 py-3"><span class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/8 text-primary capitalize">{v.type}</span></td>
									<td class="px-4 py-3 text-text-secondary">{v.durationMinutes ? `${v.durationMinutes} min` : '-'}</td>
									<td class="px-4 py-3 text-text-secondary">{v.catsObserved ?? '-'}</td>
									<td class="px-4 py-3 text-text-muted">{v.userName ?? '-'}</td>
									<td class="px-4 py-3 text-text-muted text-xs max-w-xs truncate">{v.notes ?? ''}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="px-5 py-12 text-center text-text-muted text-sm">{t(locale, 'detail.no_visits')}</div>
			{/if}
		</div>
	{/if}

	{#if activeTab === 'inspections'}
		<div class="bg-surface rounded-xl border border-border overflow-hidden">
			<div class="px-5 py-4 border-b border-border"><h3 class="text-sm font-semibold text-text">{t(locale, 'nav.inspections')}</h3></div>
			{#if colonyInspections.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead class="bg-surface-sunken text-text-muted text-left text-xs uppercase tracking-wide">
							<tr>
								<th class="px-4 py-3 font-medium">{t(locale, 'common.date')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'inspections.score')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'common.status')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'inspections.notes')}</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each colonyInspections as insp}
								<tr class="hover:bg-surface-sunken/50 transition-colors">
									<td class="px-4 py-3 text-text-secondary">{insp.createdAt ? new Date(insp.createdAt).toLocaleDateString(locale) : '-'}</td>
									<td class="px-4 py-3">
										{#if typeof insp.score === 'number'}
											<div class="flex items-center gap-2">
												<div class="w-16 h-2 bg-surface-sunken rounded-full overflow-hidden">
													<div class="h-full rounded-full {insp.score >= 80 ? 'bg-success' : insp.score >= 50 ? 'bg-warning' : 'bg-danger'}" style="width: {insp.score}%"></div>
												</div>
												<span class="text-xs font-semibold {insp.score >= 80 ? 'text-success' : insp.score >= 50 ? 'text-warning' : 'text-danger'}">{insp.score}%</span>
											</div>
										{:else}
											<span class="text-text-muted text-xs">-</span>
										{/if}
									</td>
									<td class="px-4 py-3">
										{#if insp.passed === true}
											<span class="px-2 py-0.5 rounded-md text-xs font-medium bg-success/8 text-success">{t(locale, 'inspections.approved')}</span>
										{:else if insp.passed === false}
											<span class="px-2 py-0.5 rounded-md text-xs font-medium bg-danger/8 text-danger">{t(locale, 'inspections.not_approved')}</span>
										{:else}
											<span class="text-text-muted text-xs">-</span>
										{/if}
										{#if insp.followUpRequired}
											<span class="px-2 py-0.5 rounded-md text-xs font-medium bg-warning/8 text-warning ml-1">{t(locale, 'inspections.follow_up_required')}</span>
										{/if}
									</td>
									<td class="px-4 py-3 text-text-muted text-xs max-w-xs truncate">{insp.notes ?? ''}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="px-5 py-12 text-center text-text-muted text-sm">{t(locale, 'detail.no_inspections')}</div>
			{/if}
		</div>
	{/if}

	{#if activeTab === 'interventions'}
		<div class="bg-surface rounded-xl border border-border overflow-hidden">
			<div class="px-5 py-4 border-b border-border"><h3 class="text-sm font-semibold text-text">{t(locale, 'detail.vet_interventions')}</h3></div>
			{#if colonyInterventions.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead class="bg-surface-sunken text-text-muted text-left text-xs uppercase tracking-wide">
							<tr>
								<th class="px-4 py-3 font-medium">{t(locale, 'common.date')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'providers.provider')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'common.type')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'providers.cost')}</th>
								<th class="px-4 py-3 font-medium">{t(locale, 'providers.invoice')}</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each colonyInterventions as intv}
								<tr class="hover:bg-surface-sunken/50 transition-colors">
									<td class="px-4 py-3 text-text-secondary">{intv.performedAt ? new Date(intv.performedAt).toLocaleDateString(locale) : '-'}</td>
									<td class="px-4 py-3 font-medium text-text">{intv.providerName ?? '-'}</td>
									<td class="px-4 py-3"><span class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-accent/8 text-accent capitalize">{intv.type}</span></td>
									<td class="px-4 py-3 text-text-secondary">{intv.cost ? `${Number(intv.cost).toFixed(2)} €` : '-'}</td>
									<td class="px-4 py-3 font-mono text-xs text-text-muted">{intv.invoiceRef ?? '-'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="px-5 py-12 text-center text-text-muted text-sm">{t(locale, 'detail.no_interventions')}</div>
			{/if}
		</div>
	{/if}
</div>

<ConfirmDialog
	open={showDeleteConfirm}
	title={t(locale, 'detail.delete_colony')}
	message={t(locale, 'detail.confirm_delete_colony')}
	confirmLabel={t(locale, 'common.yes_delete')}
	onconfirm={() => { showDeleteConfirm = false; deleteFormEl?.requestSubmit(); }}
	oncancel={() => showDeleteConfirm = false}
/>

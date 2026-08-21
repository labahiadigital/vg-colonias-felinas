<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';
	import Pagination from '$lib/components/ui/Pagination.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);

	let showNewForm = $state(false);
	let editingVisit = $state<string | null>(null);
	let useGeo = $state(false);
	let geoLat = $state('');
	let geoLng = $state('');

	function getLocation() {
		if (!navigator.geolocation) return;
		useGeo = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => { geoLat = String(pos.coords.latitude); geoLng = String(pos.coords.longitude); },
			() => { useGeo = false; },
			{ enableHighAccuracy: true }
		);
	}

	function typeLabel(type: string): string {
		const labels: Record<string, Record<string, string>> = {
			es: { feeding: 'Alimentación', health_check: 'Control sanitario', census: 'Censo', cleaning: 'Limpieza', capture: 'Captura', monitoring: 'Monitoreo', other: 'Otro' },
			eu: { feeding: 'Elikatzea', health_check: 'Osasun kontrola', census: 'Zentsua', cleaning: 'Garbiketa', capture: 'Harrapaketa', monitoring: 'Jarraipena', other: 'Beste bat' },
			ca: { feeding: 'Alimentació', health_check: 'Control sanitari', census: 'Cens', cleaning: 'Neteja', capture: 'Captura', monitoring: 'Monitoratge', other: 'Altre' },
			en: { feeding: 'Feeding', health_check: 'Health check', census: 'Census', cleaning: 'Cleaning', capture: 'Capture', monitoring: 'Monitoring', other: 'Other' }
		};
		return labels[locale]?.[type] ?? labels['es']?.[type] ?? type;
	}

	function typeColor(tp: string): string {
		const map: Record<string, string> = {
			feeding: 'bg-success/8 text-success', health_check: 'bg-accent/8 text-accent',
			census: 'bg-info/8 text-info', cleaning: 'bg-warning/8 text-warning',
			capture: 'bg-danger/8 text-danger', monitoring: 'bg-primary/8 text-primary'
		};
		return map[tp] ?? 'bg-surface-sunken text-text-muted';
	}
</script>

<div class="max-w-7xl mx-auto">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-text tracking-tight">{t(locale, 'visits.title')}</h1>
			<p class="text-sm text-text-muted mt-0.5">{t(locale, 'visits.subtitle')}</p>
		</div>
		<button onclick={() => showNewForm = !showNewForm}
			class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-sm">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M12 5v14m-7-7h14"/></svg>
			{showNewForm ? 'Cancelar' : t(locale, 'visits.new')}
		</button>
	</div>

	<!-- KPIs -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
		<div class="bg-surface rounded-xl border border-border p-4 interactive-card">
			<p class="text-2xl font-bold text-primary">{data.totalVisits}</p>
			<p class="text-xs text-text-muted mt-1">{t(locale, 'visits.total_visits')}</p>
		</div>
		<div class="bg-surface rounded-xl border border-border p-4 interactive-card">
			<p class="text-2xl font-bold text-success">{Number(data.totalVolunteerHours).toFixed(1)}h</p>
			<p class="text-xs text-text-muted mt-1">{t(locale, 'visits.volunteer_hours')}</p>
		</div>
		<div class="bg-surface rounded-xl border border-border p-4 interactive-card">
			<p class="text-2xl font-bold text-accent">{data.items.filter(v => v.foodProvided).length}</p>
			<p class="text-xs text-text-muted mt-1">{t(locale, 'visits.feedings')}</p>
		</div>
		<div class="bg-surface rounded-xl border border-border p-4 interactive-card">
			<p class="text-2xl font-bold text-warning">{data.items.filter(v => v.incidentDetected).length}</p>
			<p class="text-xs text-text-muted mt-1">{t(locale, 'visits.incidents_detected')}</p>
		</div>
	</div>

	{#if showNewForm}
		<div class="bg-surface rounded-xl border border-border p-6 mb-6">
			<h3 class="text-base font-semibold text-text mb-4">{t(locale, 'visits.register')}</h3>
			{#if form?.error}<div class="bg-danger-subtle text-danger text-sm p-3 rounded-lg mb-4 border border-danger/10">{form.error}</div>{/if}
			<form method="POST" action="?/create" use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') { showNewForm = false; await update(); } else { await update(); }
				};
			}}>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="colonyId" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'visits.colony')} <span class="text-danger">*</span></label>
						<select name="colonyId" id="colonyId" required class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
							<option value="">{t(locale, 'visits.select_colony')}</option>
							{#each data.colonies as col}
								<option value={col.id}>{col.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="type" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'visits.type')}</label>
						<select name="type" id="type" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
							<option value="feeding">{typeLabel('feeding')}</option>
							<option value="health_check">{typeLabel('health_check')}</option>
							<option value="census">{typeLabel('census')}</option>
							<option value="cleaning">{typeLabel('cleaning')}</option>
							<option value="capture">{typeLabel('capture')}</option>
							<option value="monitoring">{typeLabel('monitoring')}</option>
							<option value="other">{typeLabel('other')}</option>
						</select>
					</div>
					<div>
						<label for="durationMinutes" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'visits.duration')}</label>
						<input type="number" name="durationMinutes" id="durationMinutes" min="1" max="480" placeholder="30" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
					</div>
					<div>
						<label for="catsObserved" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'visits.cats_observed')}</label>
						<input type="number" name="catsObserved" id="catsObserved" min="0" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
					</div>
					<div>
						<span class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'visits.location')}</span>
						<button type="button" onclick={getLocation} class="w-full px-3 py-2 bg-info/8 text-info border border-info/20 rounded-lg text-sm font-medium hover:bg-info/12 transition-colors inline-flex items-center justify-center gap-2 min-h-[40px]">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-4 h-4"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>
							{useGeo ? `${geoLat.slice(0, 8)}, ${geoLng.slice(0, 8)}` : t(locale, 'visits.get_location')}
						</button>
						<input type="hidden" name="latitude" value={geoLat} />
						<input type="hidden" name="longitude" value={geoLng} />
					</div>
					<div class="flex items-end gap-4 pb-1">
						<label class="flex items-center gap-2 text-sm cursor-pointer min-h-[40px]">
							<input type="checkbox" name="foodProvided" class="rounded border-border text-primary focus:ring-primary/20" />
							<span class="text-text-secondary">{t(locale, 'visits.food')}</span>
						</label>
						<label class="flex items-center gap-2 text-sm cursor-pointer min-h-[40px]">
							<input type="checkbox" name="waterProvided" class="rounded border-border text-primary focus:ring-primary/20" />
							<span class="text-text-secondary">{t(locale, 'visits.water')}</span>
						</label>
						<label class="flex items-center gap-2 text-sm cursor-pointer min-h-[40px]">
							<input type="checkbox" name="incidentDetected" class="rounded border-border text-primary focus:ring-primary/20" />
							<span class="text-text-secondary text-warning">{t(locale, 'visits.incident')}</span>
						</label>
					</div>
					<div class="md:col-span-2 bg-surface-sunken/50 rounded-lg p-4 border border-border/50">
						<p class="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">{t(locale, 'visits.feeding_details')}</p>
						<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
							<div>
								<label for="foodQuantityKg" class="block text-xs text-text-secondary mb-1">{t(locale, 'visits.food_qty_kg')}</label>
								<input type="number" name="foodQuantityKg" id="foodQuantityKg" min="0" step="0.1" placeholder="0.0" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
							</div>
							<div>
								<label for="foodType" class="block text-xs text-text-secondary mb-1">{t(locale, 'visits.food_type')}</label>
								<select name="foodType" id="foodType" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
									<option value="">—</option>
									<option value="dry">{t(locale, 'visits.food_dry')}</option>
									<option value="wet">{t(locale, 'visits.food_wet')}</option>
									<option value="mixed">{t(locale, 'visits.food_mixed')}</option>
									<option value="special">{t(locale, 'visits.food_special')}</option>
								</select>
							</div>
							<div>
								<label for="waterQuantityL" class="block text-xs text-text-secondary mb-1">{t(locale, 'visits.water_qty_l')}</label>
								<input type="number" name="waterQuantityL" id="waterQuantityL" min="0" step="0.1" placeholder="0.0" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
							</div>
							<div>
								<label for="feedingCostEur" class="block text-xs text-text-secondary mb-1">{t(locale, 'visits.feeding_cost')}</label>
								<input type="number" name="feedingCostEur" id="feedingCostEur" min="0" step="0.01" placeholder="0.00" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
							</div>
						</div>
						<div class="mt-3">
							<label for="specialNeeds" class="block text-xs text-text-secondary mb-1">{t(locale, 'visits.special_needs')}</label>
							<input type="text" name="specialNeeds" id="specialNeeds" placeholder={t(locale, 'visits.special_needs_placeholder')} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
						</div>
					</div>
					<div class="md:col-span-2">
						<label for="notes" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'visits.notes')}</label>
						<textarea name="notes" id="notes" rows="2" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"></textarea>
					</div>
				</div>
				<div class="flex items-center gap-3 mt-5 pt-5 border-t border-border">
					<button type="submit" class="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors min-h-[44px]">{t(locale, 'common.save')}</button>
					<button type="button" onclick={() => showNewForm = false} class="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text hover:bg-surface-sunken rounded-lg transition-colors">{t(locale, 'common.cancel')}</button>
				</div>
			</form>
		</div>
	{/if}

	{#if form?.success}
		<div class="bg-success-subtle text-success text-sm p-3 rounded-lg mb-4 border border-success/10">{t(locale, 'visits.created')}</div>
	{/if}

	<!-- Filters -->
	<div class="bg-surface rounded-xl border border-border p-4 mb-5">
		<form method="GET" class="flex flex-wrap gap-3 items-end">
			<div>
				<label for="filterColony" class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wide">{t(locale, 'visits.colony')}</label>
				<select name="colony" id="filterColony" class="px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
					<option value="">{t(locale, 'common.all')}</option>
					{#each data.colonies as c}
						<option value={c.id} selected={data.filters.colony === c.id}>{c.name}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="filterType" class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wide">{t(locale, 'visits.type')}</label>
				<select name="type" id="filterType" class="px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
					<option value="">{t(locale, 'common.all')}</option>
					<option value="feeding" selected={data.filters.type === 'feeding'}>{typeLabel('feeding')}</option>
					<option value="health_check" selected={data.filters.type === 'health_check'}>{typeLabel('health_check')}</option>
					<option value="census" selected={data.filters.type === 'census'}>{typeLabel('census')}</option>
					<option value="cleaning" selected={data.filters.type === 'cleaning'}>{typeLabel('cleaning')}</option>
					<option value="monitoring" selected={data.filters.type === 'monitoring'}>{typeLabel('monitoring')}</option>
				</select>
			</div>
			<div>
				<label for="from" class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wide">{t(locale, 'common.from')}</label>
				<input type="date" name="from" id="from" value={data.filters.from} class="px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
			</div>
			<div>
				<label for="to" class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wide">{t(locale, 'common.to')}</label>
				<input type="date" name="to" id="to" value={data.filters.to} class="px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
			</div>
			<button type="submit" class="px-4 py-2 bg-text text-text-inverse text-sm font-medium rounded-lg hover:bg-text/90 transition-colors">{t(locale, 'common.filter')}</button>
		</form>
	</div>

	<!-- Visit list -->
	<div class="bg-surface rounded-xl border border-border overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-surface-sunken text-text-muted text-left text-xs uppercase tracking-wide">
					<tr>
						<th class="px-4 py-3 font-medium">{t(locale, 'visits.date')}</th>
						<th class="px-4 py-3 font-medium">{t(locale, 'visits.colony')}</th>
						<th class="px-4 py-3 font-medium">{t(locale, 'visits.type')}</th>
						<th class="px-4 py-3 font-medium">{t(locale, 'visits.duration')}</th>
						<th class="px-4 py-3 font-medium">{t(locale, 'visits.cats_observed')}</th>
						<th class="px-4 py-3 font-medium">{t(locale, 'visits.volunteer')}</th>
						<th class="px-4 py-3 font-medium">{t(locale, 'visits.actions_col')}</th>
						<th class="px-4 py-3 font-medium"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each data.items as visit}
						<tr class="hover:bg-surface-sunken/50 transition-colors">
							<td class="px-4 py-3 text-text-secondary">{visit.visitedAt ? new Date(visit.visitedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
							<td class="px-4 py-3 font-medium">
								{#if visit.colonyId}
									<a href="/colonias/{visit.colonyId}" class="text-primary hover:text-primary-hover transition-colors">{visit.colonyName || '-'}</a>
								{:else}
									-
								{/if}
							</td>
							<td class="px-4 py-3">
								<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium {typeColor(visit.type)}">
									{typeLabel(visit.type)}
								</span>
							</td>
							<td class="px-4 py-3 text-text-secondary">{visit.durationMinutes ? `${visit.durationMinutes} min` : '-'}</td>
							<td class="px-4 py-3 text-text-secondary">{visit.catsObserved ?? '-'}</td>
							<td class="px-4 py-3 text-text-muted">{visit.userName ?? '-'}</td>
							<td class="px-4 py-3">
								<div class="flex gap-1.5">
									{#if visit.foodProvided}
										<span class="w-5 h-5 rounded bg-success/10 flex items-center justify-center" title={t(locale, 'visits.food')}>
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3 text-success"><polyline points="20,6 9,17 4,12"/></svg>
										</span>
									{/if}
									{#if visit.waterProvided}
										<span class="w-5 h-5 rounded bg-info/10 flex items-center justify-center" title={t(locale, 'visits.water')}>
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3 text-info"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
										</span>
									{/if}
									{#if visit.incidentDetected}
										<span class="w-5 h-5 rounded bg-danger/10 flex items-center justify-center" title={t(locale, 'visits.incident')}>
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3 text-danger"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
										</span>
									{/if}
									{#if visit.latitude && visit.longitude}
										<span class="w-5 h-5 rounded bg-primary/10 flex items-center justify-center" title={t(locale, 'visits.location')}>
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3 text-primary"><circle cx="12" cy="12" r="3"/></svg>
										</span>
									{/if}
								</div>
							</td>
							<td class="px-4 py-3">
								<div class="flex gap-1">
									<button onclick={() => editingVisit = editingVisit === visit.id ? null : visit.id} class="p-1.5 rounded-lg text-info hover:bg-info/8 transition-colors" title={t(locale, 'common.edit')}>
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3.5 h-3.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
									</button>
									<form method="POST" action="?/delete" use:enhance onsubmit={(e: SubmitEvent) => { if (!confirm(t(locale, 'common.confirm_delete'))) e.preventDefault(); }}>
										<input type="hidden" name="id" value={visit.id} />
										<button type="submit" class="p-1.5 rounded-lg text-danger hover:bg-danger/8 transition-colors" title={t(locale, 'common.delete')}>
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3.5 h-3.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
										</button>
									</form>
								</div>
							</td>
						</tr>
						{#if editingVisit === visit.id}
							<tr class="bg-surface-sunken/50">
								<td colspan="8" class="px-4 py-3">
									<form method="POST" action="?/edit" use:enhance class="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
										<input type="hidden" name="id" value={visit.id} />
										<label class="block">
											<span class="text-[10px] text-text-muted uppercase">{t(locale, 'visits.colony')}</span>
											<select name="colonyId" class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs">
												{#each data.colonies as col}
													<option value={col.id} selected={col.id === visit.colonyId}>{col.name}</option>
												{/each}
											</select>
										</label>
										<label class="block">
											<span class="text-[10px] text-text-muted uppercase">{t(locale, 'visits.type')}</span>
											<select name="type" class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs">
												{#each ['feeding', 'health_check', 'census', 'cleaning', 'capture', 'monitoring', 'other'] as tp}
													<option value={tp} selected={visit.type === tp}>{typeLabel(tp)}</option>
												{/each}
											</select>
										</label>
										<label class="block">
											<span class="text-[10px] text-text-muted uppercase">{t(locale, 'visits.duration')}</span>
											<input type="number" name="durationMinutes" value={visit.durationMinutes ?? ''} class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs" />
										</label>
										<label class="block">
											<span class="text-[10px] text-text-muted uppercase">{t(locale, 'visits.notes')}</span>
											<input type="text" name="notes" value={visit.notes ?? ''} class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs" />
										</label>
										<div class="flex gap-1">
											<button type="submit" class="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-hover transition-colors">{t(locale, 'common.save')}</button>
											<button type="button" onclick={() => editingVisit = null} class="px-3 py-1.5 bg-surface-sunken text-text-secondary rounded-lg text-xs font-medium hover:bg-border transition-colors">{t(locale, 'common.cancel')}</button>
										</div>
									</form>
								</td>
							</tr>
						{/if}
					{/each}
					{#if data.items.length === 0}
						<tr><td colspan="8" class="px-4 py-12 text-center text-text-muted">{t(locale, 'common.no_results')}</td></tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>

	<Pagination currentPage={data.page} totalPages={data.totalPages} totalItems={data.totalItems} pageSize={data.pageSize} />
</div>

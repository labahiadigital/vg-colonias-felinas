<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);

	import Pagination from '$lib/components/ui/Pagination.svelte';

	let showNewForm = $state(false);

	function statusConfig(status: string) {
		const map: Record<string, { bg: string; dot: string }> = {
			active: { bg: 'bg-success/8 text-success', dot: 'bg-success' },
			monitoring: { bg: 'bg-warning/8 text-warning', dot: 'bg-warning' },
			inactive: { bg: 'bg-surface-sunken text-text-muted', dot: 'bg-text-muted' },
			closed: { bg: 'bg-danger/8 text-danger', dot: 'bg-danger' }
		};
		return map[status] ?? { bg: 'bg-surface-sunken text-text-muted', dot: 'bg-text-muted' };
	}
</script>

<div class="max-w-7xl mx-auto">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-text tracking-tight">{t(locale, 'colonies.title')}</h1>
			<p class="text-sm text-text-muted mt-0.5">{data.totalItems} {t(locale, 'providers.registered')}</p>
		</div>
		<button
			onclick={() => showNewForm = !showNewForm}
			class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
		>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M12 5v14m-7-7h14"/></svg>
			{t(locale, 'colonies.new')}
		</button>
	</div>

	{#if showNewForm}
		<div class="bg-surface rounded-xl border border-border p-6 mb-6">
			<h3 class="text-base font-semibold text-text mb-4">{t(locale, 'colonies.new')}</h3>
			{#if form?.error}
				<div class="bg-danger-subtle text-danger text-sm p-3 rounded-lg mb-4 border border-danger/10">{form.error}</div>
			{/if}
			<form method="POST" action="?/create" use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						showNewForm = false;
						await update();
					} else {
						await update();
					}
				};
			}}>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="name" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'common.name')} <span class="text-danger">*</span></label>
						<input type="text" name="name" id="name" required class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
					</div>
					<div>
						<label for="district" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'colonies.district')}</label>
						<input type="text" name="district" id="district" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
					</div>
					<div>
						<label for="classification" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'colonies.classification')}</label>
						<select name="classification" id="classification" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
							<option value="">--</option>
							<option value="Parque urbano">{t(locale, 'colonies.class.urban_park')}</option>
							<option value="Residencial">{t(locale, 'colonies.class.residential')}</option>
							<option value="Industrial">{t(locale, 'colonies.class.industrial')}</option>
							<option value="Zona verde">{t(locale, 'colonies.class.green_zone')}</option>
							<option value="Solar">{t(locale, 'colonies.class.lot')}</option>
						</select>
					</div>
					<div>
						<label for="latitude" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'common.coordinates')} (lat)</label>
						<input type="number" step="any" name="latitude" id="latitude" placeholder="42.8467" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
					</div>
					<div>
						<label for="longitude" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'common.coordinates')} (lng)</label>
						<input type="number" step="any" name="longitude" id="longitude" placeholder="-2.6726" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
					</div>
					<div class="md:col-span-2">
						<label for="description" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'common.description')}</label>
						<textarea name="description" id="description" rows="2" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"></textarea>
					</div>
				</div>
				<div class="flex items-center gap-3 mt-5 pt-5 border-t border-border">
					<button type="submit" class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors">{t(locale, 'common.save')}</button>
					<button type="button" onclick={() => showNewForm = false} class="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text hover:bg-surface-sunken rounded-lg transition-colors">{t(locale, 'common.cancel')}</button>
				</div>
			</form>
		</div>
	{/if}

	<div class="bg-surface rounded-xl border border-border p-4 mb-5">
		<form method="GET" class="flex flex-wrap gap-3 items-end">
			<div class="flex-1 min-w-[200px]">
				<label for="q" class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wide">{t(locale, 'common.search')}</label>
				<input type="text" name="q" id="q" value={data.filters.search} placeholder={t(locale, 'colonies.search')} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
			</div>
			<div>
				<label for="status" class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wide">{t(locale, 'common.status')}</label>
				<select name="status" id="status" class="px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
					<option value="">{t(locale, 'common.all')}</option>
					<option value="active" selected={data.filters.status === 'active'}>{t(locale, 'colonies.status.active')}</option>
					<option value="monitoring" selected={data.filters.status === 'monitoring'}>{t(locale, 'colonies.status.monitoring')}</option>
					<option value="inactive" selected={data.filters.status === 'inactive'}>{t(locale, 'colonies.status.inactive')}</option>
				</select>
			</div>
			<div>
				<label for="district" class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wide">{t(locale, 'colonies.district')}</label>
				<select name="district" id="district" class="px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
					<option value="">{t(locale, 'common.all')}</option>
					{#each data.districts as d}
						<option value={d} selected={data.filters.district === d}>{d}</option>
					{/each}
				</select>
			</div>
			<button type="submit" class="px-4 py-2 bg-text text-text-inverse text-sm font-medium rounded-lg hover:bg-text/90 transition-colors">{t(locale, 'common.filter')}</button>
		</form>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
		{#each data.items as colony}
			{@const badge = statusConfig(colony.status)}
			<a href="/colonias/{colony.id}" class="bg-surface rounded-xl border border-border hover:border-primary/30 transition-all group overflow-hidden interactive-card">
				<div class="p-5">
					<div class="flex items-start justify-between mb-3">
						<div class="flex items-center gap-2.5">
							<div class="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-4.5 h-4.5 text-primary"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
							</div>
							<div>
								<h3 class="font-semibold text-text text-sm group-hover:text-primary transition-colors">{colony.name}</h3>
								<p class="text-xs text-text-muted">{colony.district ?? ''}{colony.classification ? ` · ${colony.classification}` : ''}</p>
							</div>
						</div>
						<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium {badge.bg}">
							<span class="w-1.5 h-1.5 rounded-full {badge.dot}"></span>
							{t(locale, `colonies.status.${colony.status}`) || colony.status}
						</span>
					</div>
					<div class="flex items-center gap-4 pt-3 border-t border-border">
						<div class="flex items-center gap-1.5 text-xs text-text-secondary">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3.5 h-3.5"><path d="M12 5c-1.5-2-4-2.5-6-1.5 0 3 1 5.5 3 7.5-1 1-2 2.5-2 4.5 0 2 1.5 3.5 3.5 3.5 1 0 1.5-.5 1.5-.5s.5.5 1.5.5c2 0 3.5-1.5 3.5-3.5 0-2-1-3.5-2-4.5 2-2 3-4.5 3-7.5-2-1-4.5-.5-6 1.5z"/></svg>
							<span>{colony.catCount} {t(locale, 'nav.cats').toLowerCase()}</span>
						</div>
						<div class="flex items-center gap-1.5 text-xs text-text-secondary">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3.5 h-3.5"><polyline points="20,6 9,17 4,12"/></svg>
							<span>{colony.sterilizedCount} {t(locale, 'dashboard.sterilized')}</span>
						</div>
					</div>
				</div>
			</a>
		{:else}
			<div class="col-span-full py-16 text-center">
				<div class="w-12 h-12 rounded-xl bg-surface-sunken flex items-center justify-center mx-auto mb-3">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6 text-text-muted"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
				</div>
				<p class="text-sm text-text-secondary mb-1">{t(locale, 'common.no_results')}</p>
			</div>
		{/each}
	</div>

	<Pagination currentPage={data.page} totalPages={data.totalPages} totalItems={data.totalItems} pageSize={data.pageSize} />
</div>

<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);

	import FileUpload from '$lib/components/ui/FileUpload.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';

	let showNewForm = $state(false);
	let catPhotoPath = $state('');

	function sexConfig(sex: string | null) {
		if (sex === 'male') return { label: t(locale, 'cats.sex.male_short'), bg: 'bg-info/8 text-info' };
		if (sex === 'female') return { label: t(locale, 'cats.sex.female_short'), bg: 'bg-accent/8 text-accent' };
		return { label: '?', bg: 'bg-surface-sunken text-text-muted' };
	}
</script>

<div class="max-w-7xl mx-auto">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-text tracking-tight">{t(locale, 'cats.title')}</h1>
			<p class="text-sm text-text-muted mt-0.5">{data.totalItems} {t(locale, 'providers.registered')}</p>
		</div>
		<button onclick={() => showNewForm = !showNewForm} class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-sm">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M12 5v14m-7-7h14"/></svg>
			{t(locale, 'cats.new')}
		</button>
	</div>

	{#if showNewForm}
		<div class="bg-surface rounded-xl border border-border p-6 mb-6">
			<h3 class="text-base font-semibold text-text mb-4">{t(locale, 'cats.new')}</h3>
			{#if form?.error}
				<div class="bg-danger-subtle text-danger text-sm p-3 rounded-lg mb-4 border border-danger/10">{form.error}</div>
			{/if}
			<form method="POST" action="?/create" use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') { showNewForm = false; await update(); } else { await update(); }
				};
			}}>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<div>
						<label for="name" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'common.name')}</label>
						<input type="text" name="name" id="name" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
					</div>
					<div>
						<label for="colonyId" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'cats.colony')}</label>
						<select name="colonyId" id="colonyId" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
							<option value="">{t(locale, 'cats.unassigned')}</option>
							{#each data.colonies as c}
								<option value={c.id}>{c.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="sex" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'detail.sex')}</label>
						<select name="sex" id="sex" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
							<option value="">{t(locale, 'common.unknown')}</option>
							<option value="male">{t(locale, 'common.male')}</option>
							<option value="female">{t(locale, 'common.female')}</option>
						</select>
					</div>
					<div>
						<label for="microchip" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'cats.microchip')}</label>
						<input type="text" name="microchip" id="microchip" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
					</div>
					<div>
						<label for="estimatedAge" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'detail.estimated_age')}</label>
						<input type="text" name="estimatedAge" id="estimatedAge" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
					</div>
					<div>
						<FileUpload ownerEntity="cats" accept="image/*" label="📷" onuploaded={(r) => catPhotoPath = r.path} />
						<input type="hidden" name="photo" value={catPhotoPath} />
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
			<div class="flex-1 min-w-[180px]">
				<label for="q" class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wide">{t(locale, 'common.search')}</label>
				<input type="text" name="q" id="q" value={data.filters.search} placeholder={t(locale, 'cats.search')} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
			</div>
			<div>
				<label for="status" class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wide">{t(locale, 'common.status')}</label>
				<select name="status" id="status" class="px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
					<option value="">{t(locale, 'common.all')}</option>
					<option value="in_colony" selected={data.filters.status === 'in_colony'}>{t(locale, 'cats.status.in_colony')}</option>
					<option value="adopted" selected={data.filters.status === 'adopted'}>{t(locale, 'cats.status.adopted')}</option>
					<option value="missing" selected={data.filters.status === 'missing'}>{t(locale, 'cats.status.missing')}</option>
					<option value="deceased" selected={data.filters.status === 'deceased'}>{t(locale, 'cats.status.deceased')}</option>
				</select>
			</div>
			<div>
				<label for="sterilized" class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wide">{t(locale, 'detail.sterilized')}</label>
				<select name="sterilized" id="sterilized" class="px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
					<option value="">{t(locale, 'common.all')}</option>
					<option value="yes" selected={data.filters.sterilized === 'yes'}>{t(locale, 'common.yes')}</option>
					<option value="no" selected={data.filters.sterilized === 'no'}>{t(locale, 'common.no')}</option>
				</select>
			</div>
			<div>
				<label for="colony" class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wide">{t(locale, 'cats.colony')}</label>
				<select name="colony" id="colony" class="px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
					<option value="">{t(locale, 'common.all')}</option>
					{#each data.colonies as c}
						<option value={c.id} selected={data.filters.colony === c.id}>{c.name}</option>
					{/each}
				</select>
			</div>
			<button type="submit" class="px-4 py-2 bg-text text-text-inverse text-sm font-medium rounded-lg hover:bg-text/90 transition-colors">{t(locale, 'common.filter')}</button>
		</form>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
		{#each data.items as cat}
			{@const sex = sexConfig(cat.sex)}
			<a href="/gatos/{cat.id}" class="bg-surface rounded-xl border border-border hover:border-primary/30 transition-all group p-4 interactive-card">
				<div class="flex items-start gap-3">
					<div class="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-5 h-5 text-primary"><path d="M12 5c-1.5-2-4-2.5-6-1.5 0 3 1 5.5 3 7.5-1 1-2 2.5-2 4.5 0 2 1.5 3.5 3.5 3.5 1 0 1.5-.5 1.5-.5s.5.5 1.5.5c2 0 3.5-1.5 3.5-3.5 0-2-1-3.5-2-4.5 2-2 3-4.5 3-7.5-2-1-4.5-.5-6 1.5z"/></svg>
					</div>
					<div class="flex-1 min-w-0">
						<h3 class="font-semibold text-sm text-text group-hover:text-primary transition-colors truncate">{cat.name ?? t(locale, 'common.unnamed')}</h3>
						<p class="text-xs text-text-muted truncate">{cat.colonyName ?? t(locale, 'detail.no_colony_assigned')}</p>
					</div>
				</div>
				<div class="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
					<span class="px-2 py-0.5 rounded-md text-[11px] font-medium {sex.bg}">{sex.label}</span>
					<span class="px-2 py-0.5 rounded-md text-[11px] font-medium {cat.sterilized ? 'bg-success/8 text-success' : 'bg-danger/8 text-danger'}">{cat.sterilized ? t(locale, 'detail.sterilized') : t(locale, 'common.no')}</span>
					{#if cat.estimatedAge}
						<span class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-sunken text-text-muted">{cat.estimatedAge}</span>
					{/if}
				</div>
			</a>
		{:else}
			<div class="col-span-full py-16 text-center">
				<div class="w-12 h-12 rounded-xl bg-surface-sunken flex items-center justify-center mx-auto mb-3">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6 text-text-muted"><path d="M12 5c-1.5-2-4-2.5-6-1.5 0 3 1 5.5 3 7.5-1 1-2 2.5-2 4.5 0 2 1.5 3.5 3.5 3.5 1 0 1.5-.5 1.5-.5s.5.5 1.5.5c2 0 3.5-1.5 3.5-3.5 0-2-1-3.5-2-4.5 2-2 3-4.5 3-7.5-2-1-4.5-.5-6 1.5z"/></svg>
				</div>
				<p class="text-sm text-text-secondary mb-1">{t(locale, 'common.no_results')}</p>
			</div>
		{/each}
	</div>

	<Pagination currentPage={data.page} totalPages={data.totalPages} totalItems={data.totalItems} pageSize={data.pageSize} />
</div>

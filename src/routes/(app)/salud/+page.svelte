<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import { toDateString } from '$lib/index.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);

	let showNewForm = $state(false);
	let editingRecord = $state<string | null>(null);

	const healthTypes = ['sterilization', 'vaccination', 'deworming', 'microchip', 'checkup', 'surgery', 'other'];

	function typeLabel(type: string): string {
		const key = `health.type.${type}` as const;
		return t(locale, key) || type;
	}

	function typeBadge(type: string): string {
		const map: Record<string, string> = {
			sterilization: 'bg-accent/8 text-accent', vaccination: 'bg-info/8 text-info',
			deworming: 'bg-success/8 text-success', microchip: 'bg-warning/8 text-warning',
			checkup: 'bg-surface-sunken text-text-secondary', surgery: 'bg-danger/8 text-danger', other: 'bg-surface-sunken text-text-muted'
		};
		return map[type] || 'bg-surface-sunken text-text-muted';
	}
</script>

<div class="max-w-7xl mx-auto">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-text tracking-tight">{t(locale, 'health.title')}</h1>
			<p class="text-sm text-text-muted mt-0.5">{data.totalItems} {t(locale, 'health.records_count')}</p>
		</div>
		<button onclick={() => showNewForm = !showNewForm}
			class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-sm">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M12 5v14m-7-7h14"/></svg>
			{showNewForm ? t(locale, 'common.cancel') : t(locale, 'health.new_record')}
		</button>
	</div>

	{#if showNewForm}
		<div class="bg-surface rounded-xl border border-border p-6 mb-6">
			<h3 class="text-base font-semibold text-text mb-4">{t(locale, 'health.new_record')}</h3>
			<form method="POST" action="?/create" use:enhance class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="catId" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'health.cat')} <span class="text-danger">*</span></label>
					<select name="catId" id="catId" required class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
						<option value="">{t(locale, 'health.select_cat')}</option>
						{#each data.cats as cat}
							<option value={cat.id}>{cat.name || t(locale, 'health.no_name')} ({cat.colonyName || t(locale, 'health.no_colony')})</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="type" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'health.type')} <span class="text-danger">*</span></label>
					<select name="type" id="type" required class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
						{#each healthTypes as ht}
							<option value={ht}>{typeLabel(ht)}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="performedAt" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'health.performed_at')} <span class="text-danger">*</span></label>
					<input type="date" name="performedAt" id="performedAt" required class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
				</div>
				<div>
					<label for="vetName" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'health.vet_name')}</label>
					<input type="text" name="vetName" id="vetName" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
				</div>
				<div>
					<label for="vetClinic" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'health.vet_clinic')}</label>
					<input type="text" name="vetClinic" id="vetClinic" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
				</div>
				<div class="md:col-span-2">
					<label for="notes" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'health.notes')}</label>
					<textarea name="notes" id="notes" rows="3" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"></textarea>
				</div>
				<div class="md:col-span-2 pt-4 border-t border-border">
					<button type="submit" class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors">{t(locale, 'common.save')}</button>
				</div>
			</form>
		</div>
	{/if}

	{#if form?.error}
		<div class="bg-danger-subtle text-danger text-sm p-3 rounded-lg mb-4 border border-danger/10">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="bg-success-subtle text-success text-sm p-3 rounded-lg mb-4 border border-success/10">{t(locale, 'health.success')}</div>
	{/if}

	<!-- Filters -->
	<div class="bg-surface rounded-xl border border-border p-4 mb-5">
		<form method="GET" class="flex gap-3 items-end flex-wrap">
			<div class="flex-1 min-w-[200px]">
				<label for="q" class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wide">{t(locale, 'health.search_label')}</label>
				<input type="text" name="q" value={data.search} placeholder={t(locale, 'health.search')} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
			</div>
			<div>
				<label for="typeFilter" class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wide">{t(locale, 'health.type_filter')}</label>
				<select name="type" id="typeFilter" class="px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
					<option value="">{t(locale, 'health.all_types')}</option>
					{#each healthTypes as ht}
						<option value={ht} selected={data.typeFilter === ht}>{typeLabel(ht)}</option>
					{/each}
				</select>
			</div>
			<button type="submit" class="px-4 py-2 bg-text text-text-inverse text-sm font-medium rounded-lg hover:bg-text/90 transition-colors">{t(locale, 'common.filter')}</button>
		</form>
	</div>

	<!-- Records table -->
	<div class="bg-surface rounded-xl border border-border overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-surface-sunken text-text-muted text-left text-xs uppercase tracking-wide">
					<tr>
						<th class="px-4 py-3 font-medium">{t(locale, 'health.cat')}</th>
						<th class="px-4 py-3 font-medium">{t(locale, 'health.colony')}</th>
						<th class="px-4 py-3 font-medium">{t(locale, 'health.type')}</th>
						<th class="px-4 py-3 font-medium">{t(locale, 'health.date')}</th>
						<th class="px-4 py-3 font-medium">{t(locale, 'health.vet')}</th>
						<th class="px-4 py-3 font-medium">{t(locale, 'health.clinic')}</th>
						<th class="px-4 py-3 font-medium">{t(locale, 'health.notes')}</th>
						<th class="px-4 py-3 font-medium"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each data.items as r}
						<tr class="hover:bg-surface-sunken/50 transition-colors">
							<td class="px-4 py-3 font-medium">
								<a href="/gatos/{r.catId}" class="text-primary hover:text-primary-hover transition-colors">{r.catName || t(locale, 'health.no_name')}</a>
							</td>
							<td class="px-4 py-3 text-text-secondary">{r.colonyName || '-'}</td>
							<td class="px-4 py-3">
								<span class="px-2 py-0.5 rounded-md text-[11px] font-medium {typeBadge(r.type)}">{typeLabel(r.type)}</span>
							</td>
							<td class="px-4 py-3 text-text-secondary">{r.performedAt ? new Date(r.performedAt).toLocaleDateString(locale === 'eu' ? 'eu' : locale === 'ca' ? 'ca' : locale === 'en' ? 'en-GB' : 'es-ES') : '-'}</td>
							<td class="px-4 py-3 text-text-secondary">{r.vetName || '-'}</td>
							<td class="px-4 py-3 text-text-secondary">{r.vetClinic || '-'}</td>
							<td class="px-4 py-3 text-text-muted max-w-xs truncate">{r.notes || '-'}</td>
							<td class="px-4 py-3">
								<div class="flex gap-1">
									<button onclick={() => editingRecord = editingRecord === r.id ? null : r.id} class="p-1.5 rounded-lg text-info hover:bg-info/8 transition-colors" title={t(locale, 'common.edit')}>
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3.5 h-3.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
									</button>
									<form method="POST" action="?/delete" use:enhance onsubmit={(e: SubmitEvent) => { if (!confirm(t(locale, 'common.confirm_delete'))) e.preventDefault(); }}>
										<input type="hidden" name="id" value={r.id} />
										<button type="submit" class="p-1.5 rounded-lg text-danger hover:bg-danger/8 transition-colors" title={t(locale, 'common.delete')}>
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3.5 h-3.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
										</button>
									</form>
								</div>
							</td>
						</tr>
						{#if editingRecord === r.id}
							<tr class="bg-surface-sunken/50">
								<td colspan="8" class="px-4 py-3">
									<form method="POST" action="?/edit" use:enhance class="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end">
										<input type="hidden" name="id" value={r.id} />
										<label class="block">
											<span class="text-[10px] text-text-muted uppercase">{t(locale, 'health.type')}</span>
											<select name="type" class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs">
												{#each healthTypes as ht}
													<option value={ht} selected={r.type === ht}>{typeLabel(ht)}</option>
												{/each}
											</select>
										</label>
										<label class="block">
											<span class="text-[10px] text-text-muted uppercase">{t(locale, 'health.date')}</span>
											<input type="date" name="performedAt" value={r.performedAt ? toDateString(new Date(r.performedAt)) : ''} class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs" />
										</label>
										<label class="block">
											<span class="text-[10px] text-text-muted uppercase">{t(locale, 'health.vet')}</span>
											<input type="text" name="vetName" value={r.vetName ?? ''} class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs" />
										</label>
										<label class="block">
											<span class="text-[10px] text-text-muted uppercase">{t(locale, 'health.clinic')}</span>
											<input type="text" name="vetClinic" value={r.vetClinic ?? ''} class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs" />
										</label>
										<label class="block">
											<span class="text-[10px] text-text-muted uppercase">{t(locale, 'health.notes')}</span>
											<input type="text" name="notes" value={r.notes ?? ''} class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs" />
										</label>
										<div class="flex gap-1">
											<button type="submit" class="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-hover transition-colors">{t(locale, 'common.save')}</button>
											<button type="button" onclick={() => editingRecord = null} class="px-3 py-1.5 bg-surface-sunken text-text-secondary rounded-lg text-xs font-medium hover:bg-border transition-colors">{t(locale, 'common.cancel')}</button>
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
		<Pagination currentPage={data.page} totalPages={data.totalPages} totalItems={data.totalItems} pageSize={data.pageSize} />
	</div>
</div>

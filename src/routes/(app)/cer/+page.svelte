<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';
	import Pagination from '$lib/components/ui/Pagination.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);

	let showNewForm = $state(false);
	let activeTab = $state<'timeline' | 'indicators'>('indicators');

	function statusLabel(a: { capturedAt: unknown; sterilizedAt: unknown; returnedAt: unknown }): { label: string; dot: string; bg: string } {
		if (a.returnedAt) return { label: t(locale, 'cer.status_completed'), dot: 'bg-success', bg: 'bg-success/8 text-success' };
		if (a.sterilizedAt) return { label: t(locale, 'cer.status_pending_return'), dot: 'bg-warning', bg: 'bg-warning/8 text-warning' };
		if (a.capturedAt) return { label: t(locale, 'cer.status_captured'), dot: 'bg-info', bg: 'bg-info/8 text-info' };
		return { label: t(locale, 'cer.status_registered'), dot: 'bg-text-muted', bg: 'bg-surface-sunken text-text-muted' };
	}

	let maxChartVal = $derived(Math.max(...(data.monthlyChart?.map((m: { count: number }) => m.count) || [1]), 1));
</script>

<div class="max-w-7xl mx-auto">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-text tracking-tight">{t(locale, 'cer.title')}</h1>
			<p class="text-sm text-text-muted mt-0.5">{data.indicators.totalActions} {t(locale, 'cer.registered')}</p>
		</div>
		<button onclick={() => showNewForm = !showNewForm}
			class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-sm btn-press">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M12 5v14m-7-7h14"/></svg>
			{showNewForm ? t(locale, 'common.cancel') : t(locale, 'cer.new_action')}
		</button>
	</div>

	{#if showNewForm}
		<div class="bg-surface rounded-xl border border-border p-6 mb-6">
			<h3 class="text-base font-semibold text-text mb-4">{t(locale, 'cer.new_action')}</h3>
			<form method="POST" action="?/create" use:enhance class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="catId" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'cer.cat')} <span class="text-danger">*</span></label>
					<select name="catId" id="catId" required class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
						<option value="">{t(locale, 'cer.select_cat')}</option>
						{#each data.cats as cat}
							<option value={cat.id}>{cat.name || t(locale, 'cer.no_name')}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="colonyId" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'cer.colony')} <span class="text-danger">*</span></label>
					<select name="colonyId" id="colonyId" required class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
						<option value="">{t(locale, 'cer.select_colony')}</option>
						{#each data.colonies as col}
							<option value={col.id}>{col.name}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="capturedAt" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'cer.captured_at')}</label>
					<input type="date" name="capturedAt" id="capturedAt" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
				</div>
				<div>
					<label for="sterilizedAt" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'cer.sterilized_at')}</label>
					<input type="date" name="sterilizedAt" id="sterilizedAt" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
				</div>
				<div>
					<label for="returnedAt" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'cer.returned_at')}</label>
					<input type="date" name="returnedAt" id="returnedAt" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
				</div>
				<div>
					<label for="collaboratorName" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'cer.collaborator')}</label>
					<input type="text" name="collaboratorName" id="collaboratorName" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
				</div>
				<div class="md:col-span-2">
					<label for="notes" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'cer.notes')}</label>
					<textarea name="notes" id="notes" rows="2" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"></textarea>
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
		<div class="bg-success-subtle text-success text-sm p-3 rounded-lg mb-4 border border-success/10">{t(locale, 'cer.created')}</div>
	{/if}

	<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
		<div class="bg-surface rounded-xl border border-border p-4 interactive-card">
			<p class="text-2xl font-bold text-primary">{data.indicators.totalActions}</p>
			<p class="text-xs text-text-muted mt-1">{t(locale, 'cer.total_actions')}</p>
		</div>
		<div class="bg-surface rounded-xl border border-border p-4 interactive-card">
			<p class="text-2xl font-bold text-success">{data.indicators.completed}</p>
			<p class="text-xs text-text-muted mt-1">{t(locale, 'cer.completed')}</p>
		</div>
		<div class="bg-surface rounded-xl border border-border p-4 interactive-card">
			<p class="text-2xl font-bold text-warning">{data.indicators.pendingReturn}</p>
			<p class="text-xs text-text-muted mt-1">{t(locale, 'cer.pending_return')}</p>
		</div>
		<div class="bg-surface rounded-xl border border-border p-4 interactive-card">
			<p class="text-2xl font-bold text-info">{data.indicators.successRate}%</p>
			<p class="text-xs text-text-muted mt-1">{t(locale, 'cer.success_rate')}</p>
		</div>
	</div>

	<div class="flex gap-1 p-1 bg-surface-sunken rounded-lg w-fit mb-5">
		<button onclick={() => activeTab = 'indicators'}
			class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeTab === 'indicators' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'}">
			{t(locale, 'cer.monthly_chart')}
		</button>
		<button onclick={() => activeTab = 'timeline'}
			class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeTab === 'timeline' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'}">
			{t(locale, 'cer.timeline')}
		</button>
	</div>

	{#if activeTab === 'indicators'}
		<div class="bg-surface rounded-xl border border-border p-6 mb-6">
			<h3 class="text-sm font-semibold text-text mb-4">{t(locale, 'cer.monthly_chart')}</h3>
			{#if data.monthlyChart && data.monthlyChart.length > 0}
				<div class="flex items-end gap-2 h-48">
					{#each data.monthlyChart as m}
						<div class="flex-1 flex flex-col items-center">
							<span class="text-xs font-medium text-text-secondary mb-1">{m.count}</span>
							<div class="w-full bg-primary rounded-t transition-all" style="height: {(m.count / maxChartVal) * 100}%"></div>
							<span class="text-[10px] text-text-muted mt-1.5 rotate-[-45deg] origin-top-left whitespace-nowrap">{m.month}</span>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-text-muted text-sm">{t(locale, 'cer.no_chart_data')}</p>
			{/if}
		</div>
	{/if}

	{#if activeTab === 'timeline'}
		<div class="bg-surface rounded-xl border border-border overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-surface-sunken text-text-muted text-left text-xs uppercase tracking-wide">
						<tr>
							<th class="px-4 py-3 font-medium">{t(locale, 'cer.cat_col')}</th>
							<th class="px-4 py-3 font-medium">{t(locale, 'cer.colony_col')}</th>
							<th class="px-4 py-3 font-medium">{t(locale, 'cer.status_col')}</th>
							<th class="px-4 py-3 font-medium">{t(locale, 'cer.capture_col')}</th>
							<th class="px-4 py-3 font-medium">{t(locale, 'cer.sterilization_col')}</th>
							<th class="px-4 py-3 font-medium">{t(locale, 'cer.return_col')}</th>
							<th class="px-4 py-3 font-medium">{t(locale, 'cer.collaborator_col')}</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each data.items as a}
							{@const badge = statusLabel(a)}
							<tr class="hover:bg-surface-sunken/50 transition-colors">
								<td class="px-4 py-3 font-medium">
									<a href="/gatos/{a.catId}" class="text-primary hover:text-primary-hover transition-colors">{a.catName || t(locale, 'cer.no_name')}</a>
								</td>
								<td class="px-4 py-3 text-text-secondary">{a.colonyName || '-'}</td>
								<td class="px-4 py-3">
									<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium {badge.bg}">
										<span class="w-1.5 h-1.5 rounded-full {badge.dot}"></span>{badge.label}
									</span>
								</td>
								<td class="px-4 py-3 text-text-secondary">{a.capturedAt ? new Date(a.capturedAt).toLocaleDateString(locale) : '-'}</td>
								<td class="px-4 py-3 text-text-secondary">{a.sterilizedAt ? new Date(a.sterilizedAt).toLocaleDateString(locale) : '-'}</td>
								<td class="px-4 py-3 text-text-secondary">{a.returnedAt ? new Date(a.returnedAt).toLocaleDateString(locale) : '-'}</td>
								<td class="px-4 py-3 text-text-muted">{a.collaboratorName || '-'}</td>
							</tr>
						{/each}
						{#if data.items.length === 0}
							<tr><td colspan="7" class="px-4 py-12 text-center text-text-muted">{t(locale, 'common.no_results')}</td></tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<Pagination currentPage={data.page} totalPages={data.totalPages} totalItems={data.totalItems} pageSize={data.pageSize} />
</div>

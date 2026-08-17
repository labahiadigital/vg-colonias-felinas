<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);

	let showNewForm = $state(false);
	let editingAdoption = $state<string | null>(null);

	function statusConfig(s: string): { label: string; dot: string; bg: string } {
		const map: Record<string, { label: string; dot: string; bg: string }> = {
			pending: { label: t(locale, 'adoptions.status.pending'), dot: 'bg-warning', bg: 'bg-warning/8 text-warning' },
			approved: { label: t(locale, 'adoptions.status.approved'), dot: 'bg-info', bg: 'bg-info/8 text-info' },
			completed: { label: t(locale, 'adoptions.status.completed'), dot: 'bg-success', bg: 'bg-success/8 text-success' },
			rejected: { label: t(locale, 'adoptions.status.rejected'), dot: 'bg-danger', bg: 'bg-danger/8 text-danger' },
			cancelled: { label: t(locale, 'adoptions.status.cancelled'), dot: 'bg-text-muted', bg: 'bg-surface-sunken text-text-muted' }
		};
		return map[s] || { label: s, dot: 'bg-text-muted', bg: 'bg-surface-sunken text-text-muted' };
	}

	function getAdopterField(info: unknown, field: string): string {
		if (info && typeof info === 'object' && field in (info as Record<string, unknown>)) {
			return String((info as Record<string, unknown>)[field] || '-');
		}
		return '-';
	}
</script>

<div class="max-w-7xl mx-auto">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-text tracking-tight">{t(locale, 'adoptions.title')}</h1>
			<p class="text-sm text-text-muted mt-0.5">{data.adoptions.length} {t(locale, 'adoptions.registered_count')}</p>
		</div>
		<button onclick={() => showNewForm = !showNewForm}
			class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-sm">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M12 5v14m-7-7h14"/></svg>
			{showNewForm ? t(locale, 'common.cancel') : t(locale, 'adoptions.new')}
		</button>
	</div>

	{#if showNewForm}
		<div class="bg-surface rounded-xl border border-border p-6 mb-6">
			<h3 class="text-base font-semibold text-text mb-4">{t(locale, 'adoptions.new')}</h3>
			<form method="POST" action="?/create" use:enhance class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="md:col-span-2">
					<label for="catId" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'adoptions.cat')} <span class="text-danger">*</span></label>
					<select name="catId" id="catId" required class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
						<option value="">{t(locale, 'adoptions.select_cat')}</option>
						{#each data.availableCats as cat}
							<option value={cat.id}>{cat.name || t(locale, 'adoptions.no_name')} ({cat.colonyName || t(locale, 'adoptions.no_colony')})</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="adopterName" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'adoptions.adopter_name')} <span class="text-danger">*</span></label>
					<input type="text" name="adopterName" id="adopterName" required class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
				</div>
				<div>
					<label for="adopterDocument" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'adoptions.adopter_document')}</label>
					<input type="text" name="adopterDocument" id="adopterDocument" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
				</div>
				<div>
					<label for="adopterPhone" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'adoptions.adopter_phone')}</label>
					<input type="tel" name="adopterPhone" id="adopterPhone" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
				</div>
				<div>
					<label for="adopterEmail" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'adoptions.adopter_email')}</label>
					<input type="email" name="adopterEmail" id="adopterEmail" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
				</div>
				<div class="md:col-span-2">
					<label for="adopterAddress" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'adoptions.adopter_address')}</label>
					<input type="text" name="adopterAddress" id="adopterAddress" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
				</div>
				<div class="md:col-span-2">
					<label class="flex items-center gap-2.5 text-sm cursor-pointer min-h-[44px]">
						<input type="checkbox" name="consentSigned" class="rounded border-border text-primary focus:ring-primary/20 w-4 h-4" />
						<span class="text-text-secondary">{t(locale, 'adoptions.consent')}</span>
					</label>
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
		<div class="bg-success-subtle text-success text-sm p-3 rounded-lg mb-4 border border-success/10">{t(locale, 'adoptions.success')}</div>
	{/if}

	<!-- Adoptions table -->
	<div class="bg-surface rounded-xl border border-border overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-surface-sunken text-text-muted text-left text-xs uppercase tracking-wide">
					<tr>
						<th class="px-4 py-3 font-medium">{t(locale, 'adoptions.cat')}</th>
						<th class="px-4 py-3 font-medium">{t(locale, 'adoptions.colony')}</th>
						<th class="px-4 py-3 font-medium">{t(locale, 'adoptions.adopter')}</th>
						<th class="px-4 py-3 font-medium">{t(locale, 'adoptions.adopter_document')}</th>
						<th class="px-4 py-3 font-medium">{t(locale, 'adoptions.status')}</th>
						<th class="px-4 py-3 font-medium">{t(locale, 'adoptions.date')}</th>
						<th class="px-4 py-3 font-medium">{t(locale, 'adoptions.actions')}</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each data.adoptions as adoption}
						{@const badge = statusConfig(adoption.status)}
						<tr class="hover:bg-surface-sunken/50 transition-colors">
							<td class="px-4 py-3 font-medium">
								<a href="/gatos/{adoption.catId}" class="text-primary hover:text-primary-hover transition-colors">{adoption.catName || t(locale, 'adoptions.no_name')}</a>
							</td>
							<td class="px-4 py-3 text-text-secondary">{adoption.colonyName || '-'}</td>
							<td class="px-4 py-3 text-text">{getAdopterField(adoption.adopterInfo, 'name')}</td>
							<td class="px-4 py-3 text-text-secondary">{getAdopterField(adoption.adopterInfo, 'document')}</td>
							<td class="px-4 py-3">
								<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium {badge.bg}">
									<span class="w-1.5 h-1.5 rounded-full {badge.dot}"></span>{badge.label}
								</span>
							</td>
							<td class="px-4 py-3 text-text-secondary">{adoption.adoptedAt ? new Date(adoption.adoptedAt).toLocaleDateString(locale === 'eu' ? 'eu' : locale === 'ca' ? 'ca' : locale === 'en' ? 'en-GB' : 'es-ES') : adoption.createdAt ? new Date(adoption.createdAt).toLocaleDateString(locale === 'eu' ? 'eu' : locale === 'ca' ? 'ca' : locale === 'en' ? 'en-GB' : 'es-ES') : '-'}</td>
							<td class="px-4 py-3">
								{#if adoption.status === 'pending'}
									<form method="POST" action="?/updateStatus" use:enhance class="flex gap-1">
										<input type="hidden" name="id" value={adoption.id} />
										<button type="submit" name="status" value="approved" class="px-2.5 py-1.5 bg-info/8 text-info border border-info/20 rounded-lg text-xs font-medium hover:bg-info/12 transition-colors min-h-[32px]">{t(locale, 'adoptions.approve')}</button>
										<button type="submit" name="status" value="rejected" class="px-2.5 py-1.5 bg-danger/8 text-danger border border-danger/20 rounded-lg text-xs font-medium hover:bg-danger/12 transition-colors min-h-[32px]">{t(locale, 'adoptions.reject')}</button>
									</form>
								{:else if adoption.status === 'approved'}
									<form method="POST" action="?/updateStatus" use:enhance>
										<input type="hidden" name="id" value={adoption.id} />
										<button type="submit" name="status" value="completed" class="px-2.5 py-1.5 bg-success/8 text-success border border-success/20 rounded-lg text-xs font-medium hover:bg-success/12 transition-colors min-h-[32px]">{t(locale, 'adoptions.complete')}</button>
									</form>
								{/if}
								<button onclick={() => editingAdoption = editingAdoption === adoption.id ? null : adoption.id} class="p-1.5 rounded-lg text-info hover:bg-info/8 transition-colors ml-1" title={t(locale, 'common.edit')}>
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3.5 h-3.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
								</button>
								<form method="POST" action="?/delete" use:enhance onsubmit={(e: SubmitEvent) => { if (!confirm(t(locale, 'common.confirm_delete'))) e.preventDefault(); }} class="inline-block ml-1">
									<input type="hidden" name="id" value={adoption.id} />
									<button type="submit" class="p-1.5 rounded-lg text-danger hover:bg-danger/8 transition-colors" title={t(locale, 'common.delete')}>
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3.5 h-3.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
									</button>
								</form>
							</td>
						</tr>
						{#if editingAdoption === adoption.id}
							{@const info = (adoption.adopterInfo as Record<string, string> | null) ?? {}}
							<tr class="bg-surface-sunken/50">
								<td colspan="7" class="px-4 py-3">
									<form method="POST" action="?/edit" use:enhance class="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
										<input type="hidden" name="id" value={adoption.id} />
										<div>
											<label class="text-[10px] text-text-muted uppercase">{t(locale, 'adoptions.adopter_name')}</label>
											<input type="text" name="adopterName" value={info.name ?? ''} class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs" />
										</div>
										<div>
											<label class="text-[10px] text-text-muted uppercase">{t(locale, 'adoptions.adopter_phone')}</label>
											<input type="text" name="adopterPhone" value={info.phone ?? ''} class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs" />
										</div>
										<div>
											<label class="text-[10px] text-text-muted uppercase">{t(locale, 'adoptions.adopter_email')}</label>
											<input type="text" name="adopterEmail" value={info.email ?? ''} class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs" />
										</div>
										<div class="flex gap-1">
											<button type="submit" class="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-hover transition-colors">{t(locale, 'common.save')}</button>
											<button type="button" onclick={() => editingAdoption = null} class="px-3 py-1.5 bg-surface-sunken text-text-secondary rounded-lg text-xs font-medium hover:bg-border transition-colors">{t(locale, 'common.cancel')}</button>
										</div>
									</form>
								</td>
							</tr>
						{/if}
					{/each}
					{#if data.adoptions.length === 0}
						<tr><td colspan="7" class="px-4 py-12 text-center text-text-muted">{t(locale, 'common.no_results')}</td></tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>

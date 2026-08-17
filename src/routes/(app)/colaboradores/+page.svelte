<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);

	let showNewForm = $state(false);

	function statusConfig(s: string) {
		const map: Record<string, { dot: string; bg: string; key: string }> = {
			active: { dot: 'bg-success', bg: 'bg-success/8 text-success', key: 'collaborators.status.active' },
			pending: { dot: 'bg-warning', bg: 'bg-warning/8 text-warning', key: 'collaborators.status.pending' },
			inactive: { dot: 'bg-text-muted', bg: 'bg-surface-sunken text-text-muted', key: 'collaborators.status.inactive' },
			suspended: { dot: 'bg-danger', bg: 'bg-danger/8 text-danger', key: 'collaborators.status.suspended' }
		};
		const cfg = map[s] ?? { dot: 'bg-text-muted', bg: 'bg-surface-sunken text-text-muted', key: '' };
		return { ...cfg, label: cfg.key ? t(locale, cfg.key) : s };
	}
</script>

<div class="max-w-7xl mx-auto">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-text tracking-tight">{t(locale, 'collaborators.title')}</h1>
			<p class="text-sm text-text-muted mt-0.5">{data.collaborators.length} {t(locale, 'collaborators.registered_count')}</p>
		</div>
		<button onclick={() => showNewForm = !showNewForm} class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-sm">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M12 5v14m-7-7h14"/></svg>
			{t(locale, 'collaborators.new')}
		</button>
	</div>

	{#if showNewForm}
		<div class="bg-surface rounded-xl border border-border p-6 mb-6">
			<h3 class="text-base font-semibold text-text mb-4">{t(locale, 'collaborators.register_new')}</h3>
			{#if form?.error}
				<div class="bg-danger-subtle text-danger text-sm p-3 rounded-lg mb-4 border border-danger/10">{form.error}</div>
			{/if}
			<form method="POST" action="?/create" use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') { showNewForm = false; await update(); } else { await update(); }
				};
			}}>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="name" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'collaborators.full_name')} <span class="text-danger">*</span></label>
						<input type="text" name="name" id="name" required class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
					</div>
					<div>
						<label for="documentId" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'collaborators.document_id')}</label>
						<input type="text" name="documentId" id="documentId" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
					</div>
					<div class="md:col-span-2">
						<label class="block text-sm font-medium text-text-secondary mb-2">{t(locale, 'collaborators.assigned_colonies')}</label>
						<div class="flex flex-wrap gap-2">
							{#each data.colonies as c}
								<label class="flex items-center gap-1.5 text-sm bg-surface-sunken px-3 py-2 rounded-lg border border-border cursor-pointer hover:border-primary/30 transition-colors min-h-[44px]">
									<input type="checkbox" name="assignedColonies" value={c.id} class="rounded border-border text-primary focus:ring-primary/20" />
									{c.name}
								</label>
							{/each}
						</div>
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
				<input type="text" name="q" id="q" value={data.filters.search} placeholder={t(locale, 'collaborators.name_placeholder')} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
			</div>
			<div>
				<label for="status" class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wide">{t(locale, 'collaborators.status')}</label>
				<select name="status" id="status" class="px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
					<option value="">{t(locale, 'common.all')}</option>
					<option value="active" selected={data.filters.status === 'active'}>{t(locale, 'collaborators.status.active')}</option>
					<option value="pending" selected={data.filters.status === 'pending'}>{t(locale, 'collaborators.status.pending')}</option>
					<option value="inactive" selected={data.filters.status === 'inactive'}>{t(locale, 'collaborators.status.inactive')}</option>
				</select>
			</div>
			<button type="submit" class="px-4 py-2 bg-text text-text-inverse text-sm font-medium rounded-lg hover:bg-text/90 transition-colors">{t(locale, 'common.filter')}</button>
		</form>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
		{#each data.collaborators as col}
			{@const badge = statusConfig(col.status)}
			<div class="bg-surface rounded-xl border border-border p-5 hover:border-primary/20 transition-colors">
				<div class="flex items-start justify-between mb-3">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
							{col.name.charAt(0).toUpperCase()}
						</div>
						<div>
							<h3 class="font-semibold text-sm text-text">{col.name}</h3>
							<p class="text-xs text-text-muted">{col.documentId ?? ''}</p>
						</div>
					</div>
					<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium {badge.bg}">
						<span class="w-1.5 h-1.5 rounded-full {badge.dot}"></span>{badge.label}
					</span>
				</div>

				{#if col.colonyNames.length > 0}
					<div class="mb-3">
						<p class="text-xs font-medium text-text-muted mb-1.5">{t(locale, 'collaborators.assigned_colonies')}</p>
						<div class="flex flex-wrap gap-1">
							{#each col.colonyNames as cn}
								<span class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/8 text-primary">{cn}</span>
							{/each}
						</div>
					</div>
				{/if}

				<div class="flex justify-between items-center text-xs text-text-muted mb-3 pt-3 border-t border-border">
					<span class="inline-flex items-center gap-1">
						{#if col.privacyNoticeSigned}
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5 text-success"><polyline points="20,6 9,17 4,12"/></svg>
							{t(locale, 'collaborators.privacy_signed')}
						{:else}
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5 text-danger"><path d="M18 6L6 18M6 6l12 12"/></svg>
							{t(locale, 'collaborators.privacy_pending')}
						{/if}
					</span>
					{#if col.validUntil}
						<span>{t(locale, 'collaborators.valid_until')}: {col.validUntil}</span>
					{/if}
				</div>

				<div class="flex gap-2">
					{#if col.status === 'pending'}
						<form method="POST" action="?/updateStatus" use:enhance class="flex-1">
							<input type="hidden" name="id" value={col.id} />
							<input type="hidden" name="status" value="active" />
							<button type="submit" class="w-full px-3 py-2 bg-success/8 text-success border border-success/20 rounded-lg text-xs font-medium hover:bg-success/12 transition-colors min-h-[40px]">{t(locale, 'collaborators.approve')}</button>
						</form>
						<form method="POST" action="?/updateStatus" use:enhance class="flex-1">
							<input type="hidden" name="id" value={col.id} />
							<input type="hidden" name="status" value="inactive" />
							<button type="submit" class="w-full px-3 py-2 bg-danger/8 text-danger border border-danger/20 rounded-lg text-xs font-medium hover:bg-danger/12 transition-colors min-h-[40px]">{t(locale, 'collaborators.reject')}</button>
						</form>
					{/if}
					<a href="/colaboradores/{col.id}" class="flex-1 px-3 py-2 bg-surface-sunken text-text-secondary rounded-lg text-xs font-medium hover:bg-border transition-colors text-center min-h-[40px] flex items-center justify-center">{t(locale, 'collaborators.view_card')}</a>
				</div>
			</div>
		{:else}
			<div class="col-span-full py-16 text-center">
				<div class="w-12 h-12 rounded-xl bg-surface-sunken flex items-center justify-center mx-auto mb-3">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6 text-text-muted"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
				</div>
				<p class="text-sm text-text-secondary mb-1">{t(locale, 'collaborators.no_results')}</p>
				<p class="text-xs text-text-muted">{t(locale, 'collaborators.try_filters')}</p>
			</div>
		{/each}
	</div>
</div>

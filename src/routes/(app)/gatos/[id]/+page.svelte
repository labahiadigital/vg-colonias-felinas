<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);
	let cat = $derived(data.cat);

	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';

	let activeTab = $state('health');
	let editing = $state(false);
	let showHealthForm = $state(false);
	let showDeleteConfirm = $state(false);
	let deleteFormEl: HTMLFormElement;

	function healthTypeLabel(type: string): string {
		const key = `health.type.${type}`;
		return t(locale, key) || type;
	}

	function statusLabel(s: string): string {
		return t(locale, `cats.status.${s}`) || s;
	}

	function statusConfig(s: string) {
		const map: Record<string, { dot: string; bg: string }> = {
			in_colony: { dot: 'bg-success', bg: 'bg-success/8 text-success' },
			adopted: { dot: 'bg-info', bg: 'bg-info/8 text-info' },
			missing: { dot: 'bg-warning', bg: 'bg-warning/8 text-warning' },
			deceased: { dot: 'bg-text-muted', bg: 'bg-surface-sunken text-text-muted' }
		};
		return map[s] ?? { dot: 'bg-text-muted', bg: 'bg-surface-sunken text-text-muted' };
	}
</script>

<div class="max-w-7xl mx-auto">
	<a href="/gatos" class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-4">
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M19 12H5m0 0l7 7m-7-7l7-7"/></svg>
		{t(locale, 'detail.back_to_cats')}
	</a>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<div class="bg-surface rounded-xl border border-border overflow-hidden">
			<div class="h-32 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
				<div class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-8 h-8 text-primary"><path d="M12 5c-1.5-2-4-2.5-6-1.5 0 3 1 5.5 3 7.5-1 1-2 2.5-2 4.5 0 2 1.5 3.5 3.5 3.5 1 0 1.5-.5 1.5-.5s.5.5 1.5.5c2 0 3.5-1.5 3.5-3.5 0-2-1-3.5-2-4.5 2-2 3-4.5 3-7.5-2-1-4.5-.5-6 1.5z"/></svg>
				</div>
			</div>
			<div class="p-5">
				<h2 class="text-lg font-bold text-text tracking-tight">{cat.name ?? t(locale, 'common.unnamed')}</h2>
				<p class="text-sm text-text-muted mt-0.5">{cat.colonyName ?? t(locale, 'detail.no_colony_assigned')}</p>

				<div class="mt-4 space-y-2.5">
					<div class="flex justify-between text-sm"><span class="text-text-muted">{t(locale, 'detail.sex')}</span><span class="font-medium text-text">{cat.sex === 'male' ? t(locale, 'common.male') : cat.sex === 'female' ? t(locale, 'common.female') : t(locale, 'common.unknown')}</span></div>
					<div class="flex justify-between text-sm"><span class="text-text-muted">{t(locale, 'detail.estimated_age')}</span><span class="font-medium text-text">{cat.estimatedAge ?? '-'}</span></div>
					<div class="flex justify-between text-sm"><span class="text-text-muted">{t(locale, 'cats.microchip')}</span><span class="font-medium text-text font-mono text-xs">{cat.microchip ?? t(locale, 'cats.no_microchip')}</span></div>
					<div class="flex justify-between text-sm items-center">
						<span class="text-text-muted">{t(locale, 'detail.sterilized')}</span>
						<span class="inline-flex items-center gap-1.5">
							{#if cat.sterilized}
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-success"><polyline points="20,6 9,17 4,12"/></svg>
								<span class="text-sm font-medium text-success">{t(locale, 'common.yes')}</span>
							{:else}
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-danger"><path d="M18 6L6 18M6 6l12 12"/></svg>
								<span class="text-sm font-medium text-danger">{t(locale, 'common.no')}</span>
							{/if}
						</span>
					</div>
					{#if cat.sterilizationDate}
						<div class="flex justify-between text-sm"><span class="text-text-muted">{t(locale, 'detail.sterilization_date')}</span><span class="font-medium text-text">{cat.sterilizationDate}</span></div>
					{/if}
					<div class="flex justify-between text-sm items-center">
						<span class="text-text-muted">{t(locale, 'common.status')}</span>
						<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium {statusConfig(cat.status).bg}">
							<span class="w-1.5 h-1.5 rounded-full {statusConfig(cat.status).dot}"></span>{statusLabel(cat.status)}
						</span>
					</div>
				</div>

				<div class="mt-5 pt-5 border-t border-border space-y-2">
					<div class="flex gap-2">
						<button onclick={() => editing = !editing} class="flex-1 px-3 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors min-h-[44px]">
							{editing ? t(locale, 'common.cancel') : t(locale, 'common.edit')}
						</button>
						<button onclick={() => showDeleteConfirm = true} class="px-3 py-2.5 bg-danger/8 text-danger border border-danger/20 rounded-lg hover:bg-danger/12 transition-colors min-h-[44px]" aria-label={t(locale, 'common.delete')}>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
						</button>
						<form bind:this={deleteFormEl} method="POST" action="?/delete" use:enhance class="hidden"></form>
					</div>
					<div class="flex flex-col gap-1.5">
						<a href="/api/certificado/{cat.id}?type=health" target="_blank" class="px-3 py-2 bg-surface-sunken text-text-secondary rounded-lg text-xs font-medium hover:bg-border transition-colors text-center min-h-[36px] flex items-center justify-center">{t(locale, 'detail.health_cert')}</a>
						<a href="/api/certificado/{cat.id}?type=sterilization" target="_blank" class="px-3 py-2 bg-surface-sunken text-text-secondary rounded-lg text-xs font-medium hover:bg-border transition-colors text-center min-h-[36px] flex items-center justify-center">{t(locale, 'detail.sterilization_cert')}</a>
						<a href="/api/certificado/{cat.id}?type=cer" target="_blank" class="px-3 py-2 bg-surface-sunken text-text-secondary rounded-lg text-xs font-medium hover:bg-border transition-colors text-center min-h-[36px] flex items-center justify-center">{t(locale, 'detail.cer_cert')}</a>
					</div>
				</div>
			</div>
		</div>

		<div class="lg:col-span-2 space-y-5">
			{#if editing}
				<div class="bg-surface rounded-xl border border-border p-6">
					<h3 class="text-base font-semibold text-text mb-4">{t(locale, 'detail.edit_cat')}</h3>
					<form method="POST" action="?/update" use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success') { editing = false; await update(); } else { await update(); }
						};
					}}>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label for="name" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'common.name')}</label>
								<input type="text" name="name" id="name" value={cat.name ?? ''} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
							</div>
							<div>
								<label for="colonyId" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'cats.colony')}</label>
								<select name="colonyId" id="colonyId" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
									<option value="">{t(locale, 'cats.unassigned')}</option>
									{#each data.colonies as c}
										<option value={c.id} selected={c.id === cat.colonyId}>{c.name}</option>
									{/each}
								</select>
							</div>
							<div>
								<label for="sex" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'detail.sex')}</label>
								<select name="sex" id="sex" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
									<option value="">{t(locale, 'common.unknown')}</option>
									<option value="male" selected={cat.sex === 'male'}>{t(locale, 'common.male')}</option>
									<option value="female" selected={cat.sex === 'female'}>{t(locale, 'common.female')}</option>
								</select>
							</div>
							<div>
								<label for="microchip" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'cats.microchip')}</label>
								<input type="text" name="microchip" id="microchip" value={cat.microchip ?? ''} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
							</div>
							<div>
								<label for="estimatedAge" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'detail.estimated_age')}</label>
								<input type="text" name="estimatedAge" id="estimatedAge" value={cat.estimatedAge ?? ''} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
							</div>
							<div>
								<label for="status" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'common.status')}</label>
								<select name="status" id="status" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
									<option value="in_colony" selected={cat.status === 'in_colony'}>{t(locale, 'cats.status.in_colony')}</option>
									<option value="adopted" selected={cat.status === 'adopted'}>{t(locale, 'cats.status.adopted')}</option>
									<option value="missing" selected={cat.status === 'missing'}>{t(locale, 'cats.status.missing')}</option>
									<option value="deceased" selected={cat.status === 'deceased'}>{t(locale, 'cats.status.deceased')}</option>
								</select>
							</div>
						</div>
						<div class="flex items-center gap-3 mt-5 pt-5 border-t border-border">
							<button type="submit" class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors">{t(locale, 'common.save')}</button>
							<button type="button" onclick={() => editing = false} class="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text hover:bg-surface-sunken rounded-lg transition-colors">{t(locale, 'common.cancel')}</button>
						</div>
					</form>
				</div>
			{/if}

			<div class="flex gap-1 p-1 bg-surface-sunken rounded-lg overflow-x-auto">
				{#each [{ id: 'health', label: `${t(locale, 'nav.health')} (${data.healthRecords.length})` }, { id: 'cer', label: `CER (${data.cerActions.length})` }, { id: 'adoptions', label: `${t(locale, 'nav.adoptions')} (${data.adoptions.length})` }] as tab}
					<button
						onclick={() => activeTab = tab.id}
						class="px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap min-h-[40px]
							{activeTab === tab.id ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'}"
					>
						{tab.label}
					</button>
				{/each}
			</div>

			{#if activeTab === 'health'}
				<div class="bg-surface rounded-xl border border-border">
					<div class="px-5 py-4 border-b border-border flex justify-between items-center">
						<h3 class="text-sm font-semibold text-text">{t(locale, 'detail.health_history')}</h3>
						<button onclick={() => showHealthForm = !showHealthForm} class="text-sm text-primary font-medium hover:text-primary-hover transition-colors">+ {t(locale, 'common.add')}</button>
					</div>

					{#if showHealthForm}
						<div class="p-5 border-b border-border bg-surface-sunken">
							<form method="POST" action="?/addHealth" use:enhance={() => {
								return async ({ result, update }) => {
									if (result.type === 'success') { showHealthForm = false; await update(); } else { await update(); }
								};
							}}>
								<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
									<div>
										<label for="type" class="block text-xs font-medium text-text-muted mb-1">{t(locale, 'common.type')} *</label>
										<select name="type" id="type" required class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
											<option value="vaccination">{t(locale, 'health.type.vaccination')}</option>
											<option value="sterilization">{t(locale, 'health.type.sterilization')}</option>
											<option value="treatment">{t(locale, 'providers.intervention_type.treatment')}</option>
											<option value="checkup">{t(locale, 'health.type.checkup')}</option>
											<option value="deworming">{t(locale, 'health.type.deworming')}</option>
											<option value="surgery">{t(locale, 'health.type.surgery')}</option>
										</select>
									</div>
									<div>
										<label for="performedAt" class="block text-xs font-medium text-text-muted mb-1">{t(locale, 'common.date')} *</label>
										<input type="date" name="performedAt" id="performedAt" required class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
									</div>
									<div>
										<label for="vetName" class="block text-xs font-medium text-text-muted mb-1">{t(locale, 'health.vet_name')}</label>
										<input type="text" name="vetName" id="vetName" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
									</div>
									<div>
										<label for="vetClinic" class="block text-xs font-medium text-text-muted mb-1">{t(locale, 'health.vet_clinic')}</label>
										<input type="text" name="vetClinic" id="vetClinic" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
									</div>
									<div class="md:col-span-2">
										<label for="notes" class="block text-xs font-medium text-text-muted mb-1">{t(locale, 'common.notes')}</label>
										<textarea name="notes" id="notes" rows="2" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"></textarea>
									</div>
								</div>
								<div class="flex gap-2 mt-3">
									<button type="submit" class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors">{t(locale, 'common.save')}</button>
									<button type="button" onclick={() => showHealthForm = false} class="px-4 py-2 text-sm text-text-secondary hover:bg-border rounded-lg transition-colors">{t(locale, 'common.cancel')}</button>
								</div>
							</form>
						</div>
					{/if}

					{#if data.healthRecords.length > 0}
						<div class="divide-y divide-border">
							{#each data.healthRecords as hr}
								<div class="px-5 py-4">
									<div class="flex items-start justify-between">
										<div>
											<span class="text-sm font-medium text-text">{healthTypeLabel(hr.type)}</span>
											{#if hr.vetName}
												<span class="text-xs text-text-muted ml-2">— {hr.vetName}</span>
											{/if}
											{#if hr.vetClinic}
												<span class="text-xs text-text-muted ml-1">({hr.vetClinic})</span>
											{/if}
										</div>
										<span class="text-xs text-text-muted">{hr.performedAt ? new Date(hr.performedAt).toLocaleDateString(locale) : ''}</span>
									</div>
									{#if hr.notes}
										<p class="text-sm text-text-secondary mt-1">{hr.notes}</p>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<div class="px-5 py-12 text-center text-text-muted text-sm">{t(locale, 'detail.no_health')}</div>
					{/if}
				</div>
			{/if}

			{#if activeTab === 'cer'}
				<div class="bg-surface rounded-xl border border-border">
					<div class="px-5 py-4 border-b border-border"><h3 class="text-sm font-semibold text-text">{t(locale, 'cer.title')}</h3></div>
					{#if data.cerActions.length > 0}
						<div class="divide-y divide-border">
							{#each data.cerActions as cer}
								<div class="px-5 py-4">
									<div class="flex flex-wrap gap-4 text-sm">
										<div><span class="text-text-muted">{t(locale, 'cer.captured_at')}:</span> <span class="text-text font-medium">{cer.capturedAt ? new Date(cer.capturedAt).toLocaleDateString(locale) : '-'}</span></div>
										<div><span class="text-text-muted">{t(locale, 'cer.sterilized_at')}:</span> <span class="text-text font-medium">{cer.sterilizedAt ? new Date(cer.sterilizedAt).toLocaleDateString(locale) : '-'}</span></div>
										<div><span class="text-text-muted">{t(locale, 'cer.returned_at')}:</span> <span class="text-text font-medium">{cer.returnedAt ? new Date(cer.returnedAt).toLocaleDateString(locale) : '-'}</span></div>
									</div>
									<p class="text-xs text-text-muted mt-1.5">{t(locale, 'cer.collaborator')}: {cer.collaboratorName ?? '-'} {cer.notes ? `| ${cer.notes}` : ''}</p>
								</div>
							{/each}
						</div>
					{:else}
						<div class="px-5 py-12 text-center text-text-muted text-sm">{t(locale, 'detail.no_cer')}</div>
					{/if}
				</div>
			{/if}

			{#if activeTab === 'adoptions'}
				<div class="bg-surface rounded-xl border border-border">
					<div class="px-5 py-4 border-b border-border"><h3 class="text-sm font-semibold text-text">{t(locale, 'nav.adoptions')}</h3></div>
					{#if data.adoptions.length > 0}
						<div class="divide-y divide-border">
							{#each data.adoptions as adoption}
								<div class="px-5 py-4">
									<div class="flex justify-between items-start">
										<span class="text-sm font-medium text-text capitalize">{t(locale, `adoptions.status.${adoption.status}`) || adoption.status}</span>
										{#if adoption.adoptedAt}
											<span class="text-xs text-text-muted">{new Date(adoption.adoptedAt).toLocaleDateString(locale)}</span>
										{/if}
									</div>
									{#if adoption.adopterInfo && typeof adoption.adopterInfo === 'object'}
										{@const info = adoption.adopterInfo as Record<string, string>}
										<p class="text-sm text-text-secondary mt-1">{t(locale, 'adoptions.adopter_name')}: {info.name ?? '-'}</p>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<div class="px-5 py-12 text-center text-text-muted text-sm">{t(locale, 'detail.no_adoptions')}</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>

<ConfirmDialog
	open={showDeleteConfirm}
	title={t(locale, 'detail.delete_cat')}
	message={t(locale, 'detail.confirm_delete_cat')}
	confirmLabel={t(locale, 'common.yes_delete')}
	onconfirm={() => { showDeleteConfirm = false; deleteFormEl?.requestSubmit(); }}
	oncancel={() => showDeleteConfirm = false}
/>

<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);

	let showNewForm = $state(false);
	let showInterventionForm = $state<string | null>(null);
	let editingProvider = $state<string | null>(null);

	function provTypeLabel(type: string): string {
		return t(locale, `providers.type.${type}`) || type;
	}

	function typeColor(tp: string): string {
		const map: Record<string, string> = {
			veterinary: 'bg-accent/8 text-accent', clinic: 'bg-info/8 text-info',
			laboratory: 'bg-warning/8 text-warning', transport: 'bg-primary/8 text-primary',
			shelter: 'bg-success/8 text-success', food_supplier: 'bg-success/8 text-success'
		};
		return map[tp] ?? 'bg-surface-sunken text-text-muted';
	}

	function statusConfig(s: string) {
		const map: Record<string, { dot: string; bg: string }> = {
			active: { dot: 'bg-success', bg: 'bg-success/8 text-success' },
			inactive: { dot: 'bg-text-muted', bg: 'bg-surface-sunken text-text-muted' },
			suspended: { dot: 'bg-danger', bg: 'bg-danger/8 text-danger' }
		};
		return map[s] ?? { dot: 'bg-text-muted', bg: 'bg-surface-sunken text-text-muted' };
	}

	function intervTypeLabel(type: string): string {
		return t(locale, `providers.intervention_type.${type}`) || type;
	}
</script>

<div class="max-w-7xl mx-auto">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-text tracking-tight">{t(locale, 'providers.title')}</h1>
			<p class="text-sm text-text-muted mt-0.5">{data.providers.length} {t(locale, 'providers.registered')}</p>
		</div>
		<button onclick={() => showNewForm = !showNewForm}
			class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-sm">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M12 5v14m-7-7h14"/></svg>
			{showNewForm ? t(locale, 'common.cancel') : t(locale, 'providers.new')}
		</button>
	</div>

	{#if showNewForm}
		<div class="bg-surface rounded-xl border border-border p-6 mb-6">
			<h3 class="text-base font-semibold text-text mb-4">{t(locale, 'providers.register')}</h3>
			{#if form?.error}<div class="bg-danger-subtle text-danger text-sm p-3 rounded-lg mb-4 border border-danger/10">{form.error}</div>{/if}
			<form method="POST" action="?/create" use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') { showNewForm = false; await update(); } else { await update(); }
				};
			}}>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="name" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'common.name')} <span class="text-danger">*</span></label>
						<input type="text" name="name" id="name" required class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
					</div>
					<div>
						<label for="type" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'common.type')}</label>
						<select name="type" id="type" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
							<option value="veterinary">{t(locale, 'providers.type.veterinary')}</option>
							<option value="clinic">{t(locale, 'providers.type.clinic')}</option>
							<option value="laboratory">{t(locale, 'providers.type.laboratory')}</option>
							<option value="transport">{t(locale, 'providers.type.transport')}</option>
							<option value="shelter">{t(locale, 'providers.type.shelter')}</option>
							<option value="food_supplier">{t(locale, 'providers.type.food_supplier')}</option>
							<option value="other">{t(locale, 'providers.type.other')}</option>
						</select>
					</div>
					<div>
						<label for="contactPerson" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'providers.contact_person')}</label>
						<input type="text" name="contactPerson" id="contactPerson" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
					</div>
					<div>
						<label for="email" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'common.email')}</label>
						<input type="email" name="email" id="email" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
					</div>
					<div>
						<label for="phone" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'common.phone')}</label>
						<input type="tel" name="phone" id="phone" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
					</div>
					<div>
						<label for="licenseNumber" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'providers.license_number')}</label>
						<input type="text" name="licenseNumber" id="licenseNumber" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
					</div>
					<div>
						<label for="address" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'providers.address')}</label>
						<input type="text" name="address" id="address" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
					</div>
					<div>
						<label for="city" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'providers.city')}</label>
						<input type="text" name="city" id="city" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
					</div>
					<div>
						<label for="contractStart" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'providers.contract_start')}</label>
						<input type="date" name="contractStart" id="contractStart" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
					</div>
					<div>
						<label for="contractEnd" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'providers.contract_end')}</label>
						<input type="date" name="contractEnd" id="contractEnd" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
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
		<div class="bg-success-subtle text-success text-sm p-3 rounded-lg mb-4 border border-success/10">{t(locale, 'providers.registered_ok')}</div>
	{/if}
	{#if form?.interventionSuccess}
		<div class="bg-success-subtle text-success text-sm p-3 rounded-lg mb-4 border border-success/10">{t(locale, 'providers.intervention_ok')}</div>
	{/if}

	<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
		{#each data.providers as prov}
			{@const badge = statusConfig(prov.status)}
			<div class="bg-surface rounded-xl border border-border p-5 interactive-card">
				<div class="flex items-start justify-between mb-3">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-5 h-5 text-accent"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>
						</div>
						<div>
							<h3 class="font-semibold text-sm text-text">{prov.name}</h3>
							<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium {typeColor(prov.type)}">{provTypeLabel(prov.type)}</span>
						</div>
					</div>
					<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium {badge.bg}">
						<span class="w-1.5 h-1.5 rounded-full {badge.dot}"></span>{t(locale, `providers.status.${prov.status}`) || prov.status}
					</span>
				</div>

				<div class="space-y-1.5 text-xs text-text-secondary mb-3">
					{#if prov.contactPerson}<p>{prov.contactPerson}</p>{/if}
					{#if prov.phone}<p>{prov.phone}</p>{/if}
					{#if prov.email}<p>{prov.email}</p>{/if}
					{#if prov.licenseNumber}<p>Nº: {prov.licenseNumber}</p>{/if}
				</div>

				<div class="flex gap-3 text-xs text-text-muted pt-3 border-t border-border mb-3">
					<span class="font-medium">{prov.interventionCount} {t(locale, 'providers.interventions')}</span>
					{#if prov.totalCost > 0}
						<span>{Number(prov.totalCost).toFixed(2)} €</span>
					{/if}
				</div>

				<div class="flex gap-2">
					<button onclick={() => showInterventionForm = showInterventionForm === prov.id ? null : prov.id}
						class="flex-1 px-3 py-2 bg-surface-sunken text-text-secondary rounded-lg text-xs font-medium hover:bg-border transition-colors min-h-[40px]">
						{showInterventionForm === prov.id ? t(locale, 'common.close') : t(locale, 'providers.register_intervention')}
					</button>
					<button onclick={() => editingProvider = editingProvider === prov.id ? null : prov.id} class="px-3 py-2 rounded-lg text-info hover:bg-info/8 transition-colors min-h-[40px]" title={t(locale, 'common.edit')}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-4 h-4"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
					</button>
					<form method="POST" action="?/delete" use:enhance onsubmit={(e: SubmitEvent) => { if (!confirm(t(locale, 'common.confirm_delete'))) e.preventDefault(); }}>
						<input type="hidden" name="id" value={prov.id} />
						<button type="submit" class="px-3 py-2 rounded-lg text-danger hover:bg-danger/8 transition-colors min-h-[40px]" title={t(locale, 'common.delete')}>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-4 h-4"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
						</button>
					</form>
				</div>

				{#if editingProvider === prov.id}
					<form method="POST" action="?/edit" use:enhance class="mt-3 space-y-2 p-3 bg-surface-sunken rounded-lg">
						<input type="hidden" name="id" value={prov.id} />
						<div class="grid grid-cols-2 gap-2">
							<div>
								<label class="text-[10px] text-text-muted uppercase">{t(locale, 'providers.name')}</label>
								<input type="text" name="name" value={prov.name} class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs" />
							</div>
							<div>
								<label class="text-[10px] text-text-muted uppercase">{t(locale, 'providers.contact')}</label>
								<input type="text" name="contactPerson" value={prov.contactPerson ?? ''} class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs" />
							</div>
							<div>
								<label class="text-[10px] text-text-muted uppercase">{t(locale, 'providers.phone')}</label>
								<input type="text" name="phone" value={prov.phone ?? ''} class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs" />
							</div>
							<div>
								<label class="text-[10px] text-text-muted uppercase">{t(locale, 'providers.email')}</label>
								<input type="text" name="email" value={prov.email ?? ''} class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs" />
							</div>
						</div>
						<div class="flex gap-2">
							<button type="submit" class="px-4 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-hover transition-colors min-h-[36px]">{t(locale, 'common.save')}</button>
							<button type="button" onclick={() => editingProvider = null} class="px-4 py-2 bg-surface-sunken text-text-secondary rounded-lg text-xs font-medium hover:bg-border transition-colors min-h-[36px]">{t(locale, 'common.cancel')}</button>
						</div>
					</form>
				{/if}

				{#if showInterventionForm === prov.id}
					<form method="POST" action="?/addIntervention" use:enhance class="mt-3 space-y-3 p-3 bg-surface-sunken rounded-lg">
						<input type="hidden" name="providerId" value={prov.id} />
						<div class="grid grid-cols-2 gap-2">
							<div>
								<label class="block text-[11px] font-medium text-text-muted mb-1">{t(locale, 'common.type')}</label>
								<select name="interventionType" required class="w-full px-2 py-1.5 bg-background border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary/20">
									<option value="sterilization">{t(locale, 'providers.intervention_type.sterilization')}</option>
									<option value="vaccination">{t(locale, 'providers.intervention_type.vaccination')}</option>
									<option value="treatment">{t(locale, 'providers.intervention_type.treatment')}</option>
									<option value="surgery">{t(locale, 'providers.intervention_type.surgery')}</option>
									<option value="checkup">{t(locale, 'providers.intervention_type.checkup')}</option>
									<option value="other">{t(locale, 'providers.intervention_type.other')}</option>
								</select>
							</div>
							<div>
								<label class="block text-[11px] font-medium text-text-muted mb-1">{t(locale, 'providers.cost')} (€)</label>
								<input type="number" name="cost" step="0.01" min="0" class="w-full px-2 py-1.5 bg-background border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary/20" />
							</div>
							<div>
								<label class="block text-[11px] font-medium text-text-muted mb-1">{t(locale, 'health.cat')}</label>
								<select name="catId" class="w-full px-2 py-1.5 bg-background border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary/20">
									<option value="">--</option>
									{#each data.cats as cat}
										<option value={cat.id}>{cat.name || t(locale, 'common.unnamed')}</option>
									{/each}
								</select>
							</div>
							<div>
								<label class="block text-[11px] font-medium text-text-muted mb-1">{t(locale, 'common.date')}</label>
								<input type="date" name="performedAt" class="w-full px-2 py-1.5 bg-background border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary/20" />
							</div>
						</div>
						<div>
							<label class="block text-[11px] font-medium text-text-muted mb-1">{t(locale, 'providers.invoice')}</label>
							<input type="text" name="invoiceRef" class="w-full px-2 py-1.5 bg-background border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary/20" />
						</div>
						<button type="submit" class="w-full px-3 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-hover transition-colors min-h-[36px]">{t(locale, 'providers.save_intervention')}</button>
					</form>
				{/if}
			</div>
		{:else}
			<div class="col-span-full py-16 text-center">
				<div class="w-12 h-12 rounded-xl bg-surface-sunken flex items-center justify-center mx-auto mb-3">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6 text-text-muted"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/></svg>
				</div>
				<p class="text-sm text-text-secondary mb-1">{t(locale, 'providers.no_providers')}</p>
				<p class="text-xs text-text-muted">{t(locale, 'providers.no_providers_desc')}</p>
			</div>
		{/each}
	</div>
</div>

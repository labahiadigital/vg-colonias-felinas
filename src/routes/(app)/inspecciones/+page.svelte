<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);

	let showNewForm = $state(false);
	let showTemplateForm = $state(false);
	let editingInspection = $state<string | null>(null);
	let activeTab = $state<'list' | 'templates'>('list');
	let templateFields = $state<Array<{label: string; type: string; options: string[]; weight: number}>>([]);

	const quickFields = $derived([
		{ name: 'estado_general', label: t(locale, 'inspections.general_status'), type: 'select', options: [t(locale, 'inspections.good'), t(locale, 'inspections.fair'), t(locale, 'inspections.bad'), t(locale, 'inspections.critical')] },
		{ name: 'agua_disponible', label: t(locale, 'inspections.water_available'), type: 'select', options: [t(locale, 'inspections.yes'), t(locale, 'inspections.no')] },
		{ name: 'comida_disponible', label: t(locale, 'inspections.food_available'), type: 'select', options: [t(locale, 'inspections.yes'), t(locale, 'inspections.no')] },
		{ name: 'refugios', label: t(locale, 'inspections.shelters'), type: 'select', options: [t(locale, 'inspections.yes'), t(locale, 'inspections.no'), t(locale, 'inspections.partial')] },
		{ name: 'gatos_vistos', label: t(locale, 'inspections.cats_seen'), type: 'number' },
		{ name: 'limpieza', label: t(locale, 'inspections.cleanliness'), type: 'select', options: [t(locale, 'inspections.clean_good'), t(locale, 'inspections.clean_ok'), t(locale, 'inspections.clean_bad')] }
	]);

	let quickResults = $state<Record<string, string>>({});

	const calculatedScore = $derived.by(() => {
		let total = 0;
		let maxScore = 0;
		const positiveValues = new Set([t(locale, 'inspections.good'), t(locale, 'inspections.yes'), t(locale, 'inspections.clean_good')]);
		const midValues = new Set([t(locale, 'inspections.fair'), t(locale, 'inspections.partial'), t(locale, 'inspections.clean_ok')]);
		for (const field of quickFields) {
			if (field.type === 'select') {
				maxScore += 10;
				const val = quickResults[field.name];
				if (val) {
					if (positiveValues.has(val)) total += 10;
					else if (midValues.has(val)) total += 5;
				}
			}
		}
		if (maxScore === 0) return null;
		const pct = Math.round((total / maxScore) * 100);
		return { total, maxScore, pct };
	});

	function scoreColor(pct: number): string {
		if (pct >= 80) return 'text-success';
		if (pct >= 50) return 'text-warning';
		return 'text-danger';
	}

	function scoreBg(pct: number): string {
		if (pct >= 80) return 'bg-success';
		if (pct >= 50) return 'bg-warning';
		return 'bg-danger';
	}

	function scoreLabel(pct: number): string {
		if (pct >= 80) return t(locale, 'inspections.approved');
		if (pct >= 50) return t(locale, 'inspections.needs_improvement');
		return t(locale, 'inspections.not_approved');
	}

	function fieldTypeLabel(tp: string): string {
		const map: Record<string, string> = {
			select: t(locale, 'inspections.type_select'),
			number: t(locale, 'inspections.type_number'),
			text: t(locale, 'inspections.type_text'),
			boolean: t(locale, 'inspections.type_boolean')
		};
		return map[tp] ?? tp;
	}
</script>

<div class="max-w-7xl mx-auto">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-text tracking-tight">{t(locale, 'inspections.title')}</h1>
			<p class="text-sm text-text-muted mt-0.5">{data.inspections.length} {t(locale, 'inspections.registered')}</p>
		</div>
		<button onclick={() => { showNewForm = !showNewForm; showTemplateForm = false; }}
			class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-sm">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M12 5v14m-7-7h14"/></svg>
			{showNewForm ? t(locale, 'common.cancel') : t(locale, 'inspections.new')}
		</button>
	</div>

	{#if showNewForm}
		<div class="bg-surface rounded-xl border border-border p-6 mb-6">
			<h3 class="text-base font-semibold text-text mb-4">{t(locale, 'inspections.new')}</h3>
			<form method="POST" action="?/create" use:enhance class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="colonyId" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'inspections.colony')} <span class="text-danger">*</span></label>
					<select name="colonyId" id="colonyId" required class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
						<option value="">{t(locale, 'inspections.select_colony')}</option>
						{#each data.colonies as col}
							<option value={col.id}>{col.name}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="templateId" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'inspections.template')}</label>
					<select name="templateId" id="templateId" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
						<option value="">{t(locale, 'inspections.no_template')}</option>
						{#each data.templates as tmpl}
							<option value={tmpl.id}>{tmpl.name}</option>
						{/each}
					</select>
				</div>

				<div class="md:col-span-2 bg-info/5 border border-info/15 rounded-xl p-4">
					<p class="text-sm font-medium text-info mb-3">{t(locale, 'inspections.quick_evaluation')}</p>
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{#each quickFields as field}
							<div>
								<label for={`qf-${field.name}`} class="block text-xs font-medium text-text-secondary mb-1">{field.label}</label>
								{#if field.type === 'select'}
									<select id={`qf-${field.name}`} bind:value={quickResults[field.name]} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
										<option value="">--</option>
										{#each field.options as opt}
											<option value={opt}>{opt}</option>
										{/each}
									</select>
								{:else}
									<input type={field.type} id={`qf-${field.name}`} bind:value={quickResults[field.name]} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
								{/if}
							</div>
						{/each}
					</div>
				</div>

				{#if calculatedScore}
					<div class="md:col-span-2 p-4 bg-surface rounded-xl border border-border">
						<div class="flex items-center justify-between mb-2">
							<p class="text-sm font-medium text-text">{t(locale, 'inspections.score')}</p>
							<span class="text-lg font-bold {scoreColor(calculatedScore.pct)}">{calculatedScore.pct}%</span>
						</div>
						<div class="w-full h-3 bg-surface-sunken rounded-full overflow-hidden mb-2">
							<div class="h-full rounded-full transition-all duration-500 {scoreBg(calculatedScore.pct)}" style="width: {calculatedScore.pct}%"></div>
						</div>
						<div class="flex items-center justify-between text-xs">
							<span class="text-text-muted">{calculatedScore.total} / {calculatedScore.maxScore} {t(locale, 'inspections.points')}</span>
							<span class="font-medium {scoreColor(calculatedScore.pct)}">{scoreLabel(calculatedScore.pct)}</span>
						</div>
					</div>
				{/if}

				<input type="hidden" name="results" value={JSON.stringify(quickResults)} />
				<input type="hidden" name="score" value={calculatedScore?.pct ?? ''} />
				<input type="hidden" name="passed" value={calculatedScore ? (calculatedScore.pct >= 60 ? 'true' : 'false') : ''} />

				<div class="md:col-span-2">
					<label for="notes" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'inspections.notes')}</label>
					<textarea name="notes" id="notes" rows="3" placeholder={t(locale, 'inspections.observations_placeholder')} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"></textarea>
				</div>
				<div class="md:col-span-2 pt-4 border-t border-border">
					<button type="submit" class="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors min-h-[44px]">{t(locale, 'common.save')}</button>
				</div>
			</form>
		</div>
	{/if}

	{#if form?.error}
		<div class="bg-danger-subtle text-danger text-sm p-3 rounded-lg mb-4 border border-danger/10">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="bg-success-subtle text-success text-sm p-3 rounded-lg mb-4 border border-success/10">{t(locale, 'inspections.created')}</div>
	{/if}
	{#if form?.templateSuccess}
		<div class="bg-success-subtle text-success text-sm p-3 rounded-lg mb-4 border border-success/10">{t(locale, 'inspections.template_created')}</div>
	{/if}

	<div class="flex gap-1 p-1 bg-surface-sunken rounded-lg w-fit mb-5">
		<button onclick={() => activeTab = 'list'}
			class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeTab === 'list' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'}">
			{t(locale, 'inspections.title')}
		</button>
		<button onclick={() => activeTab = 'templates'}
			class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeTab === 'templates' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'}">
			{t(locale, 'inspections.templates')}
		</button>
	</div>

	{#if activeTab === 'list'}
		<div class="bg-surface rounded-xl border border-border overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-surface-sunken text-text-muted text-left text-xs uppercase tracking-wide">
						<tr>
							<th class="px-4 py-3 font-medium">{t(locale, 'inspections.colony_col')}</th>
							<th class="px-4 py-3 font-medium">{t(locale, 'inspections.date_col')}</th>
							<th class="px-4 py-3 font-medium">{t(locale, 'inspections.score_col')}</th>
							<th class="px-4 py-3 font-medium">{t(locale, 'inspections.status_col')}</th>
							<th class="px-4 py-3 font-medium">{t(locale, 'inspections.notes_col')}</th>
							<th class="px-4 py-3 font-medium"></th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each data.inspections as insp}
							{@const inspScore = typeof insp.score === 'number' ? insp.score : null}
							<tr class="hover:bg-surface-sunken/50 transition-colors">
								<td class="px-4 py-3 font-medium">
									{#if insp.colonyId}
										<a href="/colonias/{insp.colonyId}" class="text-primary hover:text-primary-hover transition-colors">{insp.colonyName || '-'}</a>
									{:else}
										<span class="text-text-muted">-</span>
									{/if}
								</td>
								<td class="px-4 py-3 text-text-secondary">{insp.createdAt ? new Date(insp.createdAt).toLocaleDateString(locale) : '-'}</td>
								<td class="px-4 py-3">
									{#if inspScore !== null}
										<div class="flex items-center gap-2">
											<div class="w-16 h-2 bg-surface-sunken rounded-full overflow-hidden">
												<div class="h-full rounded-full {scoreBg(inspScore)}" style="width: {inspScore}%"></div>
											</div>
											<span class="text-xs font-semibold {scoreColor(inspScore)}">{inspScore}%</span>
										</div>
									{:else}
										<span class="text-text-muted text-xs">-</span>
									{/if}
								</td>
								<td class="px-4 py-3">
									{#if insp.passed === true}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-success/8 text-success">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3"><polyline points="20,6 9,17 4,12"/></svg>
											{t(locale, 'inspections.approved')}
										</span>
									{:else if insp.passed === false}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-danger/8 text-danger">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3"><path d="M18 6L6 18M6 6l12 12"/></svg>
											{t(locale, 'inspections.not_approved')}
										</span>
									{:else}
										<span class="text-text-muted text-xs">-</span>
									{/if}
									{#if insp.followUpRequired}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-warning/8 text-warning ml-1">
											{t(locale, 'inspections.follow_up')}
										</span>
									{/if}
								</td>
								<td class="px-4 py-3 text-text-muted max-w-xs truncate">{insp.notes || '-'}</td>
								<td class="px-4 py-3">
									<div class="flex gap-1">
										<button onclick={() => editingInspection = editingInspection === insp.id ? null : insp.id} class="p-1.5 rounded-lg text-info hover:bg-info/8 transition-colors" title={t(locale, 'common.edit')}>
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3.5 h-3.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
										</button>
										<form method="POST" action="?/delete" use:enhance onsubmit={(e: SubmitEvent) => { if (!confirm(t(locale, 'common.confirm_delete'))) e.preventDefault(); }}>
											<input type="hidden" name="id" value={insp.id} />
											<button type="submit" class="p-1.5 rounded-lg text-danger hover:bg-danger/8 transition-colors" title={t(locale, 'common.delete')}>
												<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3.5 h-3.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
											</button>
										</form>
									</div>
								</td>
							</tr>
							{#if editingInspection === insp.id}
								<tr class="bg-surface-sunken/50">
									<td colspan="7" class="px-4 py-3">
										<form method="POST" action="?/edit" use:enhance class="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
											<input type="hidden" name="id" value={insp.id} />
											<div>
												<label class="text-[10px] text-text-muted uppercase">{t(locale, 'inspections.colony')}</label>
												<select name="colonyId" class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs">
													{#each data.colonies as col}
														<option value={col.id} selected={col.id === insp.colonyId}>{col.name}</option>
													{/each}
												</select>
											</div>
											<div>
												<label class="text-[10px] text-text-muted uppercase">{t(locale, 'inspections.score')}</label>
												<input type="number" name="score" value={insp.score ?? ''} min="0" max="100" class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs" />
											</div>
											<div>
												<label class="text-[10px] text-text-muted uppercase">{t(locale, 'inspections.result')}</label>
												<select name="passed" class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs">
													<option value="">-</option>
													<option value="true" selected={insp.passed === true}>{t(locale, 'inspections.approved')}</option>
													<option value="false" selected={insp.passed === false}>{t(locale, 'inspections.not_approved')}</option>
												</select>
											</div>
											<div>
												<label class="text-[10px] text-text-muted uppercase">{t(locale, 'inspections.notes_col')}</label>
												<input type="text" name="notes" value={insp.notes ?? ''} class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs" />
											</div>
											<div class="flex gap-1">
												<button type="submit" class="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-hover transition-colors">{t(locale, 'common.save')}</button>
												<button type="button" onclick={() => editingInspection = null} class="px-3 py-1.5 bg-surface-sunken text-text-secondary rounded-lg text-xs font-medium hover:bg-border transition-colors">{t(locale, 'common.cancel')}</button>
											</div>
										</form>
									</td>
								</tr>
							{/if}
						{/each}
						{#if data.inspections.length === 0}
							<tr><td colspan="5" class="px-4 py-12 text-center text-text-muted">{t(locale, 'common.no_results')}</td></tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	{#if activeTab === 'templates'}
		<div class="mb-4">
			<button onclick={() => showTemplateForm = !showTemplateForm}
				class="inline-flex items-center gap-2 px-4 py-2 bg-surface-sunken text-text-secondary text-sm font-medium rounded-lg hover:bg-border transition-colors">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M12 5v14m-7-7h14"/></svg>
				{showTemplateForm ? t(locale, 'common.cancel') : t(locale, 'inspections.new_template')}
			</button>
		</div>

		{#if showTemplateForm}
			<div class="bg-surface rounded-xl border border-border p-6 mb-6">
				<h3 class="text-base font-semibold text-text mb-4">{t(locale, 'inspections.new_template')}</h3>
				<form method="POST" action="?/createTemplate" use:enhance class="grid gap-4">
					<div>
						<label for="templateName" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'inspections.template_name')}</label>
						<input type="text" name="name" id="templateName" required class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder={t(locale, 'inspections.template_name_placeholder')} />
					</div>

					<div class="bg-info/5 border border-info/15 rounded-xl p-4">
						<div class="flex items-center justify-between mb-3">
							<p class="text-sm font-medium text-info">{t(locale, 'inspections.evaluation_fields')}</p>
							<button type="button" onclick={() => templateFields = [...templateFields, { label: '', type: 'select', options: [t(locale, 'inspections.good'), t(locale, 'inspections.fair'), t(locale, 'inspections.bad')], weight: 10 }]}
								class="inline-flex items-center gap-1 px-2.5 py-1 bg-info/10 text-info text-xs font-medium rounded-md hover:bg-info/20 transition-colors">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3"><path d="M12 5v14m-7-7h14"/></svg>
								{t(locale, 'inspections.add_field')}
							</button>
						</div>
						{#if templateFields.length === 0}
							<p class="text-xs text-text-muted py-4 text-center">{t(locale, 'inspections.add_fields_hint')}</p>
						{/if}
						<div class="space-y-3">
							{#each templateFields as field, i}
								<div class="bg-surface rounded-lg border border-border p-3">
									<div class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
										<div class="sm:col-span-4">
											<label class="block text-[11px] font-medium text-text-muted mb-1">{t(locale, 'inspections.field_name')}</label>
											<input type="text" bind:value={field.label} placeholder={t(locale, 'inspections.general_status')} class="w-full px-2.5 py-1.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
										</div>
										<div class="sm:col-span-2">
											<label class="block text-[11px] font-medium text-text-muted mb-1">{t(locale, 'inspections.field_type')}</label>
											<select bind:value={field.type} class="w-full px-2.5 py-1.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
												<option value="select">{t(locale, 'inspections.type_select')}</option>
												<option value="number">{t(locale, 'inspections.type_number')}</option>
												<option value="text">{t(locale, 'inspections.type_text')}</option>
												<option value="boolean">{t(locale, 'inspections.type_boolean')}</option>
											</select>
										</div>
										<div class="sm:col-span-4">
											{#if field.type === 'select'}
												<label class="block text-[11px] font-medium text-text-muted mb-1">{t(locale, 'inspections.options_hint')}</label>
												<input type="text" value={field.options.join(', ')} oninput={(e) => { field.options = (e.currentTarget as HTMLInputElement).value.split(',').map(s => s.trim()).filter(Boolean) }} class="w-full px-2.5 py-1.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
											{:else if field.type === 'boolean'}
												<label class="block text-[11px] font-medium text-text-muted mb-1">{t(locale, 'inspections.field_options')}</label>
												<p class="text-xs text-text-muted py-1.5">{t(locale, 'inspections.auto_options')}</p>
											{:else}
												<label class="block text-[11px] font-medium text-text-muted mb-1">{t(locale, 'inspections.placeholder')}</label>
												<input type="text" placeholder={t(locale, 'inspections.placeholder_hint')} class="w-full px-2.5 py-1.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
											{/if}
										</div>
										<div class="sm:col-span-1">
											<label class="block text-[11px] font-medium text-text-muted mb-1">{t(locale, 'inspections.field_weight')}</label>
											<input type="number" bind:value={field.weight} min="0" max="100" class="w-full px-2 py-1.5 bg-background border border-border rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
										</div>
										<div class="sm:col-span-1 flex justify-center">
											<button type="button" onclick={() => templateFields = templateFields.filter((_, j) => j !== i)} class="p-1.5 text-danger/60 hover:text-danger hover:bg-danger/10 rounded-md transition-colors" title={t(locale, 'inspections.delete_field')}>
												<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
											</button>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<input type="hidden" name="fields" value={JSON.stringify(templateFields)} />
					<button type="submit" class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors w-fit">{t(locale, 'common.save')}</button>
				</form>
			</div>
		{/if}

		<div class="grid gap-4">
			{#each data.templates as tmpl}
				{@const fields = Array.isArray(tmpl.schema) ? tmpl.schema as Array<{label: string; type: string; options?: string[]; weight?: number}> : []}
				<div class="bg-surface rounded-xl border border-border p-5">
					<div class="flex items-center justify-between mb-3">
						<div>
							<h4 class="font-semibold text-text">{tmpl.name}</h4>
							<p class="text-xs text-text-muted mt-0.5">{fields.length} {t(locale, 'inspections.fields')} · {t(locale, 'inspections.created_date')}: {tmpl.createdAt ? new Date(tmpl.createdAt).toLocaleDateString(locale) : '-'}</p>
						</div>
						{#if tmpl.isActive}
							<span class="px-2 py-0.5 bg-success/8 text-success text-xs font-medium rounded-md">{t(locale, 'inspections.active')}</span>
						{/if}
					</div>
					{#if fields.length > 0}
						<div class="border border-border rounded-lg overflow-hidden">
							<table class="w-full text-xs">
								<thead class="bg-surface-sunken">
									<tr>
										<th class="px-3 py-2 text-left text-text-muted font-medium">{t(locale, 'inspections.field_col')}</th>
										<th class="px-3 py-2 text-left text-text-muted font-medium">{t(locale, 'inspections.type_col')}</th>
										<th class="px-3 py-2 text-left text-text-muted font-medium">{t(locale, 'inspections.options_col')}</th>
										<th class="px-3 py-2 text-center text-text-muted font-medium">{t(locale, 'inspections.weight_col')}</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-border">
									{#each fields as f}
										<tr>
											<td class="px-3 py-2 text-text-secondary">{f.label}</td>
											<td class="px-3 py-2">
												<span class="px-1.5 py-0.5 bg-surface-sunken rounded text-text-muted">{fieldTypeLabel(f.type)}</span>
											</td>
											<td class="px-3 py-2 text-text-muted">{f.options?.join(', ') ?? '-'}</td>
											<td class="px-3 py-2 text-center font-medium text-text">{f.weight ?? '-'}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<p class="text-xs text-text-muted">{t(locale, 'inspections.no_fields')}</p>
					{/if}
				</div>
			{/each}
			{#if data.templates.length === 0}
				<div class="py-12 text-center">
					<p class="text-sm text-text-muted">{t(locale, 'inspections.no_templates')}</p>
					<p class="text-xs text-text-muted mt-1">{t(locale, 'inspections.no_templates_hint')}</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

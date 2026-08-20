<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	let locale = $derived(data.locale);
	let showNew = $state(false);
	let showEventForm = $state<string | null>(null);

	const statusColors: Record<string, string> = {
		planned: 'bg-info/8 text-info',
		active: 'bg-success/8 text-success',
		completed: 'bg-primary/8 text-primary',
		cancelled: 'bg-danger/8 text-danger'
	};

	let eventsByCampaign = $derived(data.eventsByCampaign ?? {});
	let expandedTimeline = $state<string | null>(null);

	const eventTypes = [
		{ value: 'trap_placed', label: 'campaigns.trap_placed' },
		{ value: 'trap_active', label: 'campaigns.trap_active' },
		{ value: 'trap_captured', label: 'campaigns.trap_captured' },
		{ value: 'trap_collected', label: 'campaigns.trap_collected' }
	];

	const eventTypeIcons: Record<string, { icon: string; color: string }> = {
		trap_placed: { icon: '📍', color: 'bg-blue-100 border-blue-400' },
		trap_active: { icon: '🟢', color: 'bg-green-100 border-green-400' },
		trap_captured: { icon: '🐱', color: 'bg-amber-100 border-amber-400' },
		trap_collected: { icon: '✅', color: 'bg-emerald-100 border-emerald-400' }
	};

	function formatEventDate(d: string | Date | null) {
		if (!d) return '';
		return new Date(d).toLocaleDateString(data.locale ?? 'es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
	}
</script>

<div class="max-w-7xl mx-auto">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-text tracking-tight">{t(locale, 'campaigns.title')}</h1>
			<p class="text-sm text-text-muted mt-0.5">{t(locale, 'campaigns.subtitle')}</p>
		</div>
		<button onclick={() => showNew = !showNew} class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4"><path d="M12 5v14m-7-7h14"/></svg>
			{t(locale, 'campaigns.new')}
		</button>
	</div>

	{#if showNew}
		<div class="bg-surface rounded-xl border border-border p-5 mb-6">
			<form method="POST" action="?/create" use:enhance={() => { return async ({ update }) => { showNew = false; await update(); }; }}>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="name" class="block text-sm font-medium text-text mb-1">{t(locale, 'campaigns.name')}</label>
						<input id="name" name="name" required class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
					</div>
					<div>
						<label for="colonyId" class="block text-sm font-medium text-text mb-1">{t(locale, 'campaigns.colony')}</label>
						<select id="colonyId" name="colonyId" class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
							<option value="">—</option>
							{#each data.colonies as colony}
								<option value={colony.id}>{colony.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="startDate" class="block text-sm font-medium text-text mb-1">{t(locale, 'campaigns.start_date')}</label>
						<input id="startDate" name="startDate" type="date" required class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
					</div>
					<div>
						<label for="endDate" class="block text-sm font-medium text-text mb-1">{t(locale, 'campaigns.end_date')}</label>
						<input id="endDate" name="endDate" type="date" class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
					</div>
					<div class="md:col-span-2">
						<label for="notes" class="block text-sm font-medium text-text mb-1">Notas</label>
						<textarea id="notes" name="notes" rows="2" class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"></textarea>
					</div>
				</div>
				<div class="mt-4 flex gap-2">
					<button type="submit" class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors">Guardar</button>
					<button type="button" onclick={() => showNew = false} class="px-4 py-2 bg-surface-sunken text-text-secondary text-sm rounded-lg hover:bg-border transition-colors">Cancelar</button>
				</div>
			</form>
		</div>
	{/if}

	{#if data.campaigns.length === 0}
		<div class="bg-surface rounded-xl border border-border p-12 text-center">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-12 h-12 text-text-muted mx-auto mb-3"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12L12 12"/><circle cx="18" cy="18" r="3"/></svg>
			<p class="text-text-muted text-sm">{t(locale, 'campaigns.no_campaigns')}</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each data.campaigns as campaign}
				<div class="bg-surface rounded-xl border border-border overflow-hidden">
					<div class="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
						<div>
							<div class="flex items-center gap-2">
								<h3 class="text-sm font-semibold text-text">{campaign.name}</h3>
								<span class="px-2 py-0.5 rounded text-xs font-medium {statusColors[campaign.status] ?? 'bg-surface-sunken text-text-muted'}">{t(locale, `campaigns.${campaign.status}`)}</span>
							</div>
							<p class="text-xs text-text-muted mt-0.5">
								{campaign.colonyName ?? '—'} · {campaign.startDate}{campaign.endDate ? ` → ${campaign.endDate}` : ''} · {campaign.eventCount} eventos
							</p>
						</div>
						<div class="flex items-center gap-2">
							{#if campaign.status === 'planned'}
								<form method="POST" action="?/updateStatus" use:enhance>
									<input type="hidden" name="id" value={campaign.id} />
									<input type="hidden" name="status" value="active" />
									<button type="submit" class="px-3 py-1.5 bg-success/10 text-success text-xs font-medium rounded-lg hover:bg-success/20 transition-colors">Iniciar</button>
								</form>
							{/if}
							{#if campaign.status === 'active'}
								<form method="POST" action="?/updateStatus" use:enhance>
									<input type="hidden" name="id" value={campaign.id} />
									<input type="hidden" name="status" value="completed" />
									<button type="submit" class="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-lg hover:bg-primary/20 transition-colors">Completar</button>
								</form>
							{/if}
							<button onclick={() => showEventForm = showEventForm === campaign.id ? null : campaign.id} class="px-3 py-1.5 bg-surface-sunken text-text-secondary text-xs font-medium rounded-lg hover:bg-border transition-colors">
								{t(locale, 'campaigns.add_event')}
							</button>
						</div>
					</div>
					{#if showEventForm === campaign.id}
						<div class="px-5 pb-4 border-t border-border pt-3">
							<form method="POST" action="?/addEvent" use:enhance={() => { return async ({ update }) => { showEventForm = null; await update(); }; }} class="flex flex-wrap items-end gap-3">
								<input type="hidden" name="campaignId" value={campaign.id} />
								<div>
									<label for="eventType-{campaign.id}" class="block text-xs font-medium text-text-muted mb-1">Tipo</label>
									<select id="eventType-{campaign.id}" name="eventType" class="px-3 py-1.5 border border-border rounded-lg text-sm bg-background">
										{#each eventTypes as et}
											<option value={et.value}>{t(locale, et.label)}</option>
										{/each}
									</select>
								</div>
								<div class="flex-1">
									<label for="eventNotes-{campaign.id}" class="block text-xs font-medium text-text-muted mb-1">Notas</label>
									<input id="eventNotes-{campaign.id}" name="notes" class="w-full px-3 py-1.5 border border-border rounded-lg text-sm bg-background" />
								</div>
								<button type="submit" class="px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary-hover transition-colors">Registrar</button>
							</form>
						</div>
					{/if}

					<!-- Timeline visual -->
					{@const events = eventsByCampaign[campaign.id] ?? []}
					{#if events.length > 0}
						<div class="border-t border-border">
							<button onclick={() => expandedTimeline = expandedTimeline === campaign.id ? null : campaign.id} class="w-full px-5 py-2.5 flex items-center justify-between text-xs font-medium text-text-muted hover:bg-surface-sunken transition-colors">
								<span>{t(locale, 'campaigns.timeline')} ({events.length})</span>
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5 transition-transform {expandedTimeline === campaign.id ? 'rotate-180' : ''}"><path d="M6 9l6 6 6-6"/></svg>
							</button>
							{#if expandedTimeline === campaign.id}
								<div class="px-5 pb-4">
									<div class="relative ml-3 border-l-2 border-border pl-6 space-y-4">
										{#each events as event}
											{@const meta = eventTypeIcons[event.eventType] ?? { icon: '📋', color: 'bg-surface-sunken border-border' }}
											<div class="relative">
												<div class="absolute -left-[31px] top-0.5 w-5 h-5 rounded-full border-2 {meta.color} flex items-center justify-center text-[10px]">{meta.icon}</div>
												<div>
													<p class="text-sm font-medium text-text">{t(locale, `campaigns.${event.eventType}`)}</p>
													{#if event.notes}
														<p class="text-xs text-text-muted mt-0.5">{event.notes}</p>
													{/if}
													<p class="text-[10px] text-text-muted mt-0.5">
														{formatEventDate(event.performedAt)}
														{#if event.performedByName} · {event.performedByName}{/if}
													</p>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

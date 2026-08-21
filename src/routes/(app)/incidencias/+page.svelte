<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import { toRecord } from '$lib/index.js';
	import type { PageData, ActionData } from './$types.js';
	import FileUpload from '$lib/components/ui/FileUpload.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);

	let showNewForm = $state(false);
	let expandedIncident = $state<string | null>(null);
	let useGeo = $state(false);
	let geoLat = $state('');
	let incidentPhotos = $state<string[]>([]);
	let geoLng = $state('');

	function getLocation() {
		if (!navigator.geolocation) return;
		useGeo = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => { geoLat = String(pos.coords.latitude); geoLng = String(pos.coords.longitude); },
			() => { useGeo = false; },
			{ enableHighAccuracy: true }
		);
	}

	function priorityConfig(p: string) {
		const map: Record<string, { dot: string; bg: string; key: string }> = {
			critical: { dot: 'bg-danger', bg: 'bg-danger/8 text-danger', key: 'incidents.priority.critical' },
			high: { dot: 'bg-danger', bg: 'bg-danger/8 text-danger', key: 'incidents.priority.high' },
			medium: { dot: 'bg-warning', bg: 'bg-warning/8 text-warning', key: 'incidents.priority.medium' },
			low: { dot: 'bg-success', bg: 'bg-success/8 text-success', key: 'incidents.priority.low' }
		};
		const cfg = map[p] ?? { dot: 'bg-text-muted', bg: 'bg-surface-sunken text-text-muted', key: '' };
		return { ...cfg, label: cfg.key ? t(locale, cfg.key) : p };
	}

	function statusConfig(s: string) {
		const map: Record<string, { dot: string; bg: string; key: string }> = {
			open: { dot: 'bg-danger', bg: 'bg-danger/8 text-danger', key: 'incidents.status.open' },
			in_progress: { dot: 'bg-warning', bg: 'bg-warning/8 text-warning', key: 'incidents.status.in_progress' },
			resolved: { dot: 'bg-success', bg: 'bg-success/8 text-success', key: 'incidents.status.resolved' },
			closed: { dot: 'bg-text-muted', bg: 'bg-surface-sunken text-text-muted', key: 'incidents.status.closed' }
		};
		const cfg = map[s] ?? { dot: 'bg-text-muted', bg: 'bg-surface-sunken text-text-muted', key: '' };
		return { ...cfg, label: cfg.key ? t(locale, cfg.key) : s };
	}

	function categoryLabel(c: string): string {
		const key = `incidents.cat_${c}`;
		return t(locale, key) || c;
	}

	function commentsForIncident(id: string) {
		return (data.incidentComments || []).filter((c) => c.entityId === id);
	}
</script>

<div class="max-w-7xl mx-auto">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-text tracking-tight">{t(locale, 'incidents.title')}</h1>
			<p class="text-sm text-text-muted mt-0.5">{data.totalItems} {t(locale, 'incidents.registered')}</p>
		</div>
		<button onclick={() => showNewForm = !showNewForm} class="inline-flex items-center gap-2 px-4 py-2.5 bg-danger text-white text-sm font-medium rounded-lg hover:bg-danger/90 transition-colors shadow-sm">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
			{t(locale, 'incidents.new')}
		</button>
	</div>

	{#if showNewForm}
		<div class="bg-surface rounded-xl border border-border p-6 mb-6">
			<h3 class="text-base font-semibold text-text mb-4">{t(locale, 'incidents.report_new')}</h3>
			{#if form?.error}<div class="bg-danger-subtle text-danger text-sm p-3 rounded-lg mb-4 border border-danger/10">{form.error}</div>{/if}
			<form method="POST" action="?/create" use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') { showNewForm = false; await update(); } else { await update(); }
				};
			}}>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="category" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'incidents.category')} <span class="text-danger">*</span></label>
						<select name="category" id="category" required class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
							<option value="health">{t(locale, 'incidents.cat_health')}</option>
							<option value="environmental">{t(locale, 'incidents.cat_environmental')}</option>
							<option value="complaint">{t(locale, 'incidents.cat_complaint')}</option>
							<option value="infrastructure">{t(locale, 'incidents.cat_infrastructure')}</option>
							<option value="abandonment">{t(locale, 'incidents.cat_abandonment')}</option>
							<option value="abuse">{t(locale, 'incidents.cat_abuse')}</option>
							<option value="other">{t(locale, 'incidents.cat_other')}</option>
						</select>
					</div>
					<div>
						<label for="priority" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'incidents.priority')}</label>
						<select name="priority" id="priority" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
							<option value="low">{t(locale, 'incidents.priority.low')}</option>
							<option value="medium" selected>{t(locale, 'incidents.priority.medium')}</option>
							<option value="high">{t(locale, 'incidents.priority.high')}</option>
							<option value="critical">{t(locale, 'incidents.priority.critical')}</option>
						</select>
					</div>
					<div>
						<label for="colonyId" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'incidents.colony_linked')}</label>
						<select name="colonyId" id="colonyId" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
							<option value="">{t(locale, 'incidents.none')}</option>
							{#each data.colonies as c}
								<option value={c.id}>{c.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<span class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'incidents.location')}</span>
						<button type="button" onclick={getLocation} class="w-full px-3 py-2 bg-info/8 text-info border border-info/20 rounded-lg text-sm font-medium hover:bg-info/12 transition-colors inline-flex items-center justify-center gap-2">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-4 h-4"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
							{useGeo ? `${geoLat.slice(0, 8)}, ${geoLng.slice(0, 8)}` : t(locale, 'incidents.get_location')}
						</button>
						<input type="hidden" name="latitude" value={geoLat} />
						<input type="hidden" name="longitude" value={geoLng} />
					</div>
					<div class="md:col-span-2">
						<label for="description" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'incidents.description')} <span class="text-danger">*</span></label>
						<textarea name="description" id="description" rows="3" required class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"></textarea>
					</div>
					<div class="md:col-span-2">
						<FileUpload ownerEntity="incidents" accept="image/*" label={t(locale, 'incidents.attach_photo')} onuploaded={(r) => { incidentPhotos = [...incidentPhotos, r.path]; }} />
						<input type="hidden" name="photos" value={JSON.stringify(incidentPhotos)} />
					</div>
				</div>
				<div class="flex items-center gap-3 mt-5 pt-5 border-t border-border">
					<button type="submit" class="px-4 py-2 bg-danger text-white text-sm font-medium rounded-lg hover:bg-danger/90 transition-colors">{t(locale, 'incidents.submit')}</button>
					<button type="button" onclick={() => showNewForm = false} class="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text hover:bg-surface-sunken rounded-lg transition-colors">{t(locale, 'common.cancel')}</button>
				</div>
			</form>
		</div>
	{/if}

	<div class="bg-surface rounded-xl border border-border p-4 mb-5">
		<form method="GET" class="flex flex-wrap gap-3 items-end">
			<div class="flex-1 min-w-[180px]">
				<label for="q" class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wide">{t(locale, 'incidents.search')}</label>
				<input type="text" name="q" id="q" value={data.filters.search} placeholder={t(locale, 'incidents.search_placeholder')} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
			</div>
			<div>
				<label for="filterStatus" class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wide">{t(locale, 'incidents.status')}</label>
				<select name="status" id="filterStatus" class="px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
					<option value="">{t(locale, 'incidents.all')}</option>
					<option value="open" selected={data.filters.status === 'open'}>{t(locale, 'incidents.status.open')}</option>
					<option value="in_progress" selected={data.filters.status === 'in_progress'}>{t(locale, 'incidents.status.in_progress')}</option>
					<option value="resolved" selected={data.filters.status === 'resolved'}>{t(locale, 'incidents.status.resolved')}</option>
					<option value="closed" selected={data.filters.status === 'closed'}>{t(locale, 'incidents.status.closed')}</option>
				</select>
			</div>
			<div>
				<label for="filterPriority" class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wide">{t(locale, 'incidents.priority')}</label>
				<select name="priority" id="filterPriority" class="px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
					<option value="">{t(locale, 'incidents.all_f')}</option>
					<option value="critical" selected={data.filters.priority === 'critical'}>{t(locale, 'incidents.priority.critical')}</option>
					<option value="high" selected={data.filters.priority === 'high'}>{t(locale, 'incidents.priority.high')}</option>
					<option value="medium" selected={data.filters.priority === 'medium'}>{t(locale, 'incidents.priority.medium')}</option>
					<option value="low" selected={data.filters.priority === 'low'}>{t(locale, 'incidents.priority.low')}</option>
				</select>
			</div>
			<button type="submit" class="px-4 py-2 bg-text text-text-inverse text-sm font-medium rounded-lg hover:bg-text/90 transition-colors">{t(locale, 'incidents.filter')}</button>
		</form>
	</div>

	<div class="space-y-3">
		{#each data.items as inc}
			{@const pBadge = priorityConfig(inc.priority)}
			{@const sBadge = statusConfig(inc.status)}
			{@const comments = commentsForIncident(inc.id)}
			<div class="bg-surface rounded-xl border border-border overflow-hidden interactive-card">
				<div class="p-4 sm:p-5">
					<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 flex-wrap">
								<span class="text-sm font-semibold text-text">{categoryLabel(inc.category)}</span>
								<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium {pBadge.bg}">
									<span class="w-1.5 h-1.5 rounded-full {pBadge.dot}"></span>{pBadge.label}
								</span>
								<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium {sBadge.bg}">
									<span class="w-1.5 h-1.5 rounded-full {sBadge.dot}"></span>{sBadge.label}
								</span>
							</div>
							<p class="text-sm text-text-secondary mt-1.5 line-clamp-2">{inc.description ?? ''}</p>
							<div class="flex flex-wrap gap-3 mt-2 text-xs text-text-muted">
								{#if inc.colonyName}<span>{inc.colonyName}</span>{/if}
								{#if inc.reporterName}<span>{inc.reporterName}</span>{/if}
								{#if inc.createdAt}<span>{new Date(inc.createdAt).toLocaleDateString(locale)}</span>{/if}
								{#if comments.length > 0}<span>{comments.length} {t(locale, 'incidents.comments')}</span>{/if}
							</div>
						</div>
						<div class="flex gap-2 flex-shrink-0 items-start">
							{#if inc.status !== 'resolved' && inc.status !== 'closed'}
								<form method="POST" action="?/updateStatus" use:enhance>
									<input type="hidden" name="id" value={inc.id} />
									{#if inc.status === 'open'}
										<input type="hidden" name="status" value="in_progress" />
										<button type="submit" class="px-3 py-1.5 bg-warning/8 text-warning border border-warning/20 rounded-lg text-xs font-medium hover:bg-warning/12 transition-colors">{t(locale, 'incidents.in_progress_action')}</button>
									{:else}
										<input type="hidden" name="status" value="resolved" />
										<button type="submit" class="px-3 py-1.5 bg-success/8 text-success border border-success/20 rounded-lg text-xs font-medium hover:bg-success/12 transition-colors">{t(locale, 'incidents.resolve')}</button>
									{/if}
								</form>
							{/if}
							<button onclick={() => expandedIncident = expandedIncident === inc.id ? null : inc.id} class="px-3 py-1.5 bg-surface-sunken text-text-secondary rounded-lg text-xs font-medium hover:bg-border transition-colors">
								{expandedIncident === inc.id ? t(locale, 'incidents.close_detail') : t(locale, 'incidents.detail')}
							</button>
						</div>
					</div>
				</div>

				{#if expandedIncident === inc.id}
					<div class="border-t border-border bg-surface-sunken p-4 sm:p-5 space-y-4">
						<div>
							<span class="text-xs font-medium text-text-muted uppercase tracking-wide">{t(locale, 'incidents.assign_responsible')}</span>
							<form method="POST" action="?/assign" use:enhance class="flex gap-2 mt-1.5">
								<input type="hidden" name="id" value={inc.id} />
								<select name="assignedTo" class="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
									<option value="">{t(locale, 'incidents.unassigned')}</option>
									{#each data.users as u}
										<option value={u.id} selected={u.id === inc.assignedTo}>{u.name}</option>
									{/each}
								</select>
								<button type="submit" class="px-3 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-hover transition-colors">{t(locale, 'incidents.assign')}</button>
							</form>
						</div>

						{#if comments.length > 0}
							<div>
								<span class="text-xs font-medium text-text-muted uppercase tracking-wide mb-2 block">{t(locale, 'incidents.history')}</span>
								<div class="space-y-2 max-h-40 overflow-y-auto">
									{#each comments as c}
										{@const det = toRecord(c.details)}
										<div class="text-xs bg-surface p-3 rounded-lg border border-border">
											<div class="flex justify-between text-text-muted">
												<span class="font-medium text-text-secondary">{c.userName ?? t(locale, 'incidents.system')}</span>
												<span>{c.createdAt ? new Date(c.createdAt).toLocaleString(locale) : ''}</span>
											</div>
											<p class="mt-1 text-text-secondary">
												{#if c.action === 'comment'}
													{det?.text ?? ''}
												{:else if c.action === 'change_status'}
													<span class="inline-flex items-center gap-1">
														<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3 text-info"><path d="M12 2v20m10-10H2"/></svg>
														{t(locale, 'incidents.status_changed_to')} <strong>{t(locale, `incidents.status.${det?.newStatus ?? ''}`)}</strong>
													</span>
												{:else if c.action === 'assign'}
													<span class="italic">{t(locale, 'incidents.assigned_action')}</span>
												{:else if c.action === 'create'}
													<span class="italic">{t(locale, 'incidents.created_action')}</span>
												{:else if c.action === 'update'}
													<span class="italic">{t(locale, 'incidents.updated_action')}</span>
												{:else if c.action === 'delete'}
													<span class="italic">{t(locale, 'incidents.deleted_action')}</span>
												{:else}
													<span class="italic">{c.action}</span>
												{/if}
											</p>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<form method="POST" action="?/addComment" use:enhance class="flex gap-2">
							<input type="hidden" name="incidentId" value={inc.id} />
							<input type="text" name="comment" placeholder={t(locale, 'incidents.add_comment')} required class="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
							<button type="submit" class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors">{t(locale, 'incidents.send')}</button>
						</form>

						<div class="flex items-center gap-3 pt-3 border-t border-border">
							<form method="POST" action="?/edit" use:enhance class="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
								<input type="hidden" name="id" value={inc.id} />
								<select name="category" class="px-2 py-1.5 bg-background border border-border rounded-lg text-xs">
									{#each ['health', 'environmental', 'complaint', 'infrastructure', 'abandonment', 'abuse'] as cat}
										<option value={cat} selected={inc.category === cat}>{t(locale, `incidents.cat_${cat}`)}</option>
									{/each}
								</select>
								<select name="priority" class="px-2 py-1.5 bg-background border border-border rounded-lg text-xs">
									{#each [['low', 'incidents.priority.low'], ['medium', 'incidents.priority.medium'], ['high', 'incidents.priority.high'], ['critical', 'incidents.priority.critical']] as pair}
										<option value={pair[0] ?? ''} selected={inc.priority === pair[0]}>{t(locale, pair[1] ?? '')}</option>
									{/each}
								</select>
								<input type="text" name="description" value={inc.description} class="px-2 py-1.5 bg-background border border-border rounded-lg text-xs" />
								<button type="submit" class="px-3 py-1.5 bg-info/8 text-info border border-info/20 rounded-lg text-xs font-medium hover:bg-info/12 transition-colors">{t(locale, 'common.edit')}</button>
							</form>
							<form method="POST" action="?/delete" use:enhance onsubmit={(e: SubmitEvent) => { if (!confirm(t(locale, 'common.confirm_delete'))) e.preventDefault(); }}>
								<input type="hidden" name="id" value={inc.id} />
								<button type="submit" class="px-3 py-1.5 bg-danger/8 text-danger border border-danger/20 rounded-lg text-xs font-medium hover:bg-danger/12 transition-colors">{t(locale, 'common.delete')}</button>
							</form>
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<div class="py-16 text-center">
				<div class="w-12 h-12 rounded-xl bg-surface-sunken flex items-center justify-center mx-auto mb-3">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6 text-text-muted"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
				</div>
				<p class="text-sm text-text-secondary mb-1">{t(locale, 'incidents.no_results')}</p>
				<p class="text-xs text-text-muted">{t(locale, 'incidents.try_other_filters')}</p>
			</div>
		{/each}
	</div>

	<Pagination currentPage={data.page} totalPages={data.totalPages} totalItems={data.totalItems} pageSize={data.pageSize} />
</div>

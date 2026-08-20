<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	let locale = $derived(data.locale);
	let showNew = $state(false);

	const statusColors: Record<string, string> = {
		available: 'bg-success/8 text-success',
		loaned: 'bg-warning/8 text-warning',
		maintenance: 'bg-info/8 text-info',
		retired: 'bg-danger/8 text-danger'
	};

	const typeIcons: Record<string, string> = {
		trap: '🪤',
		reader: '📡',
		carrier: '📦',
		feeder: '🥣',
		other: '🔧'
	};

	let historyByEquipment = $derived(data.historyByEquipment ?? {});
	let expandedHistory = $state<string | null>(null);

	function isOverdue(dueDate: string | Date | null | undefined): boolean {
		if (!dueDate) return false;
		return new Date(dueDate) < new Date();
	}

	function formatDate(d: string | Date | null) {
		if (!d) return '';
		return new Date(d).toLocaleDateString(data.locale ?? 'es', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	const actionLabels: Record<string, string> = {
		loaned: '📤 Prestado',
		returned: '📥 Devuelto',
		status_maintenance: '🔧 Mantenimiento',
		status_retired: '🚫 Retirado',
		status_available: '✅ Disponible'
	};
</script>

<div class="max-w-7xl mx-auto">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-text tracking-tight">{t(locale, 'equipment.title')}</h1>
			<p class="text-sm text-text-muted mt-0.5">{t(locale, 'equipment.subtitle')}</p>
		</div>
		<button onclick={() => showNew = !showNew} class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4"><path d="M12 5v14m-7-7h14"/></svg>
			{t(locale, 'equipment.new')}
		</button>
	</div>

	{#if showNew}
		<div class="bg-surface rounded-xl border border-border p-5 mb-6">
			<form method="POST" action="?/create" use:enhance={() => { return async ({ update }) => { showNew = false; await update(); }; }}>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<label for="eqName" class="block text-sm font-medium text-text mb-1">{t(locale, 'equipment.name')}</label>
						<input id="eqName" name="name" required class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
					</div>
					<div>
						<label for="eqType" class="block text-sm font-medium text-text mb-1">{t(locale, 'equipment.type')}</label>
						<select id="eqType" name="type" class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
							<option value="trap">{t(locale, 'equipment.type_trap')}</option>
							<option value="reader">{t(locale, 'equipment.type_reader')}</option>
							<option value="carrier">{t(locale, 'equipment.type_carrier')}</option>
							<option value="feeder">{t(locale, 'equipment.type_feeder')}</option>
							<option value="other">{t(locale, 'equipment.type_other')}</option>
						</select>
					</div>
					<div>
						<label for="eqSerial" class="block text-sm font-medium text-text mb-1">{t(locale, 'equipment.serial')}</label>
						<input id="eqSerial" name="serialNumber" class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
					</div>
				</div>
				<div class="mt-4 flex gap-2">
					<button type="submit" class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors">Guardar</button>
					<button type="button" onclick={() => showNew = false} class="px-4 py-2 bg-surface-sunken text-text-secondary text-sm rounded-lg hover:bg-border transition-colors">Cancelar</button>
				</div>
			</form>
		</div>
	{/if}

	{#if data.equipment.length === 0}
		<div class="bg-surface rounded-xl border border-border p-12 text-center">
			<p class="text-text-muted text-sm">{t(locale, 'equipment.no_equipment')}</p>
		</div>
	{:else}
		<div class="bg-surface rounded-xl border border-border overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-surface-sunken text-text-muted text-left text-xs uppercase tracking-wide">
						<tr>
							<th class="px-4 py-3 font-medium">{t(locale, 'equipment.name')}</th>
							<th class="px-4 py-3 font-medium">{t(locale, 'equipment.type')}</th>
							<th class="px-4 py-3 font-medium">{t(locale, 'equipment.serial')}</th>
							<th class="px-4 py-3 font-medium">{t(locale, 'equipment.status')}</th>
							<th class="px-4 py-3 font-medium">{t(locale, 'equipment.loaned_to')}</th>
							<th class="px-4 py-3 font-medium"></th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each data.equipment as item}
							<tr class="hover:bg-surface-sunken/50 transition-colors">
								<td class="px-4 py-3 font-medium text-text">{typeIcons[item.type] ?? '🔧'} {item.name}</td>
								<td class="px-4 py-3 text-text-secondary">{t(locale, `equipment.type_${item.type}`)}</td>
								<td class="px-4 py-3 text-text-muted text-xs">{item.serialNumber ?? '—'}</td>
								<td class="px-4 py-3">
									<span class="px-2 py-0.5 rounded text-xs font-medium {statusColors[item.status] ?? ''}">{t(locale, `equipment.${item.status}`)}</span>
									{#if item.status === 'loaned' && isOverdue(item.dueDate)}
										<span class="ml-1 px-2 py-0.5 rounded text-xs font-medium bg-danger/8 text-danger">{t(locale, 'equipment.overdue')}</span>
									{/if}
								</td>
								<td class="px-4 py-3 text-text-secondary text-xs">
									{#if item.loanedUserName}
										{item.loanedUserName}
										{#if item.dueDate}
											<span class="text-text-muted"> · {new Date(item.dueDate).toLocaleDateString(locale)}</span>
										{/if}
									{:else}
										—
									{/if}
								</td>
							<td class="px-4 py-3 space-x-2">
								{#if item.status === 'available'}
									<form method="POST" action="?/loan" use:enhance class="inline">
										<input type="hidden" name="id" value={item.id} />
										<input type="hidden" name="dueDate" value={new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)} />
										<button type="submit" class="text-xs text-primary font-medium hover:underline">Prestar</button>
									</form>
								{:else if item.status === 'loaned'}
									<form method="POST" action="?/updateStatus" use:enhance class="inline">
										<input type="hidden" name="id" value={item.id} />
										<input type="hidden" name="status" value="available" />
										<button type="submit" class="text-xs text-success font-medium hover:underline">Devolver</button>
									</form>
								{/if}
								{@const history = historyByEquipment[item.id] ?? []}
								{#if history.length > 0}
									<button onclick={() => expandedHistory = expandedHistory === item.id ? null : item.id} class="text-xs text-text-muted font-medium hover:text-text transition-colors">
										{t(locale, 'equipment.history')} ({history.length})
									</button>
								{/if}
							</td>
						</tr>
						{#if expandedHistory === item.id}
							{@const history = historyByEquipment[item.id] ?? []}
							<tr>
								<td colspan="6" class="px-4 py-3 bg-surface-sunken/50">
									<div class="max-h-48 overflow-y-auto space-y-2">
										{#each history as entry}
											<div class="flex items-center gap-3 text-xs">
												<span class="text-text-muted w-32 flex-shrink-0">{formatDate(entry.createdAt)}</span>
												<span class="font-medium text-text">{actionLabels[entry.action] ?? entry.action}</span>
												{#if entry.userName}
													<span class="text-text-muted">— {entry.userName}</span>
												{/if}
												{#if entry.notes}
													<span class="text-text-muted italic">({entry.notes})</span>
												{/if}
											</div>
										{/each}
									</div>
								</td>
							</tr>
						{/if}
					{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Column {
		key: string;
		label: string;
		sortable?: boolean;
		align?: 'left' | 'center' | 'right';
		width?: string;
		hideOnMobile?: boolean;
	}

	let {
		columns = [],
		data = [],
		sortKey = '',
		sortDir = 'asc',
		selectable = false,
		selectedIds = [],
		onSort,
		onSelect,
		onSelectAll,
		rowHref,
		emptyMessage = 'Sin datos',
		row,
		bulkActions
	}: {
		columns: Column[];
		data: Array<Record<string, unknown>>;
		sortKey?: string;
		sortDir?: 'asc' | 'desc';
		selectable?: boolean;
		selectedIds?: string[];
		onSort?: (key: string) => void;
		onSelect?: (id: string) => void;
		onSelectAll?: () => void;
		rowHref?: (item: Record<string, unknown>) => string;
		emptyMessage?: string;
		row: Snippet<[Record<string, unknown>]>;
		bulkActions?: Snippet;
	} = $props();

	let allSelected = $derived(data.length > 0 && selectedIds.length === data.length);
</script>

<div class="bg-surface rounded-xl border border-border overflow-hidden">
	{#if selectable && selectedIds.length > 0}
		<div class="px-4 py-2.5 bg-primary/5 border-b border-primary/10 flex items-center gap-3 animate-slide-down">
			<span class="text-xs font-medium text-primary">{selectedIds.length} seleccionado{selectedIds.length > 1 ? 's' : ''}</span>
			{#if bulkActions}{@render bulkActions()}{/if}
		</div>
	{/if}

	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead class="bg-surface-sunken text-text-muted text-left text-[11px] uppercase tracking-wider">
				<tr>
					{#if selectable}
						<th class="px-4 py-3 w-10">
							<input
								type="checkbox"
								checked={allSelected}
								onchange={onSelectAll}
								class="w-3.5 h-3.5 rounded border-border accent-primary cursor-pointer"
							/>
						</th>
					{/if}
					{#each columns as col}
						<th
							class="px-4 py-3 font-semibold {col.hideOnMobile ? 'hidden md:table-cell' : ''}"
							style={col.width ? `width: ${col.width}` : ''}
						>
							{#if col.sortable && onSort}
								<button
									onclick={() => onSort(col.key)}
									class="flex items-center gap-1 hover:text-text transition-colors group"
								>
									{col.label}
									<span class="flex flex-col {sortKey === col.key ? 'text-primary' : 'text-transparent group-hover:text-text-muted'} transition-colors">
										<svg viewBox="0 0 8 4" class="w-2 h-1 {sortKey === col.key && sortDir === 'asc' ? 'opacity-100' : 'opacity-30'}"><path d="M0 4l4-4 4 4z" fill="currentColor"/></svg>
										<svg viewBox="0 0 8 4" class="w-2 h-1 {sortKey === col.key && sortDir === 'desc' ? 'opacity-100' : 'opacity-30'}"><path d="M0 0l4 4 4-4z" fill="currentColor"/></svg>
									</span>
								</button>
							{:else}
								{col.label}
							{/if}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody class="divide-y divide-border">
				{#if data.length === 0}
					<tr>
						<td colspan={columns.length + (selectable ? 1 : 0)} class="px-4 py-12 text-center text-text-muted">
							{emptyMessage}
						</td>
					</tr>
				{:else}
					{#each data as item}
						<tr class="hover:bg-surface-sunken/50 transition-colors {selectedIds.includes(item.id as string) ? 'bg-primary/[0.03]' : ''}">
							{#if selectable}
								<td class="px-4 py-3 w-10">
									<input
										type="checkbox"
										checked={selectedIds.includes(item.id as string)}
										onchange={() => onSelect?.(item.id as string)}
										class="w-3.5 h-3.5 rounded border-border accent-primary cursor-pointer"
									/>
								</td>
							{/if}
							{@render row(item)}
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>

<script lang="ts">
	import type { Snippet } from 'svelte';

	interface KanbanColumn {
		id: string;
		label: string;
		color: string;
		items: Array<{ id: string; [key: string]: unknown }>;
	}

	let {
		columns = [],
		onmove,
		renderCard
	}: {
		columns: KanbanColumn[];
		onmove?: (itemId: string, fromColumn: string, toColumn: string) => void;
		renderCard: Snippet<[{ id: string; [key: string]: unknown }]>;
	} = $props();

	let draggedItem = $state<{ id: string; columnId: string } | null>(null);
	let dropTarget = $state<string | null>(null);

	function handleDragStart(itemId: string, columnId: string) {
		draggedItem = { id: itemId, columnId };
	}

	function handleDragOver(e: DragEvent, columnId: string) {
		e.preventDefault();
		dropTarget = columnId;
	}

	function handleDragLeave() {
		dropTarget = null;
	}

	function handleDrop(columnId: string) {
		if (draggedItem && draggedItem.columnId !== columnId) {
			onmove?.(draggedItem.id, draggedItem.columnId, columnId);
		}
		draggedItem = null;
		dropTarget = null;
	}

	function handleDragEnd() {
		draggedItem = null;
		dropTarget = null;
	}
</script>

<div class="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
	{#each columns as column}
		<div
			class="flex-shrink-0 w-72 flex flex-col"
			ondragover={(e) => handleDragOver(e, column.id)}
			ondragleave={handleDragLeave}
			ondrop={() => handleDrop(column.id)}
			role="list"
			aria-label={column.label}
		>
			<!-- Column header -->
			<div class="flex items-center gap-2 mb-3 px-1">
				<span class="w-2 h-2 rounded-full {column.color}"></span>
				<h3 class="text-sm font-semibold text-text">{column.label}</h3>
				<span class="text-[11px] font-medium text-text-muted bg-surface-sunken px-1.5 py-0.5 rounded-md ml-auto">{column.items.length}</span>
			</div>

			<!-- Column content -->
			<div class="flex-1 space-y-2 p-2 rounded-xl border-2 transition-colors min-h-[200px] {dropTarget === column.id ? 'border-primary/40 bg-primary/[0.02]' : 'border-transparent bg-surface-sunken/50'}">
				{#each column.items as item (item.id)}
					<div
						draggable="true"
						ondragstart={() => handleDragStart(item.id, column.id)}
						ondragend={handleDragEnd}
						class="bg-surface rounded-lg border border-border p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing active:opacity-70 active:scale-[0.98]"
						role="listitem"
					>
						{@render renderCard(item)}
					</div>
				{/each}

				{#if column.items.length === 0}
					<div class="py-8 text-center text-xs text-text-muted">
						Arrastra elementos aquí
					</div>
				{/if}
			</div>
		</div>
	{/each}
</div>

<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title = '',
		icon,
		collapsible = true,
		collapsed = false,
		removable = false,
		onremove,
		children
	}: {
		title?: string;
		icon?: string;
		collapsible?: boolean;
		collapsed?: boolean;
		removable?: boolean;
		onremove?: () => void;
		children: Snippet;
	} = $props();

	let isCollapsed = $state(collapsed);
</script>

<div class="bg-surface rounded-xl border border-border overflow-hidden interactive-card group">
	<!-- Header -->
	<div class="flex items-center justify-between px-4 py-3 border-b border-border/50">
		<div class="flex items-center gap-2">
			{#if icon}
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-4 h-4 text-text-muted"><path d={icon}/></svg>
			{/if}
			<h3 class="text-sm font-semibold text-text">{title}</h3>
		</div>
		<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
			{#if collapsible}
				<button
					onclick={() => isCollapsed = !isCollapsed}
					class="p-1 rounded hover:bg-surface-sunken transition-colors"
					aria-label={isCollapsed ? 'Expandir' : 'Colapsar'}
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5 text-text-muted transition-transform {isCollapsed ? 'rotate-180' : ''}"><path d="M19 9l-7 7-7-7"/></svg>
				</button>
			{/if}
			{#if removable && onremove}
				<button
					onclick={onremove}
					class="p-1 rounded hover:bg-danger/10 transition-colors"
					aria-label="Eliminar widget"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5 text-text-muted hover:text-danger"><path d="M18 6L6 18M6 6l12 12"/></svg>
				</button>
			{/if}
		</div>
	</div>

	<!-- Content -->
	{#if !isCollapsed}
		<div class="p-4">
			{@render children()}
		</div>
	{/if}
</div>

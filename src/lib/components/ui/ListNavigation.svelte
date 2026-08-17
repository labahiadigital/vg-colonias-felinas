<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import type { Snippet } from 'svelte';

	let {
		items = [],
		getHref,
		children
	}: {
		items: Array<{ id: string }>;
		getHref?: (item: { id: string }) => string;
		children: Snippet;
	} = $props();

	let activeIndex = $state(-1);
	let containerEl = $state<HTMLDivElement>();

	function scrollToActive() {
		if (!containerEl) return;
		const rows = containerEl.querySelectorAll('[data-list-item]');
		const row = rows[activeIndex];
		if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	}

	if (browser) {
		$effect(() => {
			function handleKey(e: KeyboardEvent) {
				if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
				if (e.metaKey || e.ctrlKey || e.altKey) return;

				if (e.key === 'j' || e.key === 'ArrowDown') {
					e.preventDefault();
					activeIndex = Math.min(activeIndex + 1, items.length - 1);
					scrollToActive();
				} else if (e.key === 'k' || e.key === 'ArrowUp') {
					e.preventDefault();
					activeIndex = Math.max(activeIndex - 1, 0);
					scrollToActive();
				} else if (e.key === 'Enter' && activeIndex >= 0) {
					e.preventDefault();
					const item = items[activeIndex];
					if (item && getHref) goto(getHref(item));
				} else if (e.key === 'Escape') {
					activeIndex = -1;
				}
			}

			window.addEventListener('keydown', handleKey);
			return () => window.removeEventListener('keydown', handleKey);
		});
	}

	export function getActiveIndex() { return activeIndex; }
</script>

<div bind:this={containerEl} class="relative">
	{@render children()}
</div>

{#if items.length > 0}
	<div class="hidden lg:flex fixed bottom-4 left-4 z-30 items-center gap-3 px-3 py-1.5 bg-surface/90 backdrop-blur border border-border rounded-lg shadow-sm text-[10px] text-text-muted">
		<span class="flex items-center gap-1">
			<kbd class="px-1 py-0.5 bg-surface-sunken border border-border rounded font-mono">J</kbd>/<kbd class="px-1 py-0.5 bg-surface-sunken border border-border rounded font-mono">K</kbd>
			navegar
		</span>
		<span class="flex items-center gap-1">
			<kbd class="px-1 py-0.5 bg-surface-sunken border border-border rounded font-mono">↵</kbd>
			abrir
		</span>
	</div>
{/if}

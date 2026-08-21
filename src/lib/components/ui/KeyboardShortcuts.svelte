<script lang="ts">
	import { browser } from '$app/environment';

	let {
		shortcuts = []
	}: {
		shortcuts?: Array<{
			key: string;
			label: string;
			action: () => void;
			ctrl?: boolean;
		}>;
	} = $props();

	if (browser) {
		$effect(() => {
			function handleKey(e: KeyboardEvent) {
				if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
				if (e.metaKey || e.ctrlKey) return;

				for (const shortcut of shortcuts) {
					if (e.key.toLowerCase() === shortcut.key.toLowerCase()) {
						e.preventDefault();
						shortcut.action();
						return;
					}
				}
			}

			window.addEventListener('keydown', handleKey);
			return () => window.removeEventListener('keydown', handleKey);
		});
	}
</script>

<!-- Shortcut hints shown on hover/focus of relevant buttons -->
{#if shortcuts.length > 0}
	<div class="hidden lg:flex fixed bottom-4 right-4 z-30 items-center gap-2 px-3 py-2 bg-surface/90 backdrop-blur border border-border rounded-lg shadow-sm text-[10px] text-text-muted">
		{#each shortcuts.slice(0, 4) as s}
			<span class="flex items-center gap-1">
				<kbd class="px-1 py-0.5 bg-surface-sunken border border-border rounded text-[9px] font-mono font-medium">{s.key.toUpperCase()}</kbd>
				<span>{s.label}</span>
			</span>
		{/each}
	</div>
{/if}

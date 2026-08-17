<script lang="ts">
	let { keys = '' }: { keys?: string } = $props();
	let parts = $derived(keys.split('+').map(k => k.trim()));
</script>

<span class="inline-flex items-center gap-0.5">
	{#each parts as key, i}
		{#if i > 0}<span class="text-text-muted text-[9px]">+</span>{/if}
		<kbd class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-medium text-text-muted bg-surface-sunken border border-border rounded shadow-sm">{key}</kbd>
	{/each}
</span>

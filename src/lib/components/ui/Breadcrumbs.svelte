<script lang="ts">
	let { items = [] }: {
		items: Array<{ label: string; href?: string }>;
	} = $props();
</script>

{#if items.length > 1}
	<nav aria-label="Breadcrumb" class="mb-4">
		<ol class="flex items-center gap-1 text-sm">
			{#each items as item, i}
				{#if i > 0}
					<li class="text-text-muted" aria-hidden="true">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3"><path d="M9 18l6-6-6-6"/></svg>
					</li>
				{/if}
				<li>
					{#if item.href && i < items.length - 1}
						<a href={item.href} class="text-text-muted hover:text-primary transition-colors font-medium">{item.label}</a>
					{:else}
						<span class="text-text font-medium" aria-current="page">{item.label}</span>
					{/if}
				</li>
			{/each}
		</ol>
	</nav>
{/if}

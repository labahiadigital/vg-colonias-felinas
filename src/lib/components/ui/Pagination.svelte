<script lang="ts">
	import { page } from '$app/stores';

	let { currentPage, totalPages, totalItems, pageSize }: {
		currentPage: number;
		totalPages: number;
		totalItems: number;
		pageSize: number;
	} = $props();

	function buildUrl(targetPage: number): string {
		const url = new URL($page.url);
		url.searchParams.set('page', String(targetPage));
		return url.pathname + url.search;
	}

	const start = $derived((currentPage - 1) * pageSize + 1);
	const end = $derived(Math.min(currentPage * pageSize, totalItems));

	const visiblePages = $derived.by(() => {
		const pages: number[] = [];
		const delta = 2;
		const left = Math.max(2, currentPage - delta);
		const right = Math.min(totalPages - 1, currentPage + delta);

		pages.push(1);
		if (left > 2) pages.push(-1);
		for (let i = left; i <= right; i++) pages.push(i);
		if (right < totalPages - 1) pages.push(-1);
		if (totalPages > 1) pages.push(totalPages);

		return pages;
	});
</script>

{#if totalPages > 1}
<nav class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t border-border" aria-label="Paginación">
	<p class="text-xs text-text-muted">{start}–{end} de {totalItems}</p>
	<div class="flex items-center gap-1">
		{#if currentPage > 1}
			<a href={buildUrl(currentPage - 1)} class="px-2.5 py-1.5 text-xs font-medium rounded-md bg-surface border border-border hover:bg-surface-sunken transition-colors">←</a>
		{/if}
		{#each visiblePages as p}
			{#if p === -1}
				<span class="px-1.5 text-xs text-text-muted">…</span>
			{:else if p === currentPage}
				<span class="px-2.5 py-1.5 text-xs font-bold rounded-md bg-primary text-white">{p}</span>
			{:else}
				<a href={buildUrl(p)} class="px-2.5 py-1.5 text-xs font-medium rounded-md bg-surface border border-border hover:bg-surface-sunken transition-colors">{p}</a>
			{/if}
		{/each}
		{#if currentPage < totalPages}
			<a href={buildUrl(currentPage + 1)} class="px-2.5 py-1.5 text-xs font-medium rounded-md bg-surface border border-border hover:bg-surface-sunken transition-colors">→</a>
		{/if}
	</div>
</nav>
{/if}

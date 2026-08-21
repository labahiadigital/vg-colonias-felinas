<script lang="ts">
	let {
		icon = 'search',
		title = 'Sin resultados',
		description = '',
		actionLabel = '',
		actionHref = ''
	}: {
		icon?: 'search' | 'colony' | 'cat' | 'incident' | 'person' | 'message' | 'chart' | 'health' | 'heart';
		title?: string;
		description?: string;
		actionLabel?: string;
		actionHref?: string;
	} = $props();

	const illustrations: Record<string, { paths: string[]; accent: string }> = {
		search: {
			paths: ['M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'],
			accent: 'text-primary bg-primary/5'
		},
		colony: {
			paths: ['M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z', 'M12 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5z'],
			accent: 'text-primary bg-primary/5'
		},
		cat: {
			paths: ['M12 5c-1.5-2-4-2.5-6-1.5 0 3 1 5.5 3 7.5-1 1-2 2.5-2 4.5 0 2 1.5 3.5 3.5 3.5 1 0 1.5-.5 1.5-.5s.5.5 1.5.5c2 0 3.5-1.5 3.5-3.5 0-2-1-3.5-2-4.5 2-2 3-4.5 3-7.5-2-1-4.5-.5-6 1.5z'],
			accent: 'text-accent bg-accent/5'
		},
		incident: {
			paths: ['M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z', 'M12 9v4', 'M12 17h.01'],
			accent: 'text-warning bg-warning/5'
		},
		person: {
			paths: ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', 'M9 7a4 4 0 100-8 4 4 0 000 8z', 'M23 21v-2a4 4 0 00-3-3.87', 'M16 3.13a4 4 0 010 7.75'],
			accent: 'text-info bg-info/5'
		},
		message: {
			paths: ['M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'],
			accent: 'text-primary bg-primary/5'
		},
		chart: {
			paths: ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
			accent: 'text-success bg-success/5'
		},
		health: {
			paths: ['M22 12h-4l-3 9L9 3l-3 9H2'],
			accent: 'text-accent bg-accent/5'
		},
		heart: {
			paths: ['M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z'],
			accent: 'text-danger bg-danger/5'
		}
	};

	const fallback = { paths: ['M11 17.25a6.25 6.25 0 110-12.5 6.25 6.25 0 010 12.5z', 'M16 16l4.5 4.5'], accent: 'text-primary bg-primary/5' };
	let config = $derived(illustrations[icon] ?? fallback);
</script>

<div class="py-16 text-center animate-enter">
	<div class="relative mx-auto mb-5 w-20 h-20">
		<!-- Decorative rings -->
		<div class="absolute inset-0 rounded-2xl {config.accent} opacity-60 animate-pulse"></div>
		<div class="absolute inset-2 rounded-xl bg-surface border border-border flex items-center justify-center">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-7 h-7 {config.accent.split(' ')[0]}">
				{#each config.paths as path}
					<path d={path} />
				{/each}
			</svg>
		</div>
	</div>
	<p class="text-base font-medium text-text mb-1">{title}</p>
	{#if description}
		<p class="text-sm text-text-muted max-w-xs mx-auto">{description}</p>
	{/if}
	{#if actionLabel && actionHref}
		<a href={actionHref} class="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors btn-press min-h-[44px]">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M12 5v14m-7-7h14"/></svg>
			{actionLabel}
		</a>
	{/if}
</div>

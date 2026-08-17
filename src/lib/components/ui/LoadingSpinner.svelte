<script lang="ts">
	let { size = 'md', label = 'Cargando...' }: { size?: 'sm' | 'md' | 'lg'; label?: string } = $props();

	const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
</script>

<div class="flex items-center justify-center gap-2" role="status" aria-label={label}>
	<svg class="{sizeMap[size]} animate-spin text-primary" viewBox="0 0 24 24" fill="none">
		<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.2"/>
		<path d="M12 2a10 10 0 019.95 9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
	</svg>
	<span class="sr-only">{label}</span>
</div>

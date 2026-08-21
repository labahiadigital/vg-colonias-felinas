<script lang="ts">
	import { browser } from '$app/environment';

	let {
		value = 'comfortable',
		onchange
	}: {
		value?: 'compact' | 'comfortable' | 'spacious';
		onchange?: (density: 'compact' | 'comfortable' | 'spacious') => void;
	} = $props();

	$effect(() => {
		if (browser && !onchange) {
			const stored = localStorage.getItem('gatopolis-density');
			if (stored === 'compact' || stored === 'comfortable' || stored === 'spacious') {
				value = stored;
			}
		}
	});

	function set(density: 'compact' | 'comfortable' | 'spacious') {
		value = density;
		if (browser) localStorage.setItem('gatopolis-density', density);
		onchange?.(density);
	}

	const options: Array<{ id: 'compact' | 'comfortable' | 'spacious'; icon: string; label: string }> = [
		{ id: 'compact', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', label: 'Compacto' },
		{ id: 'comfortable', icon: 'M4 6h16M4 12h16M4 18h16', label: 'Normal' },
		{ id: 'spacious', icon: 'M4 5h16M4 12h16M4 19h16', label: 'Espacioso' },
	];
</script>

<div class="inline-flex items-center gap-0.5 p-0.5 bg-surface-sunken rounded-lg border border-border">
	{#each options as opt}
		<button
			onclick={() => set(opt.id)}
			class="p-1.5 rounded-md transition-colors {value === opt.id ? 'bg-surface shadow-sm text-text' : 'text-text-muted hover:text-text-secondary'}"
			aria-label={opt.label}
			data-tooltip={opt.label}
		>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="w-4 h-4"><path d={opt.icon}/></svg>
		</button>
	{/each}
</div>

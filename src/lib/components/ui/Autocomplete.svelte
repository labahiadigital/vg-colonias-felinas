<script lang="ts">
	import { browser } from '$app/environment';

	let {
		name = '',
		value = '',
		placeholder = '',
		options = [],
		onselect,
		label = '',
		required = false
	}: {
		name?: string;
		value?: string;
		placeholder?: string;
		options: Array<{ value: string; label: string; subtitle?: string }>;
		onselect?: (val: string) => void;
		label?: string;
		required?: boolean;
	} = $props();

	let query = $state(value ?? '');
	let open = $state(false);
	let selectedIndex = $state(0);
	let inputEl = $state<HTMLInputElement>();

	let filtered = $derived(
		query.length === 0
			? options.slice(0, 8)
			: options.filter(o =>
				o.label.toLowerCase().includes(query.toLowerCase()) ||
				(o.subtitle?.toLowerCase().includes(query.toLowerCase()) ?? false)
			).slice(0, 8)
	);

	function select(opt: { value: string; label: string }) {
		query = opt.label;
		value = opt.value;
		open = false;
		onselect?.(opt.value);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) { if (e.key === 'ArrowDown') { open = true; e.preventDefault(); } return; }
		if (e.key === 'ArrowDown') { selectedIndex = Math.min(selectedIndex + 1, filtered.length - 1); e.preventDefault(); }
		else if (e.key === 'ArrowUp') { selectedIndex = Math.max(selectedIndex - 1, 0); e.preventDefault(); }
		else if (e.key === 'Enter' && filtered[selectedIndex]) { select(filtered[selectedIndex]); e.preventDefault(); }
		else if (e.key === 'Escape') { open = false; }
	}

	$effect(() => { if (query) selectedIndex = 0; });
</script>

<div class="relative">
	{#if label}
		<label for={name} class="block text-sm font-medium text-text-secondary mb-1.5">
			{label} {#if required}<span class="text-danger">*</span>{/if}
		</label>
	{/if}

	<input type="hidden" {name} {value} />

	<input
		bind:this={inputEl}
		bind:value={query}
		{placeholder}
		{required}
		autocomplete="off"
		onfocus={() => open = true}
		onblur={() => setTimeout(() => { open = false; }, 150)}
		onkeydown={handleKeydown}
		class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[44px]"
	/>

	{#if open && filtered.length > 0}
		<div class="absolute top-full left-0 right-0 mt-1 bg-surface rounded-lg border border-border shadow-lg z-50 overflow-hidden animate-scale-in origin-top max-h-[200px] overflow-y-auto">
			{#each filtered as opt, i}
				<button
					type="button"
					class="w-full text-left px-3 py-2 text-sm transition-colors {i === selectedIndex ? 'bg-primary/8 text-primary' : 'text-text-secondary hover:bg-surface-sunken'}"
					onmousedown={() => select(opt)}
					onmouseenter={() => selectedIndex = i}
				>
					<span class="block">{opt.label}</span>
					{#if opt.subtitle}
						<span class="text-[11px] text-text-muted">{opt.subtitle}</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

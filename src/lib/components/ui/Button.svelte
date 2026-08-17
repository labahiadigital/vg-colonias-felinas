<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'primary',
		size = 'md',
		loading = false,
		disabled = false,
		type = 'button',
		href,
		onclick,
		children
	}: {
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
		size?: 'sm' | 'md' | 'lg';
		loading?: boolean;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		href?: string;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
	} = $props();

	const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50 disabled:pointer-events-none';

	const variants: Record<string, string> = {
		primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow',
		secondary: 'bg-surface-sunken text-text-secondary border border-border hover:bg-border hover:text-text',
		ghost: 'text-text-secondary hover:bg-surface-sunken hover:text-text',
		danger: 'bg-danger text-white hover:bg-danger/90 shadow-sm',
		outline: 'border border-border text-text-secondary hover:border-text-muted hover:text-text bg-transparent'
	};

	const sizes: Record<string, string> = {
		sm: 'text-xs px-3 py-1.5 min-h-[32px]',
		md: 'text-sm px-4 py-2.5 min-h-[40px]',
		lg: 'text-sm px-6 py-3 min-h-[48px]'
	};

	let classes = $derived(`${baseClasses} ${variants[variant]} ${sizes[size]}`);
</script>

{#if href}
	<a {href} class={classes} aria-disabled={disabled || loading}>
		{#if loading}
			<svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.2"/><path d="M12 2a10 10 0 019.95 9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
		{/if}
		{@render children()}
	</a>
{:else}
	<button {type} class={classes} {onclick} disabled={disabled || loading}>
		{#if loading}
			<svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.2"/><path d="M12 2a10 10 0 019.95 9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
		{/if}
		{@render children()}
	</button>
{/if}

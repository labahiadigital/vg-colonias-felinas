<script lang="ts">
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';

	let {
		children,
		staggerMs = 50,
		threshold = 0.1
	}: {
		children: Snippet;
		staggerMs?: number;
		threshold?: number;
	} = $props();

	let containerEl = $state<HTMLDivElement>();
	let visible = $state(false);

	if (browser) {
		$effect(() => {
			if (!containerEl) return;
			const observer = new IntersectionObserver(
				([entry]) => {
					if (entry.isIntersecting) {
						visible = true;
						observer.disconnect();
					}
				},
				{ threshold }
			);
			observer.observe(containerEl);
			return () => observer.disconnect();
		});
	}
</script>

<div
	bind:this={containerEl}
	class="staggered-container {visible ? 'is-visible' : ''}"
	style="--stagger-ms: {staggerMs}ms"
>
	{@render children()}
</div>

<style>
	.staggered-container :global(> *) {
		opacity: 0;
		transform: translateY(8px);
		transition: opacity 0.3s cubic-bezier(0.22, 1, 0.36, 1),
					transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.staggered-container.is-visible :global(> *) {
		opacity: 1;
		transform: translateY(0);
	}

	.staggered-container.is-visible :global(> :nth-child(1)) { transition-delay: 0ms; }
	.staggered-container.is-visible :global(> :nth-child(2)) { transition-delay: var(--stagger-ms); }
	.staggered-container.is-visible :global(> :nth-child(3)) { transition-delay: calc(var(--stagger-ms) * 2); }
	.staggered-container.is-visible :global(> :nth-child(4)) { transition-delay: calc(var(--stagger-ms) * 3); }
	.staggered-container.is-visible :global(> :nth-child(5)) { transition-delay: calc(var(--stagger-ms) * 4); }
	.staggered-container.is-visible :global(> :nth-child(6)) { transition-delay: calc(var(--stagger-ms) * 5); }
	.staggered-container.is-visible :global(> :nth-child(7)) { transition-delay: calc(var(--stagger-ms) * 6); }
	.staggered-container.is-visible :global(> :nth-child(8)) { transition-delay: calc(var(--stagger-ms) * 7); }
	.staggered-container.is-visible :global(> :nth-child(n+9)) { transition-delay: calc(var(--stagger-ms) * 8); }

	@media (prefers-reduced-motion: reduce) {
		.staggered-container :global(> *) {
			opacity: 1;
			transform: none;
			transition: none;
		}
	}
</style>

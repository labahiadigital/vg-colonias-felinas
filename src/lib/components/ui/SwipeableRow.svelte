<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		onSwipeLeft,
		onSwipeRight,
		leftLabel = 'Archivar',
		rightLabel = 'Eliminar',
		leftColor = 'bg-warning',
		rightColor = 'bg-danger',
		threshold = 80,
		children
	}: {
		onSwipeLeft?: () => void;
		onSwipeRight?: () => void;
		leftLabel?: string;
		rightLabel?: string;
		leftColor?: string;
		rightColor?: string;
		threshold?: number;
		children: Snippet;
	} = $props();

	let startX = $state(0);
	let currentX = $state(0);
	let swiping = $state(false);
	let offset = $derived(swiping ? currentX - startX : 0);

	function handleTouchStart(e: TouchEvent) {
		startX = e.touches[0].clientX;
		swiping = true;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!swiping) return;
		currentX = e.touches[0].clientX;
	}

	function handleTouchEnd() {
		if (!swiping) return;
		if (offset > threshold && onSwipeRight) {
			onSwipeRight();
		} else if (offset < -threshold && onSwipeLeft) {
			onSwipeLeft();
		}
		swiping = false;
		startX = 0;
		currentX = 0;
	}
</script>

<div class="relative overflow-hidden rounded-lg lg:overflow-visible">
	<!-- Background actions -->
	{#if offset !== 0}
		<div class="absolute inset-0 flex items-center {offset > 0 ? 'justify-start pl-4' : 'justify-end pr-4'} {offset > 0 ? rightColor : leftColor} text-white text-xs font-medium rounded-lg">
			{offset > 0 ? rightLabel : leftLabel}
		</div>
	{/if}

	<!-- Content -->
	<div
		class="relative bg-surface transition-transform {swiping ? '' : 'duration-200'}"
		style="transform: translateX({Math.max(-120, Math.min(120, offset))}px)"
		ontouchstart={handleTouchStart}
		ontouchmove={handleTouchMove}
		ontouchend={handleTouchEnd}
		role="row"
	>
		{@render children()}
	</div>
</div>

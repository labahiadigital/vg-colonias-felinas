<script lang="ts">
	import { browser } from '$app/environment';
	import { untrack } from 'svelte';

	let {
		value = 0,
		duration = 800,
		suffix = '',
		prefix = ''
	}: {
		value?: number;
		duration?: number;
		suffix?: string;
		prefix?: string;
	} = $props();

	let displayed = $state(0);

	$effect(() => {
		const target = value;
		if (!browser) { displayed = target; return; }

		const start = untrack(() => displayed);
		const diff = target - start;
		if (diff === 0) return;

		const startTime = performance.now();

		function easeOutExpo(t: number): number {
			return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
		}

		function step(now: number) {
			const elapsed = now - startTime;
			const progress = Math.min(elapsed / duration, 1);
			displayed = Math.round(start + diff * easeOutExpo(progress));
			if (progress < 1) requestAnimationFrame(step);
		}

		requestAnimationFrame(step);
	});
</script>

<span class="tabular-nums">{prefix}{displayed}{suffix}</span>

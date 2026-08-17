<script lang="ts">
	import { onMount } from 'svelte';

	let {
		data = [],
		color = 'var(--color-primary)',
		height = 40,
		type = 'line'
	}: {
		data?: number[];
		color?: string;
		height?: number;
		type?: 'line' | 'bar';
	} = $props();

	let canvasEl = $state<HTMLCanvasElement>();

	function resolveColor(el: HTMLElement, raw: string): string {
		if (raw.startsWith('var(')) {
			const resolved = getComputedStyle(el).getPropertyValue(raw.slice(4, -1).split(',')[0].trim()).trim();
			return resolved || 'rgb(15, 118, 110)';
		}
		return raw;
	}

	function toRgba(c: string, alpha: number): string {
		if (c.startsWith('rgb(')) return c.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
		if (c.startsWith('rgba(')) return c.replace(/,\s*[\d.]+\)$/, `, ${alpha})`);
		return `rgba(15, 118, 110, ${alpha})`;
	}

	onMount(() => {
		if (!canvasEl || data.length === 0) return;
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;

		const resolved = resolveColor(canvasEl, color);

		const dpr = window.devicePixelRatio || 1;
		const w = canvasEl.offsetWidth;
		const h = height;
		canvasEl.width = w * dpr;
		canvasEl.height = h * dpr;
		ctx.scale(dpr, dpr);

		const max = Math.max(...data, 1);
		const min = Math.min(...data, 0);
		const range = max - min || 1;
		const padding = 2;

		if (type === 'bar') {
			const barWidth = (w - padding * 2) / data.length - 2;
			data.forEach((val, i) => {
				const barH = ((val - min) / range) * (h - padding * 2);
				const x = padding + i * ((w - padding * 2) / data.length) + 1;
				const y = h - padding - barH;
				ctx.fillStyle = resolved;
				ctx.globalAlpha = 0.3 + (val / max) * 0.7;
				ctx.beginPath();
				ctx.roundRect(x, y, barWidth, barH, 2);
				ctx.fill();
			});
		} else {
			ctx.beginPath();
			ctx.strokeStyle = resolved;
			ctx.lineWidth = 1.5;
			ctx.lineJoin = 'round';
			ctx.lineCap = 'round';

			data.forEach((val, i) => {
				const x = padding + (i / (data.length - 1)) * (w - padding * 2);
				const y = h - padding - ((val - min) / range) * (h - padding * 2);
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			});
			ctx.stroke();

			const gradient = ctx.createLinearGradient(0, 0, 0, h);
			gradient.addColorStop(0, toRgba(resolved, 0.1));
			gradient.addColorStop(1, 'transparent');
			ctx.lineTo(w - padding, h);
			ctx.lineTo(padding, h);
			ctx.closePath();
			ctx.fillStyle = gradient;
			ctx.globalAlpha = 0.3;
			ctx.fill();
		}
	});
</script>

<canvas
	bind:this={canvasEl}
	class="w-full"
	style="height: {height}px"
></canvas>

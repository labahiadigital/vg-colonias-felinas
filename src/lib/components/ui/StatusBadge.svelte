<script lang="ts">
	let {
		status = 'default',
		label = '',
		pulse = false
	}: {
		status?: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'muted';
		label?: string;
		pulse?: boolean;
	} = $props();

	const config: Record<string, { dot: string; bg: string }> = {
		success: { dot: 'bg-success', bg: 'bg-success/8 text-success' },
		warning: { dot: 'bg-warning', bg: 'bg-warning/8 text-warning' },
		danger: { dot: 'bg-danger', bg: 'bg-danger/8 text-danger' },
		info: { dot: 'bg-info', bg: 'bg-info/8 text-info' },
		default: { dot: 'bg-primary', bg: 'bg-primary/8 text-primary' },
		muted: { dot: 'bg-text-muted', bg: 'bg-surface-sunken text-text-muted' }
	};

	let style = $derived(config[status] ?? config.default);
</script>

<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium {style.bg}">
	<span class="relative flex w-1.5 h-1.5">
		{#if pulse}
			<span class="absolute inset-0 rounded-full {style.dot} animate-ping opacity-75"></span>
		{/if}
		<span class="relative w-1.5 h-1.5 rounded-full {style.dot}"></span>
	</span>
	{label}
</span>

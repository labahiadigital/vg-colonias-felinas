<script lang="ts">
	let {
		type = 'success',
		message = '',
		show = false,
		onclose
	}: {
		type?: 'success' | 'error' | 'warning' | 'info';
		message?: string;
		show?: boolean;
		onclose?: () => void;
	} = $props();

	const config = {
		success: { bg: 'bg-success-subtle border-success/20', text: 'text-success', icon: 'M20 6L9 17l-5-5' },
		error: { bg: 'bg-danger-subtle border-danger/20', text: 'text-danger', icon: 'M18 6L6 18M6 6l12 12' },
		warning: { bg: 'bg-warning-subtle border-warning/20', text: 'text-warning', icon: 'M12 9v4m0 4h.01' },
		info: { bg: 'bg-info-subtle border-info/20', text: 'text-info', icon: 'M12 16v-4m0-4h.01' }
	};

	let style = $derived(config[type]);

	$effect(() => {
		if (show && onclose) {
			const timer = setTimeout(onclose, 4000);
			return () => clearTimeout(timer);
		}
	});
</script>

{#if show && message}
	<div class="fixed bottom-6 right-6 z-[9990] max-w-sm animate-slide-up" role="alert">
		<div class="flex items-start gap-3 {style.bg} {style.text} text-sm p-4 rounded-xl border shadow-lg backdrop-blur-sm">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 mt-0.5 flex-shrink-0">
				<circle cx="12" cy="12" r="10"/><path d={style.icon}/>
			</svg>
			<span class="flex-1 text-text">{message}</span>
			{#if onclose}
				<button onclick={onclose} class="flex-shrink-0 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors" aria-label="Cerrar">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-text-muted"><path d="M18 6L6 18M6 6l12 12"/></svg>
				</button>
			{/if}
		</div>
	</div>
{/if}

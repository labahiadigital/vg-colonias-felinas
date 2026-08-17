<script lang="ts">
	import { browser } from '$app/environment';

	let {
		open = false,
		title = '¿Estás seguro?',
		message = 'Esta acción no se puede deshacer.',
		confirmLabel = 'Confirmar',
		cancelLabel = 'Cancelar',
		onconfirm,
		oncancel
	}: {
		open: boolean;
		title?: string;
		message?: string;
		confirmLabel?: string;
		cancelLabel?: string;
		onconfirm: () => void;
		oncancel: () => void;
	} = $props();

	let dialogEl = $state<HTMLDivElement>();

	$effect(() => {
		if (!browser || !open) return;
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') oncancel();
		};
		document.addEventListener('keydown', handleKey);
		dialogEl?.querySelector<HTMLButtonElement>('button')?.focus();
		return () => document.removeEventListener('keydown', handleKey);
	});
</script>

{#if open}
	<div class="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
		<div class="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onclick={oncancel} role="presentation"></div>
		<div bind:this={dialogEl} class="relative bg-surface rounded-xl shadow-2xl border border-border p-6 max-w-sm w-full animate-scale-in">
			<div class="w-11 h-11 rounded-xl bg-danger/8 flex items-center justify-center mb-4">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-5 h-5 text-danger"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
			</div>
			<h3 id="confirm-title" class="text-lg font-semibold text-text mb-1">{title}</h3>
			<p class="text-sm text-text-secondary mb-6 leading-relaxed">{message}</p>
			<div class="flex gap-3 justify-end">
				<button onclick={oncancel} class="px-4 py-2.5 bg-surface-sunken text-text-secondary rounded-lg text-sm font-medium hover:bg-border transition-colors min-h-[40px] btn-press">{cancelLabel}</button>
				<button onclick={onconfirm} class="px-4 py-2.5 bg-danger text-white rounded-lg text-sm font-medium hover:bg-danger/90 transition-colors min-h-[40px] btn-press shadow-sm">{confirmLabel}</button>
			</div>
		</div>
	</div>
{/if}

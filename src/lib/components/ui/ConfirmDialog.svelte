<script lang="ts">
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
</script>

{#if open}
	<div class="fixed inset-0 z-[9999] flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
		<div class="absolute inset-0 bg-black/50" onclick={oncancel} role="presentation"></div>
		<div class="relative bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
			<h3 id="confirm-title" class="text-lg font-bold text-gray-900 mb-2">{title}</h3>
			<p class="text-sm text-gray-600 mb-6">{message}</p>
			<div class="flex gap-3 justify-end">
				<button onclick={oncancel} class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-200">{cancelLabel}</button>
				<button onclick={onconfirm} class="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700">{confirmLabel}</button>
			</div>
		</div>
	</div>
{/if}

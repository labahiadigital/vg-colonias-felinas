<script lang="ts">
	let { class: className = '' }: { class?: string } = $props();
</script>

<button
	type="button"
	class="drag-handle cursor-grab active:cursor-grabbing p-1 rounded hover:bg-surface-sunken transition-colors {className}"
	aria-label="Arrastrar para reordenar"
	data-tooltip="Arrastrar"
>
	<svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-text-muted">
		<circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
		<circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
		<circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
	</svg>
</button>

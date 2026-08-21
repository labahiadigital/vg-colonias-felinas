<script lang="ts">
	let {
		ownerEntity = '',
		ownerId = '',
		accept = 'image/*',
		label = 'Subir archivo',
		onuploaded
	}: {
		ownerEntity?: string;
		ownerId?: string;
		accept?: string;
		label?: string;
		onuploaded?: (result: { id: string; path: string; filename: string }) => void;
	} = $props();

	let uploading = $state(false);
	let error = $state('');
	let uploadedFile = $state<{ path: string; filename: string } | null>(null);

	async function handleFile(e: Event) {
		const input = e.target;
		if (!(input instanceof HTMLInputElement)) return;
		const file = input.files?.[0];
		if (!file) return;

		uploading = true;
		error = '';

		const fd = new FormData();
		fd.append('file', file);
		fd.append('ownerEntity', ownerEntity);
		fd.append('ownerId', ownerId);
		fd.append('type', 'photo');

		try {
			const res = await fetch('/api/upload', { method: 'POST', body: fd });
			const data = await res.json();
			if (!res.ok) {
				error = data.error || 'Error al subir archivo';
			} else {
				uploadedFile = { path: data.path, filename: data.filename };
				onuploaded?.(data);
			}
		} catch {
			error = 'Error de conexión';
		} finally {
			uploading = false;
		}
	}
</script>

<div class="space-y-2">
	<label class="block">
		<span class="text-sm font-medium text-text-secondary">{label}</span>
		<input
			type="file"
			{accept}
			onchange={handleFile}
			disabled={uploading}
			class="mt-1.5 block w-full text-sm text-text-muted file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-primary/8 file:text-primary hover:file:bg-primary/12 file:transition-colors disabled:opacity-50"
			capture="environment"
		/>
	</label>

	{#if uploading}
		<div class="flex items-center gap-2 text-xs text-primary">
			<svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.2"/><path d="M12 2a10 10 0 019.95 9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
			Subiendo archivo...
		</div>
	{/if}
	{#if error}
		<p class="text-xs text-danger">{error}</p>
	{/if}
	{#if uploadedFile}
		<div class="flex items-center gap-2 text-xs text-success bg-success-subtle p-2 rounded-lg border border-success/10">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5 flex-shrink-0"><polyline points="20,6 9,17 4,12"/></svg>
			<span class="truncate">{uploadedFile.filename}</span>
			{#if uploadedFile.path.match(/\.(jpg|jpeg|png|webp|gif)$/i)}
				<img src={uploadedFile.path} alt="Preview" class="w-10 h-10 object-cover rounded-md flex-shrink-0 ml-auto" />
			{/if}
		</div>
	{/if}
</div>

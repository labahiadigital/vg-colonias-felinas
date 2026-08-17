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
		const input = e.target as HTMLInputElement;
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
		<span class="text-sm font-semibold text-gray-700">{label}</span>
		<input
			type="file"
			{accept}
			onchange={handleFile}
			disabled={uploading}
			class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 disabled:opacity-50"
			capture="environment"
		/>
	</label>

	{#if uploading}
		<p class="text-xs text-blue-600 animate-pulse">Subiendo archivo...</p>
	{/if}
	{#if error}
		<p class="text-xs text-red-600">{error}</p>
	{/if}
	{#if uploadedFile}
		<div class="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-2 rounded">
			<span>Subido: {uploadedFile.filename}</span>
			{#if uploadedFile.path.match(/\.(jpg|jpeg|png|webp|gif)$/i)}
				<img src={uploadedFile.path} alt="Preview" class="w-16 h-16 object-cover rounded" />
			{/if}
		</div>
	{/if}
</div>

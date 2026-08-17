<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);
	let colony = $derived(data.colony);

	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';

	let activeTab = $state('general');
	let editing = $state(false);
	let showDeleteConfirm = $state(false);
	let mapEl = $state<HTMLDivElement>();

	let deleteFormEl: HTMLFormElement;

	let tabs = $derived([
		{ id: 'general', label: 'General', icon: '📋' },
		{ id: 'map', label: 'Mapa', icon: '🗺️' },
		{ id: 'cats', label: `Gatos (${data.cats.length})`, icon: '🐈' },
		{ id: 'cer', label: `CER (${data.cerActions.length})`, icon: '✂️' },
		{ id: 'incidents', label: `Incidencias (${data.incidents.length})`, icon: '⚠️' }
	]);

	function statusBadge(status: string) {
		const map: Record<string, { bg: string; label: string }> = {
			active: { bg: 'bg-green-100 text-green-800', label: 'Activa' },
			monitoring: { bg: 'bg-yellow-100 text-yellow-800', label: 'Monitorización' },
			inactive: { bg: 'bg-gray-100 text-gray-600', label: 'Inactiva' }
		};
		return map[status] ?? { bg: 'bg-gray-100 text-gray-600', label: status };
	}

	onMount(async () => {
		if (colony.latitude && colony.longitude) {
			const L = await import('leaflet');
			if (!mapEl) return;
			const map = L.map(mapEl).setView([colony.latitude, colony.longitude], 16);
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; OpenStreetMap'
			}).addTo(map);

			L.marker([colony.latitude, colony.longitude]).addTo(map).bindPopup(colony.name);

			data.feedingPoints.forEach((fp: any) => {
				if (fp.latitude && fp.longitude) {
					L.circleMarker([fp.latitude, fp.longitude], { radius: 6, color: '#27ae60', fillOpacity: 0.8 })
						.addTo(map)
						.bindPopup(`Punto: ${fp.notes ?? ''}`);
				}
			});

			setTimeout(() => map.invalidateSize(), 200);
		}
	});
</script>

<svelte:head>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<div>
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<a href="/colonias" class="text-sm text-primary hover:underline mb-2 inline-block">← Volver a colonias</a>
			<div class="flex items-center gap-3">
				<h2 class="text-2xl font-bold text-gray-800">{colony.name}</h2>
				<span class="px-2.5 py-1 rounded-full text-xs font-bold {statusBadge(colony.status).bg}">{statusBadge(colony.status).label}</span>
			</div>
			<p class="text-sm text-gray-500 mt-1">{colony.district ?? ''} {colony.classification ? `- ${colony.classification}` : ''}</p>
		</div>
		<div class="flex gap-2">
			<button onclick={() => editing = !editing} class="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-dark">
				{editing ? 'Cancelar' : '✏️ Editar'}
			</button>
			<button onclick={() => showDeleteConfirm = true} class="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700">
				🗑️ Eliminar
			</button>
			<form bind:this={deleteFormEl} method="POST" action="?/delete" use:enhance class="hidden"></form>
		</div>
	</div>

	<!-- Tabs -->
	<div class="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
		{#each tabs as tab}
			<button
				onclick={() => activeTab = tab.id}
				class="px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
					{activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}"
			>
				{tab.icon} {tab.label}
			</button>
		{/each}
	</div>

	<!-- General Tab -->
	{#if activeTab === 'general'}
		{#if editing}
			<div class="bg-white rounded-lg shadow-sm p-6">
				{#if form?.error}
					<div class="bg-danger-light text-danger text-sm p-3 rounded-md mb-4">{form.error}</div>
				{/if}
				<form method="POST" action="?/update" use:enhance>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="name" class="block text-sm font-semibold mb-1">Nombre *</label>
							<input type="text" name="name" id="name" value={colony.name} required class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
						</div>
						<div>
							<label for="district" class="block text-sm font-semibold mb-1">Distrito</label>
							<input type="text" name="district" id="district" value={colony.district ?? ''} class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
						</div>
						<div>
							<label for="classification" class="block text-sm font-semibold mb-1">Clasificación</label>
							<input type="text" name="classification" id="classification" value={colony.classification ?? ''} class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
						</div>
						<div>
							<label for="status" class="block text-sm font-semibold mb-1">Estado</label>
							<select name="status" id="status" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
								<option value="active" selected={colony.status === 'active'}>Activa</option>
								<option value="monitoring" selected={colony.status === 'monitoring'}>Monitorización</option>
								<option value="inactive" selected={colony.status === 'inactive'}>Inactiva</option>
							</select>
						</div>
						<div class="md:col-span-2">
							<label for="description" class="block text-sm font-semibold mb-1">Descripción</label>
							<textarea name="description" id="description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">{colony.description ?? ''}</textarea>
						</div>
					</div>
					<div class="flex gap-3 mt-4">
						<button type="submit" class="px-5 py-2 bg-primary text-white rounded-md font-semibold hover:bg-primary-dark">Guardar</button>
						<button type="button" onclick={() => editing = false} class="px-5 py-2 bg-gray-200 rounded-md font-semibold hover:bg-gray-300">Cancelar</button>
					</div>
				</form>
			</div>
		{:else}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div class="bg-white rounded-lg shadow-sm p-6">
					<h3 class="font-bold text-gray-800 mb-4">Información General</h3>
					<dl class="space-y-3">
						<div class="flex justify-between"><dt class="text-sm text-gray-500">Nombre</dt><dd class="text-sm font-medium">{colony.name}</dd></div>
						<div class="flex justify-between"><dt class="text-sm text-gray-500">Distrito</dt><dd class="text-sm font-medium">{colony.district ?? '-'}</dd></div>
						<div class="flex justify-between"><dt class="text-sm text-gray-500">Clasificación</dt><dd class="text-sm font-medium">{colony.classification ?? '-'}</dd></div>
						<div class="flex justify-between"><dt class="text-sm text-gray-500">Estado</dt><dd class="text-sm font-medium">{colony.status}</dd></div>
						<div class="flex justify-between"><dt class="text-sm text-gray-500">Coordenadas</dt><dd class="text-sm font-medium">{colony.latitude?.toFixed(4)}, {colony.longitude?.toFixed(4)}</dd></div>
					</dl>
					{#if colony.description}
						<p class="text-sm text-gray-600 mt-4 pt-4 border-t">{colony.description}</p>
					{/if}
				</div>
				<div class="bg-white rounded-lg shadow-sm p-6">
					<h3 class="font-bold text-gray-800 mb-4">Estadísticas</h3>
					<div class="grid grid-cols-2 gap-4">
						<div class="text-center p-4 bg-primary-light rounded-lg">
							<div class="text-2xl font-bold text-primary">{data.cats.length}</div>
							<div class="text-xs text-gray-600">Gatos censados</div>
						</div>
						<div class="text-center p-4 bg-accent-light rounded-lg">
							<div class="text-2xl font-bold text-accent">{data.cats.filter((c: any) => c.sterilized).length}</div>
							<div class="text-xs text-gray-600">Esterilizados</div>
						</div>
						<div class="text-center p-4 bg-info-light rounded-lg">
							<div class="text-2xl font-bold text-info">{data.cerActions.length}</div>
							<div class="text-xs text-gray-600">Acciones CER</div>
						</div>
						<div class="text-center p-4 bg-warning-light rounded-lg">
							<div class="text-2xl font-bold text-warning">{data.incidents.length}</div>
							<div class="text-xs text-gray-600">Incidencias</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	{/if}

	<!-- Map Tab -->
	{#if activeTab === 'map'}
		<div class="bg-white rounded-lg shadow-sm overflow-hidden">
			<div bind:this={mapEl} class="w-full h-96"></div>
			{#if data.feedingPoints.length > 0}
				<div class="p-4 border-t">
					<h4 class="font-semibold text-sm mb-2">Puntos de alimentación ({data.feedingPoints.length})</h4>
					<ul class="space-y-1">
						{#each data.feedingPoints as fp}
							<li class="text-sm text-gray-600">📍 {fp.notes ?? `${fp.latitude?.toFixed(4)}, ${fp.longitude?.toFixed(4)}`}</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Cats Tab -->
	{#if activeTab === 'cats'}
		<div class="bg-white rounded-lg shadow-sm">
			<div class="p-4 border-b flex justify-between items-center">
				<h3 class="font-bold">Gatos de esta colonia</h3>
				<a href="/gatos?colony={colony.id}" class="text-sm text-primary hover:underline">Ver todos →</a>
			</div>
			{#if data.cats.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-4 py-3 text-left font-semibold">Nombre</th>
								<th class="px-4 py-3 text-left font-semibold">Sexo</th>
								<th class="px-4 py-3 text-left font-semibold">Esterilizado</th>
								<th class="px-4 py-3 text-left font-semibold">Microchip</th>
								<th class="px-4 py-3 text-left font-semibold">Estado</th>
								<th class="px-4 py-3"></th>
							</tr>
						</thead>
						<tbody>
							{#each data.cats as cat}
								<tr class="border-t hover:bg-gray-50">
									<td class="px-4 py-3 font-medium">{cat.name ?? 'Sin nombre'}</td>
									<td class="px-4 py-3">{cat.sex === 'male' ? '♂ Macho' : cat.sex === 'female' ? '♀ Hembra' : '-'}</td>
									<td class="px-4 py-3">{cat.sterilized ? '✅ Sí' : '❌ No'}</td>
									<td class="px-4 py-3 font-mono text-xs">{cat.microchip ?? '-'}</td>
									<td class="px-4 py-3">
										{#if cat.status === 'in_colony'}
											<span class="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">En colonia</span>
										{:else if cat.status === 'adopted'}
											<span class="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">Adoptado</span>
										{:else}
											<span class="px-2 py-0.5 rounded-full text-xs bg-gray-100">{cat.status}</span>
										{/if}
									</td>
									<td class="px-4 py-3">
										<a href="/gatos/{cat.id}" class="text-primary hover:underline text-xs font-semibold">Ver →</a>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="p-8 text-center text-gray-400">No hay gatos registrados en esta colonia</div>
			{/if}
		</div>
	{/if}

	<!-- CER Tab -->
	{#if activeTab === 'cer'}
		<div class="bg-white rounded-lg shadow-sm">
			<div class="p-4 border-b">
				<h3 class="font-bold">Acciones CER (Captura-Esterilización-Retorno)</h3>
			</div>
			{#if data.cerActions.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-4 py-3 text-left font-semibold">Captura</th>
								<th class="px-4 py-3 text-left font-semibold">Esterilización</th>
								<th class="px-4 py-3 text-left font-semibold">Retorno</th>
								<th class="px-4 py-3 text-left font-semibold">Colaborador</th>
								<th class="px-4 py-3 text-left font-semibold">Notas</th>
							</tr>
						</thead>
						<tbody>
							{#each data.cerActions as cer}
								<tr class="border-t hover:bg-gray-50">
									<td class="px-4 py-3">{cer.capturedAt ? new Date(cer.capturedAt).toLocaleDateString('es') : '-'}</td>
									<td class="px-4 py-3">{cer.sterilizedAt ? new Date(cer.sterilizedAt).toLocaleDateString('es') : '-'}</td>
									<td class="px-4 py-3">{cer.returnedAt ? new Date(cer.returnedAt).toLocaleDateString('es') : '-'}</td>
									<td class="px-4 py-3">{cer.collaboratorName ?? '-'}</td>
									<td class="px-4 py-3 text-gray-500">{cer.notes ?? '-'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="p-8 text-center text-gray-400">No hay acciones CER registradas</div>
			{/if}
		</div>
	{/if}

	<!-- Incidents Tab -->
	{#if activeTab === 'incidents'}
		<div class="bg-white rounded-lg shadow-sm">
			<div class="p-4 border-b">
				<h3 class="font-bold">Incidencias</h3>
			</div>
			{#if data.incidents.length > 0}
				<div class="divide-y">
					{#each data.incidents as inc}
						<div class="p-4 hover:bg-gray-50">
							<div class="flex items-start justify-between">
								<div>
									<span class="text-sm font-semibold capitalize">{inc.category}</span>
									<p class="text-sm text-gray-600 mt-1">{inc.description ?? ''}</p>
								</div>
								<div class="flex gap-2">
									<span class="px-2 py-0.5 rounded-full text-xs font-bold
										{inc.priority === 'high' ? 'bg-red-100 text-red-800' : inc.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
										{inc.priority}
									</span>
									<span class="px-2 py-0.5 rounded-full text-xs font-bold
										{inc.status === 'open' ? 'bg-red-100 text-red-700' : inc.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}">
										{inc.status}
									</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="p-8 text-center text-gray-400">No hay incidencias registradas</div>
			{/if}
		</div>
	{/if}
</div>

<ConfirmDialog
	open={showDeleteConfirm}
	title="Eliminar colonia"
	message="¿Estás seguro de que quieres eliminar esta colonia? Esta acción no se puede deshacer y se perderán todos los datos asociados."
	confirmLabel="Sí, eliminar"
	onconfirm={() => { showDeleteConfirm = false; deleteFormEl?.requestSubmit(); }}
	oncancel={() => showDeleteConfirm = false}
/>

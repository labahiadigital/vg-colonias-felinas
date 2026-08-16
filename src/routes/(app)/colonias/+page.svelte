<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);

	let showNewForm = $state(false);

	function statusBadge(status: string) {
		const map: Record<string, { bg: string; label: string }> = {
			active: { bg: 'bg-green-100 text-green-800', label: 'Activa' },
			monitoring: { bg: 'bg-yellow-100 text-yellow-800', label: 'Monitorización' },
			inactive: { bg: 'bg-gray-100 text-gray-600', label: 'Inactiva' },
			closed: { bg: 'bg-red-100 text-red-700', label: 'Cerrada' }
		};
		return map[status] ?? { bg: 'bg-gray-100 text-gray-600', label: status };
	}
</script>

<div>
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h2 class="text-2xl font-bold text-gray-800">{t(locale, 'colonies.title')}</h2>
			<p class="text-sm text-gray-500 mt-1">{data.colonies.length} colonias registradas</p>
		</div>
		<button onclick={() => showNewForm = !showNewForm} class="px-5 py-2.5 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors">
			➕ {t(locale, 'colonies.new')}
		</button>
	</div>

	{#if showNewForm}
		<div class="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-primary">
			<h3 class="text-lg font-bold mb-4">Nueva Colonia</h3>
			{#if form?.error}
				<div class="bg-danger-light text-danger text-sm p-3 rounded-md mb-4">{form.error}</div>
			{/if}
			<form method="POST" action="?/create" use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						showNewForm = false;
						await update();
					} else {
						await update();
					}
				};
			}}>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="name" class="block text-sm font-semibold mb-1">Nombre *</label>
						<input type="text" name="name" id="name" required class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
					</div>
					<div>
						<label for="district" class="block text-sm font-semibold mb-1">Distrito</label>
						<input type="text" name="district" id="district" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
					</div>
					<div>
						<label for="classification" class="block text-sm font-semibold mb-1">Clasificación</label>
						<select name="classification" id="classification" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
							<option value="">Seleccionar...</option>
							<option value="Parque urbano">Parque urbano</option>
							<option value="Residencial">Residencial</option>
							<option value="Industrial">Industrial</option>
							<option value="Zona verde">Zona verde</option>
							<option value="Solar">Solar</option>
						</select>
					</div>
					<div>
						<label for="latitude" class="block text-sm font-semibold mb-1">Latitud</label>
						<input type="number" step="any" name="latitude" id="latitude" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
					</div>
					<div>
						<label for="longitude" class="block text-sm font-semibold mb-1">Longitud</label>
						<input type="number" step="any" name="longitude" id="longitude" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
					</div>
					<div class="md:col-span-2">
						<label for="description" class="block text-sm font-semibold mb-1">Descripción</label>
						<textarea name="description" id="description" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"></textarea>
					</div>
				</div>
				<div class="flex gap-3 mt-4">
					<button type="submit" class="px-5 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark">Guardar</button>
					<button type="button" onclick={() => showNewForm = false} class="px-5 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300">Cancelar</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Filters -->
	<div class="bg-white rounded-lg shadow-sm p-4 mb-4">
		<form method="GET" class="flex flex-wrap gap-3 items-end">
			<div class="flex-1 min-w-[200px]">
				<label for="q" class="block text-xs font-semibold mb-1">Buscar</label>
				<input type="text" name="q" id="q" value={data.filters.search} placeholder="Nombre de colonia..." class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
			</div>
			<div>
				<label for="status" class="block text-xs font-semibold mb-1">Estado</label>
				<select name="status" id="status" class="px-3 py-2 border border-gray-300 rounded-md text-sm">
					<option value="">Todos</option>
					<option value="active" selected={data.filters.status === 'active'}>Activa</option>
					<option value="monitoring" selected={data.filters.status === 'monitoring'}>Monitorización</option>
					<option value="inactive" selected={data.filters.status === 'inactive'}>Inactiva</option>
				</select>
			</div>
			<div>
				<label for="district" class="block text-xs font-semibold mb-1">Distrito</label>
				<select name="district" id="district" class="px-3 py-2 border border-gray-300 rounded-md text-sm">
					<option value="">Todos</option>
					{#each data.districts as d}
						<option value={d} selected={data.filters.district === d}>{d}</option>
					{/each}
				</select>
			</div>
			<button type="submit" class="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-dark">Filtrar</button>
		</form>
	</div>

	<!-- Colony Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
		{#each data.colonies as colony}
			{@const badge = statusBadge(colony.status)}
			<a href="/colonias/{colony.id}" class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
				<div class="h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-6xl">
					🏘️
				</div>
				<div class="p-4">
					<div class="flex items-start justify-between mb-2">
						<h3 class="font-bold text-gray-800 group-hover:text-primary transition-colors">{colony.name}</h3>
						<span class="px-2 py-0.5 rounded-full text-xs font-bold {badge.bg}">{badge.label}</span>
					</div>
					<p class="text-xs text-gray-500 mb-3">{colony.district ?? ''} {colony.classification ? `- ${colony.classification}` : ''}</p>
					<div class="flex justify-between text-sm text-gray-600 border-t border-gray-100 pt-3">
						<span>🐈 {colony.catCount} gatos</span>
						<span>✂️ {colony.sterilizedCount} esteril.</span>
					</div>
				</div>
			</a>
		{:else}
			<div class="col-span-full text-center py-12 text-gray-400">
				No se encontraron colonias con los filtros seleccionados.
			</div>
		{/each}
	</div>
</div>

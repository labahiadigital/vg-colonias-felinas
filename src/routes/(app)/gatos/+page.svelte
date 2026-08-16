<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const locale = data.locale;

	let showNewForm = $state(false);
</script>

<div>
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h2 class="text-2xl font-bold text-gray-800">{t(locale, 'cats.title')}</h2>
			<p class="text-sm text-gray-500 mt-1">{data.cats.length} gatos registrados</p>
		</div>
		<button onclick={() => showNewForm = !showNewForm} class="px-5 py-2.5 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors">
			🐱 Nuevo gato
		</button>
	</div>

	{#if showNewForm}
		<div class="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-primary">
			<h3 class="text-lg font-bold mb-4">Registrar Nuevo Gato</h3>
			{#if form?.error}
				<div class="bg-danger-light text-danger text-sm p-3 rounded-md mb-4">{form.error}</div>
			{/if}
			<form method="POST" action="?/create" use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') { showNewForm = false; await update(); } else { await update(); }
				};
			}}>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<div>
						<label for="name" class="block text-sm font-semibold mb-1">Nombre</label>
						<input type="text" name="name" id="name" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
					</div>
					<div>
						<label for="colonyId" class="block text-sm font-semibold mb-1">Colonia</label>
						<select name="colonyId" id="colonyId" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
							<option value="">Sin asignar</option>
							{#each data.colonies as c}
								<option value={c.id}>{c.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="sex" class="block text-sm font-semibold mb-1">Sexo</label>
						<select name="sex" id="sex" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
							<option value="">Desconocido</option>
							<option value="male">Macho</option>
							<option value="female">Hembra</option>
						</select>
					</div>
					<div>
						<label for="microchip" class="block text-sm font-semibold mb-1">Microchip</label>
						<input type="text" name="microchip" id="microchip" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
					</div>
					<div>
						<label for="estimatedAge" class="block text-sm font-semibold mb-1">Edad estimada</label>
						<input type="text" name="estimatedAge" id="estimatedAge" placeholder="Ej: 2 años" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
					</div>
				</div>
				<div class="flex gap-3 mt-4">
					<button type="submit" class="px-5 py-2 bg-primary text-white rounded-md font-semibold hover:bg-primary-dark">Guardar</button>
					<button type="button" onclick={() => showNewForm = false} class="px-5 py-2 bg-gray-200 rounded-md font-semibold hover:bg-gray-300">Cancelar</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Filters -->
	<div class="bg-white rounded-lg shadow-sm p-4 mb-4">
		<form method="GET" class="flex flex-wrap gap-3 items-end">
			<div class="flex-1 min-w-[180px]">
				<label for="q" class="block text-xs font-semibold mb-1">Buscar</label>
				<input type="text" name="q" id="q" value={data.filters.search} placeholder="Nombre del gato..." class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
			</div>
			<div>
				<label for="status" class="block text-xs font-semibold mb-1">Estado</label>
				<select name="status" id="status" class="px-3 py-2 border border-gray-300 rounded-md text-sm">
					<option value="">Todos</option>
					<option value="in_colony" selected={data.filters.status === 'in_colony'}>En colonia</option>
					<option value="adopted" selected={data.filters.status === 'adopted'}>Adoptado</option>
					<option value="missing" selected={data.filters.status === 'missing'}>Desaparecido</option>
					<option value="deceased" selected={data.filters.status === 'deceased'}>Fallecido</option>
				</select>
			</div>
			<div>
				<label for="sterilized" class="block text-xs font-semibold mb-1">Esterilizado</label>
				<select name="sterilized" id="sterilized" class="px-3 py-2 border border-gray-300 rounded-md text-sm">
					<option value="">Todos</option>
					<option value="yes" selected={data.filters.sterilized === 'yes'}>Sí</option>
					<option value="no" selected={data.filters.sterilized === 'no'}>No</option>
				</select>
			</div>
			<div>
				<label for="colony" class="block text-xs font-semibold mb-1">Colonia</label>
				<select name="colony" id="colony" class="px-3 py-2 border border-gray-300 rounded-md text-sm">
					<option value="">Todas</option>
					{#each data.colonies as c}
						<option value={c.id} selected={data.filters.colony === c.id}>{c.name}</option>
					{/each}
				</select>
			</div>
			<button type="submit" class="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-dark">Filtrar</button>
		</form>
	</div>

	<!-- Cat Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
		{#each data.cats as cat}
			<a href="/gatos/{cat.id}" class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
				<div class="h-28 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-5xl">
					{cat.sex === 'female' ? '🐱' : '😸'}
				</div>
				<div class="p-4">
					<h3 class="font-bold text-gray-800 group-hover:text-primary">{cat.name ?? 'Sin nombre'}</h3>
					<p class="text-xs text-gray-500 mt-1">{cat.colonyName ?? 'Sin colonia'}</p>
					<div class="flex flex-wrap gap-1.5 mt-3">
						<span class="px-2 py-0.5 rounded-full text-xs {cat.sex === 'male' ? 'bg-blue-100 text-blue-800' : cat.sex === 'female' ? 'bg-pink-100 text-pink-800' : 'bg-gray-100'}">{cat.sex === 'male' ? '♂' : cat.sex === 'female' ? '♀' : '?'}</span>
						<span class="px-2 py-0.5 rounded-full text-xs {cat.sterilized ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">{cat.sterilized ? '✂️ Sí' : '❌ No'}</span>
						{#if cat.estimatedAge}
							<span class="px-2 py-0.5 rounded-full text-xs bg-gray-100">{cat.estimatedAge}</span>
						{/if}
					</div>
				</div>
			</a>
		{:else}
			<div class="col-span-full text-center py-12 text-gray-400">No se encontraron gatos.</div>
		{/each}
	</div>
</div>

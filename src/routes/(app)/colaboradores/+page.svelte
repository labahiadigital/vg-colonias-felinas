<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);

	let showNewForm = $state(false);

	function statusBadge(s: string) {
		const map: Record<string, { bg: string; label: string }> = {
			active: { bg: 'bg-green-100 text-green-800', label: 'Activo' },
			pending: { bg: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
			inactive: { bg: 'bg-gray-100 text-gray-600', label: 'Inactivo' },
			suspended: { bg: 'bg-red-100 text-red-700', label: 'Suspendido' }
		};
		return map[s] ?? { bg: 'bg-gray-100', label: s };
	}
</script>

<div>
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h2 class="text-2xl font-bold text-gray-800">{t(locale, 'collaborators.title')}</h2>
			<p class="text-sm text-gray-500 mt-1">{data.collaborators.length} colaboradores registrados</p>
		</div>
		<button onclick={() => showNewForm = !showNewForm} class="px-5 py-2.5 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors">
			👤 Nuevo Colaborador
		</button>
	</div>

	{#if showNewForm}
		<div class="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-primary">
			<h3 class="text-lg font-bold mb-4">Registrar Nuevo Colaborador</h3>
			{#if form?.error}
				<div class="bg-danger-light text-danger text-sm p-3 rounded-md mb-4">{form.error}</div>
			{/if}
			<form method="POST" action="?/create" use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') { showNewForm = false; await update(); } else { await update(); }
				};
			}}>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="name" class="block text-sm font-semibold mb-1">Nombre completo *</label>
						<input type="text" name="name" id="name" required class="w-full px-3 py-2 border rounded-md text-sm" />
					</div>
					<div>
						<label for="documentId" class="block text-sm font-semibold mb-1">DNI/NIE</label>
						<input type="text" name="documentId" id="documentId" class="w-full px-3 py-2 border rounded-md text-sm" />
					</div>
					<div class="md:col-span-2">
						<span class="block text-sm font-semibold mb-1">Colonias asignadas</span>
						<div class="flex flex-wrap gap-2">
							{#each data.colonies as c}
								<label class="flex items-center gap-1.5 text-sm bg-gray-50 px-3 py-1.5 rounded border cursor-pointer hover:bg-gray-100">
									<input type="checkbox" name="assignedColonies" value={c.id} />
									{c.name}
								</label>
							{/each}
						</div>
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
				<input type="text" name="q" id="q" value={data.filters.search} placeholder="Nombre..." class="w-full px-3 py-2 border rounded-md text-sm" />
			</div>
			<div>
				<label for="status" class="block text-xs font-semibold mb-1">Estado</label>
				<select name="status" id="status" class="px-3 py-2 border rounded-md text-sm">
					<option value="">Todos</option>
					<option value="active" selected={data.filters.status === 'active'}>Activo</option>
					<option value="pending" selected={data.filters.status === 'pending'}>Pendiente</option>
					<option value="inactive" selected={data.filters.status === 'inactive'}>Inactivo</option>
				</select>
			</div>
			<button type="submit" class="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-dark">Filtrar</button>
		</form>
	</div>

	<!-- Collaborator cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
		{#each data.collaborators as col}
			{@const badge = statusBadge(col.status)}
			<div class="bg-white rounded-lg shadow-sm p-5">
				<div class="flex items-start justify-between mb-3">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-lg">
							{col.name.charAt(0)}
						</div>
						<div>
							<h3 class="font-bold text-gray-800">{col.name}</h3>
							<p class="text-xs text-gray-500">{col.documentId ?? ''}</p>
						</div>
					</div>
					<span class="px-2 py-0.5 rounded-full text-xs font-bold {badge.bg}">{badge.label}</span>
				</div>

				{#if col.colonyNames.length > 0}
					<div class="mb-3">
						<p class="text-xs font-semibold text-gray-500 mb-1">Colonias asignadas</p>
						<div class="flex flex-wrap gap-1">
							{#each col.colonyNames as cn}
								<span class="px-2 py-0.5 rounded text-xs bg-primary-light text-primary">{cn}</span>
							{/each}
						</div>
					</div>
				{/if}

				<div class="flex justify-between text-xs text-gray-500 mb-3">
					<span>{col.privacyNoticeSigned ? '✅ LOPD firmada' : '❌ LOPD pendiente'}</span>
					{#if col.validUntil}
						<span>Válido: {col.validUntil}</span>
					{/if}
				</div>

				{#if col.status === 'pending'}
					<div class="flex gap-2">
						<form method="POST" action="?/updateStatus" use:enhance class="flex-1">
							<input type="hidden" name="id" value={col.id} />
							<input type="hidden" name="status" value="active" />
							<button type="submit" class="w-full px-3 py-1.5 bg-green-100 text-green-800 rounded text-xs font-semibold hover:bg-green-200">Aprobar</button>
						</form>
						<form method="POST" action="?/updateStatus" use:enhance class="flex-1">
							<input type="hidden" name="id" value={col.id} />
							<input type="hidden" name="status" value="inactive" />
							<button type="submit" class="w-full px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-semibold hover:bg-red-200">Rechazar</button>
						</form>
					</div>
				{/if}
			</div>
		{:else}
			<div class="col-span-full text-center py-12 text-gray-400">No se encontraron colaboradores.</div>
		{/each}
	</div>
</div>

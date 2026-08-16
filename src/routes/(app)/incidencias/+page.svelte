<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);

	let showNewForm = $state(false);
	let expandedIncident = $state<string | null>(null);
	let useGeo = $state(false);
	let geoLat = $state('');
	let geoLng = $state('');

	function getLocation() {
		if (!navigator.geolocation) return;
		useGeo = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => { geoLat = String(pos.coords.latitude); geoLng = String(pos.coords.longitude); },
			() => { useGeo = false; },
			{ enableHighAccuracy: true }
		);
	}

	function priorityBadge(p: string) {
		const map: Record<string, { bg: string; label: string }> = {
			critical: { bg: 'bg-red-200 text-red-900', label: '🔴 Crítica' },
			high: { bg: 'bg-red-100 text-red-800', label: '🔴 Alta' },
			medium: { bg: 'bg-yellow-100 text-yellow-800', label: '🟡 Media' },
			low: { bg: 'bg-green-100 text-green-800', label: '🟢 Baja' }
		};
		return map[p] ?? { bg: 'bg-gray-100', label: p };
	}

	function statusBadge(s: string) {
		const map: Record<string, { bg: string; label: string }> = {
			open: { bg: 'bg-red-100 text-red-700', label: 'Abierta' },
			in_progress: { bg: 'bg-yellow-100 text-yellow-700', label: 'En progreso' },
			resolved: { bg: 'bg-green-100 text-green-700', label: 'Resuelta' },
			closed: { bg: 'bg-gray-100 text-gray-600', label: 'Cerrada' }
		};
		return map[s] ?? { bg: 'bg-gray-100', label: s };
	}

	function categoryLabel(c: string) {
		const map: Record<string, string> = {
			health: '🏥 Salud Animal', environmental: '🌍 Medioambiental', complaint: '📢 Queja vecinal',
			infrastructure: '🔧 Infraestructura', abandonment: '🐾 Abandono', abuse: '⛔ Maltrato', other: '📋 Otro'
		};
		return map[c] ?? c;
	}

	function commentsForIncident(id: string) {
		return (data.incidentComments || []).filter((c: any) => c.entityId === id);
	}
</script>

<div>
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h2 class="text-2xl font-bold text-gray-800">{t(locale, 'incidents.title')}</h2>
			<p class="text-sm text-gray-500 mt-1">{data.incidents.length} incidencias registradas</p>
		</div>
		<button onclick={() => showNewForm = !showNewForm} class="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors">
			⚠️ Nueva Incidencia
		</button>
	</div>

	{#if showNewForm}
		<div class="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-red-500">
			<h3 class="text-lg font-bold mb-4">Reportar Nueva Incidencia</h3>
			{#if form?.error}<div class="bg-red-50 text-red-700 text-sm p-3 rounded-md mb-4">{form.error}</div>{/if}
			<form method="POST" action="?/create" use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') { showNewForm = false; await update(); } else { await update(); }
				};
			}}>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="category" class="block text-sm font-semibold mb-1">Categoría *</label>
						<select name="category" id="category" required class="w-full px-3 py-2 border rounded-md text-sm">
							<option value="health">Salud Animal</option>
							<option value="environmental">Medioambiental</option>
							<option value="complaint">Queja vecinal</option>
							<option value="infrastructure">Infraestructura</option>
							<option value="abandonment">Abandono</option>
							<option value="abuse">Maltrato</option>
							<option value="other">Otro</option>
						</select>
					</div>
					<div>
						<label for="priority" class="block text-sm font-semibold mb-1">Prioridad</label>
						<select name="priority" id="priority" class="w-full px-3 py-2 border rounded-md text-sm">
							<option value="low">Baja</option>
							<option value="medium" selected>Media</option>
							<option value="high">Alta</option>
							<option value="critical">Crítica</option>
						</select>
					</div>
					<div>
						<label for="colonyId" class="block text-sm font-semibold mb-1">Colonia asociada</label>
						<select name="colonyId" id="colonyId" class="w-full px-3 py-2 border rounded-md text-sm">
							<option value="">Ninguna</option>
							{#each data.colonies as c}
								<option value={c.id}>{c.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<span class="block text-sm font-semibold mb-1">Ubicación</span>
						<button type="button" onclick={getLocation} class="px-3 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-semibold hover:bg-blue-100 w-full">
							📍 {useGeo ? `${geoLat.slice(0, 8)}, ${geoLng.slice(0, 8)}` : 'Obtener ubicación automática'}
						</button>
						<input type="hidden" name="latitude" value={geoLat} />
						<input type="hidden" name="longitude" value={geoLng} />
					</div>
					<div class="md:col-span-2">
						<label for="description" class="block text-sm font-semibold mb-1">Descripción *</label>
						<textarea name="description" id="description" rows="3" required class="w-full px-3 py-2 border rounded-md text-sm"></textarea>
					</div>
				</div>
				<div class="flex gap-3 mt-4">
					<button type="submit" class="px-5 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700">Enviar</button>
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
				<input type="text" name="q" id="q" value={data.filters.search} placeholder="Descripción..." class="w-full px-3 py-2 border rounded-md text-sm" />
			</div>
			<div>
				<label for="filterStatus" class="block text-xs font-semibold mb-1">Estado</label>
				<select name="status" id="filterStatus" class="px-3 py-2 border rounded-md text-sm">
					<option value="">Todos</option>
					<option value="open" selected={data.filters.status === 'open'}>Abierta</option>
					<option value="in_progress" selected={data.filters.status === 'in_progress'}>En progreso</option>
					<option value="resolved" selected={data.filters.status === 'resolved'}>Resuelta</option>
					<option value="closed" selected={data.filters.status === 'closed'}>Cerrada</option>
				</select>
			</div>
			<div>
				<label for="filterPriority" class="block text-xs font-semibold mb-1">Prioridad</label>
				<select name="priority" id="filterPriority" class="px-3 py-2 border rounded-md text-sm">
					<option value="">Todas</option>
					<option value="critical" selected={data.filters.priority === 'critical'}>Crítica</option>
					<option value="high" selected={data.filters.priority === 'high'}>Alta</option>
					<option value="medium" selected={data.filters.priority === 'medium'}>Media</option>
					<option value="low" selected={data.filters.priority === 'low'}>Baja</option>
				</select>
			</div>
			<div>
				<label for="filterCategory" class="block text-xs font-semibold mb-1">Categoría</label>
				<select name="category" id="filterCategory" class="px-3 py-2 border rounded-md text-sm">
					<option value="">Todas</option>
					<option value="health" selected={data.filters.category === 'health'}>Salud</option>
					<option value="environmental" selected={data.filters.category === 'environmental'}>Ambiental</option>
					<option value="complaint" selected={data.filters.category === 'complaint'}>Queja</option>
					<option value="abuse" selected={data.filters.category === 'abuse'}>Maltrato</option>
				</select>
			</div>
			<button type="submit" class="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-dark">Filtrar</button>
		</form>
	</div>

	<!-- Incident list -->
	<div class="space-y-3">
		{#each data.incidents as inc}
			{@const pBadge = priorityBadge(inc.priority)}
			{@const sBadge = statusBadge(inc.status)}
			{@const comments = commentsForIncident(inc.id)}
			<div class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
				<div class="p-4">
					<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
						<div class="flex-1">
							<div class="flex items-center gap-2 flex-wrap">
								<span class="text-sm font-bold">{categoryLabel(inc.category)}</span>
								<span class="px-2 py-0.5 rounded-full text-xs font-bold {pBadge.bg}">{pBadge.label}</span>
								<span class="px-2 py-0.5 rounded-full text-xs font-bold {sBadge.bg}">{sBadge.label}</span>
							</div>
							<p class="text-sm text-gray-600 mt-1">{inc.description ?? ''}</p>
							<div class="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
								{#if inc.colonyName}<span>📍 {inc.colonyName}</span>{/if}
								{#if inc.reporterName}<span>👤 {inc.reporterName}</span>{/if}
								{#if inc.createdAt}<span>📅 {new Date(inc.createdAt).toLocaleDateString('es')}</span>{/if}
								{#if comments.length > 0}<span>💬 {comments.length} comentarios</span>{/if}
							</div>
						</div>
						<div class="flex gap-2 flex-shrink-0 items-start">
							{#if inc.status !== 'resolved' && inc.status !== 'closed'}
								<form method="POST" action="?/updateStatus" use:enhance>
									<input type="hidden" name="id" value={inc.id} />
									{#if inc.status === 'open'}
										<input type="hidden" name="status" value="in_progress" />
										<button type="submit" class="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold hover:bg-yellow-200">En progreso</button>
									{:else}
										<input type="hidden" name="status" value="resolved" />
										<button type="submit" class="px-3 py-1.5 bg-green-100 text-green-800 rounded text-xs font-semibold hover:bg-green-200">Resolver</button>
									{/if}
								</form>
							{/if}
							<button onclick={() => expandedIncident = expandedIncident === inc.id ? null : inc.id} class="px-3 py-1.5 bg-gray-100 text-gray-600 rounded text-xs font-semibold hover:bg-gray-200">
								{expandedIncident === inc.id ? '▲' : '▼'}
							</button>
						</div>
					</div>
				</div>

				{#if expandedIncident === inc.id}
					<div class="border-t bg-gray-50 p-4 space-y-4">
						<!-- Assign -->
						<div>
							<span class="text-xs font-bold text-gray-600">Asignar responsable:</span>
							<form method="POST" action="?/assign" use:enhance class="flex gap-2 mt-1">
								<input type="hidden" name="id" value={inc.id} />
								<select name="assignedTo" class="px-2 py-1 border rounded text-xs flex-1">
									<option value="">Sin asignar</option>
									{#each data.users as u}
										<option value={u.id} selected={u.id === inc.assignedTo}>{u.name}</option>
									{/each}
								</select>
								<button type="submit" class="px-3 py-1 bg-primary text-white rounded text-xs hover:bg-primary-dark">Asignar</button>
							</form>
						</div>

						<!-- Comments -->
						{#if comments.length > 0}
							<div>
								<span class="text-xs font-bold text-gray-600 mb-2 block">Historial / Comentarios:</span>
								<div class="space-y-2 max-h-40 overflow-y-auto">
									{#each comments as c}
										<div class="text-xs bg-white p-2 rounded border">
											<div class="flex justify-between text-gray-400">
												<span class="font-semibold text-gray-600">{c.userName ?? 'Sistema'}</span>
												<span>{c.createdAt ? new Date(c.createdAt).toLocaleString('es') : ''}</span>
											</div>
											<p class="mt-0.5 text-gray-700">
												{#if c.action === 'comment'}
													{(c.details as any)?.text ?? ''}
												{:else}
													<span class="italic">{c.action}: {JSON.stringify(c.details).slice(0, 80)}</span>
												{/if}
											</p>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Add comment -->
						<form method="POST" action="?/addComment" use:enhance class="flex gap-2">
							<input type="hidden" name="incidentId" value={inc.id} />
							<input type="text" name="comment" placeholder="Añadir comentario o actuación..." required class="flex-1 px-3 py-2 border rounded-md text-sm" />
							<button type="submit" class="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-dark">Enviar</button>
						</form>
					</div>
				{/if}
			</div>
		{:else}
			<div class="text-center py-12 text-gray-400">No se encontraron incidencias.</div>
		{/each}
	</div>
</div>

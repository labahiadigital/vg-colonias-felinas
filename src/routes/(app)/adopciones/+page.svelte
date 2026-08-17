<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);

	let showNewForm = $state(false);

	function statusBadge(s: string): { label: string; bg: string } {
		const map: Record<string, { label: string; bg: string }> = {
			pending: { label: 'Pendiente', bg: 'bg-yellow-100 text-yellow-800' },
			approved: { label: 'Aprobada', bg: 'bg-blue-100 text-blue-800' },
			completed: { label: 'Completada', bg: 'bg-green-100 text-green-800' },
			rejected: { label: 'Rechazada', bg: 'bg-red-100 text-red-800' },
			cancelled: { label: 'Cancelada', bg: 'bg-gray-100 text-gray-600' }
		};
		return map[s] || { label: s, bg: 'bg-gray-100 text-gray-600' };
	}

	function getAdopterField(info: unknown, field: string): string {
		if (info && typeof info === 'object' && field in (info as Record<string, unknown>)) {
			return String((info as Record<string, unknown>)[field] || '-');
		}
		return '-';
	}
</script>

<div>
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h2 class="text-2xl font-bold text-gray-800">{t(locale, 'adoptions.title')}</h2>
			<p class="text-sm text-gray-500">{data.adoptions.length} adopciones registradas</p>
		</div>
		<button onclick={() => showNewForm = !showNewForm}
			class="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-dark">
			{showNewForm ? 'Cancelar' : `+ ${t(locale, 'adoptions.new')}`}
		</button>
	</div>

	{#if showNewForm}
		<div class="bg-white rounded-xl shadow-sm border p-6 mb-6">
			<h3 class="font-bold text-lg mb-4">{t(locale, 'adoptions.new')}</h3>
			<form method="POST" action="?/create" use:enhance class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="md:col-span-2">
					<label for="catId" class="block text-sm font-semibold mb-1">{t(locale, 'adoptions.cat')}</label>
					<select name="catId" id="catId" required class="w-full px-3 py-2 border rounded-md text-sm">
						<option value="">-- Seleccionar gato --</option>
						{#each data.availableCats as cat}
							<option value={cat.id}>{cat.name || 'Sin nombre'} ({cat.colonyName || 'Sin colonia'})</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="adopterName" class="block text-sm font-semibold mb-1">{t(locale, 'adoptions.adopter_name')}</label>
					<input type="text" name="adopterName" id="adopterName" required class="w-full px-3 py-2 border rounded-md text-sm" />
				</div>
				<div>
					<label for="adopterDocument" class="block text-sm font-semibold mb-1">{t(locale, 'adoptions.adopter_document')}</label>
					<input type="text" name="adopterDocument" id="adopterDocument" class="w-full px-3 py-2 border rounded-md text-sm" />
				</div>
				<div>
					<label for="adopterPhone" class="block text-sm font-semibold mb-1">{t(locale, 'adoptions.adopter_phone')}</label>
					<input type="tel" name="adopterPhone" id="adopterPhone" class="w-full px-3 py-2 border rounded-md text-sm" />
				</div>
				<div>
					<label for="adopterEmail" class="block text-sm font-semibold mb-1">{t(locale, 'adoptions.adopter_email')}</label>
					<input type="email" name="adopterEmail" id="adopterEmail" class="w-full px-3 py-2 border rounded-md text-sm" />
				</div>
				<div class="md:col-span-2">
					<label for="adopterAddress" class="block text-sm font-semibold mb-1">{t(locale, 'adoptions.adopter_address')}</label>
					<input type="text" name="adopterAddress" id="adopterAddress" class="w-full px-3 py-2 border rounded-md text-sm" />
				</div>
				<div class="md:col-span-2">
					<label class="flex items-center gap-2 text-sm">
						<input type="checkbox" name="consentSigned" class="rounded" />
						<span>{t(locale, 'adoptions.consent')}</span>
					</label>
				</div>
				<div class="md:col-span-2">
					<button type="submit" class="px-5 py-2 bg-primary text-white rounded-md font-semibold hover:bg-primary-dark">{t(locale, 'common.save')}</button>
				</div>
			</form>
		</div>
	{/if}

	{#if form?.error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">Adopción registrada correctamente.</div>
	{/if}

	<!-- Adoptions list -->
	<div class="bg-white rounded-xl shadow-sm border overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-gray-50 text-gray-600 text-left">
					<tr>
						<th class="px-4 py-3">Gato</th>
						<th class="px-4 py-3">Colonia</th>
						<th class="px-4 py-3">Adoptante</th>
						<th class="px-4 py-3">DNI/NIE</th>
						<th class="px-4 py-3">Estado</th>
						<th class="px-4 py-3">Fecha</th>
						<th class="px-4 py-3">Acciones</th>
					</tr>
				</thead>
				<tbody class="divide-y">
					{#each data.adoptions as adoption}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-3 font-medium">
								<a href="/gatos/{adoption.catId}" class="text-primary hover:underline">{adoption.catName || 'Sin nombre'}</a>
							</td>
							<td class="px-4 py-3 text-gray-600">{adoption.colonyName || '-'}</td>
							<td class="px-4 py-3">{getAdopterField(adoption.adopterInfo, 'name')}</td>
							<td class="px-4 py-3 text-gray-600">{getAdopterField(adoption.adopterInfo, 'document')}</td>
							<td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full text-xs font-bold {statusBadge(adoption.status).bg}">{statusBadge(adoption.status).label}</span></td>
							<td class="px-4 py-3 text-gray-600">{adoption.adoptedAt ? new Date(adoption.adoptedAt).toLocaleDateString('es-ES') : adoption.createdAt ? new Date(adoption.createdAt).toLocaleDateString('es-ES') : '-'}</td>
							<td class="px-4 py-3">
								{#if adoption.status === 'pending'}
									<form method="POST" action="?/updateStatus" use:enhance class="flex gap-1">
										<input type="hidden" name="id" value={adoption.id} />
										<button type="submit" name="status" value="approved" class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200">Aprobar</button>
										<button type="submit" name="status" value="rejected" class="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">Rechazar</button>
									</form>
								{:else if adoption.status === 'approved'}
									<form method="POST" action="?/updateStatus" use:enhance>
										<input type="hidden" name="id" value={adoption.id} />
										<button type="submit" name="status" value="completed" class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">Completar</button>
									</form>
								{/if}
							</td>
						</tr>
					{/each}
					{#if data.adoptions.length === 0}
						<tr><td colspan="7" class="px-4 py-8 text-center text-gray-400">{t(locale, 'common.no_results')}</td></tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>

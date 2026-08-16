<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);

	let showNewForm = $state(false);

	const healthTypes = ['sterilization', 'vaccination', 'deworming', 'microchip', 'checkup', 'surgery', 'other'];

	function typeLabel(type: string): string {
		const map: Record<string, string> = {
			sterilization: 'Esterilización', vaccination: 'Vacunación', deworming: 'Desparasitación',
			microchip: 'Microchip', checkup: 'Revisión', surgery: 'Cirugía', other: 'Otro'
		};
		return map[type] || type;
	}

	function typeBadge(type: string): string {
		const map: Record<string, string> = {
			sterilization: 'bg-purple-100 text-purple-800', vaccination: 'bg-blue-100 text-blue-800',
			deworming: 'bg-green-100 text-green-800', microchip: 'bg-orange-100 text-orange-800',
			checkup: 'bg-gray-100 text-gray-800', surgery: 'bg-red-100 text-red-800', other: 'bg-gray-100 text-gray-600'
		};
		return map[type] || 'bg-gray-100 text-gray-800';
	}
</script>

<div>
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h2 class="text-2xl font-bold text-gray-800">{t(locale, 'health.title')}</h2>
			<p class="text-sm text-gray-500">{data.records.length} registros sanitarios</p>
		</div>
		<button onclick={() => showNewForm = !showNewForm}
			class="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-dark">
			{showNewForm ? 'Cancelar' : `+ ${t(locale, 'health.new_record')}`}
		</button>
	</div>

	{#if showNewForm}
		<div class="bg-white rounded-xl shadow-sm border p-6 mb-6">
			<h3 class="font-bold text-lg mb-4">{t(locale, 'health.new_record')}</h3>
			<form method="POST" action="?/create" use:enhance class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="catId" class="block text-sm font-semibold mb-1">{t(locale, 'health.cat')}</label>
					<select name="catId" id="catId" required class="w-full px-3 py-2 border rounded-md text-sm">
						<option value="">-- Seleccionar gato --</option>
						{#each data.cats as cat}
							<option value={cat.id}>{cat.name || 'Sin nombre'} ({cat.colonyName || 'Sin colonia'})</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="type" class="block text-sm font-semibold mb-1">{t(locale, 'health.type')}</label>
					<select name="type" id="type" required class="w-full px-3 py-2 border rounded-md text-sm">
						{#each healthTypes as ht}
							<option value={ht}>{typeLabel(ht)}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="performedAt" class="block text-sm font-semibold mb-1">{t(locale, 'health.performed_at')}</label>
					<input type="date" name="performedAt" id="performedAt" required class="w-full px-3 py-2 border rounded-md text-sm" />
				</div>
				<div>
					<label for="vetName" class="block text-sm font-semibold mb-1">{t(locale, 'health.vet_name')}</label>
					<input type="text" name="vetName" id="vetName" class="w-full px-3 py-2 border rounded-md text-sm" />
				</div>
				<div>
					<label for="vetClinic" class="block text-sm font-semibold mb-1">{t(locale, 'health.vet_clinic')}</label>
					<input type="text" name="vetClinic" id="vetClinic" class="w-full px-3 py-2 border rounded-md text-sm" />
				</div>
				<div class="md:col-span-2">
					<label for="notes" class="block text-sm font-semibold mb-1">{t(locale, 'health.notes')}</label>
					<textarea name="notes" id="notes" rows="3" class="w-full px-3 py-2 border rounded-md text-sm"></textarea>
				</div>
				<div class="md:col-span-2">
					<button type="submit" class="px-5 py-2 bg-primary text-white rounded-md font-semibold hover:bg-primary-dark">
						{t(locale, 'common.save')}
					</button>
				</div>
			</form>
		</div>
	{/if}

	{#if form?.error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">Registro sanitario creado correctamente.</div>
	{/if}

	<!-- Filters -->
	<div class="flex flex-wrap gap-3 mb-4">
		<form method="GET" class="flex gap-2 items-end flex-wrap">
			<input type="text" name="q" value={data.search} placeholder={t(locale, 'health.search')}
				class="px-3 py-2 border rounded-md text-sm w-64" />
			<select name="type" class="px-3 py-2 border rounded-md text-sm">
				<option value="">Todos los tipos</option>
				{#each healthTypes as ht}
					<option value={ht} selected={data.typeFilter === ht}>{typeLabel(ht)}</option>
				{/each}
			</select>
			<button type="submit" class="px-4 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200">{t(locale, 'common.filter')}</button>
		</form>
	</div>

	<!-- Records table -->
	<div class="bg-white rounded-xl shadow-sm border overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-gray-50 text-gray-600 text-left">
					<tr>
						<th class="px-4 py-3">Gato</th>
						<th class="px-4 py-3">Colonia</th>
						<th class="px-4 py-3">Tipo</th>
						<th class="px-4 py-3">Fecha</th>
						<th class="px-4 py-3">Veterinario</th>
						<th class="px-4 py-3">Clínica</th>
						<th class="px-4 py-3">Notas</th>
					</tr>
				</thead>
				<tbody class="divide-y">
					{#each data.records as r}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-3 font-medium">
								<a href="/gatos/{r.catId}" class="text-primary hover:underline">{r.catName || 'Sin nombre'}</a>
							</td>
							<td class="px-4 py-3 text-gray-600">{r.colonyName || '-'}</td>
							<td class="px-4 py-3">
								<span class="px-2 py-0.5 rounded-full text-xs font-bold {typeBadge(r.type)}">{typeLabel(r.type)}</span>
							</td>
							<td class="px-4 py-3 text-gray-600">{r.performedAt ? new Date(r.performedAt).toLocaleDateString('es-ES') : '-'}</td>
							<td class="px-4 py-3 text-gray-600">{r.vetName || '-'}</td>
							<td class="px-4 py-3 text-gray-600">{r.vetClinic || '-'}</td>
							<td class="px-4 py-3 text-gray-500 max-w-xs truncate">{r.notes || '-'}</td>
						</tr>
					{/each}
					{#if data.records.length === 0}
						<tr><td colspan="7" class="px-4 py-8 text-center text-gray-400">{t(locale, 'common.no_results')}</td></tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>

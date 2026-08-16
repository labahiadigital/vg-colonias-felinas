<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);

	let showNewForm = $state(false);
	let showTemplateForm = $state(false);
	let activeTab = $state<'list' | 'templates'>('list');
</script>

<div>
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h2 class="text-2xl font-bold text-gray-800">{t(locale, 'inspections.title')}</h2>
			<p class="text-sm text-gray-500">{data.inspections.length} inspecciones registradas</p>
		</div>
		<div class="flex gap-2">
			<button onclick={() => { showNewForm = !showNewForm; showTemplateForm = false; }}
				class="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-dark">
				{showNewForm ? 'Cancelar' : `+ ${t(locale, 'inspections.new')}`}
			</button>
		</div>
	</div>

	{#if showNewForm}
		<div class="bg-white rounded-xl shadow-sm border p-6 mb-6">
			<h3 class="font-bold text-lg mb-4">{t(locale, 'inspections.new')}</h3>
			<form method="POST" action="?/create" use:enhance class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="colonyId" class="block text-sm font-semibold mb-1">{t(locale, 'inspections.colony')}</label>
					<select name="colonyId" id="colonyId" required class="w-full px-3 py-2 border rounded-md text-sm">
						<option value="">-- Seleccionar colonia --</option>
						{#each data.colonies as col}
							<option value={col.id}>{col.name}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="templateId" class="block text-sm font-semibold mb-1">{t(locale, 'inspections.template')}</label>
					<select name="templateId" id="templateId" class="w-full px-3 py-2 border rounded-md text-sm">
						<option value="">-- Sin plantilla --</option>
						{#each data.templates as tmpl}
							<option value={tmpl.id}>{tmpl.name}</option>
						{/each}
					</select>
				</div>
				<div class="md:col-span-2">
					<label for="results" class="block text-sm font-semibold mb-1">{t(locale, 'inspections.results')}</label>
					<textarea name="results" id="results" rows="4" placeholder="Escriba los resultados de la inspección..." class="w-full px-3 py-2 border rounded-md text-sm"></textarea>
				</div>
				<div class="md:col-span-2">
					<label for="notes" class="block text-sm font-semibold mb-1">{t(locale, 'inspections.notes')}</label>
					<textarea name="notes" id="notes" rows="2" class="w-full px-3 py-2 border rounded-md text-sm"></textarea>
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
		<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">Inspección creada correctamente.</div>
	{/if}
	{#if form?.templateSuccess}
		<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">Plantilla creada correctamente.</div>
	{/if}

	<!-- Tabs -->
	<div class="flex gap-2 mb-4">
		<button onclick={() => activeTab = 'list'}
			class="px-4 py-2 rounded-md text-sm font-semibold {activeTab === 'list' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}">
			Inspecciones
		</button>
		<button onclick={() => activeTab = 'templates'}
			class="px-4 py-2 rounded-md text-sm font-semibold {activeTab === 'templates' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}">
			{t(locale, 'inspections.templates')}
		</button>
	</div>

	{#if activeTab === 'list'}
		<div class="bg-white rounded-xl shadow-sm border overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-gray-50 text-gray-600 text-left">
						<tr>
							<th class="px-4 py-3">Colonia</th>
							<th class="px-4 py-3">Fecha</th>
							<th class="px-4 py-3">Resultados</th>
							<th class="px-4 py-3">Observaciones</th>
						</tr>
					</thead>
					<tbody class="divide-y">
						{#each data.inspections as insp}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-3 font-medium">
									{#if insp.colonyId}
										<a href="/colonias/{insp.colonyId}" class="text-primary hover:underline">{insp.colonyName || '-'}</a>
									{:else}
										-
									{/if}
								</td>
								<td class="px-4 py-3 text-gray-600">{insp.createdAt ? new Date(insp.createdAt).toLocaleDateString('es-ES') : '-'}</td>
								<td class="px-4 py-3 text-gray-600 max-w-xs truncate">
									{typeof insp.results === 'object' ? JSON.stringify(insp.results).slice(0, 80) : String(insp.results || '-')}
								</td>
								<td class="px-4 py-3 text-gray-500">{insp.notes || '-'}</td>
							</tr>
						{/each}
						{#if data.inspections.length === 0}
							<tr><td colspan="4" class="px-4 py-8 text-center text-gray-400">{t(locale, 'common.no_results')}</td></tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	{#if activeTab === 'templates'}
		<div class="mb-4">
			<button onclick={() => showTemplateForm = !showTemplateForm}
				class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-200">
				{showTemplateForm ? 'Cancelar' : `+ ${t(locale, 'inspections.new_template')}`}
			</button>
		</div>

		{#if showTemplateForm}
			<div class="bg-white rounded-xl shadow-sm border p-6 mb-6">
				<h3 class="font-bold text-lg mb-4">{t(locale, 'inspections.new_template')}</h3>
				<form method="POST" action="?/createTemplate" use:enhance class="grid gap-4">
					<div>
						<label for="templateName" class="block text-sm font-semibold mb-1">Nombre de la Plantilla</label>
						<input type="text" name="name" id="templateName" required class="w-full px-3 py-2 border rounded-md text-sm" />
					</div>
					<div>
						<label for="fields" class="block text-sm font-semibold mb-1">Campos (JSON array)</label>
						<textarea name="fields" id="fields" rows="4" placeholder='[{"name":"estado_general","type":"select","options":["bueno","regular","malo"]},{"name":"observaciones","type":"text"}]'
							class="w-full px-3 py-2 border rounded-md text-sm font-mono"></textarea>
					</div>
					<button type="submit" class="px-5 py-2 bg-primary text-white rounded-md font-semibold hover:bg-primary-dark w-fit">{t(locale, 'common.save')}</button>
				</form>
			</div>
		{/if}

		<div class="grid gap-4">
			{#each data.templates as tmpl}
				<div class="bg-white rounded-xl shadow-sm border p-4">
					<h4 class="font-bold">{tmpl.name}</h4>
					<p class="text-xs text-gray-400 mt-1">Creada: {tmpl.createdAt ? new Date(tmpl.createdAt).toLocaleDateString('es-ES') : '-'}</p>
					<pre class="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">{JSON.stringify(tmpl.schema, null, 2)}</pre>
				</div>
			{/each}
			{#if data.templates.length === 0}
				<p class="text-gray-400 text-sm">No hay plantillas de inspección configuradas.</p>
			{/if}
		</div>
	{/if}
</div>

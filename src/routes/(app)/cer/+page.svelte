<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);

	let showNewForm = $state(false);
	let activeTab = $state<'timeline' | 'indicators'>('indicators');

	function statusLabel(a: { capturedAt: unknown; sterilizedAt: unknown; returnedAt: unknown }): { label: string; bg: string } {
		if (a.returnedAt) return { label: 'Completado', bg: 'bg-green-100 text-green-800' };
		if (a.sterilizedAt) return { label: 'Pendiente retorno', bg: 'bg-yellow-100 text-yellow-800' };
		if (a.capturedAt) return { label: 'Capturado', bg: 'bg-blue-100 text-blue-800' };
		return { label: 'Registrado', bg: 'bg-gray-100 text-gray-600' };
	}

	let maxChartVal = $derived(Math.max(...(data.monthlyChart?.map((m: { count: number }) => m.count) || [1]), 1));
</script>

<div>
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h2 class="text-2xl font-bold text-gray-800">{t(locale, 'cer.title')}</h2>
			<p class="text-sm text-gray-500">{data.indicators.totalActions} acciones CER registradas</p>
		</div>
		<button onclick={() => showNewForm = !showNewForm}
			class="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-dark">
			{showNewForm ? 'Cancelar' : `+ ${t(locale, 'cer.new_action')}`}
		</button>
	</div>

	{#if showNewForm}
		<div class="bg-white rounded-xl shadow-sm border p-6 mb-6">
			<h3 class="font-bold text-lg mb-4">{t(locale, 'cer.new_action')}</h3>
			<form method="POST" action="?/create" use:enhance class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="catId" class="block text-sm font-semibold mb-1">{t(locale, 'cer.cat')}</label>
					<select name="catId" id="catId" required class="w-full px-3 py-2 border rounded-md text-sm">
						<option value="">-- Seleccionar gato --</option>
						{#each data.cats as cat}
							<option value={cat.id}>{cat.name || 'Sin nombre'}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="colonyId" class="block text-sm font-semibold mb-1">{t(locale, 'cer.colony')}</label>
					<select name="colonyId" id="colonyId" required class="w-full px-3 py-2 border rounded-md text-sm">
						<option value="">-- Seleccionar colonia --</option>
						{#each data.colonies as col}
							<option value={col.id}>{col.name}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="capturedAt" class="block text-sm font-semibold mb-1">{t(locale, 'cer.captured_at')}</label>
					<input type="date" name="capturedAt" id="capturedAt" class="w-full px-3 py-2 border rounded-md text-sm" />
				</div>
				<div>
					<label for="sterilizedAt" class="block text-sm font-semibold mb-1">{t(locale, 'cer.sterilized_at')}</label>
					<input type="date" name="sterilizedAt" id="sterilizedAt" class="w-full px-3 py-2 border rounded-md text-sm" />
				</div>
				<div>
					<label for="returnedAt" class="block text-sm font-semibold mb-1">{t(locale, 'cer.returned_at')}</label>
					<input type="date" name="returnedAt" id="returnedAt" class="w-full px-3 py-2 border rounded-md text-sm" />
				</div>
				<div>
					<label for="collaboratorName" class="block text-sm font-semibold mb-1">{t(locale, 'cer.collaborator')}</label>
					<input type="text" name="collaboratorName" id="collaboratorName" class="w-full px-3 py-2 border rounded-md text-sm" />
				</div>
				<div class="md:col-span-2">
					<label for="notes" class="block text-sm font-semibold mb-1">{t(locale, 'cer.notes')}</label>
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
		<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">Acción CER registrada correctamente.</div>
	{/if}

	<!-- KPIs -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
		<div class="bg-white rounded-xl shadow-sm border p-4 text-center">
			<p class="text-3xl font-bold text-primary">{data.indicators.totalActions}</p>
			<p class="text-xs text-gray-500 mt-1">{t(locale, 'cer.total_actions')}</p>
		</div>
		<div class="bg-white rounded-xl shadow-sm border p-4 text-center">
			<p class="text-3xl font-bold text-green-600">{data.indicators.completed}</p>
			<p class="text-xs text-gray-500 mt-1">{t(locale, 'cer.completed')}</p>
		</div>
		<div class="bg-white rounded-xl shadow-sm border p-4 text-center">
			<p class="text-3xl font-bold text-yellow-600">{data.indicators.pendingReturn}</p>
			<p class="text-xs text-gray-500 mt-1">{t(locale, 'cer.pending_return')}</p>
		</div>
		<div class="bg-white rounded-xl shadow-sm border p-4 text-center">
			<p class="text-3xl font-bold text-blue-600">{data.indicators.successRate}%</p>
			<p class="text-xs text-gray-500 mt-1">{t(locale, 'cer.success_rate')}</p>
		</div>
	</div>

	<!-- Tabs -->
	<div class="flex gap-2 mb-4">
		<button onclick={() => activeTab = 'indicators'}
			class="px-4 py-2 rounded-md text-sm font-semibold {activeTab === 'indicators' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}">
			{t(locale, 'cer.monthly_chart')}
		</button>
		<button onclick={() => activeTab = 'timeline'}
			class="px-4 py-2 rounded-md text-sm font-semibold {activeTab === 'timeline' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}">
			{t(locale, 'cer.timeline')}
		</button>
	</div>

	{#if activeTab === 'indicators'}
		<!-- Monthly chart (bar chart) -->
		<div class="bg-white rounded-xl shadow-sm border p-6 mb-6">
			<h3 class="font-bold mb-4">{t(locale, 'cer.monthly_chart')}</h3>
			{#if data.monthlyChart && data.monthlyChart.length > 0}
				<div class="flex items-end gap-2 h-48">
					{#each data.monthlyChart as m}
						<div class="flex-1 flex flex-col items-center">
							<span class="text-xs font-bold text-gray-700 mb-1">{m.count}</span>
							<div class="w-full bg-primary rounded-t" style="height: {(m.count / maxChartVal) * 100}%"></div>
							<span class="text-xs text-gray-400 mt-1 rotate-[-45deg] origin-top-left whitespace-nowrap">{m.month}</span>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-gray-400 text-sm">No hay datos suficientes para el gráfico.</p>
			{/if}
		</div>
	{/if}

	{#if activeTab === 'timeline'}
		<div class="bg-white rounded-xl shadow-sm border overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-gray-50 text-gray-600 text-left">
						<tr>
							<th class="px-4 py-3">Gato</th>
							<th class="px-4 py-3">Colonia</th>
							<th class="px-4 py-3">Estado</th>
							<th class="px-4 py-3">Captura</th>
							<th class="px-4 py-3">Esterilización</th>
							<th class="px-4 py-3">Retorno</th>
							<th class="px-4 py-3">Colaborador</th>
						</tr>
					</thead>
					<tbody class="divide-y">
						{#each data.actions as a}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-3 font-medium">
									<a href="/gatos/{a.catId}" class="text-primary hover:underline">{a.catName || 'Sin nombre'}</a>
								</td>
							<td class="px-4 py-3 text-gray-600">{a.colonyName || '-'}</td>
							<td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full text-xs font-bold {statusLabel(a).bg}">{statusLabel(a).label}</span></td>
								<td class="px-4 py-3 text-gray-600">{a.capturedAt ? new Date(a.capturedAt).toLocaleDateString('es-ES') : '-'}</td>
								<td class="px-4 py-3 text-gray-600">{a.sterilizedAt ? new Date(a.sterilizedAt).toLocaleDateString('es-ES') : '-'}</td>
								<td class="px-4 py-3 text-gray-600">{a.returnedAt ? new Date(a.returnedAt).toLocaleDateString('es-ES') : '-'}</td>
								<td class="px-4 py-3 text-gray-500">{a.collaboratorName || '-'}</td>
							</tr>
						{/each}
						{#if data.actions.length === 0}
							<tr><td colspan="7" class="px-4 py-8 text-center text-gray-400">{t(locale, 'common.no_results')}</td></tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

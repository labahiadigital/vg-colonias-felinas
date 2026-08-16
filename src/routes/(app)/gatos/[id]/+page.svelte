<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);
	let cat = $derived(data.cat);

	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';

	let activeTab = $state('info');
	let editing = $state(false);
	let showHealthForm = $state(false);
	let showDeleteConfirm = $state(false);
	let deleteFormEl: HTMLFormElement;

	function healthTypeLabel(type: string): string {
		const labels: Record<string, string> = {
			vaccination: 'Vacunación', sterilization: 'Esterilización', treatment: 'Tratamiento',
			checkup: 'Revisión', surgery: 'Cirugía', deworming: 'Desparasitación'
		};
		return labels[type] ?? type;
	}
</script>

<div>
	<a href="/gatos" class="text-sm text-primary hover:underline mb-4 inline-block">← Volver a gatos</a>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Sidebar: Cat profile -->
		<div class="bg-white rounded-lg shadow-sm overflow-hidden">
			<div class="h-40 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-7xl">
				{cat.sex === 'female' ? '🐱' : '😸'}
			</div>
			<div class="p-5">
				<h2 class="text-xl font-bold text-gray-800">{cat.name ?? 'Sin nombre'}</h2>
				<p class="text-sm text-gray-500 mt-1">{cat.colonyName ?? 'Sin colonia asignada'}</p>

				<div class="mt-4 space-y-2">
					<div class="flex justify-between text-sm"><span class="text-gray-500">Sexo</span><span class="font-medium">{cat.sex === 'male' ? '♂ Macho' : cat.sex === 'female' ? '♀ Hembra' : 'Desconocido'}</span></div>
					<div class="flex justify-between text-sm"><span class="text-gray-500">Edad estimada</span><span class="font-medium">{cat.estimatedAge ?? '-'}</span></div>
					<div class="flex justify-between text-sm"><span class="text-gray-500">Microchip</span><span class="font-medium font-mono text-xs">{cat.microchip ?? 'No tiene'}</span></div>
					<div class="flex justify-between text-sm"><span class="text-gray-500">Esterilizado</span><span class="font-medium">{cat.sterilized ? '✅ Sí' : '❌ No'}</span></div>
					{#if cat.sterilizationDate}
						<div class="flex justify-between text-sm"><span class="text-gray-500">Fecha ester.</span><span class="font-medium">{cat.sterilizationDate}</span></div>
					{/if}
					<div class="flex justify-between text-sm">
						<span class="text-gray-500">Estado</span>
						<span class="px-2 py-0.5 rounded-full text-xs font-bold
							{cat.status === 'in_colony' ? 'bg-green-100 text-green-800' : cat.status === 'adopted' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}">
							{cat.status === 'in_colony' ? 'En colonia' : cat.status === 'adopted' ? 'Adoptado' : cat.status}
						</span>
					</div>
				</div>

				<div class="mt-5 flex gap-2">
					<button onclick={() => editing = !editing} class="flex-1 px-3 py-2 bg-primary text-white text-sm rounded-md font-semibold hover:bg-primary-dark">
						{editing ? 'Cancelar' : '✏️ Editar'}
					</button>
					<button onclick={() => showDeleteConfirm = true} class="px-3 py-2 bg-red-600 text-white text-sm rounded-md font-semibold hover:bg-red-700">🗑️</button>
					<form bind:this={deleteFormEl} method="POST" action="?/delete" use:enhance class="hidden"></form>
				</div>
			</div>
		</div>

		<!-- Main content -->
		<div class="lg:col-span-2 space-y-6">
			{#if editing}
				<div class="bg-white rounded-lg shadow-sm p-6">
					<h3 class="font-bold mb-4">Editar datos del gato</h3>
					<form method="POST" action="?/update" use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success') { editing = false; await update(); } else { await update(); }
						};
					}}>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label for="name" class="block text-sm font-semibold mb-1">Nombre</label>
								<input type="text" name="name" id="name" value={cat.name ?? ''} class="w-full px-3 py-2 border rounded-md text-sm" />
							</div>
							<div>
								<label for="colonyId" class="block text-sm font-semibold mb-1">Colonia</label>
								<select name="colonyId" id="colonyId" class="w-full px-3 py-2 border rounded-md text-sm">
									<option value="">Sin asignar</option>
									{#each data.colonies as c}
										<option value={c.id} selected={c.id === cat.colonyId}>{c.name}</option>
									{/each}
								</select>
							</div>
							<div>
								<label for="sex" class="block text-sm font-semibold mb-1">Sexo</label>
								<select name="sex" id="sex" class="w-full px-3 py-2 border rounded-md text-sm">
									<option value="">Desconocido</option>
									<option value="male" selected={cat.sex === 'male'}>Macho</option>
									<option value="female" selected={cat.sex === 'female'}>Hembra</option>
								</select>
							</div>
							<div>
								<label for="microchip" class="block text-sm font-semibold mb-1">Microchip</label>
								<input type="text" name="microchip" id="microchip" value={cat.microchip ?? ''} class="w-full px-3 py-2 border rounded-md text-sm" />
							</div>
							<div>
								<label for="estimatedAge" class="block text-sm font-semibold mb-1">Edad estimada</label>
								<input type="text" name="estimatedAge" id="estimatedAge" value={cat.estimatedAge ?? ''} class="w-full px-3 py-2 border rounded-md text-sm" />
							</div>
							<div>
								<label for="status" class="block text-sm font-semibold mb-1">Estado</label>
								<select name="status" id="status" class="w-full px-3 py-2 border rounded-md text-sm">
									<option value="in_colony" selected={cat.status === 'in_colony'}>En colonia</option>
									<option value="adopted" selected={cat.status === 'adopted'}>Adoptado</option>
									<option value="missing" selected={cat.status === 'missing'}>Desaparecido</option>
									<option value="deceased" selected={cat.status === 'deceased'}>Fallecido</option>
								</select>
							</div>
						</div>
						<button type="submit" class="mt-4 px-5 py-2 bg-primary text-white rounded-md font-semibold hover:bg-primary-dark">Guardar</button>
					</form>
				</div>
			{/if}

			<!-- Tabs -->
			<div class="flex gap-1 border-b border-gray-200 overflow-x-auto">
				{#each [{ id: 'health', label: `Salud (${data.healthRecords.length})`, icon: '💊' }, { id: 'cer', label: `CER (${data.cerActions.length})`, icon: '✂️' }, { id: 'adoptions', label: `Adopciones (${data.adoptions.length})`, icon: '🏠' }] as tab}
					<button
						onclick={() => activeTab = tab.id}
						class="px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
							{activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}"
					>
						{tab.icon} {tab.label}
					</button>
				{/each}
			</div>

			{#if activeTab === 'health'}
				<div class="bg-white rounded-lg shadow-sm">
					<div class="p-4 border-b flex justify-between items-center">
						<h3 class="font-bold">Historial de salud</h3>
						<button onclick={() => showHealthForm = !showHealthForm} class="text-sm text-primary font-semibold hover:underline">+ Añadir registro</button>
					</div>

					{#if showHealthForm}
						<div class="p-4 border-b bg-gray-50">
							<form method="POST" action="?/addHealth" use:enhance={() => {
								return async ({ result, update }) => {
									if (result.type === 'success') { showHealthForm = false; await update(); } else { await update(); }
								};
							}}>
								<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
									<div>
										<label for="type" class="block text-xs font-semibold mb-1">Tipo *</label>
										<select name="type" id="type" required class="w-full px-3 py-2 border rounded-md text-sm">
											<option value="vaccination">Vacunación</option>
											<option value="sterilization">Esterilización</option>
											<option value="treatment">Tratamiento</option>
											<option value="checkup">Revisión</option>
											<option value="deworming">Desparasitación</option>
											<option value="surgery">Cirugía</option>
										</select>
									</div>
									<div>
										<label for="performedAt" class="block text-xs font-semibold mb-1">Fecha *</label>
										<input type="date" name="performedAt" id="performedAt" required class="w-full px-3 py-2 border rounded-md text-sm" />
									</div>
									<div>
										<label for="vetName" class="block text-xs font-semibold mb-1">Veterinario</label>
										<input type="text" name="vetName" id="vetName" class="w-full px-3 py-2 border rounded-md text-sm" />
									</div>
									<div>
										<label for="vetClinic" class="block text-xs font-semibold mb-1">Clínica</label>
										<input type="text" name="vetClinic" id="vetClinic" class="w-full px-3 py-2 border rounded-md text-sm" />
									</div>
									<div class="md:col-span-2">
										<label for="notes" class="block text-xs font-semibold mb-1">Notas</label>
										<textarea name="notes" id="notes" rows="2" class="w-full px-3 py-2 border rounded-md text-sm"></textarea>
									</div>
								</div>
								<div class="flex gap-2 mt-3">
									<button type="submit" class="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold">Guardar</button>
									<button type="button" onclick={() => showHealthForm = false} class="px-4 py-2 bg-gray-200 rounded-md text-sm">Cancelar</button>
								</div>
							</form>
						</div>
					{/if}

					{#if data.healthRecords.length > 0}
						<div class="divide-y">
							{#each data.healthRecords as hr}
								<div class="p-4">
									<div class="flex items-start justify-between">
										<div>
											<span class="font-semibold text-sm">{healthTypeLabel(hr.type)}</span>
											{#if hr.vetName}
												<span class="text-xs text-gray-500 ml-2">- {hr.vetName}</span>
											{/if}
											{#if hr.vetClinic}
												<span class="text-xs text-gray-400 ml-1">({hr.vetClinic})</span>
											{/if}
										</div>
										<span class="text-xs text-gray-400">{hr.performedAt ? new Date(hr.performedAt).toLocaleDateString('es') : ''}</span>
									</div>
									{#if hr.notes}
										<p class="text-sm text-gray-600 mt-1">{hr.notes}</p>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<div class="p-8 text-center text-gray-400">Sin registros de salud</div>
					{/if}
				</div>
			{/if}

			{#if activeTab === 'cer'}
				<div class="bg-white rounded-lg shadow-sm">
					<div class="p-4 border-b"><h3 class="font-bold">Acciones CER</h3></div>
					{#if data.cerActions.length > 0}
						<div class="divide-y">
							{#each data.cerActions as cer}
								<div class="p-4">
									<div class="flex flex-wrap gap-4 text-sm">
										<div><span class="text-gray-500">Captura:</span> {cer.capturedAt ? new Date(cer.capturedAt).toLocaleDateString('es') : '-'}</div>
										<div><span class="text-gray-500">Esterilización:</span> {cer.sterilizedAt ? new Date(cer.sterilizedAt).toLocaleDateString('es') : '-'}</div>
										<div><span class="text-gray-500">Retorno:</span> {cer.returnedAt ? new Date(cer.returnedAt).toLocaleDateString('es') : '-'}</div>
									</div>
									<p class="text-xs text-gray-500 mt-1">Colaborador: {cer.collaboratorName ?? '-'} {cer.notes ? `| ${cer.notes}` : ''}</p>
								</div>
							{/each}
						</div>
					{:else}
						<div class="p-8 text-center text-gray-400">Sin acciones CER</div>
					{/if}
				</div>
			{/if}

			{#if activeTab === 'adoptions'}
				<div class="bg-white rounded-lg shadow-sm">
					<div class="p-4 border-b"><h3 class="font-bold">Adopciones</h3></div>
					{#if data.adoptions.length > 0}
						<div class="divide-y">
							{#each data.adoptions as adoption}
								<div class="p-4">
									<div class="flex justify-between items-start">
										<div>
											<span class="font-semibold text-sm capitalize">{adoption.status}</span>
											{#if adoption.adoptedAt}
												<span class="text-xs text-gray-500 ml-2">{new Date(adoption.adoptedAt).toLocaleDateString('es')}</span>
											{/if}
										</div>
									</div>
									{#if adoption.adopterInfo && typeof adoption.adopterInfo === 'object'}
										{@const info = adoption.adopterInfo as Record<string, string>}
										<p class="text-sm text-gray-600 mt-1">Adoptante: {info.name ?? '-'}</p>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<div class="p-8 text-center text-gray-400">Sin registros de adopción</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>

<ConfirmDialog
	open={showDeleteConfirm}
	title="Eliminar gato"
	message="¿Estás seguro de que quieres eliminar este registro? Se perderán los datos sanitarios, CER y adopciones asociadas."
	confirmLabel="Sí, eliminar"
	onconfirm={() => { showDeleteConfirm = false; deleteFormEl?.requestSubmit(); }}
	oncancel={() => showDeleteConfirm = false}
/>

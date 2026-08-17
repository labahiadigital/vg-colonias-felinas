<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types.js';

	let { form }: { form: ActionData } = $props();
	let step = $state(1);

	let orgName = $state('');
	let orgSlug = $state('');

	function generateSlug() {
		orgSlug = orgName
			.toLowerCase()
			.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.slice(0, 40);
	}
</script>

<div class="min-h-screen bg-gradient-to-b from-[#005a4d] via-[#004d42] to-[#003d35] flex items-center justify-center p-4">
	<div class="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8">
		<div class="text-center mb-6">
			<h1 class="text-2xl font-bold text-gray-900">Crear nueva organización</h1>
			<p class="text-sm text-gray-500 mt-1">Registra tu entidad para gestionar colonias felinas</p>
		</div>

		{#if form?.error}
			<div class="bg-red-50 text-red-700 text-sm p-3 rounded-md mb-4">{form.error}</div>
		{/if}

		<div class="flex gap-2 mb-6">
			{#each [1, 2] as s}
				<div class="flex-1 h-1.5 rounded-full {step >= s ? 'bg-primary' : 'bg-gray-200'}"></div>
			{/each}
		</div>

		<form method="POST" use:enhance>
			{#if step === 1}
				<div class="space-y-4">
					<h2 class="text-sm font-bold text-gray-700 uppercase tracking-wide">Datos de la organización</h2>
					<div>
						<label for="orgName" class="block text-sm font-semibold mb-1">Nombre *</label>
						<input type="text" name="orgName" id="orgName" required
							bind:value={orgName} oninput={generateSlug}
							placeholder="Ej: Ayuntamiento de Vitoria-Gasteiz"
							class="w-full px-3 py-2 border rounded-md text-sm" />
					</div>
					<div>
						<label for="orgSlug" class="block text-sm font-semibold mb-1">Identificador (URL) *</label>
						<input type="text" name="orgSlug" id="orgSlug" required
							bind:value={orgSlug}
							placeholder="ej: vitoria-gasteiz"
							class="w-full px-3 py-2 border rounded-md text-sm font-mono" />
						<p class="text-xs text-gray-400 mt-1">Solo letras, números y guiones</p>
					</div>
					<div>
						<label for="orgType" class="block text-sm font-semibold mb-1">Tipo de entidad</label>
						<select name="orgType" id="orgType" class="w-full px-3 py-2 border rounded-md text-sm">
							<option value="municipality">Ayuntamiento / Municipio</option>
							<option value="regional">Diputación / Gobierno Regional</option>
							<option value="association">Asociación protectora</option>
							<option value="foundation">Fundación</option>
							<option value="other">Otro</option>
						</select>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="city" class="block text-sm font-semibold mb-1">Ciudad</label>
							<input type="text" name="city" id="city" class="w-full px-3 py-2 border rounded-md text-sm" />
						</div>
						<div>
							<label for="province" class="block text-sm font-semibold mb-1">Provincia</label>
							<input type="text" name="province" id="province" class="w-full px-3 py-2 border rounded-md text-sm" />
						</div>
					</div>
					<button type="button" onclick={() => { if (orgName && orgSlug) step = 2; }} class="w-full py-2.5 bg-primary text-white rounded-md font-semibold hover:bg-primary-dark">
						Siguiente →
					</button>
				</div>
			{:else}
				<div class="space-y-4">
					<h2 class="text-sm font-bold text-gray-700 uppercase tracking-wide">Cuenta de administrador</h2>
					<input type="hidden" name="orgName" value={orgName} />
					<input type="hidden" name="orgSlug" value={orgSlug} />
					<div>
						<label for="adminName" class="block text-sm font-semibold mb-1">Nombre completo *</label>
						<input type="text" name="adminName" id="adminName" required class="w-full px-3 py-2 border rounded-md text-sm" />
					</div>
					<div>
						<label for="adminEmail" class="block text-sm font-semibold mb-1">Email *</label>
						<input type="email" name="adminEmail" id="adminEmail" required class="w-full px-3 py-2 border rounded-md text-sm" />
					</div>
					<div>
						<label for="adminPassword" class="block text-sm font-semibold mb-1">Contraseña * (mín. 8 caracteres)</label>
						<input type="password" name="adminPassword" id="adminPassword" required minlength="8" class="w-full px-3 py-2 border rounded-md text-sm" />
					</div>
					<div class="flex gap-3">
						<button type="button" onclick={() => step = 1} class="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-300">← Atrás</button>
						<button type="submit" class="flex-1 py-2.5 bg-primary text-white rounded-md font-semibold hover:bg-primary-dark">Crear organización</button>
					</div>
				</div>
			{/if}
		</form>

		<div class="text-center mt-6 space-y-2">
			<a href="/login" class="text-sm text-primary hover:underline block">Ya tengo cuenta → Iniciar sesión</a>
			<div class="flex justify-center gap-3 text-xs text-gray-400">
				<a href="/privacidad" class="hover:text-gray-600 hover:underline">Privacidad</a>
				<span>·</span>
				<a href="/terminos" class="hover:text-gray-600 hover:underline">Términos</a>
			</div>
		</div>
	</div>
</div>

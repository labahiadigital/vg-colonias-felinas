<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types.js';

	let { form }: { form: ActionData } = $props();
	let step = $state(1);

	let orgName = $state('');
	let orgSlug = $state('');
	let loading = $state(false);

	function generateSlug() {
		orgSlug = orgName
			.toLowerCase()
			.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.slice(0, 40);
	}
</script>

<div class="min-h-screen bg-background flex items-center justify-center p-4">
	<div class="w-full max-w-lg">
		<div class="text-center mb-8">
			<div class="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
				<svg viewBox="0 0 32 32" fill="none" class="w-6 h-6">
					<path d="M16 4C11.58 4 8 7.58 8 12c0 6 8 14 8 14s8-8 8-14c0-4.42-3.58-8-8-8z" fill="white"/>
					<path d="M12 8.5L10 5.5 13 7.5z" fill="white" stroke="white" stroke-width="0.3" stroke-linejoin="round"/>
					<path d="M20 8.5L22 5.5 19 7.5z" fill="white" stroke="white" stroke-width="0.3" stroke-linejoin="round"/>
					<ellipse cx="14" cy="11" rx="0.9" ry="1.1" fill="#0f766e"/>
					<ellipse cx="18" cy="11" rx="0.9" ry="1.1" fill="#0f766e"/>
					<path d="M15.5 13L16 12.5l0.5 0.5" stroke="#0f766e" stroke-width="0.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
				</svg>
			</div>
			<h1 class="text-2xl font-bold text-text tracking-tight">Crear nueva organización</h1>
			<p class="text-sm text-text-muted mt-1">Registra tu entidad para gestionar colonias felinas</p>
		</div>

		<div class="bg-surface rounded-xl border border-border p-6 sm:p-8">
			{#if form?.error}
				<div class="bg-danger-subtle text-danger text-sm p-3 rounded-lg mb-4 border border-danger/10">{form.error}</div>
			{/if}

			<div class="flex gap-2 mb-6">
				{#each [1, 2] as s}
					<div class="flex-1 h-1 rounded-full transition-colors {step >= s ? 'bg-primary' : 'bg-border'}"></div>
				{/each}
			</div>

			<form method="POST" use:enhance={() => { loading = true; return async ({ update }) => { loading = false; await update(); }; }}>
				{#if step === 1}
					<div class="space-y-4">
						<p class="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Datos de la organización</p>
						<div>
							<label for="orgName" class="block text-sm font-medium text-text-secondary mb-1.5">Nombre <span class="text-danger">*</span></label>
							<input type="text" name="orgName" id="orgName" required
								bind:value={orgName} oninput={generateSlug}
								placeholder="Ej: Ayuntamiento de Vitoria-Gasteiz"
								class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[44px]" />
						</div>
						<div>
							<label for="orgSlug" class="block text-sm font-medium text-text-secondary mb-1.5">Identificador (URL) <span class="text-danger">*</span></label>
							<input type="text" name="orgSlug" id="orgSlug" required
								bind:value={orgSlug}
								placeholder="ej: vitoria-gasteiz"
								class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[44px]" />
							<p class="text-xs text-text-muted mt-1">Solo letras, números y guiones</p>
						</div>
						<div>
							<label for="orgType" class="block text-sm font-medium text-text-secondary mb-1.5">Tipo de entidad</label>
							<select name="orgType" id="orgType" class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[44px]">
								<option value="municipality">Ayuntamiento / Municipio</option>
								<option value="regional">Diputación / Gobierno Regional</option>
								<option value="association">Asociación protectora</option>
								<option value="foundation">Fundación</option>
								<option value="other">Otro</option>
							</select>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div>
								<label for="city" class="block text-sm font-medium text-text-secondary mb-1.5">Ciudad</label>
								<input type="text" name="city" id="city" class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[44px]" />
							</div>
							<div>
								<label for="province" class="block text-sm font-medium text-text-secondary mb-1.5">Provincia</label>
								<input type="text" name="province" id="province" class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[44px]" />
							</div>
						</div>
						<button type="button" onclick={() => { if (orgName && orgSlug) step = 2; }} class="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors min-h-[44px]">
							Siguiente
						</button>
					</div>
				{:else}
					<div class="space-y-4">
						<p class="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Cuenta de administrador</p>
						<input type="hidden" name="orgName" value={orgName} />
						<input type="hidden" name="orgSlug" value={orgSlug} />
						<div>
							<label for="adminName" class="block text-sm font-medium text-text-secondary mb-1.5">Nombre completo <span class="text-danger">*</span></label>
							<input type="text" name="adminName" id="adminName" required class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[44px]" />
						</div>
						<div>
							<label for="adminEmail" class="block text-sm font-medium text-text-secondary mb-1.5">Email <span class="text-danger">*</span></label>
							<input type="email" name="adminEmail" id="adminEmail" required class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[44px]" />
						</div>
						<div>
							<label for="adminPassword" class="block text-sm font-medium text-text-secondary mb-1.5">Contraseña <span class="text-danger">*</span></label>
							<input type="password" name="adminPassword" id="adminPassword" required minlength="8" class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[44px]" />
							<p class="text-xs text-text-muted mt-1">Mínimo 8 caracteres</p>
						</div>
						<div class="flex gap-3">
							<button type="button" onclick={() => step = 1} class="flex-1 py-2.5 bg-surface-sunken text-text-secondary text-sm font-medium rounded-lg hover:bg-border transition-colors min-h-[44px]">Atrás</button>
							<button type="submit" disabled={loading} class="flex-1 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 min-h-[44px]">
								{loading ? 'Creando...' : 'Crear organización'}
							</button>
						</div>
					</div>
				{/if}
			</form>
		</div>

		<div class="text-center mt-6 space-y-2">
			<a href="/login" class="text-sm text-primary font-medium hover:text-primary-hover transition-colors">Ya tengo cuenta</a>
			<div class="flex justify-center gap-3 text-xs text-text-muted">
				<a href="/privacidad" class="hover:text-text-secondary transition-colors">Privacidad</a>
				<span>·</span>
				<a href="/terminos" class="hover:text-text-secondary transition-colors">Términos</a>
			</div>
		</div>
	</div>
</div>

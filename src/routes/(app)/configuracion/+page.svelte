<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const locale = data.locale;
	const user = data.user;

	let activeSection = $state('profile');
</script>

<div>
	<h2 class="text-2xl font-bold text-gray-800 mb-6">{t(locale, 'settings.title')}</h2>

	<div class="flex flex-col lg:flex-row gap-6">
		<!-- Sidebar -->
		<nav class="w-full lg:w-56 flex-shrink-0">
			<div class="bg-white rounded-lg shadow-sm overflow-hidden">
				{#each [
					{ id: 'profile', label: 'Perfil', icon: '👤' },
					{ id: 'preferences', label: 'Preferencias', icon: '⚙️' },
					{ id: 'security', label: 'Seguridad', icon: '🔒' },
					{ id: 'about', label: 'Acerca de', icon: 'ℹ️' }
				] as section}
					<button
						onclick={() => activeSection = section.id}
						class="w-full px-4 py-3 text-left text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors
							{activeSection === section.id ? 'bg-primary-light text-primary font-semibold border-l-3 border-primary' : 'text-gray-600'}"
					>
						{section.icon} {section.label}
					</button>
				{/each}
			</div>
		</nav>

		<!-- Content -->
		<div class="flex-1">
			{#if activeSection === 'profile'}
				<div class="bg-white rounded-lg shadow-sm p-6">
					<h3 class="text-lg font-bold text-gray-800 mb-4">Perfil de Usuario</h3>

					{#if form?.success}
						<div class="bg-accent-light text-green-800 text-sm p-3 rounded-md mb-4">Perfil actualizado correctamente.</div>
					{/if}
					{#if form?.error}
						<div class="bg-danger-light text-danger text-sm p-3 rounded-md mb-4">{form.error}</div>
					{/if}

					<form method="POST" action="?/updateProfile" use:enhance>
						<div class="space-y-4">
							<div>
								<label for="name" class="block text-sm font-semibold mb-1">Nombre</label>
								<input type="text" name="name" id="name" value={user?.name ?? ''} required class="w-full px-3 py-2 border rounded-md text-sm" />
							</div>
							<div>
								<label for="email" class="block text-sm font-semibold mb-1">Email</label>
								<input type="email" id="email" value={user?.email ?? ''} disabled class="w-full px-3 py-2 border rounded-md text-sm bg-gray-50" />
								<p class="text-xs text-gray-400 mt-1">El email no se puede cambiar</p>
							</div>
							<div>
								<label for="language" class="block text-sm font-semibold mb-1">Idioma preferido</label>
								<select name="language" id="language" class="w-full px-3 py-2 border rounded-md text-sm">
									<option value="es" selected={user?.language === 'es'}>Castellano</option>
									<option value="eu" selected={user?.language === 'eu'}>Euskera</option>
								</select>
							</div>
							{#if data.userRole}
								<div>
									<label class="block text-sm font-semibold mb-1">Rol</label>
									<div class="px-3 py-2 bg-gray-50 border rounded-md text-sm capitalize">{data.userRole}</div>
								</div>
							{/if}
						</div>
						<button type="submit" class="mt-4 px-5 py-2 bg-primary text-white rounded-md font-semibold hover:bg-primary-dark">Guardar cambios</button>
					</form>
				</div>
			{/if}

			{#if activeSection === 'preferences'}
				<div class="bg-white rounded-lg shadow-sm p-6">
					<h3 class="text-lg font-bold text-gray-800 mb-4">Preferencias</h3>
					<div class="space-y-4">
						<label class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
							<div>
								<p class="text-sm font-semibold">Notificaciones por email</p>
								<p class="text-xs text-gray-500">Recibir notificaciones de incidencias y alertas</p>
							</div>
							<input type="checkbox" checked class="w-5 h-5" />
						</label>
						<label class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
							<div>
								<p class="text-sm font-semibold">Resumen diario</p>
								<p class="text-xs text-gray-500">Recibir resumen de actividad al final del día</p>
							</div>
							<input type="checkbox" class="w-5 h-5" />
						</label>
						<label class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
							<div>
								<p class="text-sm font-semibold">Alertas CER</p>
								<p class="text-xs text-gray-500">Notificar sobre acciones CER pendientes</p>
							</div>
							<input type="checkbox" checked class="w-5 h-5" />
						</label>
					</div>
				</div>
			{/if}

			{#if activeSection === 'security'}
				<div class="bg-white rounded-lg shadow-sm p-6">
					<h3 class="text-lg font-bold text-gray-800 mb-4">Seguridad</h3>
					<div class="space-y-4">
						<div class="p-4 bg-gray-50 rounded-md">
							<h4 class="text-sm font-semibold mb-2">Cambiar contraseña</h4>
							<p class="text-xs text-gray-500 mb-3">Para cambiar tu contraseña, utiliza la opción de recuperación de contraseña.</p>
							<a href="/recuperar-contrasena" class="text-sm text-primary font-semibold hover:underline">Ir a recuperar contraseña →</a>
						</div>
						<div class="p-4 bg-gray-50 rounded-md">
							<h4 class="text-sm font-semibold mb-2">Sesiones activas</h4>
							<p class="text-xs text-gray-500">Tu sesión actual está activa.</p>
						</div>
					</div>
				</div>
			{/if}

			{#if activeSection === 'about'}
				<div class="bg-white rounded-lg shadow-sm p-6">
					<h3 class="text-lg font-bold text-gray-800 mb-4">Acerca de la aplicación</h3>
					<dl class="space-y-3">
						<div class="flex justify-between text-sm"><dt class="text-gray-500">Aplicación</dt><dd class="font-medium">Gestión de Colonias Felinas Urbanas</dd></div>
						<div class="flex justify-between text-sm"><dt class="text-gray-500">Versión</dt><dd class="font-medium">1.0.0</dd></div>
						<div class="flex justify-between text-sm"><dt class="text-gray-500">Expediente</dt><dd class="font-medium">2026/CO_ASUM/0013</dd></div>
						<div class="flex justify-between text-sm"><dt class="text-gray-500">Municipio</dt><dd class="font-medium">Ayuntamiento de Vitoria-Gasteiz</dd></div>
						<div class="flex justify-between text-sm"><dt class="text-gray-500">Normativa</dt><dd class="font-medium">RGPD / LOPDGDD / Ley 6/1993</dd></div>
					</dl>
				</div>
			{/if}
		</div>
	</div>
</div>

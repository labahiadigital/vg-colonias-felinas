<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);
	let user = $derived(data.user);

	let activeSection = $state('profile');
	let isAdmin = $derived(data.isAdmin);
	let importResult = $state('');

	async function handleImport() {
		const entity = (document.getElementById('importEntity') as HTMLSelectElement)?.value;
		const fileInput = document.getElementById('importFile') as HTMLInputElement;
		const file = fileInput?.files?.[0];
		if (!file) { importResult = 'Selecciona un archivo'; return; }
		const fd = new FormData();
		fd.append('file', file);
		fd.append('entity', entity);
		importResult = 'Importando...';
		try {
			const res = await fetch('/api/import', { method: 'POST', body: fd });
			const d = await res.json();
			if (d.success) {
				importResult = `Importados: ${d.imported}/${d.totalRows}` + (d.errors?.length > 0 ? ` (${d.errors.length} errores)` : '');
			} else {
				importResult = d.error || 'Error';
			}
		} catch { importResult = 'Error de conexión'; }
	}

	let sections = $derived([
		{ id: 'profile', label: 'Mi Perfil', icon: '👤' },
		{ id: 'preferences', label: 'Preferencias', icon: '⚙️' },
		{ id: 'security', label: 'Seguridad', icon: '🔒' },
		...(isAdmin ? [
			{ id: 'users', label: 'Usuarios', icon: '👥' },
			{ id: 'roles', label: 'Roles y Permisos', icon: '🔑' },
			{ id: 'catalogs', label: 'Catálogos', icon: '📋' },
			{ id: 'templates', label: 'Plantillas', icon: '📝' },
			{ id: 'email', label: 'Email y Notif.', icon: '📧' },
			{ id: 'retention', label: 'Retención', icon: '🗄️' },
			{ id: 'import', label: 'Importar/Exportar', icon: '📦' },
			{ id: 'audit', label: 'Auditoría', icon: '📜' }
		] : []),
		{ id: 'about', label: 'Acerca de', icon: 'ℹ️' }
	]);

	const catalogTypes = [
		{ value: 'colony_status', label: 'Estado de colonia' },
		{ value: 'colony_classification', label: 'Clasificación de colonia' },
		{ value: 'cat_status', label: 'Estado de gato' },
		{ value: 'incident_category', label: 'Categoría de incidencia' },
		{ value: 'incident_priority', label: 'Prioridad de incidencia' },
		{ value: 'health_type', label: 'Tipo de actuación sanitaria' },
		{ value: 'adoption_status', label: 'Estado de adopción' },
		{ value: 'collaborator_status', label: 'Estado de colaborador' }
	];
</script>

<div>
	<h2 class="text-2xl font-bold text-gray-800 mb-6">{t(locale, 'settings.title')}</h2>

	<div class="flex flex-col lg:flex-row gap-6">
		<nav class="w-full lg:w-56 flex-shrink-0">
			<div class="bg-white rounded-lg shadow-sm overflow-hidden">
				{#each sections as section}
					<button
						onclick={() => activeSection = section.id}
						class="w-full px-4 py-3 text-left text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors
							{activeSection === section.id ? 'bg-primary/10 text-primary font-semibold border-l-3 border-primary' : 'text-gray-600'}"
					>
						{section.icon} {section.label}
					</button>
				{/each}
			</div>
		</nav>

		<div class="flex-1">
			<!-- Profile -->
			{#if activeSection === 'profile'}
				<div class="bg-white rounded-lg shadow-sm p-6">
					<h3 class="text-lg font-bold text-gray-800 mb-4">Perfil de Usuario</h3>
					{#if form?.success}<div class="bg-green-50 text-green-800 text-sm p-3 rounded-md mb-4">Perfil actualizado correctamente.</div>{/if}
					{#if form?.error}<div class="bg-red-50 text-red-700 text-sm p-3 rounded-md mb-4">{form.error}</div>{/if}

					<form method="POST" action="?/updateProfile" use:enhance>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label for="name" class="block text-sm font-semibold mb-1">Nombre</label>
								<input type="text" name="name" id="name" value={user?.name ?? ''} required class="w-full px-3 py-2 border rounded-md text-sm" />
							</div>
							<div>
								<label for="email" class="block text-sm font-semibold mb-1">Email</label>
								<input type="email" id="email" value={user?.email ?? ''} disabled class="w-full px-3 py-2 border rounded-md text-sm bg-gray-50" />
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
									<span class="block text-sm font-semibold mb-1">Rol</span>
									<div class="px-3 py-2 bg-gray-50 border rounded-md text-sm capitalize">{data.userRole}</div>
								</div>
							{/if}
						</div>
						<button type="submit" class="mt-4 px-5 py-2 bg-primary text-white rounded-md font-semibold hover:bg-primary-dark">Guardar cambios</button>
					</form>
				</div>
			{/if}

			<!-- Preferences -->
			{#if activeSection === 'preferences'}
				<div class="bg-white rounded-lg shadow-sm p-6">
					<h3 class="text-lg font-bold text-gray-800 mb-4">Preferencias de Notificación</h3>
					<div class="space-y-3">
						{#each [
							{ id: 'email_notifications', label: 'Notificaciones por email', desc: 'Recibir alertas de incidencias y cambios', checked: true },
							{ id: 'daily_summary', label: 'Resumen diario', desc: 'Recibir resumen de actividad al final del día', checked: false },
							{ id: 'cer_alerts', label: 'Alertas CER', desc: 'Notificar sobre acciones CER pendientes', checked: true },
							{ id: 'inspection_reminders', label: 'Recordatorios de inspección', desc: 'Avisar sobre inspecciones programadas', checked: true }
						] as pref}
							<label for={pref.id} class="flex items-center justify-between p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100">
								<div>
									<p class="text-sm font-semibold">{pref.label}</p>
									<p class="text-xs text-gray-500">{pref.desc}</p>
								</div>
								<input type="checkbox" id={pref.id} checked={pref.checked} class="w-5 h-5" />
							</label>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Security -->
			{#if activeSection === 'security'}
				<div class="bg-white rounded-lg shadow-sm p-6">
					<h3 class="text-lg font-bold text-gray-800 mb-4">Seguridad</h3>
					<div class="space-y-4">
						<div class="p-4 bg-gray-50 rounded-md">
							<h4 class="text-sm font-semibold mb-2">Cambiar contraseña</h4>
							<p class="text-xs text-gray-500 mb-3">Para cambiar tu contraseña, utiliza la opción de recuperación.</p>
							<a href="/recuperar-contrasena" class="text-sm text-primary font-semibold hover:underline">Ir a recuperar contraseña &rarr;</a>
						</div>
						<div class="p-4 bg-gray-50 rounded-md">
							<h4 class="text-sm font-semibold mb-2">Autenticación en dos factores (2FA)</h4>
							<p class="text-xs text-gray-500">Próximamente disponible. [PENDIENTE DE CONFIRMAR]</p>
						</div>
						<div class="p-4 bg-gray-50 rounded-md">
							<h4 class="text-sm font-semibold mb-2">Sesiones activas</h4>
							<p class="text-xs text-gray-500">Tu sesión actual está activa desde este dispositivo.</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Users (Admin only) -->
			{#if activeSection === 'users' && isAdmin}
				<div class="bg-white rounded-lg shadow-sm p-6">
					<h3 class="text-lg font-bold text-gray-800 mb-4">Gestión de Usuarios ({data.allUsers.length})</h3>
					{#if form?.roleSuccess}<div class="bg-green-50 text-green-800 text-sm p-3 rounded-md mb-4">Rol asignado correctamente.</div>{/if}

					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead class="bg-gray-50 text-gray-600 text-left">
								<tr>
									<th class="px-4 py-3">Nombre</th>
									<th class="px-4 py-3">Email</th>
									<th class="px-4 py-3">Rol actual</th>
									<th class="px-4 py-3">Registrado</th>
									<th class="px-4 py-3">Asignar rol</th>
								</tr>
							</thead>
							<tbody class="divide-y">
								{#each data.allUsers as u}
									<tr class="hover:bg-gray-50">
										<td class="px-4 py-3 font-medium">{u.name}</td>
										<td class="px-4 py-3 text-gray-600">{u.email}</td>
										<td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary capitalize">{u.roleName || 'Sin rol'}</span></td>
										<td class="px-4 py-3 text-gray-500 text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-ES') : '-'}</td>
										<td class="px-4 py-3">
											<form method="POST" action="?/assignRole" use:enhance class="flex gap-1.5 items-center">
												<input type="hidden" name="userId" value={u.id} />
												<select name="roleId" class="px-2 py-1 border rounded text-xs">
													{#each data.allRoles as r}
														<option value={r.id} selected={r.name === u.roleName}>{r.name}</option>
													{/each}
												</select>
												<button type="submit" class="px-2 py-1 bg-primary text-white rounded text-xs hover:bg-primary-dark">Asignar</button>
											</form>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}

			<!-- Roles & Permissions (Admin only) -->
			{#if activeSection === 'roles' && isAdmin}
				<div class="space-y-6">
					<div class="bg-white rounded-lg shadow-sm p-6">
						<div class="flex items-center justify-between mb-4">
							<h3 class="text-lg font-bold text-gray-800">Roles del Sistema</h3>
						</div>
						{#if form?.roleCreated}<div class="bg-green-50 text-green-800 text-sm p-3 rounded-md mb-4">Rol creado correctamente.</div>{/if}

						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
							{#each data.allRoles as role}
								<div class="p-4 bg-gray-50 rounded-lg border">
									<h4 class="font-bold capitalize">{role.name}</h4>
									<p class="text-xs text-gray-500 mt-1">{role.description || 'Sin descripción'}</p>
									<p class="text-xs text-gray-400 mt-2">
										Permisos: {data.allRolePermissions.filter(rp => rp.roleId === role.id).length}
									</p>
								</div>
							{/each}
						</div>

						<div class="border-t pt-4">
							<h4 class="text-sm font-bold mb-3">Crear nuevo rol</h4>
							<form method="POST" action="?/createRole" use:enhance class="flex gap-3 items-end flex-wrap">
								<div>
									<label for="roleName" class="block text-xs font-semibold mb-1">Nombre</label>
									<input type="text" name="name" id="roleName" required class="px-3 py-2 border rounded-md text-sm" placeholder="ej: gestor_entidad" />
								</div>
								<div class="flex-1 min-w-[200px]">
									<label for="roleDesc" class="block text-xs font-semibold mb-1">Descripción</label>
									<input type="text" name="description" id="roleDesc" class="w-full px-3 py-2 border rounded-md text-sm" placeholder="Descripción del rol" />
								</div>
								<button type="submit" class="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-dark">Crear rol</button>
							</form>
						</div>
					</div>

					<div class="bg-white rounded-lg shadow-sm p-6">
						<h3 class="text-lg font-bold text-gray-800 mb-4">Matriz de Permisos</h3>
						<p class="text-xs text-gray-500 mb-4">Módulos y acciones disponibles en el sistema.</p>
						{#if data.allPermissions.length > 0}
							<div class="overflow-x-auto">
								<table class="w-full text-xs">
									<thead class="bg-gray-50">
										<tr>
											<th class="px-3 py-2 text-left">Módulo</th>
											<th class="px-3 py-2 text-left">Acción</th>
											{#each data.allRoles as role}
												<th class="px-3 py-2 text-center capitalize">{role.name}</th>
											{/each}
										</tr>
									</thead>
									<tbody class="divide-y">
										{#each data.allPermissions as perm}
											<tr class="hover:bg-gray-50">
												<td class="px-3 py-2 capitalize font-medium">{perm.module}</td>
												<td class="px-3 py-2">{perm.action}</td>
												{#each data.allRoles as role}
													{@const has = data.allRolePermissions.some(rp => rp.roleId === role.id && rp.permissionId === perm.id)}
													<td class="px-3 py-2 text-center">
														<span class="text-lg">{has ? '✅' : '❌'}</span>
													</td>
												{/each}
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{:else}
							<p class="text-gray-400 text-sm">No hay permisos configurados. Ejecute el seed para crear permisos iniciales.</p>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Catalogs (Admin only) -->
			{#if activeSection === 'catalogs' && isAdmin}
				<div class="bg-white rounded-lg shadow-sm p-6">
					<h3 class="text-lg font-bold text-gray-800 mb-4">Catálogos Configurables</h3>
					<p class="text-xs text-gray-500 mb-4">Estados, categorías y templates del sistema. Estos valores configurables permiten adaptar la aplicación sin modificar código.</p>

					{#if form?.catalogCreated}<div class="bg-green-50 text-green-800 text-sm p-3 rounded-md mb-4">Entrada de catálogo creada.</div>{/if}

					<form method="POST" action="?/createCatalog" use:enhance class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
						<div>
							<label for="catType" class="block text-xs font-semibold mb-1">Tipo</label>
							<select name="type" id="catType" required class="w-full px-3 py-2 border rounded-md text-sm">
								{#each catalogTypes as ct}
									<option value={ct.value}>{ct.label}</option>
								{/each}
							</select>
						</div>
						<div>
							<label for="catKey" class="block text-xs font-semibold mb-1">Clave</label>
							<input type="text" name="key" id="catKey" required class="w-full px-3 py-2 border rounded-md text-sm" placeholder="ej: activa" />
						</div>
						<div>
							<label for="catLabel" class="block text-xs font-semibold mb-1">Etiqueta (ES)</label>
							<input type="text" name="label" id="catLabel" required class="w-full px-3 py-2 border rounded-md text-sm" placeholder="ej: Activa" />
						</div>
						<div>
							<label for="catLabelEu" class="block text-xs font-semibold mb-1">Etiqueta (EU)</label>
							<input type="text" name="labelEu" id="catLabelEu" class="w-full px-3 py-2 border rounded-md text-sm" placeholder="ej: Aktiboa" />
						</div>
						<div class="flex items-end">
							<button type="submit" class="w-full px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-dark">Añadir</button>
						</div>
					</form>

					{#if data.allCatalogs.length > 0}
						{@const groupedCatalogs = data.allCatalogs.reduce((acc: Record<string, typeof data.allCatalogs>, c) => {
							(acc[c.type] = acc[c.type] || []).push(c);
							return acc;
						}, {})}
						<div class="space-y-4">
							{#each Object.entries(groupedCatalogs) as [type, items]}
								<div class="border rounded-lg overflow-hidden">
									<div class="px-4 py-2 bg-gray-50 font-semibold text-sm capitalize">{catalogTypes.find(ct => ct.value === type)?.label || type}</div>
									<table class="w-full text-sm">
										<tbody class="divide-y">
											{#each items as item}
												<tr class="hover:bg-gray-50">
													<td class="px-4 py-2 font-mono text-xs text-gray-500">{item.key}</td>
													<td class="px-4 py-2">{item.label}</td>
													<td class="px-4 py-2 text-gray-500">{item.labelEu || '-'}</td>
													<td class="px-4 py-2 text-center">{item.isActive ? '✅' : '❌'}</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-gray-400 text-sm">No hay entradas de catálogo. Cree las primeras entradas arriba.</p>
					{/if}
				</div>
			{/if}

			<!-- Audit Log (Admin only) -->
			{#if activeSection === 'audit' && isAdmin}
				<div class="bg-white rounded-lg shadow-sm p-6">
					<h3 class="text-lg font-bold text-gray-800 mb-4">Registro de Auditoría (últimos 20)</h3>
					{#if data.auditLog && data.auditLog.length > 0}
						<div class="overflow-x-auto">
							<table class="w-full text-sm">
								<thead class="bg-gray-50">
									<tr>
										<th class="px-4 py-2 text-left font-semibold">Fecha</th>
										<th class="px-4 py-2 text-left font-semibold">Usuario</th>
										<th class="px-4 py-2 text-left font-semibold">Entidad</th>
										<th class="px-4 py-2 text-left font-semibold">Acción</th>
										<th class="px-4 py-2 text-left font-semibold">Detalles</th>
									</tr>
								</thead>
								<tbody class="divide-y">
									{#each data.auditLog as log}
										<tr class="hover:bg-gray-50">
											<td class="px-4 py-2 text-xs">{log.createdAt ? new Date(log.createdAt).toLocaleString('es-ES') : '-'}</td>
											<td class="px-4 py-2">{log.userName ?? '-'}</td>
											<td class="px-4 py-2 capitalize">{log.entity}</td>
											<td class="px-4 py-2">
												<span class="px-2 py-0.5 rounded text-xs font-bold
													{log.action === 'create' ? 'bg-green-100 text-green-800' :
													log.action === 'delete' ? 'bg-red-100 text-red-700' :
													log.action === 'export' ? 'bg-blue-100 text-blue-800' :
													'bg-gray-100 text-gray-700'}">
													{log.action}
												</span>
											</td>
											<td class="px-4 py-2 text-xs text-gray-500 max-w-xs truncate">
												{log.details && typeof log.details === 'object' ? JSON.stringify(log.details).slice(0, 80) : '-'}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<p class="text-gray-400 text-sm">Sin registros de auditoría</p>
					{/if}
				</div>
			{/if}

			<!-- Templates -->
			{#if activeSection === 'templates' && isAdmin}
				<div class="space-y-6">
					<div class="bg-white rounded-lg shadow-sm p-6">
						<h3 class="text-lg font-bold text-gray-800 mb-4">Plantillas de Inspección</h3>
						{#if data.allInspectionTemplates.length > 0}
							<div class="space-y-2 mb-4">
								{#each data.allInspectionTemplates as tpl}
									<div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
										<div>
											<p class="font-semibold text-sm">{tpl.name}</p>
											<p class="text-xs text-gray-500">{tpl.description || 'Sin descripción'}</p>
										</div>
										<span class="text-xs {tpl.isActive ? 'text-green-600' : 'text-gray-400'}">{tpl.isActive ? 'Activa' : 'Inactiva'}</span>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-sm text-gray-400 mb-4">No hay plantillas de inspección creadas.</p>
						{/if}
						<form method="POST" action="?/createInspectionTemplate" use:enhance class="grid grid-cols-1 gap-3">
							<input type="text" name="name" placeholder="Nombre de la plantilla" required class="px-3 py-2 border rounded-md text-sm" />
							<input type="text" name="description" placeholder="Descripción" class="px-3 py-2 border rounded-md text-sm" />
							<textarea name="schema" placeholder='JSON: [&#123;"name":"campo","label":"Etiqueta","type":"select","options":["A","B"]&#125;]' rows="3" required class="px-3 py-2 border rounded-md text-sm font-mono"></textarea>
							<button type="submit" class="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold">Crear plantilla</button>
						</form>
					</div>
					<div class="bg-white rounded-lg shadow-sm p-6">
						<h3 class="text-lg font-bold text-gray-800 mb-4">Plantillas de Certificado</h3>
						{#if data.allCertificateTemplates.length > 0}
							<div class="space-y-2 mb-4">
								{#each data.allCertificateTemplates as ct}
									<div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
										<div>
											<p class="font-semibold text-sm">{ct.name}</p>
											<p class="text-xs text-gray-500">Tipo: {ct.type}</p>
										</div>
										<span class="text-xs {ct.isActive ? 'text-green-600' : 'text-gray-400'}">{ct.isActive ? 'Activa' : 'Inactiva'}</span>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-sm text-gray-400 mb-4">No hay plantillas de certificado creadas.</p>
						{/if}
						<form method="POST" action="?/createCertificateTemplate" use:enhance class="grid grid-cols-1 md:grid-cols-2 gap-3">
							<select name="type" required class="px-3 py-2 border rounded-md text-sm">
								<option value="health">Certificado Sanitario</option>
								<option value="sterilization">Certificado Esterilización</option>
								<option value="cer">Certificado CER</option>
								<option value="collaborator">Credencial Colaborador</option>
							</select>
							<input type="text" name="name" placeholder="Nombre de la plantilla" required class="px-3 py-2 border rounded-md text-sm" />
							<textarea name="headerHtml" placeholder="HTML cabecera (opcional)" rows="2" class="md:col-span-2 px-3 py-2 border rounded-md text-sm font-mono"></textarea>
							<textarea name="footerHtml" placeholder="HTML pie (opcional)" rows="2" class="md:col-span-2 px-3 py-2 border rounded-md text-sm font-mono"></textarea>
							<button type="submit" class="md:col-span-2 px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold">Crear plantilla</button>
						</form>
					</div>
				</div>
			{/if}

			<!-- Email Templates -->
			{#if activeSection === 'email' && isAdmin}
				<div class="space-y-6">
					<div class="bg-white rounded-lg shadow-sm p-6">
						<h3 class="text-lg font-bold text-gray-800 mb-4">Plantillas de Email</h3>
						{#if data.allEmailTemplates.length > 0}
							<div class="space-y-2 mb-4">
								{#each data.allEmailTemplates as et}
									<div class="p-3 bg-gray-50 rounded-md">
										<p class="font-semibold text-sm">{et.key} — {et.subject}</p>
										<p class="text-xs text-gray-500">{et.locale}</p>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-sm text-gray-400 mb-4">No hay plantillas de email. Se usará el formato estándar.</p>
						{/if}
						<form method="POST" action="?/createEmailTemplate" use:enhance class="grid grid-cols-1 md:grid-cols-2 gap-3">
							<select name="key" required class="px-3 py-2 border rounded-md text-sm">
								<option value="incident_status">Cambio estado incidencia</option>
								<option value="incident_assigned">Incidencia asignada</option>
								<option value="adoption_status">Cambio estado adopción</option>
								<option value="collaborator_status">Cambio estado colaborador</option>
								<option value="welcome">Bienvenida</option>
								<option value="password_reset">Recuperar contraseña</option>
							</select>
							<input type="text" name="subject" placeholder="Asunto del email" required class="px-3 py-2 border rounded-md text-sm" />
							<textarea name="bodyHtml" placeholder={"Contenido HTML. Variables: {{nombre}}, {{estado}}, {{enlace}}"} rows="4" required class="md:col-span-2 px-3 py-2 border rounded-md text-sm font-mono"></textarea>
							<button type="submit" class="md:col-span-2 px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold">Crear plantilla</button>
						</form>
					</div>
				</div>
			{/if}

			<!-- Data Retention -->
			{#if activeSection === 'retention' && isAdmin}
				<div class="bg-white rounded-lg shadow-sm p-6">
					<h3 class="text-lg font-bold text-gray-800 mb-4">Políticas de Retención de Datos</h3>
					<p class="text-sm text-gray-500 mb-4">Define cuánto tiempo se conservan los datos antes de anonimizarlos o eliminarlos.</p>
					{#if data.allRetentionPolicies.length > 0}
						<table class="w-full text-sm mb-4">
							<thead><tr class="text-left text-xs text-gray-500 border-b"><th class="p-2">Entidad</th><th class="p-2">Retención</th><th class="p-2">Acción</th></tr></thead>
							<tbody>
								{#each data.allRetentionPolicies as rp}
									<tr class="border-b"><td class="p-2 font-medium">{rp.entity}</td><td class="p-2">{rp.retentionDays} días</td><td class="p-2">{rp.action}</td></tr>
								{/each}
							</tbody>
						</table>
					{/if}
					<form method="POST" action="?/saveRetentionPolicy" use:enhance class="grid grid-cols-1 md:grid-cols-3 gap-3">
						<select name="entity" required class="px-3 py-2 border rounded-md text-sm">
							<option value="colonies">Colonias</option>
							<option value="cats">Gatos</option>
							<option value="health_records">Registros sanitarios</option>
							<option value="incidents">Incidencias</option>
							<option value="collaborators">Colaboradores</option>
							<option value="adoptions">Adopciones</option>
							<option value="audit_logs">Logs de auditoría</option>
							<option value="messages">Mensajes</option>
						</select>
						<input type="number" name="retentionDays" placeholder="Días (ej: 1825 = 5 años)" required class="px-3 py-2 border rounded-md text-sm" />
						<select name="retentionAction" class="px-3 py-2 border rounded-md text-sm">
							<option value="anonymize">Anonimizar</option>
							<option value="delete">Eliminar</option>
							<option value="archive">Archivar</option>
						</select>
						<button type="submit" class="md:col-span-3 px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold">Guardar política</button>
					</form>
				</div>
			{/if}

			<!-- Import/Export -->
			{#if activeSection === 'import' && isAdmin}
				<div class="space-y-6">
					<div class="bg-white rounded-lg shadow-sm p-6">
						<h3 class="text-lg font-bold text-gray-800 mb-4">Importar datos (CSV)</h3>
						<p class="text-sm text-gray-500 mb-4">Sube un archivo CSV con los datos a importar. Debe incluir cabecera con nombres de campo.</p>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
							<select id="importEntity" class="px-3 py-2 border rounded-md text-sm">
								<option value="colonies">Colonias</option>
								<option value="cats">Gatos</option>
								<option value="collaborators">Colaboradores</option>
								<option value="health">Registros sanitarios</option>
								<option value="incidents">Incidencias</option>
							</select>
							<input type="file" id="importFile" accept=".csv,.txt" class="px-3 py-2 border rounded-md text-sm" />
							<button type="button" onclick={handleImport} class="md:col-span-2 px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold">Importar</button>
						</div>
						{#if importResult}
							<p class="mt-3 text-sm">{importResult}</p>
						{/if}
					</div>
					<div class="bg-white rounded-lg shadow-sm p-6">
						<h3 class="text-lg font-bold text-gray-800 mb-4">Exportar datos</h3>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<a href="/api/export-full?format=json" target="_blank" class="block px-4 py-3 bg-gray-50 rounded-md text-center hover:bg-gray-100 font-semibold text-sm">📦 Exportación completa (JSON)</a>
							<a href="/api/export-full?format=csv" target="_blank" class="block px-4 py-3 bg-gray-50 rounded-md text-center hover:bg-gray-100 font-semibold text-sm">📋 Exportación completa (CSV)</a>
						</div>
					</div>
				</div>
			{/if}

			<!-- About -->
			{#if activeSection === 'about'}
				<div class="bg-white rounded-lg shadow-sm p-6">
					<h3 class="text-lg font-bold text-gray-800 mb-4">Acerca de la aplicación</h3>
					<dl class="space-y-3">
						<div class="flex justify-between text-sm border-b pb-2"><dt class="text-gray-500">Aplicación</dt><dd class="font-medium">Gestión de Colonias Felinas Urbanas</dd></div>
						<div class="flex justify-between text-sm border-b pb-2"><dt class="text-gray-500">Versión</dt><dd class="font-medium">2.0.0-saas</dd></div>
						<div class="flex justify-between text-sm border-b pb-2"><dt class="text-gray-500">Expediente</dt><dd class="font-medium">2026/CO_ASUM/0013</dd></div>
						<div class="flex justify-between text-sm border-b pb-2"><dt class="text-gray-500">Municipio</dt><dd class="font-medium">Ayuntamiento de Vitoria-Gasteiz</dd></div>
						<div class="flex justify-between text-sm border-b pb-2"><dt class="text-gray-500">Normativa</dt><dd class="font-medium">RGPD / LOPDGDD / Ley 6/1993</dd></div>
						<div class="flex justify-between text-sm border-b pb-2"><dt class="text-gray-500">Idiomas</dt><dd class="font-medium">Castellano / Euskera</dd></div>
						<div class="flex justify-between text-sm border-b pb-2"><dt class="text-gray-500">Base de datos</dt><dd class="font-medium">PostgreSQL (Neon - UE)</dd></div>
						<div class="flex justify-between text-sm"><dt class="text-gray-500">Framework</dt><dd class="font-medium">SvelteKit + TypeScript</dd></div>
					</dl>
				</div>
			{/if}
		</div>
	</div>
</div>

<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	let locale = $derived(data.locale);

	const planColors: Record<string, string> = {
		free: 'bg-gray-100 text-gray-700',
		standard: 'bg-blue-100 text-blue-700',
		professional: 'bg-purple-100 text-purple-700',
		enterprise: 'bg-amber-100 text-amber-700'
	};
</script>

<div class="max-w-6xl mx-auto">
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-text tracking-tight">Superadmin</h1>
		<p class="text-sm text-text-muted mt-0.5">Panel de gestión global de la plataforma</p>
	</div>

	<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
		<div class="bg-surface rounded-xl border border-border p-4 text-center">
			<p class="text-3xl font-bold text-primary">{data.globalStats.organizations}</p>
			<p class="text-xs text-text-muted mt-1">Organizaciones</p>
		</div>
		<div class="bg-surface rounded-xl border border-border p-4 text-center">
			<p class="text-3xl font-bold text-accent">{data.globalStats.users}</p>
			<p class="text-xs text-text-muted mt-1">Usuarios</p>
		</div>
		<div class="bg-surface rounded-xl border border-border p-4 text-center">
			<p class="text-3xl font-bold text-info">{data.globalStats.colonies}</p>
			<p class="text-xs text-text-muted mt-1">Colonias</p>
		</div>
		<div class="bg-surface rounded-xl border border-border p-4 text-center">
			<p class="text-3xl font-bold text-success">{data.globalStats.cats}</p>
			<p class="text-xs text-text-muted mt-1">Gatos</p>
		</div>
	</div>

	<div class="bg-surface rounded-xl border border-border overflow-hidden">
		<div class="p-4 border-b border-border">
			<h2 class="text-lg font-semibold text-text">Organizaciones ({data.organizations.length})</h2>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="text-left text-text-muted text-xs border-b border-border">
						<th class="px-4 py-3 font-medium">Organización</th>
						<th class="px-4 py-3 font-medium">País</th>
						<th class="px-4 py-3 font-medium">Plan</th>
						<th class="px-4 py-3 font-medium text-right">Miembros</th>
						<th class="px-4 py-3 font-medium text-right">Colonias</th>
						<th class="px-4 py-3 font-medium text-right">Gatos</th>
						<th class="px-4 py-3 font-medium">Estado</th>
						<th class="px-4 py-3 font-medium">Acciones</th>
					</tr>
				</thead>
				<tbody>
					{#each data.organizations as org}
						<tr class="border-b border-border/50 hover:bg-surface-sunken/50 transition-colors">
							<td class="px-4 py-3">
								<p class="font-medium text-text">{org.name}</p>
								<p class="text-xs text-text-muted">{org.slug}</p>
							</td>
							<td class="px-4 py-3 text-text-secondary">{org.country ?? 'ES'}</td>
							<td class="px-4 py-3">
								<form method="POST" action="?/updatePlan" class="inline">
									<input type="hidden" name="orgId" value={org.id} />
									<select name="plan" onchange="this.form.submit()" class="text-xs px-2 py-1 rounded-md border border-border bg-transparent {planColors[org.plan] ?? ''}">
										<option value="free" selected={org.plan === 'free'}>Free</option>
										<option value="standard" selected={org.plan === 'standard'}>Standard</option>
										<option value="professional" selected={org.plan === 'professional'}>Professional</option>
										<option value="enterprise" selected={org.plan === 'enterprise'}>Enterprise</option>
									</select>
								</form>
							</td>
							<td class="px-4 py-3 text-right text-text-secondary">{org.memberCount}</td>
							<td class="px-4 py-3 text-right text-text-secondary">{org.colonyCount}</td>
							<td class="px-4 py-3 text-right text-text-secondary">{org.catCount}</td>
							<td class="px-4 py-3">
								{#if org.isActive}
									<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-success/10 text-success">
										<span class="w-1.5 h-1.5 rounded-full bg-success"></span> Activa
									</span>
								{:else}
									<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-danger/10 text-danger">
										<span class="w-1.5 h-1.5 rounded-full bg-danger"></span> Suspendida
									</span>
								{/if}
							</td>
							<td class="px-4 py-3">
								<form method="POST" action="?/toggleOrg">
									<input type="hidden" name="orgId" value={org.id} />
									<input type="hidden" name="isActive" value={String(org.isActive)} />
									<button type="submit" class="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-surface-sunken transition-colors {org.isActive ? 'text-danger' : 'text-success'}">
										{org.isActive ? 'Suspender' : 'Activar'}
									</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

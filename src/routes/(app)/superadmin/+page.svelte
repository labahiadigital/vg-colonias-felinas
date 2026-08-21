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
		<h1 class="text-2xl font-bold text-text tracking-tight">{t(locale, 'superadmin.title')}</h1>
		<p class="text-sm text-text-muted mt-0.5">{t(locale, 'superadmin.subtitle')}</p>
	</div>

	<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
		<div class="bg-surface rounded-xl border border-border p-4 text-center">
			<p class="text-3xl font-bold text-primary">{data.globalStats.organizations}</p>
			<p class="text-xs text-text-muted mt-1">{t(locale, 'superadmin.organizations')}</p>
		</div>
		<div class="bg-surface rounded-xl border border-border p-4 text-center">
			<p class="text-3xl font-bold text-accent">{data.globalStats.users}</p>
			<p class="text-xs text-text-muted mt-1">{t(locale, 'superadmin.users')}</p>
		</div>
		<div class="bg-surface rounded-xl border border-border p-4 text-center">
			<p class="text-3xl font-bold text-info">{data.globalStats.colonies}</p>
			<p class="text-xs text-text-muted mt-1">{t(locale, 'superadmin.colonies')}</p>
		</div>
		<div class="bg-surface rounded-xl border border-border p-4 text-center">
			<p class="text-3xl font-bold text-success">{data.globalStats.cats}</p>
			<p class="text-xs text-text-muted mt-1">{t(locale, 'superadmin.cats')}</p>
		</div>
	</div>

	<div class="bg-surface rounded-xl border border-border overflow-hidden">
		<div class="p-4 border-b border-border">
			<h2 class="text-lg font-semibold text-text">{t(locale, 'superadmin.org_table_title')} ({data.organizations.length})</h2>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="text-left text-text-muted text-xs border-b border-border">
						<th class="px-4 py-3 font-medium">{t(locale, 'superadmin.col_org')}</th>
						<th class="px-4 py-3 font-medium">{t(locale, 'superadmin.col_country')}</th>
						<th class="px-4 py-3 font-medium">{t(locale, 'superadmin.col_plan')}</th>
						<th class="px-4 py-3 font-medium text-right">{t(locale, 'superadmin.col_members')}</th>
						<th class="px-4 py-3 font-medium text-right">{t(locale, 'superadmin.col_colonies')}</th>
						<th class="px-4 py-3 font-medium text-right">{t(locale, 'superadmin.col_cats')}</th>
						<th class="px-4 py-3 font-medium">{t(locale, 'superadmin.col_status')}</th>
						<th class="px-4 py-3 font-medium">{t(locale, 'superadmin.col_actions')}</th>
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
									<select name="plan" onchange={(e) => { if (e.currentTarget instanceof HTMLSelectElement) e.currentTarget.form?.submit(); }} class="text-xs px-2 py-1 rounded-md border border-border bg-transparent {planColors[org.plan] ?? ''}">
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
										<span class="w-1.5 h-1.5 rounded-full bg-success"></span> {t(locale, 'superadmin.active')}
									</span>
								{:else}
									<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-danger/10 text-danger">
										<span class="w-1.5 h-1.5 rounded-full bg-danger"></span> {t(locale, 'superadmin.suspended')}
									</span>
								{/if}
							</td>
							<td class="px-4 py-3">
								<form method="POST" action="?/toggleOrg">
									<input type="hidden" name="orgId" value={org.id} />
									<input type="hidden" name="isActive" value={String(org.isActive)} />
									<button type="submit" class="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-surface-sunken transition-colors {org.isActive ? 'text-danger' : 'text-success'}">
										{org.isActive ? t(locale, 'superadmin.suspend') : t(locale, 'superadmin.activate')}
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

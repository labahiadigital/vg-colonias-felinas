<script lang="ts">
	import { t, translateEntity, translateAction } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import { authClient } from '$lib/auth-client.js';
	import { formatAuditDetails } from '$lib/index.js';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);
	let user = $derived(data.user);

	let totpSetupUri = $state('');
	let totpSecret = $state('');
	let totpCode = $state('');
	let totpError = $state('');
	let totpSuccess = $state('');
	let totpLoading = $state(false);
	let showTotpSetup = $state(false);
	let backupCodes = $state<string[]>([]);

	async function enableTotp() {
		totpLoading = true;
		totpError = '';
		try {
			const res = await authClient.twoFactor.enable({ password: '' });
			if (res.data) {
				totpSetupUri = res.data.totpURI;
				totpSecret = new URL(res.data.totpURI).searchParams.get('secret') ?? '';
				backupCodes = res.data.backupCodes ?? [];
				showTotpSetup = true;
			} else {
			totpError = t(locale, 'settings.2fa_gen_error');
		}
	} catch {
		totpError = t(locale, 'settings.connection_error');
		} finally {
			totpLoading = false;
		}
	}

	async function verifyTotp() {
		totpLoading = true;
		totpError = '';
		try {
			const res = await authClient.twoFactor.verifyTotp({ code: totpCode });
			if (res.data) {
				totpSuccess = t(locale, 'settings.2fa_enabled_success');
				showTotpSetup = false;
			} else {
				totpError = t(locale, 'settings.2fa_invalid_code');
			}
		} catch {
			totpError = t(locale, 'settings.2fa_verify_error');
		} finally {
			totpLoading = false;
		}
	}

	async function disableTotp() {
		if (!confirm(t(locale, 'settings.2fa_disable_confirm'))) return;
		totpLoading = true;
		try {
			await authClient.twoFactor.disable({ password: '' });
			totpSuccess = t(locale, 'settings.2fa_disabled_success');
		} catch {
			totpError = t(locale, 'settings.2fa_disable_error');
		} finally {
			totpLoading = false;
		}
	}

	let activeSection = $state('profile');
	let isAdmin = $derived(data.isAdmin);
	let importResult = $state('');
	let permOverrides = $state<Map<string, boolean>>(new Map());

	function hasPerm(roleId: number, permissionId: number): boolean {
		const key = `${roleId}-${permissionId}`;
		if (permOverrides.has(key)) return permOverrides.get(key)!;
		return data.allRolePermissions.some(rp => rp.roleId === roleId && rp.permissionId === permissionId);
	}

	async function togglePermission(roleId: number, permissionId: number, currentlyHas: boolean) {
		const key = `${roleId}-${permissionId}`;
		permOverrides.set(key, !currentlyHas);
		permOverrides = new Map(permOverrides);

		const fd = new FormData();
		fd.set('roleId', String(roleId));
		fd.set('permissionId', String(permissionId));
		fd.set('permAction', currentlyHas ? 'remove' : 'add');
		try {
			await fetch('?/togglePermission', {
				method: 'POST',
				body: fd,
				headers: { 'x-sveltekit-action': 'true' }
			});
		} catch {
			permOverrides.set(key, currentlyHas);
			permOverrides = new Map(permOverrides);
		}
	}

	$effect(() => {
		if (data.allRolePermissions) {
			permOverrides = new Map();
		}
	});

	async function handleImport() {
		const entityEl = document.getElementById('importEntity');
		const entity = entityEl instanceof HTMLSelectElement ? entityEl.value : '';
		const fileInput = document.getElementById('importFile');
		const file = fileInput instanceof HTMLInputElement ? fileInput.files?.[0] : undefined;
		if (!file) { importResult = t(locale, 'settings.select_file'); return; }
		const fd = new FormData();
		fd.append('file', file);
		fd.append('entity', entity);
		importResult = t(locale, 'settings.importing');
		try {
			const res = await fetch('/api/import', { method: 'POST', body: fd });
			const d = await res.json();
			if (d.success) {
				importResult = `${t(locale, 'settings.imported')}: ${d.imported}/${d.totalRows}` + (d.errors?.length > 0 ? ` (${d.errors.length} ${t(locale, 'settings.errors')})` : '');
			} else {
				importResult = d.error || 'Error';
			}
		} catch { importResult = t(locale, 'settings.connection_error'); }
	}

	let sections = $derived([
		{ id: 'profile', label: t(locale, 'settings.profile') },
		{ id: 'preferences', label: t(locale, 'settings.preferences') },
		{ id: 'security', label: t(locale, 'settings.security') },
		...(isAdmin ? [
			{ id: 'users', label: t(locale, 'settings.users') },
			{ id: 'roles', label: t(locale, 'settings.roles') },
			{ id: 'catalogs', label: t(locale, 'settings.catalogs') },
			{ id: 'templates', label: t(locale, 'settings.templates') },
			{ id: 'email', label: t(locale, 'settings.email_notif') },
			{ id: 'retention', label: t(locale, 'settings.retention') },
			{ id: 'import', label: t(locale, 'settings.import_export') },
			{ id: 'audit', label: t(locale, 'settings.audit_log') }
		] : []),
		{ id: 'about', label: t(locale, 'settings.about') }
	]);

	

	

	

	const catalogTypeKeys: Record<string, string> = {
		colony_status: 'settings.cat_type.colony_status',
		colony_classification: 'settings.cat_type.colony_classification',
		cat_status: 'settings.cat_type.cat_status',
		incident_category: 'settings.cat_type.incident_category',
		incident_priority: 'settings.cat_type.incident_priority',
		health_type: 'settings.cat_type.health_type',
		adoption_status: 'settings.cat_type.adoption_status',
		collaborator_status: 'settings.cat_type.collaborator_status'
	};

	const catalogTypeValues = Object.keys(catalogTypeKeys);
</script>

<div class="max-w-7xl mx-auto">
	<h1 class="text-2xl font-bold text-text tracking-tight mb-6">{t(locale, 'settings.title')}</h1>

	<div class="flex flex-col lg:flex-row gap-6">
		<nav class="w-full lg:w-56 flex-shrink-0">
			<div class="bg-surface rounded-xl border border-border overflow-hidden lg:sticky lg:top-4">
				<div class="flex lg:flex-col overflow-x-auto lg:overflow-x-visible mobile-scroll-snap">
					{#each sections as section}
						<button
							onclick={() => activeSection = section.id}
							class="flex-shrink-0 px-4 py-3 text-left text-sm font-medium transition-colors min-h-[44px] whitespace-nowrap
								{activeSection === section.id ? 'bg-primary/5 text-primary border-b-2 lg:border-b-0 lg:border-l-2 border-primary' : 'text-text-secondary hover:bg-surface-sunken hover:text-text'}"
						>
							{section.label}
						</button>
					{/each}
				</div>
			</div>
		</nav>

		<div class="flex-1 min-w-0">
			{#if activeSection === 'profile'}
				<div class="bg-surface rounded-xl border border-border p-6">
					<h3 class="text-base font-semibold text-text mb-4">{t(locale, 'settings.user_profile')}</h3>
					{#if form?.success}<div class="bg-success-subtle text-success text-sm p-3 rounded-lg mb-4 border border-success/10">{t(locale, 'settings.profile_updated')}</div>{/if}
					{#if form?.error}<div class="bg-danger-subtle text-danger text-sm p-3 rounded-lg mb-4 border border-danger/10">{form.error}</div>{/if}

					<form method="POST" action="?/updateProfile" use:enhance>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label for="name" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'common.name')}</label>
								<input type="text" name="name" id="name" value={user?.name ?? ''} required class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[44px]" />
							</div>
							<div>
								<label for="email" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'common.email')}</label>
								<input type="email" id="email" value={user?.email ?? ''} disabled class="w-full px-3 py-2.5 bg-surface-sunken border border-border rounded-lg text-sm text-text-muted min-h-[44px]" />
							</div>
							<div>
								<label for="language" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'settings.language')}</label>
								<select name="language" id="language" class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[44px]">
									<option value="es" selected={user?.language === 'es'}>{t(locale, 'settings.lang_es')}</option>
									<option value="eu" selected={user?.language === 'eu'}>{t(locale, 'settings.lang_eu')}</option>
									<option value="ca" selected={user?.language === 'ca'}>{t(locale, 'settings.lang_ca')}</option>
									<option value="en" selected={user?.language === 'en'}>{t(locale, 'settings.lang_en')}</option>
								</select>
							</div>
							{#if data.userRole}
								<div>
									<span class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'settings.role')}</span>
									<div class="px-3 py-2.5 bg-surface-sunken border border-border rounded-lg text-sm text-text-secondary capitalize min-h-[44px] flex items-center">{data.userRole}</div>
								</div>
							{/if}
						</div>
						<div class="pt-5 mt-5 border-t border-border">
							<button type="submit" class="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors min-h-[44px]">{t(locale, 'settings.save')}</button>
						</div>
					</form>
				</div>
			{/if}

			{#if activeSection === 'preferences'}
				<div class="bg-surface rounded-xl border border-border p-6">
					<h3 class="text-base font-semibold text-text mb-4">{t(locale, 'settings.notification_prefs')}</h3>
					<div class="space-y-2">
						{#each [
							{ id: 'email_notifications', labelKey: 'settings.email_notifications', descKey: 'settings.email_notifications_desc', checked: true },
							{ id: 'daily_summary', labelKey: 'settings.daily_summary', descKey: 'settings.daily_summary_desc', checked: false },
							{ id: 'cer_alerts', labelKey: 'settings.cer_alerts', descKey: 'settings.cer_alerts_desc', checked: true },
							{ id: 'inspection_reminders', labelKey: 'settings.inspection_reminders', descKey: 'settings.inspection_reminders_desc', checked: true }
						] as pref}
							<label for={pref.id} class="flex items-center justify-between p-4 bg-surface-sunken rounded-lg cursor-pointer hover:bg-border transition-colors min-h-[56px]">
								<div>
									<p class="text-sm font-medium text-text">{t(locale, pref.labelKey)}</p>
									<p class="text-xs text-text-muted mt-0.5">{t(locale, pref.descKey)}</p>
								</div>
								<input type="checkbox" id={pref.id} checked={pref.checked} class="rounded border-border text-primary focus:ring-primary/20 w-5 h-5" />
							</label>
						{/each}
					</div>
				</div>
			{/if}

			{#if activeSection === 'security'}
				<div class="space-y-5">
					<div class="bg-surface rounded-xl border border-border p-6">
						<h3 class="text-base font-semibold text-text mb-4">{t(locale, 'settings.security')}</h3>
						<div class="space-y-3">
							<div class="p-4 bg-surface-sunken rounded-lg">
								<h4 class="text-sm font-medium text-text mb-1">{t(locale, 'settings.change_password')}</h4>
								<p class="text-xs text-text-muted mb-3">{t(locale, 'settings.change_password_desc')}</p>
								<a href="/recuperar-contrasena" class="text-sm text-primary font-medium hover:text-primary-hover transition-colors">{t(locale, 'settings.recover_password')} &rarr;</a>
							</div>
							<div class="p-4 bg-surface-sunken rounded-lg">
								<h4 class="text-sm font-medium text-text mb-1">{t(locale, 'settings.active_sessions')}</h4>
								<p class="text-xs text-text-muted">{t(locale, 'settings.active_sessions_desc')}</p>
							</div>
						</div>
					</div>

					<div class="bg-surface rounded-xl border border-border p-6">
						<div class="flex items-center gap-3 mb-4">
							<div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-5 h-5 text-accent"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
							</div>
							<div>
								<h3 class="text-base font-semibold text-text">{t(locale, 'settings.2fa')}</h3>
								<p class="text-xs text-text-muted">{t(locale, 'settings.2fa_desc')}</p>
							</div>
						</div>

						{#if totpError}
							<div class="bg-danger-subtle text-danger text-sm p-3 rounded-lg mb-4 border border-danger/10">{totpError}</div>
						{/if}
						{#if totpSuccess}
							<div class="bg-success-subtle text-success text-sm p-3 rounded-lg mb-4 border border-success/10">{totpSuccess}</div>
						{/if}

						{#if user?.twoFactorEnabled}
							<div class="flex items-center gap-3 p-4 bg-success/5 rounded-lg border border-success/10 mb-4">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 text-success flex-shrink-0"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
								<div>
									<p class="text-sm font-medium text-success">{t(locale, 'settings.2fa_active')}</p>
									<p class="text-xs text-text-muted mt-0.5">{t(locale, 'settings.2fa_active_desc')}</p>
								</div>
							</div>
							<button onclick={disableTotp} disabled={totpLoading} class="px-4 py-2 bg-danger/10 text-danger text-sm font-medium rounded-lg hover:bg-danger/20 transition-colors">
								{t(locale, 'settings.2fa_disable')}
							</button>
						{:else if showTotpSetup}
							<div class="space-y-4">
								<div class="p-4 bg-surface-sunken rounded-lg">
									<p class="text-sm font-medium text-text mb-3">{t(locale, 'settings.2fa_scan_qr')}</p>
									<div class="flex justify-center mb-4">
										<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={encodeURIComponent(totpSetupUri)}" alt="QR TOTP" class="rounded-lg border border-border" width="200" height="200" />
									</div>
									<details class="text-xs text-text-muted">
										<summary class="cursor-pointer hover:text-text transition-colors">{t(locale, 'settings.2fa_manual_key')}</summary>
										<code class="block mt-2 p-2 bg-background rounded font-mono text-xs break-all select-all">{totpSecret}</code>
									</details>
								</div>

								{#if backupCodes.length > 0}
									<div class="p-4 bg-warning/5 rounded-lg border border-warning/10">
										<p class="text-sm font-medium text-warning mb-2">{t(locale, 'settings.2fa_backup_codes')}</p>
										<p class="text-xs text-text-muted mb-3">{t(locale, 'settings.2fa_backup_codes_desc')}</p>
										<div class="grid grid-cols-2 gap-1.5">
											{#each backupCodes as code}
												<code class="px-2 py-1 bg-background rounded text-xs font-mono text-text text-center select-all">{code}</code>
											{/each}
										</div>
									</div>
								{/if}

								<div>
									<label for="totpCode" class="block text-sm font-medium text-text-secondary mb-1.5">{t(locale, 'settings.2fa_enter_code')}</label>
									<div class="flex gap-3">
										<input type="text" id="totpCode" bind:value={totpCode} maxlength="6" pattern="[0-9]{6}" placeholder="000000" class="w-32 px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-text text-center font-mono tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
										<button onclick={verifyTotp} disabled={totpLoading || totpCode.length !== 6} class="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50">
											{t(locale, 'settings.2fa_verify')}
										</button>
									</div>
								</div>
							</div>
						{:else}
							<div class="p-4 bg-surface-sunken rounded-lg mb-4">
								<p class="text-sm text-text-secondary">{t(locale, 'settings.2fa_recommend')}</p>
							</div>
							<button onclick={enableTotp} disabled={totpLoading} class="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 inline-flex items-center gap-2">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
								{t(locale, 'settings.2fa_enable')}
							</button>
						{/if}
					</div>

					<div class="bg-surface rounded-xl border border-border p-6">
						<h3 class="text-sm font-semibold text-text mb-3">{t(locale, 'settings.password_policy')}</h3>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
							<div class="flex justify-between p-3 bg-surface-sunken rounded-lg">
								<span class="text-text-muted">{t(locale, 'settings.min_length')}</span>
								<span class="font-medium text-text">12 {t(locale, 'settings.chars')}</span>
							</div>
							<div class="flex justify-between p-3 bg-surface-sunken rounded-lg">
								<span class="text-text-muted">{t(locale, 'settings.rotation')}</span>
								<span class="font-medium text-text">90 {t(locale, 'settings.days')}</span>
							</div>
							<div class="flex justify-between p-3 bg-surface-sunken rounded-lg">
								<span class="text-text-muted">{t(locale, 'settings.max_attempts')}</span>
								<span class="font-medium text-text">5</span>
							</div>
							<div class="flex justify-between p-3 bg-surface-sunken rounded-lg">
								<span class="text-text-muted">{t(locale, 'settings.lockout_time')}</span>
								<span class="font-medium text-text">30 min</span>
							</div>
						</div>
						<p class="text-xs text-text-muted mt-3">{t(locale, 'settings.ens_media_compliance')}</p>
					</div>
				</div>
			{/if}

			{#if activeSection === 'users' && isAdmin}
				<div class="bg-surface rounded-xl border border-border overflow-hidden">
					<div class="px-6 py-4 border-b border-border">
						<h3 class="text-base font-semibold text-text">{t(locale, 'settings.user_management')} ({data.allUsers.length})</h3>
					</div>
					{#if form?.roleSuccess}<div class="mx-6 mt-4 bg-success-subtle text-success text-sm p-3 rounded-lg border border-success/10">{t(locale, 'settings.role_assigned')}</div>{/if}
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead class="bg-surface-sunken text-text-muted text-left text-xs uppercase tracking-wide">
								<tr>
									<th class="px-4 py-3 font-medium">{t(locale, 'common.name')}</th>
									<th class="px-4 py-3 font-medium">{t(locale, 'common.email')}</th>
									<th class="px-4 py-3 font-medium">{t(locale, 'settings.role')}</th>
									<th class="px-4 py-3 font-medium">{t(locale, 'settings.registered')}</th>
									<th class="px-4 py-3 font-medium">{t(locale, 'settings.assign')}</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								{#each data.allUsers as u}
									<tr class="hover:bg-surface-sunken/50 transition-colors">
										<td class="px-4 py-3 font-medium text-text">{u.name}</td>
										<td class="px-4 py-3 text-text-secondary">{u.email}</td>
										<td class="px-4 py-3"><span class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/8 text-primary capitalize">{u.roleName || t(locale, 'settings.no_role')}</span></td>
										<td class="px-4 py-3 text-text-muted text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString(locale) : '-'}</td>
										<td class="px-4 py-3">
											<form method="POST" action="?/assignRole" use:enhance class="flex gap-1.5 items-center">
												<input type="hidden" name="userId" value={u.id} />
												<select name="roleId" class="px-2 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[32px]">
													{#each data.allRoles as r}
														<option value={r.id} selected={r.name === u.roleName}>{r.name}</option>
													{/each}
												</select>
												<button type="submit" class="px-2.5 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-hover transition-colors min-h-[32px]">OK</button>
											</form>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}

			{#if activeSection === 'roles' && isAdmin}
				<div class="space-y-5">
					<div class="bg-surface rounded-xl border border-border p-6">
						<h3 class="text-base font-semibold text-text mb-4">{t(locale, 'settings.system_roles')}</h3>
						{#if form?.roleCreated}<div class="bg-success-subtle text-success text-sm p-3 rounded-lg mb-4 border border-success/10">{t(locale, 'settings.role_created')}</div>{/if}

						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
							{#each data.allRoles as role}
								<div class="p-4 bg-surface-sunken rounded-lg border border-border">
									<h4 class="font-semibold text-sm text-text capitalize">{role.name}</h4>
									<p class="text-xs text-text-muted mt-1">{role.description || t(locale, 'settings.no_description')}</p>
									<p class="text-xs text-text-muted mt-2">{t(locale, 'settings.permissions_count')}: {data.allRolePermissions.filter(rp => rp.roleId === role.id).length}</p>
								</div>
							{/each}
						</div>

						<div class="border-t border-border pt-4">
							<h4 class="text-sm font-medium text-text mb-3">{t(locale, 'settings.create_role')}</h4>
							<form method="POST" action="?/createRole" use:enhance class="flex gap-3 items-end flex-wrap">
								<div>
									<label for="roleName" class="block text-xs font-medium text-text-muted mb-1.5">{t(locale, 'settings.role_name')}</label>
									<input type="text" name="name" id="roleName" required class="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[40px]" placeholder={t(locale, 'settings.role_name_placeholder')} />
								</div>
								<div class="flex-1 min-w-[200px]">
									<label for="roleDesc" class="block text-xs font-medium text-text-muted mb-1.5">{t(locale, 'settings.role_desc')}</label>
									<input type="text" name="description" id="roleDesc" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[40px]" placeholder={t(locale, 'settings.role_desc_placeholder')} />
								</div>
								<button type="submit" class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors min-h-[40px]">{t(locale, 'settings.create_role_btn')}</button>
							</form>
						</div>
					</div>

					<div class="bg-surface rounded-xl border border-border overflow-hidden">
						<div class="px-6 py-4 border-b border-border">
							<h3 class="text-base font-semibold text-text">{t(locale, 'settings.permissions_matrix')}</h3>
						</div>
						{#if data.allPermissions.length > 0}
							<div class="overflow-x-auto">
								<table class="w-full text-xs">
									<thead class="bg-surface-sunken text-text-muted text-left uppercase tracking-wide">
										<tr>
											<th class="px-3 py-3 font-medium">{t(locale, 'settings.module')}</th>
											<th class="px-3 py-3 font-medium">{t(locale, 'settings.action')}</th>
											{#each data.allRoles as role}
												<th class="px-3 py-3 font-medium text-center capitalize">{role.name}</th>
											{/each}
										</tr>
									</thead>
									<tbody class="divide-y divide-border">
										{#each data.allPermissions as perm}
											<tr class="hover:bg-surface-sunken/50 transition-colors">
												<td class="px-3 py-2 font-medium capitalize text-text-secondary">{perm.module}</td>
												<td class="px-3 py-2 text-text-secondary">{perm.action}</td>
												{#each data.allRoles as role}
													{@const has = hasPerm(role.id, perm.id)}
													<td class="px-3 py-2 text-center">
														<button
															type="button"
															onclick={() => togglePermission(role.id, perm.id, has)}
															class="inline-flex w-6 h-6 items-center justify-center rounded-full transition-colors cursor-pointer {has ? 'bg-success/10 text-success hover:bg-danger/10 hover:text-danger' : 'bg-surface-sunken text-text-muted hover:bg-success/10 hover:text-success'}"
														>
															{#if has}
																<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="w-3 h-3"><polyline points="20,6 9,17 4,12"/></svg>
															{:else}
																<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3"><path d="M18 6L6 18M6 6l12 12"/></svg>
															{/if}
														</button>
													</td>
												{/each}
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{:else}
							<p class="px-6 py-8 text-center text-text-muted text-sm">{t(locale, 'settings.no_permissions')}</p>
						{/if}
					</div>
				</div>
			{/if}

			{#if activeSection === 'catalogs' && isAdmin}
				<div class="bg-surface rounded-xl border border-border p-6">
					<h3 class="text-base font-semibold text-text mb-1">{t(locale, 'settings.configurable_catalogs')}</h3>
					<p class="text-xs text-text-muted mb-5">{t(locale, 'settings.catalogs_desc')}</p>

					{#if form?.catalogCreated}<div class="bg-success-subtle text-success text-sm p-3 rounded-lg mb-4 border border-success/10">{t(locale, 'settings.catalog_created')}</div>{/if}

				<form method="POST" action="?/createCatalog" use:enhance class="space-y-4 mb-6 p-4 bg-surface-sunken rounded-lg">
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<label for="catType" class="block text-xs font-medium text-text-muted mb-1">{t(locale, 'settings.catalog_type')}</label>
							<select name="type" id="catType" required class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[40px]">
								{#each catalogTypeValues as ctVal}
									<option value={ctVal}>{t(locale, catalogTypeKeys[ctVal] ?? ctVal)}</option>
								{/each}
							</select>
						</div>
						<div>
							<label for="catKey" class="block text-xs font-medium text-text-muted mb-1">{t(locale, 'settings.catalog_key')}</label>
							<input type="text" name="key" id="catKey" required class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[40px]" placeholder={t(locale, 'settings.catalog_key_placeholder')} />
						</div>
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
						<div>
							<label for="catLabel" class="block text-xs font-medium text-text-muted mb-1">{t(locale, 'settings.catalog_label_es')}</label>
							<input type="text" name="label" id="catLabel" required class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[40px]" placeholder={t(locale, 'settings.catalog_label_es_placeholder')} />
						</div>
						<div>
							<label for="catLabelEu" class="block text-xs font-medium text-text-muted mb-1">{t(locale, 'settings.catalog_label_eu')}</label>
							<input type="text" name="labelEu" id="catLabelEu" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[40px]" placeholder={t(locale, 'settings.catalog_label_eu_placeholder')} />
						</div>
						<div>
							<label for="catLabelCa" class="block text-xs font-medium text-text-muted mb-1">{t(locale, 'settings.catalog_label_ca')}</label>
							<input type="text" name="labelCa" id="catLabelCa" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[40px]" placeholder={t(locale, 'settings.catalog_label_ca_placeholder')} />
						</div>
						<div>
							<label for="catLabelEn" class="block text-xs font-medium text-text-muted mb-1">{t(locale, 'settings.catalog_label_en')}</label>
							<input type="text" name="labelEn" id="catLabelEn" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[40px]" placeholder={t(locale, 'settings.catalog_label_en_placeholder')} />
						</div>
					</div>
					<div>
						<button type="submit" class="px-6 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors min-h-[40px]">{t(locale, 'settings.add')}</button>
					</div>
				</form>

					{#if data.allCatalogs.length > 0}
						{@const groupedCatalogs = data.allCatalogs.reduce((acc: Record<string, typeof data.allCatalogs>, c) => {
							(acc[c.type] = acc[c.type] || []).push(c);
							return acc;
						}, {})}
						<div class="space-y-4">
							{#each Object.entries(groupedCatalogs) as [type, items]}
								<div class="border border-border rounded-lg overflow-hidden">
									<div class="px-4 py-2.5 bg-surface-sunken text-sm font-medium text-text-secondary">{catalogTypeKeys[type] ? t(locale, catalogTypeKeys[type] ?? type) : type}</div>
								<div class="overflow-x-auto">
									<table class="w-full text-sm">
										<thead class="bg-background text-text-muted text-left text-xs">
											<tr>
												<th class="px-3 py-2 font-medium">{t(locale, 'settings.catalog_key')}</th>
												<th class="px-3 py-2 font-medium">ES</th>
												<th class="px-3 py-2 font-medium">EU</th>
												<th class="px-3 py-2 font-medium">CA</th>
												<th class="px-3 py-2 font-medium">EN</th>
												<th class="px-3 py-2 font-medium text-center">{t(locale, 'common.status')}</th>
												<th class="px-3 py-2 font-medium"></th>
											</tr>
										</thead>
										<tbody class="divide-y divide-border">
											{#each items as item}
												<tr class="hover:bg-surface-sunken/50 transition-colors group">
													<td class="px-3 py-1.5 font-mono text-xs text-text-muted">{item.key}</td>
													<td class="px-3 py-1.5" colspan="4">
														<form method="POST" action="?/editCatalog" use:enhance class="flex gap-1">
															<input type="hidden" name="id" value={item.id} />
															<input type="text" name="label" value={item.label} class="w-full px-2 py-1 bg-transparent border border-transparent hover:border-border focus:border-primary rounded text-xs text-text focus:outline-none transition-colors" />
															<input type="text" name="labelEu" value={item.labelEu || ''} class="w-full px-2 py-1 bg-transparent border border-transparent hover:border-border focus:border-primary rounded text-xs text-text-muted focus:outline-none transition-colors" />
															<input type="text" name="labelCa" value={item.labelCa || ''} class="w-full px-2 py-1 bg-transparent border border-transparent hover:border-border focus:border-primary rounded text-xs text-text-muted focus:outline-none transition-colors" />
															<input type="text" name="labelEn" value={item.labelEn || ''} class="w-full px-2 py-1 bg-transparent border border-transparent hover:border-border focus:border-primary rounded text-xs text-text-muted focus:outline-none transition-colors" />
															<button type="submit" class="opacity-0 group-hover:opacity-100 p-1 rounded text-primary hover:bg-primary/8 transition-all flex-shrink-0" title={t(locale, 'common.save')}>
																<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5"><polyline points="20,6 9,17 4,12"/></svg>
															</button>
														</form>
													</td>
													<td class="px-3 py-1.5 text-center">
														<span class="inline-flex w-5 h-5 items-center justify-center rounded-full {item.isActive ? 'bg-success/10 text-success' : 'bg-surface-sunken text-text-muted'}">
															{#if item.isActive}
																<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="w-3 h-3"><polyline points="20,6 9,17 4,12"/></svg>
															{:else}
																<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3"><path d="M18 6L6 18M6 6l12 12"/></svg>
															{/if}
														</span>
													</td>
													<td class="px-3 py-1.5">
														<form method="POST" action="?/deleteCatalog" use:enhance onsubmit={(e: SubmitEvent) => { if (!confirm(t(locale, 'common.confirm_delete'))) e.preventDefault(); }}>
															<input type="hidden" name="id" value={item.id} />
															<button type="submit" class="opacity-0 group-hover:opacity-100 p-1 rounded text-danger hover:bg-danger/8 transition-all" title={t(locale, 'common.delete')}>
																<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3.5 h-3.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
															</button>
														</form>
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-text-muted text-sm">{t(locale, 'settings.no_catalogs')}</p>
					{/if}
				</div>
			{/if}

			{#if activeSection === 'import' && isAdmin}
				<div class="space-y-5">
					<div class="bg-surface rounded-xl border border-border p-6">
						<h3 class="text-base font-semibold text-text mb-1">{t(locale, 'settings.import_csv')}</h3>
						<p class="text-xs text-text-muted mb-4">{t(locale, 'settings.import_csv_desc')}</p>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
							<select id="importEntity" class="px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[44px]">
								<option value="colonies">{t(locale, 'settings.import_colonies')}</option>
								<option value="cats">{t(locale, 'settings.import_cats')}</option>
								<option value="collaborators">{t(locale, 'settings.import_collaborators')}</option>
								<option value="health">{t(locale, 'settings.import_health')}</option>
								<option value="incidents">{t(locale, 'settings.import_incidents')}</option>
							</select>
							<input type="file" id="importFile" accept=".csv,.txt" class="px-3 py-2.5 bg-background border border-border rounded-lg text-sm min-h-[44px]" />
							<button type="button" onclick={handleImport} class="md:col-span-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors min-h-[44px]">{t(locale, 'settings.import_btn')}</button>
						</div>
						{#if importResult}
							<p class="mt-3 text-sm text-text-secondary">{importResult}</p>
						{/if}
					</div>
					<div class="bg-surface rounded-xl border border-border p-6">
						<h3 class="text-base font-semibold text-text mb-4">{t(locale, 'settings.export_data')}</h3>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<a href="/api/export-full?format=json" target="_blank" class="block px-4 py-3 bg-surface-sunken rounded-lg text-center hover:bg-border transition-colors font-medium text-sm text-text-secondary min-h-[48px] flex items-center justify-center">{t(locale, 'settings.export_full_json')}</a>
							<a href="/api/export-full?format=csv" target="_blank" class="block px-4 py-3 bg-surface-sunken rounded-lg text-center hover:bg-border transition-colors font-medium text-sm text-text-secondary min-h-[48px] flex items-center justify-center">{t(locale, 'settings.export_full_csv')}</a>
						</div>
					</div>
				</div>
			{/if}

			{#if activeSection === 'audit' && isAdmin}
				<div class="bg-surface rounded-xl border border-border overflow-hidden">
					<div class="px-6 py-4 border-b border-border">
						<h3 class="text-base font-semibold text-text">{t(locale, 'settings.audit_log')}</h3>
						<p class="text-xs text-text-muted mt-0.5">{t(locale, 'settings.last_actions')}</p>
					</div>
					{#if data.auditLog && data.auditLog.length > 0}
						<div class="overflow-x-auto">
							<table class="w-full text-sm">
								<thead class="bg-surface-sunken text-text-muted text-left text-xs uppercase tracking-wide">
									<tr>
										<th class="px-4 py-3 font-medium">{t(locale, 'settings.date')}</th>
										<th class="px-4 py-3 font-medium">{t(locale, 'settings.user')}</th>
										<th class="px-4 py-3 font-medium">{t(locale, 'settings.entity')}</th>
										<th class="px-4 py-3 font-medium">{t(locale, 'settings.action')}</th>
										<th class="px-4 py-3 font-medium">{t(locale, 'settings.details')}</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-border">
									{#each data.auditLog as log}
										<tr class="hover:bg-surface-sunken/50 transition-colors">
											<td class="px-4 py-3 text-xs text-text-muted">{log.createdAt ? new Date(log.createdAt).toLocaleString(locale) : '-'}</td>
											<td class="px-4 py-3 text-text-secondary">{log.userName ?? '-'}</td>
											<td class="px-4 py-3 text-text-secondary">{translateEntity(locale, log.entity)}</td>
											<td class="px-4 py-3">
												<span class="px-2 py-0.5 rounded-md text-[11px] font-medium
													{log.action === 'create' ? 'bg-success/8 text-success' :
													log.action === 'delete' ? 'bg-danger/8 text-danger' :
													log.action === 'export' ? 'bg-info/8 text-info' :
													'bg-surface-sunken text-text-secondary'}">
													{translateAction(locale, log.action)}
												</span>
											</td>
											<td class="px-4 py-3 text-xs text-text-muted max-w-xs truncate">{formatAuditDetails(log.details, '-')}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<p class="px-6 py-12 text-center text-text-muted text-sm">{t(locale, 'settings.no_audit')}</p>
					{/if}
				</div>
			{/if}

			{#if activeSection === 'templates' && isAdmin}
				<div class="bg-surface rounded-xl border border-border p-6">
					<h3 class="text-base font-semibold text-text mb-4">{t(locale, 'settings.inspection_templates')}</h3>
					{#if data.allInspectionTemplates.length > 0}
						<div class="space-y-2 mb-4">
							{#each data.allInspectionTemplates as tpl}
								<div class="flex items-center justify-between p-3 bg-surface-sunken rounded-lg">
									<div>
										<p class="text-sm font-medium text-text">{tpl.name}</p>
										<p class="text-xs text-text-muted">{tpl.description || t(locale, 'settings.no_description')}</p>
									</div>
									<span class="text-xs font-medium {tpl.isActive ? 'text-success' : 'text-text-muted'}">{tpl.isActive ? t(locale, 'settings.active_tpl') : t(locale, 'settings.inactive_tpl')}</span>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-text-muted mb-4">{t(locale, 'settings.no_templates')}</p>
					{/if}
					<form method="POST" action="?/createInspectionTemplate" use:enhance class="grid grid-cols-1 gap-3 pt-4 border-t border-border">
						<input type="text" name="name" placeholder={t(locale, 'settings.tpl_name_placeholder')} required class="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[40px]" />
						<input type="text" name="description" placeholder={t(locale, 'settings.tpl_desc_placeholder')} class="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[40px]" />
						<textarea name="schema" placeholder={t(locale, 'settings.tpl_schema_placeholder')} rows="3" required class="px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"></textarea>
						<button type="submit" class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors min-h-[40px] w-fit">{t(locale, 'settings.create_template')}</button>
					</form>
				</div>
			{/if}

			{#if activeSection === 'email' && isAdmin}
				<div class="bg-surface rounded-xl border border-border p-6">
					<h3 class="text-base font-semibold text-text mb-4">{t(locale, 'settings.email_templates')}</h3>
					{#if data.allEmailTemplates.length > 0}
						<div class="space-y-2 mb-4">
							{#each data.allEmailTemplates as et}
								<div class="p-3 bg-surface-sunken rounded-lg">
									<p class="text-sm font-medium text-text">{et.key} — {et.subject}</p>
									<p class="text-xs text-text-muted">{et.locale}</p>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-text-muted mb-4">{t(locale, 'settings.no_email_templates')}</p>
					{/if}
					<form method="POST" action="?/createEmailTemplate" use:enhance class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-border">
						<select name="key" required class="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[40px]">
							<option value="incident_status">{t(locale, 'settings.email_key.incident_status')}</option>
							<option value="incident_assigned">{t(locale, 'settings.email_key.incident_assigned')}</option>
							<option value="adoption_status">{t(locale, 'settings.email_key.adoption_status')}</option>
							<option value="collaborator_status">{t(locale, 'settings.email_key.collaborator_status')}</option>
							<option value="welcome">{t(locale, 'settings.email_key.welcome')}</option>
							<option value="password_reset">{t(locale, 'settings.email_key.password_reset')}</option>
						</select>
						<input type="text" name="subject" placeholder={t(locale, 'settings.email_tpl_subject')} required class="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[40px]" />
						<textarea name="bodyHtml" placeholder={t(locale, 'settings.email_tpl_body')} rows="4" required class="md:col-span-2 px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"></textarea>
						<button type="submit" class="md:col-span-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors min-h-[40px] w-fit">{t(locale, 'settings.create_email_template')}</button>
					</form>
				</div>
			{/if}

			{#if activeSection === 'retention' && isAdmin}
				<div class="bg-surface rounded-xl border border-border p-6">
					<h3 class="text-base font-semibold text-text mb-1">{t(locale, 'settings.retention_policies')}</h3>
					<p class="text-xs text-text-muted mb-4">{t(locale, 'settings.retention_desc')}</p>
					{#if data.allRetentionPolicies.length > 0}
						<div class="overflow-x-auto mb-4">
							<table class="w-full text-sm">
								<thead class="text-left text-xs text-text-muted uppercase tracking-wide border-b border-border"><tr><th class="p-2 font-medium">{t(locale, 'settings.entity')}</th><th class="p-2 font-medium">{t(locale, 'settings.retention')}</th><th class="p-2 font-medium">{t(locale, 'settings.action')}</th></tr></thead>
								<tbody class="divide-y divide-border">
									{#each data.allRetentionPolicies as rp}
										<tr><td class="p-2 font-medium text-text">{rp.entity}</td><td class="p-2 text-text-secondary">{rp.retentionDays} {t(locale, 'settings.retention_days')}</td><td class="p-2 text-text-secondary capitalize">{rp.action}</td></tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
					<form method="POST" action="?/saveRetentionPolicy" use:enhance class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-border">
						<select name="entity" required class="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[40px]">
							<option value="colonies">{t(locale, 'settings.import_colonies')}</option>
							<option value="cats">{t(locale, 'settings.import_cats')}</option>
							<option value="health_records">{t(locale, 'settings.import_health')}</option>
							<option value="incidents">{t(locale, 'settings.import_incidents')}</option>
							<option value="collaborators">{t(locale, 'settings.import_collaborators')}</option>
							<option value="adoptions">{t(locale, 'nav.adoptions')}</option>
							<option value="audit_logs">{t(locale, 'settings.audit_log')}</option>
							<option value="messages">{t(locale, 'nav.messages')}</option>
						</select>
						<input type="number" name="retentionDays" placeholder={t(locale, 'settings.retention_days_placeholder')} required class="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[40px]" />
						<select name="retentionAction" class="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[40px]">
							<option value="anonymize">{t(locale, 'settings.retention_anonymize')}</option>
							<option value="delete">{t(locale, 'settings.retention_delete')}</option>
							<option value="archive">{t(locale, 'settings.retention_archive')}</option>
						</select>
						<button type="submit" class="md:col-span-3 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors min-h-[40px] w-fit">{t(locale, 'settings.save_policy')}</button>
					</form>
				</div>
			{/if}

			{#if activeSection === 'about'}
				<div class="bg-surface rounded-xl border border-border p-6">
					<h3 class="text-base font-semibold text-text mb-4">{t(locale, 'settings.about_app')}</h3>
					<dl class="space-y-3">
						<div class="flex justify-between text-sm border-b border-border pb-2"><dt class="text-text-muted">{t(locale, 'settings.app_name')}</dt><dd class="font-medium text-text">{t(locale, 'settings.app_full_name')}</dd></div>
						<div class="flex justify-between text-sm border-b border-border pb-2"><dt class="text-text-muted">{t(locale, 'settings.version')}</dt><dd class="font-medium text-text">2.0.0-saas</dd></div>
						<div class="flex justify-between text-sm border-b border-border pb-2"><dt class="text-text-muted">{t(locale, 'settings.file_number')}</dt><dd class="font-medium text-text">2026/CO_ASUM/0013</dd></div>
						<div class="flex justify-between text-sm border-b border-border pb-2"><dt class="text-text-muted">{t(locale, 'settings.regulation')}</dt><dd class="font-medium text-text">RGPD / LOPDGDD / Ley 6/1993</dd></div>
						<div class="flex justify-between text-sm border-b border-border pb-2"><dt class="text-text-muted">{t(locale, 'settings.languages')}</dt><dd class="font-medium text-text">{t(locale, 'settings.lang_es')} / {t(locale, 'settings.lang_eu')} / {t(locale, 'settings.lang_ca')} / {t(locale, 'settings.lang_en')}</dd></div>
						<div class="flex justify-between text-sm border-b border-border pb-2"><dt class="text-text-muted">{t(locale, 'settings.database')}</dt><dd class="font-medium text-text">PostgreSQL (Neon - UE)</dd></div>
						<div class="flex justify-between text-sm"><dt class="text-text-muted">Framework</dt><dd class="font-medium text-text">SvelteKit + TypeScript</dd></div>
					</dl>
				</div>
			{/if}
		</div>
	</div>
</div>

<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);
	let col = $derived(data.collaborator);

	let showCredential = $state(false);

	const verifyUrl = $derived(
		col.verificationHash
			? `${typeof window !== 'undefined' ? window.location.origin : ''}/api/verificar/${col.verificationHash}`
			: null
	);
	const qrUrl = $derived(
		verifyUrl
			? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verifyUrl)}&bgcolor=ffffff&color=1e293b&margin=8`
			: null
	);

	function statusConfig(s: string) {
		const map: Record<string, { dot: string; bg: string; label: string }> = {
			active: { dot: 'bg-success', bg: 'bg-success/8 text-success', label: t(locale, 'collaborators.status.active') },
			pending: { dot: 'bg-warning', bg: 'bg-warning/8 text-warning', label: t(locale, 'collaborators.status.pending') },
			inactive: { dot: 'bg-text-muted', bg: 'bg-surface-sunken text-text-muted', label: t(locale, 'collaborators.status.inactive') },
			suspended: { dot: 'bg-danger', bg: 'bg-danger/8 text-danger', label: t(locale, 'collaborators.status.suspended') }
		};
		return map[s] ?? { dot: 'bg-text-muted', bg: 'bg-surface-sunken text-text-muted', label: s };
	}

	function printCredential() {
		window.print();
	}
</script>

<svelte:head>
	<style>
		{'@media print { body * { visibility: hidden; } #credential-card, #credential-card * { visibility: visible; } #credential-card { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 400px; } }'}
	</style>
</svelte:head>

<div class="max-w-7xl mx-auto">
	<a href="/colaboradores" class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-4">
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M19 12H5m0 0l7 7m-7-7l7-7"/></svg>
		{t(locale, 'collaborators.back_to')}
	</a>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Profile Card -->
		<div class="lg:col-span-2 bg-surface rounded-xl border border-border p-6">
			<div class="flex items-start justify-between mb-6">
				<div class="flex items-center gap-4">
					<div class="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
						{col.name.charAt(0).toUpperCase()}
					</div>
					<div>
						<h1 class="text-xl font-bold text-text tracking-tight">{col.name}</h1>
						<p class="text-sm text-text-muted">{col.documentId ?? t(locale, 'collaborators.no_document')}</p>
					</div>
				</div>
				<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium {statusConfig(col.status).bg}">
					<span class="w-1.5 h-1.5 rounded-full {statusConfig(col.status).dot}"></span>{statusConfig(col.status).label}
				</span>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
				<div class="p-4 bg-surface-sunken rounded-lg">
					<p class="text-xs font-medium text-text-muted mb-1">{t(locale, 'collaborators.validity')}</p>
					<p class="text-sm font-medium text-text">{col.validUntil ?? t(locale, 'collaborators.indefinite')}</p>
				</div>
				<div class="p-4 bg-surface-sunken rounded-lg">
					<p class="text-xs font-medium text-text-muted mb-1">{t(locale, 'collaborators.lopd_signed')}</p>
					<p class="text-sm font-medium text-text inline-flex items-center gap-1.5">
						{#if col.privacyNoticeSigned}
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-success"><polyline points="20,6 9,17 4,12"/></svg> {t(locale, 'common.yes')}
						{:else}
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-danger"><path d="M18 6L6 18M6 6l12 12"/></svg> {t(locale, 'common.no')}
						{/if}
					</p>
				</div>
			</div>

			{#if !col.privacyNoticeSigned}
				<div class="p-4 bg-warning-subtle border border-warning/20 rounded-xl mb-6">
					<p class="text-sm font-medium text-text mb-1">{t(locale, 'collaborators.privacy_notice_pending')}</p>
					<p class="text-xs text-text-secondary mb-3">{t(locale, 'collaborators.privacy_notice_desc')}</p>
					<form method="POST" action="?/signPrivacy" use:enhance>
						<button type="submit" class="px-4 py-2 bg-warning text-white text-sm font-medium rounded-lg hover:bg-warning/90 transition-colors min-h-[40px]">{t(locale, 'collaborators.register_lopd')}</button>
					</form>
				</div>
			{/if}

			<div>
				<h3 class="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">{t(locale, 'collaborators.assigned_colonies')}</h3>
				{#if data.assignedColonies.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each data.assignedColonies as c}
							<a href="/colonias/{c.id}" class="inline-flex items-center gap-1.5 px-3 py-2 bg-primary/8 text-primary rounded-lg text-sm font-medium hover:bg-primary/12 transition-colors min-h-[40px]">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3.5 h-3.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
								{c.name}
							</a>
						{/each}
					</div>
				{:else}
					<p class="text-text-muted text-sm">{t(locale, 'collaborators.no_colonies')}</p>
				{/if}
			</div>
		</div>

		<!-- Credential Card (Professional Digital ID) -->
		<div>
			<div class="bg-surface rounded-xl border border-border p-5">
				<div class="flex items-center justify-between mb-3">
					<h3 class="text-sm font-semibold text-text">{t(locale, 'collaborators.digital_credential')}</h3>
					{#if col.status === 'active'}
						<span class="text-[10px] text-success font-medium flex items-center gap-1">
							<span class="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>{t(locale, 'collaborators.credential_valid')}
						</span>
					{/if}
				</div>

				{#if col.status !== 'active'}
					<div class="p-4 bg-warning/5 border border-warning/20 rounded-lg">
						<p class="text-xs text-text-muted">{t(locale, 'collaborators.credential_only_active')}</p>
					</div>
				{:else}
					<button onclick={() => showCredential = !showCredential} class="w-full px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors mb-3 min-h-[44px] flex items-center justify-center gap-2">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h4v4H7z"/><path d="M13 8h4"/><path d="M13 12h4"/><path d="M7 16h10"/></svg>
						{showCredential ? t(locale, 'collaborators.hide_credential') : t(locale, 'collaborators.view_credential')}
					</button>

					{#if showCredential}
						<div id="credential-card" class="rounded-2xl overflow-hidden shadow-lg border border-primary/20">
							<!-- Header gradient -->
							<div class="bg-gradient-to-r from-sidebar via-primary to-sidebar px-5 py-4 relative overflow-hidden">
								<div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
								<div class="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
								<div class="relative z-10">
									<div class="flex items-center justify-between">
										<div>
											<p class="font-bold text-sm text-white tracking-wider">KOLONIA</p>
											<p class="text-[10px] text-white/70 mt-0.5">{t(locale, 'collaborators.credential_subtitle')}</p>
										</div>
										<div class="w-8 h-8 bg-white/15 backdrop-blur rounded-lg flex items-center justify-center">
											<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" class="w-4 h-4"><path d="M9 12l2 2 4-4"/><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/></svg>
										</div>
									</div>
								</div>
							</div>

							<!-- Body -->
							<div class="bg-surface px-5 py-4">
								<div class="flex items-start gap-4">
									<!-- Avatar + Info -->
									<div class="flex-1">
										<div class="flex items-center gap-3 mb-3">
											<div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary text-lg font-bold shadow-sm">
												{col.name.charAt(0).toUpperCase()}
											</div>
											<div class="min-w-0">
												<p class="font-bold text-sm text-text truncate">{col.name}</p>
												<p class="text-[10px] text-text-muted font-mono mt-0.5">N.º {col.id.slice(0, 8).toUpperCase()}</p>
											</div>
										</div>
										<div class="space-y-1.5 text-[11px] text-text-secondary">
											<div class="flex items-center gap-1.5">
												<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3 h-3 text-text-muted flex-shrink-0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
												<span class="truncate">{data.assignedColonies.map(c => c.name).join(', ') || t(locale, 'collaborators.no_assigned')}</span>
											</div>
											<div class="flex items-center gap-1.5">
												<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3 h-3 text-text-muted flex-shrink-0"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
												<span>{t(locale, 'collaborators.valid_until_label')}: {col.validUntil ? new Date(col.validUntil).toLocaleDateString(locale === 'eu' ? 'eu' : locale === 'ca' ? 'ca' : locale === 'en' ? 'en-GB' : 'es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : t(locale, 'collaborators.indefinite')}</span>
											</div>
										</div>
									</div>
									<!-- QR Code -->
									<div class="flex-shrink-0">
										{#if qrUrl}
											<div class="w-[90px] h-[90px] rounded-lg overflow-hidden border border-border bg-white p-1">
												<img src={qrUrl} alt={t(locale, 'collaborators.qr_alt')} class="w-full h-full" loading="lazy" />
											</div>
											<p class="text-[8px] text-text-muted text-center mt-1 font-medium">{t(locale, 'collaborators.scan_to_verify')}</p>
										{:else}
											<div class="w-[90px] h-[90px] rounded-lg bg-surface-sunken border border-border flex items-center justify-center">
												<p class="text-[8px] text-text-muted text-center px-1">{t(locale, 'collaborators.qr_unavailable')}</p>
											</div>
										{/if}
									</div>
								</div>
							</div>

							<!-- Footer -->
							<div class="bg-surface-sunken px-5 py-2.5 border-t border-border flex items-center justify-between">
								<p class="text-[9px] text-text-muted">{t(locale, 'collaborators.app_footer')} · Vitoria-Gasteiz</p>
								<div class="flex items-center gap-1">
									<span class="w-1 h-1 rounded-full bg-success"></span>
									<span class="text-[8px] text-success font-semibold">{t(locale, 'collaborators.verified')}</span>
								</div>
							</div>
						</div>

						{#if verifyUrl}
							<div class="mt-3 p-3 bg-surface-sunken rounded-lg">
								<p class="text-[10px] text-text-muted font-medium mb-1">{t(locale, 'collaborators.public_url')}</p>
								<div class="flex items-center gap-2">
									<input type="text" readonly value={verifyUrl} class="flex-1 text-[11px] font-mono text-text-secondary bg-surface border border-border rounded px-2 py-1.5 select-all" />
									<button onclick={() => navigator.clipboard.writeText(verifyUrl || '')} class="px-2.5 py-1.5 bg-primary/10 text-primary text-[10px] font-medium rounded hover:bg-primary/15 transition-colors whitespace-nowrap">
										{t(locale, 'collaborators.copy')}
									</button>
								</div>
							</div>
						{/if}

						<div class="flex gap-2 mt-3">
							<button onclick={printCredential} class="flex-1 px-3 py-2.5 bg-surface-sunken text-text-secondary rounded-lg text-xs font-medium hover:bg-border transition-colors min-h-[40px] flex items-center justify-center gap-1.5">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
								{t(locale, 'collaborators.print')}
							</button>
							<a href="/api/credencial/{col.id}" target="_blank" class="flex-1 px-3 py-2.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/15 transition-colors text-center min-h-[40px] flex items-center justify-center gap-1.5">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
								{t(locale, 'collaborators.download_pdf')}
							</a>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
</div>

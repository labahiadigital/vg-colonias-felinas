<script lang="ts">
	import { t, localeNames } from '$lib/i18n/index.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const locale = data.locale;

	let email = $state('');
	let sent = $state(false);
	let loading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		try {
			await fetch('/api/auth/forget-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, redirectTo: '/login' })
			});
		} catch {
			// Always show success to avoid email enumeration
		}
		sent = true;
		loading = false;
	}
</script>

<div class="min-h-screen bg-background flex items-center justify-center p-4">
	<div class="w-full max-w-md">
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
			<h1 class="text-2xl font-bold text-text tracking-tight">{t(locale, 'auth.recovery.title')}</h1>
			<p class="text-sm text-text-muted mt-1">{t(locale, 'auth.recovery.description')}</p>
		</div>

		<div class="bg-surface rounded-xl border border-border p-6 sm:p-8">
			{#if sent}
				<div class="bg-success-subtle text-success text-sm p-4 rounded-lg mb-4 border border-success/10 text-center">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 mx-auto mb-2"><circle cx="12" cy="12" r="10"/><polyline points="20,6 9,17 4,12"/></svg>
					{t(locale, 'auth.recovery.success')}
				</div>
			{/if}

			<form onsubmit={handleSubmit}>
				<div class="mb-4">
					<label for="identifier" class="block text-sm font-medium text-text-secondary mb-1.5">
						{t(locale, 'auth.email')}
					</label>
					<input
						type="text"
						id="identifier"
						bind:value={email}
						placeholder="usuario@ejemplo.org"
						required
						class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[44px]"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 min-h-[44px]"
				>
					{#if loading}
						<svg class="w-4 h-4 animate-spin mx-auto" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.2"/><path d="M12 2a10 10 0 019.95 9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
					{:else}
						{t(locale, 'auth.recovery.send')}
					{/if}
				</button>
			</form>

			<a href="/login" class="block text-center mt-5 text-sm text-primary font-medium hover:text-primary-hover transition-colors">
				{t(locale, 'auth.recovery.back')}
			</a>
		</div>

		<div class="flex justify-center gap-3 text-xs text-text-muted mt-6">
			<a href="/privacidad" class="hover:text-text-secondary transition-colors">Privacidad</a>
			<span>·</span>
			<a href="/terminos" class="hover:text-text-secondary transition-colors">Términos</a>
		</div>
	</div>
</div>

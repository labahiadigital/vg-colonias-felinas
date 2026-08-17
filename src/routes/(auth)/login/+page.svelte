<script lang="ts">
	import { authClient } from '$lib/auth-client.js';
	import { goto } from '$app/navigation';
	import { t, localeNames } from '$lib/i18n/index.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	let locale = $derived(data.locale);

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleLogin(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			const result = await authClient.signIn.email({ email, password });
			if (result.error) {
				error = result.error.message ?? 'Error de autenticación';
			} else {
				await goto('/dashboard');
			}
		} catch {
			error = 'Error de conexión. Inténtelo de nuevo.';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex-1 flex items-center justify-center p-4 bg-background min-h-screen">
	<div class="w-full max-w-sm">
		<!-- Language switcher -->
		<div class="flex justify-center gap-1 mb-8">
			{#each Object.entries(localeNames) as [code, name]}
				<a
					href="?locale={code}"
					class="px-2.5 py-1 text-xs font-medium rounded-md transition-colors
						{locale === code ? 'bg-text text-text-inverse' : 'text-text-muted hover:text-text hover:bg-surface-sunken'}"
				>
					{name}
				</a>
			{/each}
		</div>

		<!-- Logo + title -->
		<div class="text-center mb-8">
			<div class="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
				<svg viewBox="0 0 32 32" fill="none" class="w-8 h-8">
					<path d="M16 4C11.58 4 8 7.58 8 12c0 6 8 14 8 14s8-8 8-14c0-4.42-3.58-8-8-8z" fill="white"/>
					<path d="M12 8.5L10 5.5 13 7.5z" fill="white" stroke="white" stroke-width="0.3" stroke-linejoin="round"/>
					<path d="M20 8.5L22 5.5 19 7.5z" fill="white" stroke="white" stroke-width="0.3" stroke-linejoin="round"/>
					<ellipse cx="14" cy="11" rx="0.9" ry="1.1" fill="#0f766e"/>
					<ellipse cx="18" cy="11" rx="0.9" ry="1.1" fill="#0f766e"/>
					<path d="M15.5 13L16 12.5l0.5 0.5" stroke="#0f766e" stroke-width="0.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
				</svg>
			</div>
			<h1 class="text-xl font-bold text-text tracking-tight">Gatopolis</h1>
			<p class="text-sm text-text-muted mt-1">{t(locale, 'app.subtitle')}</p>
		</div>

		<!-- Login card -->
		<div class="bg-surface rounded-xl border border-border p-6">
			<form onsubmit={handleLogin}>
				{#if error}
					<div class="flex items-start gap-2 bg-danger-subtle text-danger text-sm p-3 rounded-lg mb-4 border border-danger/10">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
						<span>{error}</span>
					</div>
				{/if}

				<div class="space-y-4">
					<div>
						<label for="email" class="block text-sm font-medium text-text-secondary mb-1.5">
							{t(locale, 'auth.email')}
						</label>
						<input
							type="email"
							id="email"
							bind:value={email}
							placeholder="tu@organizacion.org"
							required
							class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
						/>
					</div>

					<div>
						<div class="flex items-center justify-between mb-1.5">
							<label for="password" class="block text-sm font-medium text-text-secondary">
								{t(locale, 'auth.password')}
							</label>
							<a href="/recuperar-contrasena" class="text-xs text-primary hover:text-primary-hover font-medium transition-colors">
								{t(locale, 'auth.forgot')}
							</a>
						</div>
						<input
							type="password"
							id="password"
							bind:value={password}
							placeholder="••••••••"
							required
							class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
						/>
					</div>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full mt-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if loading}
						<span class="inline-flex items-center gap-2">
							<svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="31.4 31.4" stroke-linecap="round"/></svg>
							{t(locale, 'common.loading')}
						</span>
					{:else}
						{t(locale, 'auth.login')}
					{/if}
				</button>
			</form>
		</div>

		<div class="text-center mt-6">
			<p class="text-sm text-text-muted">
				¿Nueva organización?
				<a href="/registro" class="text-primary hover:text-primary-hover font-medium transition-colors">Registrarse</a>
			</p>
		</div>

		<div class="flex justify-center gap-3 mt-8 text-xs text-text-muted">
			<a href="/privacidad" class="hover:text-text-secondary transition-colors">Privacidad</a>
			<span>·</span>
			<a href="/terminos" class="hover:text-text-secondary transition-colors">Términos</a>
		</div>
	</div>
</div>

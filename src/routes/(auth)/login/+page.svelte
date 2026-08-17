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

<div class="flex-1 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<div class="bg-white rounded-lg shadow-lg border-t-4 border-primary p-8">
			<!-- Language switcher -->
			<div class="flex justify-end gap-2 mb-6">
				{#each Object.entries(localeNames) as [code, name]}
					<a
						href="?locale={code}"
						class="text-sm font-semibold {locale === code ? 'text-gray-800 underline' : 'text-primary hover:underline'}"
					>
						{name}
					</a>
					{#if code !== 'eu'}
						<span class="text-gray-400">|</span>
					{/if}
				{/each}
			</div>

			<!-- Logo -->
			<div class="text-center mb-8">
				<div class="w-44 h-16 bg-gray-100 mx-auto mb-4 flex items-center justify-center font-bold text-gray-500 border border-dashed border-gray-300 rounded">
					AYTO. VITORIA-GASTEIZ
				</div>
				<h2 class="text-xl font-bold text-primary">{t(locale, 'app.title')}</h2>
				<p class="text-sm text-gray-500 mt-1">{t('eu', 'app.title')}</p>
			</div>

			<!-- Login form -->
			<form onsubmit={handleLogin}>
				{#if error}
					<div class="bg-danger-light text-danger text-sm p-3 rounded-md mb-4">
						{error}
					</div>
				{/if}

				<div class="mb-4">
					<label for="email" class="block text-sm font-semibold mb-2">
						{t(locale, 'auth.email')} / {t('eu', 'auth.email')}
					</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						placeholder="ejemplo@vitoria-gasteiz.org"
						required
						class="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
					/>
				</div>

				<div class="mb-6">
					<label for="password" class="block text-sm font-semibold mb-2">
						{t(locale, 'auth.password')} / {t('eu', 'auth.password')}
					</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						placeholder="••••••••"
						required
						class="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full py-3 bg-primary text-white font-bold rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if loading}
						{t(locale, 'common.loading')}
					{:else}
						{t(locale, 'auth.login')} / {t('eu', 'auth.login')}
					{/if}
				</button>
			</form>

			<div class="text-center mt-6">
				<a href="/recuperar-contrasena" class="text-sm text-primary hover:underline">
					{t(locale, 'auth.forgot')} / {t('eu', 'auth.forgot')}
				</a>
			</div>
		</div>

		<div class="text-center mt-6">
			<a href="/registro" class="text-sm text-primary font-semibold hover:underline">¿Nueva entidad? Registrar organización</a>
		</div>
		<div class="flex justify-center gap-4 mt-4 text-xs text-gray-400">
			<a href="/privacidad" class="hover:text-gray-600 hover:underline">Privacidad</a>
			<span>·</span>
			<a href="/terminos" class="hover:text-gray-600 hover:underline">Términos</a>
		</div>

		<p class="text-center text-xs text-gray-400 mt-3">
			{t(locale, 'app.expediente')} - {t(locale, 'app.title')}
		</p>
	</div>
</div>

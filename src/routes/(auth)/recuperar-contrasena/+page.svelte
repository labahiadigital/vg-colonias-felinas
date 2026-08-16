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

<div class="flex-1 flex flex-col">
	<!-- Header -->
	<header class="bg-white border-b-2 border-primary px-5 py-3 flex items-center justify-between">
		<div class="flex items-center gap-2 font-bold text-primary text-lg">
			<span>VG</span>
			<span>{t(locale, 'app.subtitle')}</span>
		</div>
		<div class="flex gap-1.5">
			{#each Object.entries(localeNames) as [code, name]}
				<span
					class="text-xs px-2 py-1 rounded border cursor-pointer
						{locale === code
							? 'bg-primary text-white border-primary'
							: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}"
				>
					{code.toUpperCase()}
				</span>
			{/each}
		</div>
	</header>

	<!-- Recovery form -->
	<div class="flex-1 flex items-center justify-center p-5">
		<div class="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
			<h1 class="text-2xl font-bold text-primary mb-2 border-b border-gray-100 pb-3">
				{t(locale, 'auth.recovery.title')}
			</h1>

			{#if sent}
				<div class="bg-accent-light text-green-800 text-sm p-4 rounded-md my-4 border border-green-200">
					{t(locale, 'auth.recovery.success')} / {t('eu', 'auth.recovery.success')}
				</div>
			{/if}

			<p class="text-sm text-gray-500 mb-5">
				{t(locale, 'auth.recovery.description')}
			</p>

			<form onsubmit={handleSubmit}>
				<div class="mb-4">
					<label for="identifier" class="block text-sm font-semibold mb-2">
						{t(locale, 'auth.email')}
					</label>
					<input
						type="text"
						id="identifier"
						bind:value={email}
						placeholder="usuario@vitoria-gasteiz.org"
						required
						class="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full py-3 bg-primary text-white font-bold rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 mt-2"
				>
					{t(locale, 'auth.recovery.send')}
				</button>
			</form>

			<a href="/login" class="block text-center mt-5 text-sm text-primary hover:underline">
				← {t(locale, 'auth.recovery.back')}
			</a>
		</div>
	</div>

	<footer class="text-center text-xs text-gray-500 py-4 border-t bg-white">
		© 2026 {t(locale, 'app.subtitle')} - {t(locale, 'app.title')} - {t(locale, 'app.expediente')}
	</footer>
</div>

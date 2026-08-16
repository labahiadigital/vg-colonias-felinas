<script lang="ts">
	import { t, localeNames } from '$lib/i18n/index.js';
	import type { Locale } from '$lib/i18n/index.js';
	import { authClient } from '$lib/auth-client.js';
	import { goto } from '$app/navigation';

	let {
		locale,
		user,
		onMenuToggle
	}: {
		locale: Locale;
		user: { name: string; email: string } | null;
		onMenuToggle: () => void;
	} = $props();

	async function logout() {
		await authClient.signOut();
		await goto('/login');
	}
</script>

<header class="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-40">
	<div class="flex items-center gap-3">
		<button
			onclick={onMenuToggle}
			class="lg:hidden p-2 rounded-md hover:bg-gray-100 text-gray-600"
			aria-label="Abrir menú"
		>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
			</svg>
		</button>
	</div>

	<div class="flex items-center gap-4">
		<form method="POST" action="/api/set-locale">
			<select
				name="locale"
				class="text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
				onchange={(e: Event) => (e.target as HTMLSelectElement).form?.submit()}
			>
				{#each Object.entries(localeNames) as [code, name]}
					<option value={code} selected={locale === code}>{name}</option>
				{/each}
			</select>
		</form>

		{#if user}
			<div class="flex items-center gap-2">
				<div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
					{user.name.charAt(0).toUpperCase()}
				</div>
				<span class="hidden sm:inline text-sm text-gray-700">{user.name}</span>
				<button onclick={logout} class="ml-2 text-xs text-gray-400 hover:text-danger transition-colors" title="Cerrar sesión">
					🚪
				</button>
			</div>
		{/if}
	</div>
</header>

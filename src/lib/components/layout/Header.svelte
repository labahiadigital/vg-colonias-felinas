<script lang="ts">
	import { t, localeNames } from '$lib/i18n/index.js';
	import type { Locale } from '$lib/i18n/index.js';
	import { authClient } from '$lib/auth-client.js';
	import { goto } from '$app/navigation';
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
	import NotificationCenter from '$lib/components/ui/NotificationCenter.svelte';

	let {
		locale,
		user,
		notifications = [],
		onMenuToggle
	}: {
		locale: Locale;
		user: { name: string; email: string } | null;
		notifications?: Array<{
			id: string;
			type: 'info' | 'warning' | 'success' | 'danger';
			title: string;
			message: string;
			time: string;
			read: boolean;
		}>;
		onMenuToggle: () => void;
	} = $props();

	let showUserMenu = $state(false);

	async function logout() {
		await authClient.signOut();
		await goto('/login');
	}

	function openCommandPalette() {
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
	}
</script>

<header class="bg-surface border-b border-border px-4 lg:px-6 h-14 flex items-center justify-between sticky top-0 z-40">
	<div class="flex items-center gap-3">
		<button
			onclick={onMenuToggle}
			class="lg:hidden p-2 -ml-2 rounded-lg hover:bg-surface-sunken text-text-secondary transition-colors"
			aria-label="Abrir menú"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
			</svg>
		</button>

		<!-- Command palette trigger -->
		<button
			onclick={openCommandPalette}
			class="hidden md:flex items-center gap-2 px-3 py-1.5 bg-surface-sunken border border-border rounded-lg text-xs text-text-muted hover:text-text-secondary hover:border-text-muted transition-colors cursor-pointer"
		>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
			<span>{t(locale, 'ui.search_placeholder')}</span>
			<kbd class="ml-4 px-1.5 py-0.5 text-[10px] font-medium bg-surface border border-border rounded">⌘K</kbd>
		</button>
	</div>

	<div class="flex items-center gap-1">
		<NotificationCenter {notifications} {locale} />
		<ThemeToggle />

		<form method="POST" action="/api/set-locale">
			<select
				name="locale"
				class="text-xs bg-transparent border border-border rounded-lg px-2.5 py-1.5 text-text-secondary cursor-pointer hover:border-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
				onchange={(e: Event) => (e.target as HTMLSelectElement).form?.submit()}
			>
				{#each Object.entries(localeNames) as [code, name]}
					<option value={code} selected={locale === code}>{name}</option>
				{/each}
			</select>
		</form>

		{#if user}
			<div class="relative">
				<button
					onclick={() => showUserMenu = !showUserMenu}
					class="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-lg hover:bg-surface-sunken transition-colors"
				>
					<span class="hidden sm:inline text-sm text-text-secondary font-medium">{user.name}</span>
					<div class="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
						{user.name.charAt(0).toUpperCase()}
					</div>
				</button>

				{#if showUserMenu}
					<div class="absolute right-0 top-full mt-1.5 w-52 bg-surface rounded-xl shadow-lg border border-border py-1 z-50 animate-scale-in origin-top-right">
						<div class="px-3 py-2.5 border-b border-border">
							<p class="text-sm font-medium text-text truncate">{user.name}</p>
							<p class="text-xs text-text-muted truncate">{user.email}</p>
						</div>
						<a href="/configuracion" class="block px-3 py-2 text-sm text-text-secondary hover:bg-surface-sunken transition-colors">
							{t(locale, 'nav.settings')}
						</a>
						<button
							onclick={logout}
							class="w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger-subtle transition-colors"
						>
							{t(locale, 'auth.logout')}
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</header>

{#if showUserMenu}
	<button
		class="fixed inset-0 z-30"
		onclick={() => showUserMenu = false}
		aria-label="Cerrar menú"
	></button>
{/if}

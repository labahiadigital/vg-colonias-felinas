<script lang="ts">
	import { page } from '$app/state';
	import { t } from '$lib/i18n/index.js';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import type { LayoutData } from './$types.js';

	let { data, children }: { data: LayoutData; children: any } = $props();
	let sidebarOpen = $state(false);
	let locale = $derived(data.locale);

	const mobileNav = [
		{ href: '/dashboard', icon: 'M3 3h7v7H3zM14 3h7v4H14zM3 14h7v7H3zM14 11h7v10H14z', key: 'nav.dashboard' },
		{ href: '/colonias', icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z', key: 'nav.colonies' },
		{ href: '/incidencias', icon: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z', key: 'nav.incidents' },
		{ href: '/gatos', icon: 'M12 5c-1.5-2-4-2.5-6-1.5 0 3 1 5.5 3 7.5-1 1-2 2.5-2 4.5 0 2 1.5 3.5 3.5 3.5 1 0 1.5-.5 1.5-.5s.5.5 1.5.5c2 0 3.5-1.5 3.5-3.5 0-2-1-3.5-2-4.5 2-2 3-4.5 3-7.5-2-1-4.5-.5-6 1.5z', key: 'nav.cats' },
		{ href: '/mapa', icon: 'M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z', key: 'nav.map' },
	];

	function isActive(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}
</script>

<div class="flex h-screen overflow-hidden bg-background">
	<aside class="hidden lg:flex lg:w-[240px] lg:flex-shrink-0">
		<Sidebar locale={locale} />
	</aside>

	{#if sidebarOpen}
		<div class="fixed inset-0 z-50 lg:hidden">
			<button
				class="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onclick={() => (sidebarOpen = false)}
				aria-label={t(locale, 'nav.close_menu')}
			></button>
			<aside class="relative w-[280px] h-full shadow-2xl">
				<Sidebar locale={locale} onclose={() => (sidebarOpen = false)} />
			</aside>
		</div>
	{/if}

	<div class="flex-1 flex flex-col overflow-hidden">
		<Header
			locale={locale}
			user={data.user}
			notifications={data.headerNotifications ?? []}
			onMenuToggle={() => (sidebarOpen = !sidebarOpen)}
		/>
		<main id="main-content" class="flex-1 overflow-y-auto p-4 lg:p-8 pb-20 lg:pb-8">
			{@render children()}
		</main>
	</div>
</div>

<nav class="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-surface border-t border-border safe-bottom" aria-label={t(locale, 'nav.quick_search')}>
	<div class="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
		{#each mobileNav as item}
			<a
				href={item.href}
				class="flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] rounded-lg px-2 py-1 transition-colors
					{isActive(item.href) ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}"
				aria-current={isActive(item.href) ? 'page' : undefined}
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={isActive(item.href) ? '2' : '1.5'} stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
					<path d={item.icon} />
				</svg>
				<span class="text-[10px] font-medium leading-none">{t(locale, item.key)}</span>
			</a>
		{/each}
	</div>
</nav>

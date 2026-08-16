<script lang="ts">
	import { page } from '$app/state';
	import { t } from '$lib/i18n/index.js';
	import type { Locale } from '$lib/i18n/index.js';

	let { locale, onclose }: { locale: Locale; onclose?: () => void } = $props();

	const navItems = [
		{ href: '/dashboard', icon: '🏠', key: 'nav.dashboard' },
		{ href: '/mapa', icon: '🗺️', key: 'nav.map' },
		{ href: '/colonias', icon: '📍', key: 'nav.colonies' },
		{ href: '/gatos', icon: '🐈', key: 'nav.cats' },
		{ href: '/incidencias', icon: '⚠️', key: 'nav.incidents' },
		{ href: '/colaboradores', icon: '👥', key: 'nav.collaborators' },
		{ href: '/informes', icon: '📊', key: 'nav.reports' },
		{ href: '/configuracion', icon: '⚙️', key: 'nav.settings' }
	];

	function isActive(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}
</script>

<nav class="flex flex-col h-full bg-sidebar text-white">
	<div class="p-5 border-b border-white/10">
		<div class="flex items-center justify-between">
			<h1 class="text-lg font-bold leading-tight">VG GESTIÓN FELINA</h1>
			{#if onclose}
				<button onclick={onclose} class="lg:hidden text-white/70 hover:text-white text-xl p-1" aria-label="Cerrar menú">✕</button>
			{/if}
		</div>
		<p class="text-xs text-white/50 mt-1">{t(locale, 'app.subtitle')}</p>
	</div>

	<div class="flex-1 overflow-y-auto py-2">
		{#each navItems as item}
			<a
				href={item.href}
				class="flex items-center gap-3 px-5 py-3 mx-2 rounded-md text-sm transition-colors
					{isActive(item.href)
						? 'bg-sidebar-hover border-l-4 border-accent text-white font-semibold'
						: 'text-white/80 hover:bg-sidebar-hover hover:text-white border-l-4 border-transparent'}"
				onclick={onclose}
			>
				<span class="text-base">{item.icon}</span>
				<span>{t(locale, item.key)}</span>
			</a>
		{/each}
	</div>

	<div class="p-4 border-t border-white/10 text-xs text-white/40">
		<p>{t(locale, 'app.expediente')}</p>
	</div>
</nav>

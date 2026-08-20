<script lang="ts">
	import { page } from '$app/state';
	import { t } from '$lib/i18n/index.js';
	import type { Locale } from '$lib/i18n/index.js';

	let { locale, onclose }: { locale: Locale; onclose?: () => void } = $props();

	const navGroups = [
		{
			label: 'nav.overview',
			items: [
				{ href: '/dashboard', icon: 'dashboard', key: 'nav.dashboard' },
				{ href: '/mapa', icon: 'map', key: 'nav.map' },
			]
		},
		{
			label: 'nav.management',
			items: [
				{ href: '/colonias', icon: 'colony', key: 'nav.colonies' },
				{ href: '/gatos', icon: 'cat', key: 'nav.cats' },
				{ href: '/gatos/identificar', icon: 'catid', key: 'nav.cat_identify' },
				{ href: '/visitas', icon: 'visits', key: 'nav.visits' },
				{ href: '/incidencias', icon: 'incident', key: 'nav.incidents' },
				{ href: '/inspecciones', icon: 'inspection', key: 'nav.inspections' },
			]
		},
		{
			label: 'nav.programs',
			items: [
				{ href: '/salud', icon: 'health', key: 'nav.health' },
				{ href: '/cer', icon: 'cer', key: 'nav.cer' },
				{ href: '/adopciones', icon: 'adoption', key: 'nav.adoptions' },
				{ href: '/campanas', icon: 'campaign', key: 'nav.campaigns' },
				{ href: '/material', icon: 'equipment', key: 'nav.equipment' },
			]
		},
		{
			label: 'nav.team',
			items: [
				{ href: '/colaboradores', icon: 'collaborators', key: 'nav.collaborators' },
				{ href: '/proveedores', icon: 'providers', key: 'nav.providers' },
				{ href: '/mensajes', icon: 'messages', key: 'nav.messages' },
				{ href: '/informes', icon: 'reports', key: 'nav.reports' },
			]
		}
	];

	function isActive(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}
</script>

{#snippet icon(name: string)}
	{#if name === 'dashboard'}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="4" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="11" width="7" height="10" rx="1"/></svg>
	{:else if name === 'map'}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z"/><path d="M9 4v13"/><path d="M15 7v13"/></svg>
	{:else if name === 'colony'}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
	{:else if name === 'cat'}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><path d="M12 5c-1.5-2-4-2.5-6-1.5 0 3 1 5.5 3 7.5-1 1-2 2.5-2 4.5 0 2 1.5 3.5 3.5 3.5 1 0 1.5-.5 1.5-.5s.5.5 1.5.5c2 0 3.5-1.5 3.5-3.5 0-2-1-3.5-2-4.5 2-2 3-4.5 3-7.5-2-1-4.5-.5-6 1.5z"/><circle cx="10" cy="10" r="1" fill="currentColor"/><circle cx="14" cy="10" r="1" fill="currentColor"/></svg>
	{:else if name === 'catid'}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M11 8v6M8 11h6"/></svg>
	{:else if name === 'incident'}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
	{:else if name === 'inspection'}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>
	{:else if name === 'health'}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
	{:else if name === 'cer'}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12L12 12"/><circle cx="18" cy="18" r="3"/><path d="M15.88 15.88L12 12"/><circle cx="18" cy="6" r="3"/><path d="M15.88 8.12L12 12"/><circle cx="6" cy="18" r="3"/><path d="M8.12 15.88L12 12"/></svg>
	{:else if name === 'adoption'}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
	{:else if name === 'visits'}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/><path d="M12 13V9"/><path d="M12 9l-2 2"/><path d="M12 9l2 2"/></svg>
	{:else if name === 'providers'}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h1"/><path d="M9 13h1"/><path d="M9 17h1"/></svg>
	{:else if name === 'collaborators'}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
	{:else if name === 'messages'}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
	{:else if name === 'reports'}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
	{:else if name === 'campaign'}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12L12 12"/><circle cx="18" cy="18" r="3"/><path d="M15.88 15.88L12 12"/></svg>
	{:else if name === 'equipment'}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
	{:else if name === 'settings'}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15 1.65 1.65 0 003 14.08V14a2 2 0 014 0v.09c0 .67.41 1.27 1 1.55a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06c-.29.29-.46.68-.33 1.08"/></svg>
	{/if}
{/snippet}

<nav class="flex flex-col h-full bg-sidebar text-white/90 relative" aria-label="Navegación principal">
	<!-- Logo -->
	<div class="px-5 py-5 flex items-center justify-between">
		<a href="/dashboard" class="flex items-center gap-2.5 group">
			<div class="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
				<svg viewBox="0 0 32 32" fill="none" class="w-5 h-5">
					<path d="M16 4C11.58 4 8 7.58 8 12c0 6 8 14 8 14s8-8 8-14c0-4.42-3.58-8-8-8z" fill="white"/>
					<path d="M12 8.5L10 5.5 13 7.5z" fill="white" stroke="white" stroke-width="0.3" stroke-linejoin="round"/>
					<path d="M20 8.5L22 5.5 19 7.5z" fill="white" stroke="white" stroke-width="0.3" stroke-linejoin="round"/>
					<ellipse cx="14" cy="11" rx="0.9" ry="1.1" fill="#0f766e"/>
					<ellipse cx="18" cy="11" rx="0.9" ry="1.1" fill="#0f766e"/>
					<path d="M15.5 13L16 12.5l0.5 0.5" stroke="#0f766e" stroke-width="0.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
				</svg>
			</div>
			<div>
				<span class="text-sm font-bold tracking-tight text-white">Gatopolis</span>
				<span class="block text-[10px] text-sidebar-muted -mt-0.5 font-medium">{t(locale, 'nav.subtitle')}</span>
			</div>
		</a>
		{#if onclose}
			<button onclick={onclose} class="lg:hidden text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-sidebar-hover transition-colors" aria-label={t(locale, 'nav.close_menu')}>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><path d="M18 6L6 18M6 6l12 12"/></svg>
			</button>
		{/if}
	</div>

	<!-- Navigation -->
	<div class="flex-1 overflow-y-auto px-3 pb-3 space-y-5">
		{#each navGroups as group}
			<div>
				<p class="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted/70">{t(locale, group.label)}</p>
				<div class="space-y-0.5">
					{#each group.items as item}
						{@const active = isActive(item.href)}
						<a
							href={item.href}
							class="relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150
								{active
									? 'bg-white/[0.08] text-white font-medium shadow-sm'
									: 'text-white/60 hover:bg-white/[0.04] hover:text-white/90'}"
							onclick={onclose}
						>
							{#if active}
								<div class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[2px] w-[3px] h-4 bg-primary rounded-r-full"></div>
							{/if}
							{@render icon(item.icon)}
							<span>{t(locale, item.key)}</span>
						</a>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- Footer -->
	<div class="px-3 pb-4 pt-2 border-t border-sidebar-border">
		<a
			href="/configuracion"
			class="relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150
				{isActive('/configuracion')
					? 'bg-white/[0.08] text-white font-medium'
					: 'text-white/60 hover:bg-white/[0.04] hover:text-white/90'}"
			onclick={onclose}
		>
			{#if isActive('/configuracion')}
				<div class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[2px] w-[3px] h-4 bg-primary rounded-r-full"></div>
			{/if}
			{@render icon('settings')}
			<span>{t(locale, 'nav.settings')}</span>
		</a>

		<!-- Keyboard shortcut hint -->
		<div class="mt-3 px-3 flex items-center gap-2 text-[10px] text-sidebar-muted/60">
			<kbd class="px-1.5 py-0.5 rounded bg-sidebar-hover text-[9px] font-mono">⌘K</kbd>
			<span>{t(locale, 'nav.quick_search')}</span>
		</div>
	</div>
</nav>

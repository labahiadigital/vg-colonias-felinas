<script lang="ts">
	import '../app.css';
	import { navigating, page } from '$app/state';
	import { onNavigate } from '$app/navigation';
	import CommandPalette from '$lib/components/ui/CommandPalette.svelte';
	import OfflineIndicator from '$lib/components/ui/OfflineIndicator.svelte';
	import UndoToastGlobal from '$lib/components/ui/UndoToastGlobal.svelte';
	import Changelog from '$lib/components/ui/Changelog.svelte';

	let { children } = $props();
	let locale = $derived((page.data as Record<string, unknown>)?.locale as string ?? 'es');

	const changelogEntries = [
		{
			version: '2.1.0',
			date: '17 Ago 2026',
			items: [
				{ type: 'feature' as const, text: 'Navegación J/K con teclado en listas' },
				{ type: 'feature' as const, text: 'Modo daltonismo para accesibilidad' },
				{ type: 'feature' as const, text: 'Gestos de deslizar en móvil' },
				{ type: 'improvement' as const, text: 'Toggle de densidad de datos' },
				{ type: 'improvement' as const, text: 'Autocompletado inteligente en formularios' },
				{ type: 'fix' as const, text: 'Correcciones de rendimiento en tablas grandes' }
			]
		},
		{
			version: '2.0.0',
			date: '16 Ago 2026',
			items: [
				{ type: 'feature' as const, text: 'Modo oscuro completo' },
				{ type: 'feature' as const, text: 'Paleta de comandos (⌘K)' },
				{ type: 'feature' as const, text: 'PWA: funciona offline' },
				{ type: 'feature' as const, text: 'Transiciones de página animadas' },
				{ type: 'improvement' as const, text: 'Diseño renovado con micro-interacciones' },
				{ type: 'improvement' as const, text: 'Notificaciones en tiempo real' }
			]
		}
	];

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

{#if navigating.to}
	<div class="fixed top-0 left-0 right-0 z-[9999] h-[2px] bg-primary/20">
		<div class="h-full bg-primary rounded-r-full" style="animation: progress 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;"></div>
	</div>
{/if}

{@render children()}

<CommandPalette {locale} />
<OfflineIndicator {locale} />
<UndoToastGlobal />
<Changelog entries={changelogEntries} currentVersion="2.1.0" {locale} />

<style>
	@keyframes progress {
		0% { width: 5%; }
		50% { width: 65%; }
		100% { width: 92%; }
	}

	:global(::view-transition-old(root)) {
		animation: fade-out 0.15s ease-out;
	}

	:global(::view-transition-new(root)) {
		animation: fade-in 0.2s ease-in;
	}

	@keyframes fade-out {
		from { opacity: 1; transform: scale(1); }
		to { opacity: 0; transform: scale(0.998); }
	}

	@keyframes fade-in {
		from { opacity: 0; transform: scale(1.002); }
		to { opacity: 1; transform: scale(1); }
	}
</style>

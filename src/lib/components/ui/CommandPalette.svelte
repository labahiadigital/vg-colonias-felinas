<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n/index.js';

	let { locale = 'es' }: { locale?: string } = $props();

	let open = $state(false);
	let query = $state('');
	let selectedIndex = $state(0);
	let inputEl = $state<HTMLInputElement>();
	let searchResults = $state<Command[]>([]);
	let searching = $state(false);

	interface Command {
		id: string;
		label: string;
		section: string;
		href?: string;
		action?: () => void;
		shortcut?: string;
		subtitle?: string;
	}

	async function searchData(q: string) {
		if (q.length < 2) { searchResults = []; return; }
		searching = true;
		try {
			const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
			if (res.ok) {
				const data = await res.json();
				searchResults = [
					...(data.colonies ?? []).map((c: { id: string; name: string }) => ({
						id: `colony-${c.id}`, label: c.name, section: 'Colonias', href: `/colonias/${c.id}`, subtitle: 'Colonia'
					})),
					...(data.cats ?? []).map((c: { id: string; name: string }) => ({
						id: `cat-${c.id}`, label: c.name ?? 'Sin nombre', section: 'Gatos', href: `/gatos/${c.id}`, subtitle: 'Gato'
					})),
					...(data.collaborators ?? []).map((c: { id: string; name: string }) => ({
						id: `collab-${c.id}`, label: c.name, section: 'Colaboradores', href: `/colaboradores/${c.id}`, subtitle: 'Colaborador'
					})),
				];
			}
		} catch { searchResults = []; }
		searching = false;
	}

	let searchTimeout: ReturnType<typeof setTimeout>;
	$effect(() => {
		clearTimeout(searchTimeout);
		if (query.length >= 2) {
			searchTimeout = setTimeout(() => searchData(query), 250);
		} else {
			searchResults = [];
		}
	});

	const commands: Command[] = [
		{ id: 'dashboard', label: 'Ir al Dashboard', section: 'Navegación', href: '/dashboard', shortcut: 'G D' },
		{ id: 'colonias', label: 'Ver Colonias', section: 'Navegación', href: '/colonias', shortcut: 'G C' },
		{ id: 'gatos', label: 'Ver Gatos', section: 'Navegación', href: '/gatos', shortcut: 'G G' },
		{ id: 'mapa', label: 'Abrir Mapa', section: 'Navegación', href: '/mapa', shortcut: 'G M' },
		{ id: 'incidencias', label: 'Ver Incidencias', section: 'Navegación', href: '/incidencias' },
		{ id: 'cer', label: 'Programa CER', section: 'Navegación', href: '/cer' },
		{ id: 'salud', label: 'Registros de Salud', section: 'Navegación', href: '/salud' },
		{ id: 'adopciones', label: 'Adopciones', section: 'Navegación', href: '/adopciones' },
		{ id: 'colaboradores', label: 'Colaboradores', section: 'Navegación', href: '/colaboradores' },
		{ id: 'inspecciones', label: 'Inspecciones', section: 'Navegación', href: '/inspecciones' },
		{ id: 'mensajes', label: 'Mensajes', section: 'Navegación', href: '/mensajes' },
		{ id: 'informes', label: 'Informes', section: 'Navegación', href: '/informes' },
		{ id: 'config', label: 'Configuración', section: 'Navegación', href: '/configuracion' },
		{ id: 'new-colony', label: 'Nueva Colonia', section: 'Acciones', href: '/colonias?new=true' },
		{ id: 'new-cat', label: 'Nuevo Gato', section: 'Acciones', href: '/gatos?new=true' },
		{ id: 'new-incident', label: 'Nueva Incidencia', section: 'Acciones', href: '/incidencias?new=true' },
		{ id: 'toggle-theme', label: 'Cambiar tema (oscuro/claro)', section: 'Sistema', action: () => {
			document.documentElement.classList.toggle('dark');
			const isDark = document.documentElement.classList.contains('dark');
			localStorage.setItem('gatopolis-theme', isDark ? 'dark' : 'light');
		}},
	];

	let filteredCommands = $derived(
		query.length === 0
			? commands
			: [
				...searchResults,
				...commands.filter(c =>
					c.label.toLowerCase().includes(query.toLowerCase()) ||
					c.section.toLowerCase().includes(query.toLowerCase())
				)
			]
	);

	let groupedCommands = $derived(
		filteredCommands.reduce((acc: Record<string, Command[]>, cmd) => {
			(acc[cmd.section] = acc[cmd.section] || []).push(cmd);
			return acc;
		}, {})
	);

	function execute(cmd: Command) {
		open = false;
		query = '';
		if (cmd.href) goto(cmd.href);
		else if (cmd.action) cmd.action();
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			open = !open;
			if (open) setTimeout(() => inputEl?.focus(), 50);
		}
		if (!open) return;

		if (e.key === 'Escape') {
			open = false;
			query = '';
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, filteredCommands.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (filteredCommands[selectedIndex]) execute(filteredCommands[selectedIndex]);
		}
	}

	$effect(() => {
		if (query) selectedIndex = 0;
	});

	if (browser) {
		$effect(() => {
			window.addEventListener('keydown', handleKeydown);
			return () => window.removeEventListener('keydown', handleKeydown);
		});
	}
</script>

{#if open}
	<div class="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]" role="dialog" aria-modal="true" aria-label="Paleta de comandos">
		<button class="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onclick={() => { open = false; query = ''; }} aria-label="Cerrar"></button>

		<div class="relative w-full max-w-lg mx-4 bg-surface rounded-xl border border-border shadow-2xl overflow-hidden animate-scale-in">
			<div class="flex items-center gap-3 px-4 border-b border-border">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="w-4 h-4 text-text-muted flex-shrink-0"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
				<input
					bind:this={inputEl}
					bind:value={query}
					placeholder="Buscar acciones, páginas..."
					class="flex-1 py-3.5 bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none"
					spellcheck="false"
				/>
				<kbd class="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-text-muted bg-surface-sunken border border-border rounded">ESC</kbd>
			</div>

			<div class="max-h-[320px] overflow-y-auto p-2">
				{#if searching}
					<div class="px-3 py-4 flex items-center gap-2 text-sm text-text-muted">
						<svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.2"/><path d="M12 2a10 10 0 019.95 9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
						Buscando...
					</div>
				{:else if filteredCommands.length === 0 && query.length > 0}
					<div class="px-3 py-8 text-center text-sm text-text-muted">{t(locale, 'ui.no_results_for')} "{query}"</div>
				{:else}
					{@const flatIndex = { current: 0 }}
					{#each Object.entries(groupedCommands) as [section, cmds]}
						<div class="px-2 pt-2 pb-1 text-[11px] font-medium text-text-muted uppercase tracking-wide">{section}</div>
						{#each cmds as cmd}
							{@const idx = flatIndex.current++}
							<button
								class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left
									{idx === selectedIndex ? 'bg-primary/8 text-primary' : 'text-text-secondary hover:bg-surface-sunken'}"
								onclick={() => execute(cmd)}
								onmouseenter={() => selectedIndex = idx}
							>
								<span class="flex items-center gap-2">
									<span>{cmd.label}</span>
									{#if cmd.subtitle}
										<span class="text-[10px] text-text-muted bg-surface-sunken px-1.5 py-0.5 rounded">{cmd.subtitle}</span>
									{/if}
								</span>
								{#if cmd.shortcut}
									<kbd class="text-[10px] font-mono text-text-muted bg-surface-sunken px-1.5 py-0.5 rounded">{cmd.shortcut}</kbd>
								{/if}
							</button>
						{/each}
					{/each}
				{/if}
			</div>

			<div class="px-4 py-2 border-t border-border flex items-center gap-4 text-[11px] text-text-muted">
				<span class="flex items-center gap-1"><kbd class="px-1 py-0.5 bg-surface-sunken rounded text-[10px]">↑↓</kbd> navegar</span>
				<span class="flex items-center gap-1"><kbd class="px-1 py-0.5 bg-surface-sunken rounded text-[10px]">↵</kbd> seleccionar</span>
				<span class="flex items-center gap-1"><kbd class="px-1 py-0.5 bg-surface-sunken rounded text-[10px]">esc</kbd> cerrar</span>
			</div>
		</div>
	</div>
{/if}

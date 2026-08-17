<script lang="ts">
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n/index.js';

	interface ChangelogEntry {
		version: string;
		date: string;
		items: Array<{
			type: 'feature' | 'improvement' | 'fix';
			text: string;
		}>;
	}

	let {
		entries = [],
		currentVersion = '1.0.0',
		locale = 'es'
	}: {
		entries?: ChangelogEntry[];
		currentVersion?: string;
		locale?: string;
	} = $props();

	let open = $state(false);

	$effect(() => {
		if (browser) {
			const lastSeen = localStorage.getItem('gatopolis-changelog-version');
			if (lastSeen !== currentVersion && entries.length > 0) {
				open = true;
			}
		}
	});

	function close() {
		open = false;
		if (browser) localStorage.setItem('gatopolis-changelog-version', currentVersion);
	}

	function typeConfig(type: string) {
		const configs: Record<string, { label: string; bg: string }> = {
			feature: { label: t(locale, 'ui.changelog_new'), bg: 'bg-primary/8 text-primary' },
			improvement: { label: t(locale, 'ui.changelog_improvement'), bg: 'bg-accent/8 text-accent' },
			fix: { label: 'Fix', bg: 'bg-success/8 text-success' }
		};
		return configs[type] ?? { label: type, bg: 'bg-surface-sunken text-text-muted' };
	}
</script>

{#if open}
	<div class="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="changelog-title">
		<button class="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onclick={close} aria-label="Cerrar"></button>

		<div class="relative w-full max-w-md bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden animate-scale-in">
			<!-- Header -->
			<div class="relative px-6 pt-8 pb-6 text-center bg-gradient-to-b from-primary/5 to-transparent">
				<div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6 text-primary"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
				</div>
				<h2 id="changelog-title" class="text-lg font-bold text-text">{t(locale, 'ui.changelog_title')} v{currentVersion}</h2>
				<p class="text-sm text-text-muted mt-1">{t(locale, 'ui.changelog_subtitle')}</p>
			</div>

			<!-- Entries -->
			<div class="px-6 pb-6 max-h-[40vh] overflow-y-auto">
				{#each entries as entry}
					<div class="mb-4 last:mb-0">
						<div class="flex items-center gap-2 mb-2">
							<span class="text-xs font-semibold text-text">{entry.version}</span>
							<span class="text-[11px] text-text-muted">{entry.date}</span>
						</div>
						<ul class="space-y-1.5">
							{#each entry.items as item}
								{@const config = typeConfig(item.type)}
								<li class="flex items-start gap-2 text-sm">
									<span class="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold {config.bg} mt-0.5 flex-shrink-0">{config.label}</span>
									<span class="text-text-secondary">{item.text}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>

			<!-- Footer -->
			<div class="px-6 py-4 border-t border-border">
				<button onclick={close} class="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors btn-press">
					Entendido
				</button>
			</div>
		</div>
	</div>
{/if}

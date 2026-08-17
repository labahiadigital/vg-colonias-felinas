<script lang="ts">
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n/index.js';

	let { stats, locale = 'es' }: { stats: { totalColonies: number; totalCats: number; activeCollaborators?: number }; locale?: string } = $props();

	let dismissed = $state(false);

	if (browser) {
		dismissed = localStorage.getItem('gatopolis-onboarding-dismissed') === 'true';
	}

	let steps = $derived([
		{ id: 'colony', label: t(locale, 'onboarding.create_colony'), href: '/colonias?new=1', done: stats.totalColonies > 0 },
		{ id: 'cat', label: t(locale, 'onboarding.register_cat'), href: '/gatos?new=1', done: stats.totalCats > 0 },
		{ id: 'team', label: t(locale, 'onboarding.invite_collaborator'), href: '/colaboradores', done: (stats.activeCollaborators ?? 0) > 1 },
		{ id: 'map', label: t(locale, 'onboarding.explore_map'), href: '/mapa', done: false }
	]);

	let completedCount = $derived(steps.filter(s => s.done).length);
	let allDone = $derived(completedCount === steps.length);
	let show = $derived(!dismissed && !allDone);

	function dismiss() {
		dismissed = true;
		if (browser) localStorage.setItem('gatopolis-onboarding-dismissed', 'true');
	}
</script>

{#if show}
	<div class="bg-surface rounded-xl border border-border p-5 mb-6 animate-enter">
		<div class="flex items-start justify-between mb-3">
			<div>
				<h3 class="text-sm font-semibold text-text">{t(locale, 'onboarding.title')}</h3>
				<p class="text-xs text-text-muted mt-0.5">{t(locale, 'onboarding.subtitle')}</p>
			</div>
			<button onclick={dismiss} class="p-1 rounded hover:bg-surface-sunken text-text-muted hover:text-text transition-colors" aria-label={t(locale, 'common.close')}>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
			</button>
		</div>

		<div class="flex items-center gap-2 mb-4">
			<div class="flex-1 h-1.5 bg-surface-sunken rounded-full overflow-hidden">
				<div class="h-full bg-primary rounded-full transition-all duration-500" style="width: {(completedCount / steps.length) * 100}%"></div>
			</div>
			<span class="text-xs font-medium text-text-muted">{completedCount}/{steps.length}</span>
		</div>

		<div class="space-y-1">
			{#each steps as step}
				<a
					href={step.href}
					class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
						{step.done ? 'opacity-60' : 'hover:bg-surface-sunken'}"
				>
					<div class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
						{step.done ? 'border-success bg-success' : 'border-border'}">
						{#if step.done}
							<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" class="w-3 h-3"><polyline points="20,6 9,17 4,12"/></svg>
						{/if}
					</div>
					<span class="text-sm {step.done ? 'text-text-muted line-through' : 'text-text'}">{step.label}</span>
					{#if !step.done}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5 text-text-muted ml-auto"><path d="M9 18l6-6-6-6"/></svg>
					{/if}
				</a>
			{/each}
		</div>
	</div>
{/if}

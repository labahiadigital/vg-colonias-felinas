<script lang="ts">
	import { browser } from '$app/environment';
	import { subscribe, cancelAction, dismissAction } from '$lib/stores/undo';

	interface PendingAction {
		id: string;
		message: string;
	}

	let actions = $state<PendingAction[]>([]);

	if (browser) {
		subscribe((current) => {
			actions = current.map(a => ({ id: a.id, message: a.message }));
		});
	}
</script>

{#if actions.length > 0}
	<div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9990] flex flex-col gap-2 items-center pointer-events-none">
		{#each actions as action (action.id)}
			<div class="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-text text-text-inverse rounded-xl shadow-2xl animate-slide-up min-w-[280px] max-w-[400px]">
				<span class="text-sm flex-1">{action.message}</span>
				<button
					onclick={() => cancelAction(action.id)}
					class="text-sm font-semibold text-primary-muted hover:text-white transition-colors uppercase tracking-wide flex-shrink-0"
				>
					Deshacer
				</button>
				<button
					onclick={() => dismissAction(action.id)}
					class="p-0.5 rounded hover:bg-white/10 transition-colors flex-shrink-0"
					aria-label="Cerrar"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 opacity-50"><path d="M18 6L6 18M6 6l12 12"/></svg>
				</button>
			</div>
		{/each}
	</div>
{/if}

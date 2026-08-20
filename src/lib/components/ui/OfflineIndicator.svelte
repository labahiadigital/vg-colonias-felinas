<script lang="ts">
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n/index.js';

	let { locale = 'es' }: { locale?: string } = $props();

	let online = $state(true);
	let showReconnected = $state(false);
	let pendingOps = $state(0);
	let syncMessage = $state('');

	if (browser) {
		online = navigator.onLine;

		$effect(() => {
			function handleOnline() {
				online = true;
				showReconnected = true;
				if (navigator.serviceWorker?.controller) {
					navigator.serviceWorker.controller.postMessage({ type: 'SYNC_NOW' });
				}
				setTimeout(() => { showReconnected = false; }, 3000);
			}
			function handleOffline() { online = false; }

			function handleSWMessage(event: MessageEvent) {
				if (event.data?.type === 'OFFLINE_QUEUED') {
					pendingOps++;
				}
				if (event.data?.type === 'SYNC_COMPLETE') {
					if (event.data.allSuccess) {
						pendingOps = 0;
						syncMessage = t(locale, 'ui.sync_complete');
						setTimeout(() => { syncMessage = ''; }, 3000);
					} else {
						syncMessage = t(locale, 'ui.sync_partial');
						setTimeout(() => { syncMessage = ''; }, 5000);
					}
				}
			}

			window.addEventListener('online', handleOnline);
			window.addEventListener('offline', handleOffline);
			navigator.serviceWorker?.addEventListener('message', handleSWMessage);
			return () => {
				window.removeEventListener('online', handleOnline);
				window.removeEventListener('offline', handleOffline);
				navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
			};
		});
	}
</script>

{#if !online}
	<div class="fixed top-0 left-0 right-0 z-[9998] bg-warning text-warning-subtle animate-slide-down" role="alert">
		<div class="max-w-4xl mx-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="w-3.5 h-3.5">
				<path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01"/>
			</svg>
			<span>{t(locale, 'ui.offline')}</span>
			{#if pendingOps > 0}
				<span class="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">{pendingOps} {t(locale, 'ui.pending_ops')}</span>
			{/if}
		</div>
	</div>
{/if}

{#if showReconnected}
	<div class="fixed top-0 left-0 right-0 z-[9998] bg-success text-white animate-slide-down" role="status">
		<div class="max-w-4xl mx-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5"><polyline points="20,6 9,17 4,12"/></svg>
			<span>{t(locale, 'ui.online')}</span>
		</div>
	</div>
{/if}

{#if syncMessage}
	<div class="fixed top-0 left-0 right-0 z-[9998] bg-info text-white animate-slide-down" role="status">
		<div class="max-w-4xl mx-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/></svg>
			<span>{syncMessage}</span>
		</div>
	</div>
{/if}

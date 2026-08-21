<script lang="ts">
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n/index.js';

	let { notifications = [], locale = 'es' }: {
		notifications?: Array<{
			id: string;
			type: 'info' | 'warning' | 'success' | 'danger';
			title: string;
			message: string;
			time: string;
			read: boolean;
		}>;
		locale?: string;
	} = $props();

	let open = $state(false);
	let unreadCount = $derived(notifications.filter(n => !n.read).length);

	const defaultIcon = { path: 'M12 16v-4m0-4h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z', color: 'text-info bg-info/8' };
	const typeIcons: Record<string, { path: string; color: string }> = {
		info: defaultIcon,
		warning: { path: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01', color: 'text-warning bg-warning/8' },
		success: { path: 'M22 12a10 10 0 11-20 0 10 10 0 0120 0zM9 12l2 2 4-4', color: 'text-success bg-success/8' },
		danger: { path: 'M22 12a10 10 0 11-20 0 10 10 0 0120 0zM15 9l-6 6m0-6l6 6', color: 'text-danger bg-danger/8' }
	};

	function close() { open = false; }

	if (browser) {
		$effect(() => {
			if (!open) return;
			function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') close(); }
			document.addEventListener('keydown', handleKey);
			return () => document.removeEventListener('keydown', handleKey);
		});
	}
</script>

<div class="relative">
	<button
		onclick={() => open = !open}
		class="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-surface-sunken transition-colors"
		aria-label={t(locale, 'ui.notifications')}
		data-tooltip={t(locale, 'ui.notifications')}
	>
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px] text-text-secondary">
			<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
		</svg>
		{#if unreadCount > 0}
			<span class="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full">
				<span class="absolute inset-0 bg-danger rounded-full animate-ping opacity-75"></span>
			</span>
		{/if}
	</button>

	{#if open}
		<div class="absolute right-0 top-full mt-2 w-80 bg-surface rounded-xl shadow-xl border border-border z-50 animate-scale-in origin-top-right overflow-hidden">
			<div class="px-4 py-3 border-b border-border flex items-center justify-between">
				<h3 class="text-sm font-semibold text-text">{t(locale, 'ui.notifications')}</h3>
			{#if unreadCount > 0}
				<span class="text-xs text-primary font-medium">{unreadCount} {t(locale, 'ui.unread')}</span>
			{/if}
			</div>

			<div class="max-h-[320px] overflow-y-auto">
				{#if notifications.length === 0}
					<div class="px-4 py-8 text-center">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-8 h-8 text-text-muted mx-auto mb-2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
						<p class="text-sm text-text-muted">{t(locale, 'ui.no_notifications')}</p>
					</div>
				{:else}
					{#each notifications as notif}
						{@const icon = typeIcons[notif.type] ?? defaultIcon}
						<div class="px-4 py-3 hover:bg-surface-sunken transition-colors border-b border-border last:border-0 {!notif.read ? 'bg-primary/[0.02]' : ''}">
							<div class="flex gap-3">
								<div class="w-8 h-8 rounded-lg {icon.color} flex items-center justify-center flex-shrink-0 mt-0.5">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><path d={icon.path}/></svg>
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-start justify-between gap-2">
										<p class="text-sm font-medium text-text truncate">{notif.title}</p>
										{#if !notif.read}
											<span class="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5"></span>
										{/if}
									</div>
									<p class="text-xs text-text-muted mt-0.5 line-clamp-2">{notif.message}</p>
									<p class="text-[11px] text-text-muted mt-1">{notif.time}</p>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			{#if notifications.length > 0}
				<div class="px-4 py-2.5 border-t border-border">
					<a href="/mensajes" class="text-xs text-primary font-medium hover:text-primary-hover transition-colors" onclick={close}>{t(locale, 'ui.view_all')}</a>
				</div>
			{/if}
		</div>
	{/if}
</div>

{#if open}
	<button class="fixed inset-0 z-40" onclick={close} aria-label={t(locale, 'ui.close')}></button>
{/if}

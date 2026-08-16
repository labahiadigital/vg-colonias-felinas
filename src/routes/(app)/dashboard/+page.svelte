<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const locale = data.locale;
	const user = data.user;
	const stats = data.stats;
	const recentActivity = data.recentActivity;

	function actionIcon(entity: string): string {
		const icons: Record<string, string> = {
			colony: '📍', cat: '🐈', incident: '⚠️', collaborator: '👤',
			health_record: '💊', cer_action: '✂️', adoption: '🏠'
		};
		return icons[entity] ?? '📋';
	}

	function actionBg(entity: string): string {
		const colors: Record<string, string> = {
			colony: 'bg-accent-light text-green-700',
			cat: 'bg-accent-light text-green-700',
			incident: 'bg-warning-light text-yellow-700',
			collaborator: 'bg-info-light text-blue-700',
			health_record: 'bg-purple-100 text-purple-700',
			cer_action: 'bg-accent-light text-green-700'
		};
		return colors[entity] ?? 'bg-gray-100 text-gray-700';
	}

	function timeAgo(dateStr: string | null): string {
		if (!dateStr) return '';
		const diff = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 60) return `Hace ${mins} min`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `Hace ${hours}h`;
		const days = Math.floor(hours / 24);
		return `Hace ${days}d`;
	}
</script>

<div>
	<div class="mb-6">
		<h2 class="text-2xl font-bold text-gray-800">{t(locale, 'dashboard.greeting')}, {user?.name ?? 'Usuario'}</h2>
		<p class="text-sm text-gray-500 mt-1">{t(locale, 'dashboard.summary')}</p>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
		<div class="bg-white rounded-lg shadow-sm p-5 border-t-4 border-accent">
			<h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t(locale, 'dashboard.active_colonies')}</h3>
			<div class="text-3xl font-bold text-gray-800 mt-2">{stats.activeColonies}</div>
			<span class="text-xs text-gray-500">{stats.totalColonies} total</span>
		</div>
		<div class="bg-white rounded-lg shadow-sm p-5 border-t-4 border-accent">
			<h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t(locale, 'dashboard.censed_cats')}</h3>
			<div class="text-3xl font-bold text-gray-800 mt-2">{stats.totalCats}</div>
			<span class="text-xs text-gray-500">{stats.sterilizationRate}% {t(locale, 'dashboard.sterilized')}</span>
		</div>
		<div class="bg-white rounded-lg shadow-sm p-5 border-t-4 border-accent">
			<h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t(locale, 'dashboard.open_incidents')}</h3>
			<div class="text-3xl font-bold text-gray-800 mt-2">{stats.openIncidents}</div>
			{#if stats.highPriority > 0}
				<span class="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-danger-light text-danger">{stats.highPriority} {t(locale, 'dashboard.urgent')}</span>
			{:else}
				<span class="text-xs text-accent">Sin urgentes</span>
			{/if}
		</div>
		<div class="bg-white rounded-lg shadow-sm p-5 border-t-4 border-accent">
			<h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t(locale, 'dashboard.cer_effectiveness')}</h3>
			<div class="text-3xl font-bold text-gray-800 mt-2">{stats.sterilizationRate}%</div>
			<div class="mt-2 h-3 bg-gray-200 rounded-full overflow-hidden">
				<div class="h-full bg-accent rounded-full" style="width: {stats.sterilizationRate}%"></div>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<div class="lg:col-span-2 bg-white rounded-lg shadow-sm p-5">
			<h2 class="text-lg font-bold text-gray-800 mb-4">{t(locale, 'dashboard.recent_activity')}</h2>
			{#if recentActivity && recentActivity.length > 0}
				<ul class="space-y-0">
					{#each recentActivity as log}
						<li class="flex gap-4 py-3 border-b border-gray-100 last:border-0">
							<div class="w-8 h-8 rounded-full {actionBg(log.entity)} flex items-center justify-center text-sm flex-shrink-0">{actionIcon(log.entity)}</div>
							<div>
								<p class="text-sm">
									<strong class="capitalize">{log.action}:</strong>
									{#if log.details && typeof log.details === 'object'}
										{@const d = log.details as Record<string, unknown>}
										{d.name ?? d.category ?? log.entity} 
									{:else}
										{log.entity}
									{/if}
									{#if log.userName}
										<span class="text-gray-400">por {log.userName}</span>
									{/if}
								</p>
								<p class="text-xs text-gray-400 mt-1">{timeAgo(log.createdAt as unknown as string)}</p>
							</div>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-sm text-gray-400">No hay actividad reciente</p>
			{/if}
		</div>

		<div class="space-y-6">
			<div class="bg-white rounded-lg shadow-sm p-5">
				<h2 class="text-lg font-bold text-gray-800 mb-4">{t(locale, 'dashboard.quick_actions')}</h2>
				<div class="grid grid-cols-2 gap-3">
					<a href="/colonias?new=1" class="bg-gray-50 border border-gray-200 rounded-md p-4 text-center hover:bg-gray-100 transition-colors text-sm font-medium">
						🆕 {t(locale, 'dashboard.new_colony')}
					</a>
					<a href="/incidencias?new=1" class="bg-gray-50 border border-gray-200 rounded-md p-4 text-center hover:bg-gray-100 transition-colors text-sm font-medium">
						📝 {t(locale, 'dashboard.report_incident')}
					</a>
					<a href="/gatos?new=1" class="bg-gray-50 border border-gray-200 rounded-md p-4 text-center hover:bg-gray-100 transition-colors text-sm font-medium">
						🐱 {t(locale, 'dashboard.new_cat')}
					</a>
					<a href="/informes" class="bg-gray-50 border border-gray-200 rounded-md p-4 text-center hover:bg-gray-100 transition-colors text-sm font-medium">
						📋 {t(locale, 'dashboard.generate_report')}
					</a>
				</div>
			</div>

			{#if stats.pendingCollaborators > 0}
				<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<h4 class="text-sm font-bold text-yellow-800 mb-2">⚠️ Recordatorio</h4>
					<p class="text-sm text-yellow-700">Hay {stats.pendingCollaborators} solicitud(es) de colaborador pendientes de revisión.</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let locale = $derived(data.locale);
	let col = $derived(data.collaborator);

	let showCredential = $state(false);

	function statusBadge(s: string) {
		const map: Record<string, { bg: string; label: string }> = {
			active: { bg: 'bg-green-100 text-green-800', label: 'Activo' },
			pending: { bg: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
			inactive: { bg: 'bg-gray-100 text-gray-600', label: 'Inactivo' },
			suspended: { bg: 'bg-red-100 text-red-700', label: 'Suspendido' }
		};
		return map[s] ?? { bg: 'bg-gray-100', label: s };
	}

	function printCredential() {
		window.print();
	}
</script>

<svelte:head>
	<style>
		{'@media print { body * { visibility: hidden; } #credential-card, #credential-card * { visibility: visible; } #credential-card { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 400px; } }'}
	</style>
</svelte:head>

<div>
	<a href="/colaboradores" class="text-sm text-primary hover:underline mb-4 inline-block">&larr; Volver a colaboradores</a>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Profile Card -->
		<div class="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
			<div class="flex items-start justify-between mb-6">
				<div class="flex items-center gap-4">
					<div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
						{col.name.charAt(0)}
					</div>
					<div>
						<h2 class="text-xl font-bold text-gray-800">{col.name}</h2>
						<p class="text-sm text-gray-500">{col.documentId ?? 'Sin documento registrado'}</p>
					</div>
				</div>
				{@const badge = statusBadge(col.status)}
				<span class="px-3 py-1 rounded-full text-sm font-bold {badge.bg}">{badge.label}</span>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
				<div class="p-3 bg-gray-50 rounded-lg">
					<p class="text-xs font-semibold text-gray-500 mb-1">Vigencia</p>
					<p class="text-sm font-medium">{col.validUntil ?? 'Sin fecha'}</p>
				</div>
				<div class="p-3 bg-gray-50 rounded-lg">
					<p class="text-xs font-semibold text-gray-500 mb-1">LOPD Firmada</p>
					<p class="text-sm font-medium">{col.privacyNoticeSigned ? '✅ Sí' : '❌ No'}</p>
				</div>
			</div>

			{#if !col.privacyNoticeSigned}
				<div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
					<p class="text-sm font-semibold text-yellow-800 mb-2">Aviso de privacidad pendiente</p>
					<p class="text-xs text-yellow-700 mb-3">El colaborador debe ser informado de la finalidad del tratamiento de datos personales conforme al RGPD y la LOPDGDD antes de activar su cuenta.</p>
					<form method="POST" action="?/signPrivacy" use:enhance>
						<button type="submit" class="px-4 py-2 bg-yellow-600 text-white rounded text-sm font-semibold hover:bg-yellow-700">Registrar aceptación LOPD</button>
					</form>
				</div>
			{/if}

			<div>
				<h3 class="text-sm font-bold text-gray-700 mb-3">Colonias asignadas</h3>
				{#if data.assignedColonies.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each data.assignedColonies as c}
							<a href="/colonias/{c.id}" class="px-3 py-1.5 bg-primary/10 text-primary rounded-md text-sm font-medium hover:bg-primary/20 transition-colors">
								📍 {c.name}
							</a>
						{/each}
					</div>
				{:else}
					<p class="text-gray-400 text-sm">Sin colonias asignadas</p>
				{/if}
			</div>
		</div>

		<!-- Credential Card -->
		<div>
			<div class="bg-white rounded-lg shadow-sm p-4">
				<h3 class="text-sm font-bold text-gray-700 mb-3">Credencial Digital</h3>

				{#if col.status !== 'active'}
					<p class="text-xs text-gray-500">La credencial solo está disponible para colaboradores activos.</p>
				{:else}
					<button onclick={() => showCredential = !showCredential} class="w-full px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-dark mb-3">
						{showCredential ? 'Ocultar' : 'Ver'} credencial
					</button>

					{#if showCredential}
						<div id="credential-card" class="border-2 border-primary rounded-xl overflow-hidden">
							<div class="bg-primary text-white px-4 py-3 text-center">
								<p class="font-bold text-sm">AYUNTAMIENTO DE VITORIA-GASTEIZ</p>
								<p class="text-xs opacity-90">GASTEIZKO UDALA</p>
								<p class="text-[10px] mt-1 opacity-75">Credencial de Persona Colaboradora</p>
							</div>
							<div class="p-4 text-center">
								<div class="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold mb-3">
									{col.name.charAt(0)}
								</div>
								<p class="font-bold text-gray-800">{col.name}</p>
								<p class="text-xs text-gray-500 mt-1">ID: {col.id.slice(0, 8).toUpperCase()}</p>

								<!-- QR placeholder -->
								<div class="mt-3 mx-auto w-32 h-32 bg-gray-100 border rounded-lg flex items-center justify-center">
									<div class="text-center">
										<div class="text-4xl mb-1">📱</div>
										<p class="text-[10px] text-gray-500">QR de verificación</p>
										<p class="text-[8px] text-gray-400 font-mono mt-1">{col.id.slice(0, 12)}</p>
									</div>
								</div>

								<div class="mt-3 text-xs text-gray-600 space-y-1">
									<p><span class="font-semibold">Colonias:</span> {data.assignedColonies.map(c => c.name).join(', ') || '-'}</p>
									<p><span class="font-semibold">Válida hasta:</span> {col.validUntil ?? '-'}</p>
								</div>
							</div>
							<div class="bg-gray-50 px-4 py-2 text-center">
								<p class="text-[9px] text-gray-400">Gestión de Colonias Felinas Urbanas · Exp. 2026/CO_ASUM/0013</p>
							</div>
						</div>

						<div class="flex gap-2 mt-3">
							<button onclick={printCredential} class="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded text-xs font-semibold hover:bg-gray-200">🖨️ Imprimir</button>
							<a href="/api/credencial/{col.id}" target="_blank" class="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded text-xs font-semibold hover:bg-gray-200 text-center">📄 PDF</a>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
</div>

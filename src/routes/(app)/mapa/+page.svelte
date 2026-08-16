<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n/index.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	let locale = $derived(data.locale);
	let coloniesData = $derived(data.colonies);
	let feedingPointsData = $derived(data.feedingPoints);
	let incidentsData = $derived(data.incidents);

	let mapContainer: HTMLDivElement;
	let map: any;
	let colonyMarkers: any[] = [];
	let fpMarkers: any[] = [];
	let incidentMarkers: any[] = [];

	let layersVisible = $state({
		colonies: true,
		feedingPoints: true,
		incidents: true,
		sensitiveZones: false
	});
	let statusFilter = $state('all');
	let searchQuery = $state('');

	function updateLayers() {
		if (!map) return;
		colonyMarkers.forEach(m => layersVisible.colonies ? m.addTo(map) : m.remove());
		fpMarkers.forEach(m => layersVisible.feedingPoints ? m.addTo(map) : m.remove());
		incidentMarkers.forEach(m => layersVisible.incidents ? m.addTo(map) : m.remove());
	}

	$effect(() => {
		void layersVisible.colonies;
		void layersVisible.feedingPoints;
		void layersVisible.incidents;
		updateLayers();
	});

	onMount(async () => {
		const L = await import('leaflet');

		map = L.map(mapContainer).setView([42.8467, -2.6716], 13);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		}).addTo(map);

		const colonyIcon = L.divIcon({
			className: 'colony-marker',
			html: '<div style="background:#2563eb;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
			iconSize: [24, 24],
			iconAnchor: [12, 12]
		});

		const monitoringIcon = L.divIcon({
			className: 'colony-marker',
			html: '<div style="background:#f59e0b;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
			iconSize: [24, 24],
			iconAnchor: [12, 12]
		});

		const feedingIcon = L.divIcon({
			className: 'fp-marker',
			html: '<div style="background:#27ae60;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
			iconSize: [14, 14],
			iconAnchor: [7, 7]
		});

		const incidentIcon = L.divIcon({
			className: 'incident-marker',
			html: '<div style="background:#ef4444;width:20px;height:20px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
			iconSize: [20, 20],
			iconAnchor: [10, 10]
		});

		coloniesData.forEach((colony: any) => {
			if (!colony.latitude || !colony.longitude) return;
			const icon = colony.status === 'monitoring' ? monitoringIcon : colonyIcon;
			const marker = L.marker([colony.latitude, colony.longitude], { icon })
				.bindPopup(`
					<div style="min-width:200px">
						<strong>${colony.name}</strong><br>
						<small>${colony.district ?? ''} - ${colony.classification ?? ''}</small>
						<hr style="margin:8px 0;border:0;border-top:1px solid #eee">
						<div style="display:flex;justify-content:space-between;font-size:12px">
							<span>🐈 ${colony.catCount ?? 0} gatos</span>
							<a href="/colonias/${colony.id}" style="color:#2563eb;font-weight:600">Ver detalle →</a>
						</div>
					</div>
				`);
			marker.addTo(map);
			colonyMarkers.push(marker);
		});

		feedingPointsData.forEach((fp: any) => {
			if (!fp.latitude || !fp.longitude) return;
			const marker = L.marker([fp.latitude, fp.longitude], { icon: feedingIcon })
				.bindPopup(`<strong>Punto de alimentación</strong><br><small>${fp.notes ?? ''}</small>`);
			marker.addTo(map);
			fpMarkers.push(marker);
		});

		incidentsData.forEach((inc: any) => {
			if (!inc.latitude || !inc.longitude) return;
			const priorityLabel: Record<string, string> = { high: '🔴 Alta', medium: '🟡 Media', low: '🟢 Baja' };
			const marker = L.marker([inc.latitude, inc.longitude], { icon: incidentIcon })
				.bindPopup(`
					<div style="min-width:180px">
						<strong>⚠️ Incidencia</strong><br>
						<small>${inc.category} - ${priorityLabel[inc.priority] ?? inc.priority}</small>
						<hr style="margin:6px 0;border:0;border-top:1px solid #eee">
						<p style="font-size:12px;margin:0">${inc.description ?? ''}</p>
					</div>
				`);
			marker.addTo(map);
			incidentMarkers.push(marker);
		});

		setTimeout(() => map.invalidateSize(), 100);
	});
</script>

<svelte:head>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<div class="flex flex-col lg:flex-row h-[calc(100vh-8rem)] -m-4 lg:-m-6">
	<aside class="w-full lg:w-72 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col p-5 gap-4 overflow-y-auto flex-shrink-0">
		<h2 class="text-lg font-bold flex items-center gap-2">🗺️ {t(locale, 'map.layers')}</h2>

		<div class="space-y-2">
			<label class="flex items-center justify-between p-2.5 bg-gray-50 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-100">
				<div class="flex items-center gap-2.5 text-sm">
					<span class="w-3 h-3 rounded-full bg-info"></span>
					{t(locale, 'map.layer.colonies')} ({coloniesData.length})
				</div>
				<input type="checkbox" bind:checked={layersVisible.colonies} />
			</label>
			<label class="flex items-center justify-between p-2.5 bg-gray-50 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-100">
				<div class="flex items-center gap-2.5 text-sm">
					<span class="w-3 h-3 rounded-full bg-accent"></span>
					{t(locale, 'map.layer.feeding_points')} ({feedingPointsData.length})
				</div>
				<input type="checkbox" bind:checked={layersVisible.feedingPoints} />
			</label>
			<label class="flex items-center justify-between p-2.5 bg-gray-50 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-100">
				<div class="flex items-center gap-2.5 text-sm">
					<span class="w-3 h-3 rounded-full bg-danger"></span>
					{t(locale, 'map.layer.incidents')} ({incidentsData.length})
				</div>
				<input type="checkbox" bind:checked={layersVisible.incidents} />
			</label>
		</div>

		<div class="mt-4">
			<h3 class="text-sm font-bold mb-2">🔍 {t(locale, 'map.filter.status')}</h3>
			<select bind:value={statusFilter} class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
				<option value="all">{t(locale, 'map.filter.all')}</option>
				<option value="active">Activa</option>
				<option value="monitoring">Monitorización</option>
				<option value="inactive">Inactiva</option>
			</select>
		</div>

		<div class="mt-auto pt-4 border-t border-gray-200 text-xs text-gray-500">
			Mostrando {coloniesData.length} colonias y {incidentsData.length} incidencias activas.
		</div>
	</aside>

	<div class="flex-1 relative">
		<div class="absolute top-4 left-4 right-16 z-[400]">
			<div class="relative max-w-xs">
				<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder={t(locale, 'map.search')}
					class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 shadow-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
				/>
			</div>
		</div>

		<div bind:this={mapContainer} class="w-full h-full"></div>

		<div class="absolute bottom-6 right-4 flex flex-col gap-3 z-[400]">
			<a href="/colonias?new=1" class="w-12 h-12 rounded-full bg-info text-white shadow-lg flex items-center justify-center text-xl hover:bg-blue-700 transition-colors" title="Añadir colonia">
				➕
			</a>
			<button class="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-xl hover:bg-gray-50 transition-colors" title="Mi ubicación">
				🎯
			</button>
		</div>
	</div>
</div>

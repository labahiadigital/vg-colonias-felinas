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
	let layerGroups: Record<string, any> = {};

	let layersVisible = $state({
		colonies: true,
		feedingPoints: true,
		incidents: true,
		criticalZones: false,
		sensitiveZones: false,
		campingZones: false
	});
	let statusFilter = $state('all');
	let districtFilter = $state('all');
	let searchQuery = $state('');
	let geolocating = $state(false);

	$effect(() => {
		if (!map) return;
		void layersVisible.colonies;
		void layersVisible.feedingPoints;
		void layersVisible.incidents;
		void layersVisible.criticalZones;
		void layersVisible.sensitiveZones;
		void layersVisible.campingZones;
		Object.entries(layerGroups).forEach(([key, group]) => {
			const k = key as keyof typeof layersVisible;
			if (layersVisible[k]) { if (!map.hasLayer(group)) group.addTo(map); }
			else { if (map.hasLayer(group)) map.removeLayer(group); }
		});
	});

	function geolocate() {
		if (!map || !navigator.geolocation) return;
		geolocating = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				map.setView([pos.coords.latitude, pos.coords.longitude], 16);
				geolocating = false;
			},
			() => { geolocating = false; },
			{ enableHighAccuracy: true }
		);
	}

	let districts = $derived([...new Set(coloniesData.map((c: any) => c.district).filter(Boolean))]);

	let filteredColonies = $derived(
		coloniesData.filter((c: any) => {
			if (statusFilter !== 'all' && c.status !== statusFilter) return false;
			if (districtFilter !== 'all' && c.district !== districtFilter) return false;
			if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
			return true;
		})
	);

	onMount(async () => {
		const L = await import('leaflet');

		map = L.map(mapContainer).setView([42.8467, -2.6716], 13);
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		}).addTo(map);

		const mkIcon = (color: string, size: number) => L.divIcon({
			className: '',
			html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
			iconSize: [size, size],
			iconAnchor: [size / 2, size / 2]
		});

		const colonyGroup = L.layerGroup();
		const fpGroup = L.layerGroup();
		const incGroup = L.layerGroup();
		const criticalGroup = L.layerGroup();
		const sensitiveGroup = L.layerGroup();
		const campingGroup = L.layerGroup();

		coloniesData.forEach((colony: any) => {
			if (!colony.latitude || !colony.longitude) return;
			const color = colony.status === 'monitoring' ? '#f59e0b' : colony.status === 'inactive' ? '#9ca3af' : '#2563eb';
			const marker = L.marker([colony.latitude, colony.longitude], { icon: mkIcon(color, 24) })
				.bindPopup(`
					<div style="min-width:220px">
						<strong>${colony.name}</strong><br>
						<small>${colony.district ?? ''} — ${colony.classification ?? ''}</small>
						<hr style="margin:8px 0;border:0;border-top:1px solid #eee">
						<div style="display:flex;justify-content:space-between;font-size:12px">
							<span>🐈 ${colony.catCount ?? 0} gatos</span>
							<a href="/colonias/${colony.id}" style="color:#2563eb;font-weight:600">Ver ficha →</a>
						</div>
					</div>
				`);
			marker.addTo(colonyGroup);

			if (colony.geojson) {
				try {
					L.geoJSON(colony.geojson, { style: { color: '#2563eb', weight: 2, fillOpacity: 0.1 } }).addTo(campingGroup);
				} catch (_) { /* GeoJSON inválido */ }
			}
		});

		feedingPointsData.forEach((fp: any) => {
			if (!fp.latitude || !fp.longitude) return;
			L.marker([fp.latitude, fp.longitude], { icon: mkIcon('#27ae60', 14) })
				.bindPopup(`<strong>Punto de alimentación</strong><br><small>${fp.notes ?? ''}</small>`)
				.addTo(fpGroup);
		});

		incidentsData.forEach((inc: any) => {
			if (!inc.latitude || !inc.longitude) return;
			const pl: Record<string, string> = { high: '🔴 Alta', medium: '🟡 Media', low: '🟢 Baja', critical: '🔴 Crítica' };
			L.marker([inc.latitude, inc.longitude], { icon: mkIcon('#ef4444', 20) })
				.bindPopup(`
					<div style="min-width:200px">
						<strong>⚠️ Incidencia</strong><br>
						<small>${inc.category} — ${pl[inc.priority] ?? inc.priority}</small>
						<hr style="margin:6px 0;border:0;border-top:1px solid #eee">
						<p style="font-size:12px;margin:0">${inc.description ?? ''}</p>
					</div>
				`)
				.addTo(incGroup);

			if (inc.priority === 'high' || inc.priority === 'critical') {
				L.circle([inc.latitude, inc.longitude], { radius: 200, color: '#ef4444', weight: 1, fillOpacity: 0.08 })
					.addTo(criticalGroup);
			}
		});

		// Zonas sensibles demo (colegios, hospitales cercanos a colonias)
		const sensitiveZones = [
			{ lat: 42.8480, lng: -2.6700, label: 'Centro Educativo', radius: 150 },
			{ lat: 42.8500, lng: -2.6760, label: 'Centro de Salud', radius: 120 }
		];
		sensitiveZones.forEach(z => {
			L.circle([z.lat, z.lng], { radius: z.radius, color: '#a855f7', weight: 1, fillOpacity: 0.1, dashArray: '5,5' })
				.bindPopup(`<strong>Zona sensible</strong><br><small>${z.label}</small>`)
				.addTo(sensitiveGroup);
		});

		layerGroups = {
			colonies: colonyGroup,
			feedingPoints: fpGroup,
			incidents: incGroup,
			criticalZones: criticalGroup,
			sensitiveZones: sensitiveGroup,
			campingZones: campingGroup
		};

		colonyGroup.addTo(map);
		fpGroup.addTo(map);
		incGroup.addTo(map);

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
			{#each [
				{ key: 'colonies', icon: '🔵', label: `Colonias (${filteredColonies.length})` },
				{ key: 'feedingPoints', icon: '🟢', label: `Puntos alimentación (${feedingPointsData.length})` },
				{ key: 'incidents', icon: '🔴', label: `Incidencias (${incidentsData.length})` },
				{ key: 'criticalZones', icon: '🔴', label: 'Zonas críticas' },
				{ key: 'sensitiveZones', icon: '🟣', label: 'Zonas sensibles' },
				{ key: 'campingZones', icon: '🔷', label: 'Zonas de campeo' }
			] as layer}
				<label for={`layer-${layer.key}`} class="flex items-center justify-between p-2.5 bg-gray-50 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-100">
					<div class="flex items-center gap-2 text-sm">
						<span>{layer.icon}</span>
						{layer.label}
					</div>
					<input type="checkbox" id={`layer-${layer.key}`} bind:checked={layersVisible[layer.key as keyof typeof layersVisible]} />
				</label>
			{/each}
		</div>

		<div class="border-t pt-3 space-y-3">
			<div>
				<label for="statusFilter" class="text-xs font-bold text-gray-600">Estado</label>
				<select id="statusFilter" bind:value={statusFilter} class="w-full px-3 py-2 border rounded-md text-sm mt-1">
					<option value="all">Todos</option>
					<option value="active">Activa</option>
					<option value="monitoring">Monitorización</option>
					<option value="inactive">Inactiva</option>
				</select>
			</div>
			<div>
				<label for="districtFilter" class="text-xs font-bold text-gray-600">Distrito</label>
				<select id="districtFilter" bind:value={districtFilter} class="w-full px-3 py-2 border rounded-md text-sm mt-1">
					<option value="all">Todos</option>
					{#each districts as d}
						<option value={d}>{d}</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="border-t pt-3">
			<h3 class="text-xs font-bold text-gray-600 mb-2">Leyenda</h3>
			<div class="space-y-1 text-xs text-gray-600">
				<div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-blue-600"></span> Colonia activa</div>
				<div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-amber-500"></span> En seguimiento</div>
				<div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-gray-400"></span> Inactiva</div>
				<div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-green-600"></span> Punto alimentación</div>
				<div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-red-500"></span> Incidencia</div>
			</div>
		</div>

		<div class="mt-auto pt-3 border-t text-xs text-gray-400">
			{filteredColonies.length} colonias · {incidentsData.length} incidencias
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
			<a href="/colonias?new=1" class="w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center text-xl hover:bg-blue-700 transition-colors" title="Añadir colonia">
				➕
			</a>
			<button onclick={geolocate} class="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-xl hover:bg-gray-50 transition-colors" title="Mi ubicación" disabled={geolocating}>
				{geolocating ? '⏳' : '🎯'}
			</button>
		</div>
	</div>
</div>

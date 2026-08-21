<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n/index.js';
	import type { PageData } from './$types.js';
	import { createMap, addHeatLayer, addDrawControl } from '$lib/leaflet-adapter.js';
	import type { Map as LeafletMap, LayerGroup } from 'leaflet';

	let { data }: { data: PageData } = $props();
	let locale = $derived(data.locale);
	let coloniesData = $derived(data.colonies);
	let feedingPointsData = $derived(data.feedingPoints);
	let incidentsData = $derived(data.incidents);
	let heatmapData = $derived(data.heatmapData);

	let mapContainer: HTMLDivElement;
	let map: LeafletMap | null = null;
	let layerGroups: Record<string, LayerGroup> = {};
	let mapReady = $state(false);
	let showLayers = $state(false);

	let layersVisible = $state({
		colonies: true,
		feedingPoints: true,
		incidents: true,
		criticalZones: false,
		sensitiveZones: false,
		campingZones: false,
		heatCatDensity: false,
		heatIncidents: false,
		heatVolunteer: false
	});
	let statusFilter = $state('all');
	let districtFilter = $state('all');
	let searchQuery = $state('');
	let geolocating = $state(false);

	$effect(() => {
		const m = map;
		if (!m) return;
		void layersVisible.colonies;
		void layersVisible.feedingPoints;
		void layersVisible.incidents;
		void layersVisible.criticalZones;
		void layersVisible.sensitiveZones;
		void layersVisible.campingZones;
		void layersVisible.heatCatDensity;
		void layersVisible.heatIncidents;
		void layersVisible.heatVolunteer;
		Object.entries(layerGroups).forEach(([key, group]) => {
			const k = key as keyof typeof layersVisible;
			if (layersVisible[k]) { if (!m.hasLayer(group)) group.addTo(m); }
			else { if (m.hasLayer(group)) m.removeLayer(group); }
		});
	});

	function geolocate() {
		const m = map;
		if (!m || !navigator.geolocation) return;
		geolocating = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				m.setView([pos.coords.latitude, pos.coords.longitude], 16);
				geolocating = false;
			},
			() => { geolocating = false; },
			{ enableHighAccuracy: true }
		);
	}

	let districts = $derived([...new Set(coloniesData.map((c) => c.district).filter(Boolean))]);

	let filteredColonies = $derived(
		coloniesData.filter((c) => {
			if (statusFilter !== 'all' && c.status !== statusFilter) return false;
			if (districtFilter !== 'all' && c.district !== districtFilter) return false;
			if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
			return true;
		})
	);

	onMount(async () => {
		const result = await createMap(mapContainer);
		const L = result.L;
		map = result.map;

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

		coloniesData.forEach((colony) => {
			if (!colony.latitude || !colony.longitude) return;
			const color = colony.status === 'monitoring' ? '#f59e0b' : colony.status === 'inactive' ? '#9ca3af' : '#0f766e';
			const m = L.marker([colony.latitude, colony.longitude], { icon: mkIcon(color, 24) })
				.bindPopup(`
					<div style="min-width:220px;font-family:Inter,system-ui,sans-serif">
						<strong style="font-size:14px">${colony.name}</strong><br>
						<span style="font-size:12px;color:#52525b">${colony.district ?? ''} — ${colony.classification ?? ''}</span>
						<hr style="margin:8px 0;border:0;border-top:1px solid #e4e4e7">
						<div style="display:flex;justify-content:space-between;font-size:12px;align-items:center">
							<span style="color:#52525b">${colony.catCount ?? 0} ${t(locale, 'map.cats_count')}</span>
							<a href="/colonias/${colony.id}" style="color:#0f766e;font-weight:600;text-decoration:none">${t(locale, 'map.view_card')} →</a>
						</div>
					</div>
				`);
			m.addTo(colonyGroup);

			if (colony.geojson) {
				try {
					L.geoJSON(colony.geojson as GeoJSON.GeoJsonObject, { style: { color: '#0f766e', weight: 2, fillOpacity: 0.1 } }).addTo(campingGroup);
				} catch (_) { /* skip */ }
			}
		});

		feedingPointsData.forEach((fp) => {
			if (!fp.latitude || !fp.longitude) return;
			L.marker([fp.latitude, fp.longitude], { icon: mkIcon('#10b981', 14) })
				.bindPopup(`<strong>${t(locale, 'map.feeding_point')}</strong><br><small>${fp.notes ?? ''}</small>`)
				.addTo(fpGroup);
		});

		incidentsData.forEach((inc) => {
			if (!inc.latitude || !inc.longitude) return;
			L.marker([inc.latitude, inc.longitude], { icon: mkIcon('#ef4444', 20) })
				.bindPopup(`
					<div style="min-width:200px;font-family:Inter,system-ui,sans-serif">
						<strong style="font-size:13px">${t(locale, 'map.incident')}</strong><br>
						<span style="font-size:12px;color:#52525b">${inc.category} — ${inc.priority}</span>
						<hr style="margin:6px 0;border:0;border-top:1px solid #e4e4e7">
						<p style="font-size:12px;margin:0;color:#52525b">${inc.description ?? ''}</p>
					</div>
				`)
				.addTo(incGroup);

			if (inc.priority === 'high' || inc.priority === 'critical') {
				L.circle([inc.latitude, inc.longitude], { radius: 200, color: '#ef4444', weight: 1, fillOpacity: 0.08 })
					.addTo(criticalGroup);
			}
		});

		const sensitiveZones = [
			{ lat: 42.8480, lng: -2.6700, label: 'Centro Educativo', radius: 150 },
			{ lat: 42.8500, lng: -2.6760, label: 'Centro de Salud', radius: 120 }
		];
		sensitiveZones.forEach(z => {
			L.circle([z.lat, z.lng], { radius: z.radius, color: '#6366f1', weight: 1, fillOpacity: 0.1, dashArray: '5,5' })
				.bindPopup(`<strong>${t(locale, 'map.sensitive_zone')}</strong><br><small>${z.label}</small>`)
				.addTo(sensitiveGroup);
		});

		const heatCatGroup = L.layerGroup();
		const heatIncGroup = L.layerGroup();
		const heatVolGroup = L.layerGroup();

		await addHeatLayer(L, heatCatGroup, heatmapData.catDensity, { radius: 35, blur: 25, maxZoom: 17, gradient: { 0.2: '#eff6ff', 0.4: '#93c5fd', 0.6: '#3b82f6', 0.8: '#1d4ed8', 1: '#1e3a5f' } });
		await addHeatLayer(L, heatIncGroup, heatmapData.incidentFrequency, { radius: 30, blur: 20, maxZoom: 17, gradient: { 0.2: '#fef3c7', 0.4: '#fbbf24', 0.6: '#f59e0b', 0.8: '#dc2626', 1: '#991b1b' } });
		await addHeatLayer(L, heatVolGroup, heatmapData.volunteerActivity, { radius: 30, blur: 20, maxZoom: 17, gradient: { 0.2: '#ecfdf5', 0.4: '#6ee7b7', 0.6: '#10b981', 0.8: '#059669', 1: '#064e3b' } });

		layerGroups = {
			colonies: colonyGroup,
			feedingPoints: fpGroup,
			incidents: incGroup,
			criticalZones: criticalGroup,
			sensitiveZones: sensitiveGroup,
			campingZones: campingGroup,
			heatCatDensity: heatCatGroup,
			heatIncidents: heatIncGroup,
			heatVolunteer: heatVolGroup
		};

		colonyGroup.addTo(map);
		fpGroup.addTo(map);
		incGroup.addTo(map);

		await addDrawControl(L, map);

		mapReady = true;
		setTimeout(() => map?.invalidateSize(), 100);
	});
</script>

<svelte:head>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
	<link rel="stylesheet" href="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css" />
</svelte:head>

<div class="flex flex-col lg:flex-row h-[calc(100vh-3.5rem-4rem)] lg:h-[calc(100vh-3.5rem)] -m-4 lg:-m-8">
	<!-- Sidebar controls (desktop) -->
	<aside class="hidden lg:flex w-72 bg-surface border-r border-border flex-col overflow-y-auto flex-shrink-0">
		<div class="p-5 border-b border-border">
			<h2 class="text-sm font-semibold text-text">{t(locale, 'map.layers')}</h2>
		</div>

		<div class="p-4 space-y-2">
			{#each [
				{ key: 'colonies', color: 'bg-primary', label: `${t(locale, 'map.layer.colonies')} (${filteredColonies.length})` },
				{ key: 'feedingPoints', color: 'bg-success', label: `${t(locale, 'map.layer.feeding_points')} (${feedingPointsData.length})` },
				{ key: 'incidents', color: 'bg-danger', label: `${t(locale, 'map.layer.incidents')} (${incidentsData.length})` },
				{ key: 'criticalZones', color: 'bg-danger', label: t(locale, 'map.layer.critical_zones') },
				{ key: 'sensitiveZones', color: 'bg-accent', label: t(locale, 'map.layer.sensitive_zones') },
				{ key: 'campingZones', color: 'bg-primary', label: t(locale, 'map.layer.camping_zones') }
			] as layer}
				<label for={`layer-${layer.key}`} class="flex items-center justify-between p-2.5 bg-surface-sunken rounded-lg cursor-pointer hover:bg-border transition-colors min-h-[44px]">
					<div class="flex items-center gap-2.5 text-sm text-text-secondary">
						<span class="w-2.5 h-2.5 rounded-full {layer.color}"></span>
						{layer.label}
					</div>
					<input type="checkbox" id={`layer-${layer.key}`} bind:checked={layersVisible[layer.key as keyof typeof layersVisible]} class="rounded border-border text-primary focus:ring-primary/20" />
				</label>
			{/each}

			<p class="px-2 mt-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted/70">{t(locale, 'map.heatmaps')}</p>
			{#each [
				{ key: 'heatCatDensity', color: 'bg-blue-500', label: t(locale, 'map.heat.cat_density') },
				{ key: 'heatIncidents', color: 'bg-red-500', label: t(locale, 'map.heat.incidents') },
				{ key: 'heatVolunteer', color: 'bg-emerald-500', label: t(locale, 'map.heat.volunteer') }
			] as layer}
				<label for={`layer-${layer.key}`} class="flex items-center justify-between p-2.5 bg-surface-sunken rounded-lg cursor-pointer hover:bg-border transition-colors min-h-[44px]">
					<div class="flex items-center gap-2.5 text-sm text-text-secondary">
						<span class="w-2.5 h-2.5 rounded-full {layer.color}"></span>
						{layer.label}
					</div>
					<input type="checkbox" id={`layer-${layer.key}`} bind:checked={layersVisible[layer.key as keyof typeof layersVisible]} class="rounded border-border text-primary focus:ring-primary/20" />
				</label>
			{/each}
		</div>

		<div class="p-4 border-t border-border space-y-3">
			<div>
				<label for="statusFilter" class="text-xs font-medium text-text-muted uppercase tracking-wide">{t(locale, 'map.filter.status')}</label>
				<select id="statusFilter" bind:value={statusFilter} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm mt-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
					<option value="all">{t(locale, 'map.filter.all')}</option>
					<option value="active">{t(locale, 'map.filter.active')}</option>
					<option value="monitoring">{t(locale, 'map.filter.monitoring')}</option>
					<option value="inactive">{t(locale, 'map.filter.inactive')}</option>
				</select>
			</div>
			<div>
				<label for="districtFilter" class="text-xs font-medium text-text-muted uppercase tracking-wide">{t(locale, 'map.filter.district')}</label>
				<select id="districtFilter" bind:value={districtFilter} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm mt-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
					<option value="all">{t(locale, 'map.filter.all')}</option>
					{#each districts as d}
						<option value={d}>{d}</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="mt-auto p-4 border-t border-border text-xs text-text-muted">
			{filteredColonies.length} {t(locale, 'map.colonies_count')} · {incidentsData.length} {t(locale, 'map.incidents_count')}
		</div>
	</aside>

	<!-- Mobile layer toggle -->
	<button
		onclick={() => showLayers = !showLayers}
		class="lg:hidden absolute top-20 left-4 z-[401] px-3 py-2 bg-surface border border-border rounded-lg shadow-lg text-sm font-medium text-text-secondary min-h-[44px] inline-flex items-center gap-2"
	>
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-4 h-4"><path d="M12 2l10 6.5v7L12 22 2 15.5v-7L12 2z"/><path d="M12 22v-7"/><path d="M22 8.5l-10 7-10-7"/></svg>
		{t(locale, 'map.layers')}
	</button>

	{#if showLayers}
		<div class="lg:hidden fixed inset-0 z-[500]">
			<button class="absolute inset-0 bg-black/40" onclick={() => showLayers = false} aria-label={t(locale, 'map.close')}></button>
			<div class="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl p-5 max-h-[70vh] overflow-y-auto safe-bottom">
				<div class="w-10 h-1 bg-border rounded-full mx-auto mb-4"></div>
				<h3 class="text-sm font-semibold text-text mb-3">{t(locale, 'map.layers')}</h3>
				<div class="space-y-2">
					{#each [
						{ key: 'colonies', color: 'bg-primary', label: `${t(locale, 'map.layer.colonies')} (${filteredColonies.length})` },
						{ key: 'feedingPoints', color: 'bg-success', label: t(locale, 'map.layer.feeding_points') },
						{ key: 'incidents', color: 'bg-danger', label: `${t(locale, 'map.layer.incidents')} (${incidentsData.length})` },
						{ key: 'criticalZones', color: 'bg-danger', label: t(locale, 'map.layer.critical_zones') },
						{ key: 'sensitiveZones', color: 'bg-accent', label: t(locale, 'map.layer.sensitive_zones') }
					] as layer}
						<label class="flex items-center justify-between p-3 bg-surface-sunken rounded-lg cursor-pointer min-h-[48px]">
							<div class="flex items-center gap-2.5 text-sm text-text-secondary">
								<span class="w-2.5 h-2.5 rounded-full {layer.color}"></span>
								{layer.label}
							</div>
							<input type="checkbox" bind:checked={layersVisible[layer.key as keyof typeof layersVisible]} class="rounded border-border text-primary focus:ring-primary/20 w-5 h-5" />
						</label>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Map container -->
	<div class="flex-1 relative">
		{#if !mapReady}
			<div class="absolute inset-0 flex items-center justify-center bg-surface-sunken">
				<div class="flex flex-col items-center gap-2">
					<svg class="w-6 h-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.2"/><path d="M12 2a10 10 0 019.95 9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
					<span class="text-sm text-text-muted">{t(locale, 'map.loading')}</span>
				</div>
			</div>
		{/if}

		<div class="absolute top-4 left-4 lg:left-4 right-16 z-[400]">
			<div class="relative max-w-xs ml-14 lg:ml-0">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder={t(locale, 'map.search')}
					class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border shadow-lg bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[44px]"
				/>
			</div>
		</div>

		<div bind:this={mapContainer} class="w-full h-full"></div>

		<div class="absolute bottom-6 right-4 flex flex-col gap-3 z-[400]">
			<a href="/colonias?new=1" class="w-12 h-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary-hover transition-colors" title={t(locale, 'map.add_colony')}>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-5 h-5"><path d="M12 5v14m-7-7h14"/></svg>
			</a>
			<button onclick={geolocate} disabled={geolocating} class="w-12 h-12 rounded-full bg-surface border border-border shadow-lg flex items-center justify-center hover:bg-surface-sunken transition-colors disabled:opacity-50" title={t(locale, 'map.my_location')}>
				{#if geolocating}
					<svg class="w-5 h-5 animate-spin text-primary" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.2"/><path d="M12 2a10 10 0 019.95 9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
				{:else}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-5 h-5 text-text-secondary"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/><circle cx="12" cy="12" r="8"/></svg>
				{/if}
			</button>
		</div>
	</div>
</div>

<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';

	let { data }: { data: PageData } = $props();
	let locale = $derived(data.locale);

	let category = $state('abandoned');
	let description = $state('');
	let email = $state('');
	let latitude = $state<number | null>(null);
	let longitude = $state<number | null>(null);
	let submitting = $state(false);
	let submitted = $state(false);
	let error = $state('');
	let mapContainer: HTMLDivElement;
	let map: any;
	let marker: any;
	let geolocating = $state(false);

	const categories = [
		{ value: 'abandoned', labelKey: 'citizen.cat_abandoned' },
		{ value: 'injured', labelKey: 'citizen.cat_injured' },
		{ value: 'new_colony', labelKey: 'citizen.cat_colony' },
		{ value: 'other', labelKey: 'citizen.other' }
	];

	function geolocate() {
		if (!navigator.geolocation) return;
		geolocating = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				latitude = pos.coords.latitude;
				longitude = pos.coords.longitude;
				if (map) {
					map.setView([latitude, longitude], 16);
					updateMarker();
				}
				geolocating = false;
			},
			() => { geolocating = false; },
			{ enableHighAccuracy: true }
		);
	}

	function updateMarker() {
		if (!map || !latitude || !longitude) return;
		import('leaflet').then(L => {
			if (marker) marker.setLatLng([latitude!, longitude!]);
			else {
				marker = L.marker([latitude!, longitude!], { draggable: true }).addTo(map);
				marker.on('dragend', () => {
					const pos = marker.getLatLng();
					latitude = pos.lat;
					longitude = pos.lng;
				});
			}
		});
	}

	onMount(async () => {
		const L = await import('leaflet');
		map = L.map(mapContainer).setView([42.8467, -2.6716], 13);
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; OpenStreetMap'
		}).addTo(map);
		map.on('click', (e: any) => {
			latitude = e.latlng.lat;
			longitude = e.latlng.lng;
			updateMarker();
		});
		setTimeout(() => map.invalidateSize(), 100);
	});

	async function submit() {
		if (!description.trim()) return;
		submitting = true;
		error = '';
		try {
			const res = await fetch('/api/citizen-report', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ category, description, latitude, longitude, email })
			});
			if (res.ok) {
				submitted = true;
			} else {
				const data = await res.json();
				error = data.error || t(locale, 'citizen.error');
			}
		} catch {
			error = t(locale, 'citizen.error');
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{t(locale, 'citizen.title')} - Gatopolis</title>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-primary/5 to-background">
	<header class="bg-white border-b border-border">
		<div class="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
			<a href="/" class="flex items-center gap-2">
				<div class="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center">
					<svg viewBox="0 0 32 32" fill="none" class="w-5 h-5">
						<path d="M16 4C11.58 4 8 7.58 8 12c0 6 8 14 8 14s8-8 8-14c0-4.42-3.58-8-8-8z" fill="white"/>
						<ellipse cx="14" cy="11" rx="0.9" ry="1.1" fill="#0f766e"/>
						<ellipse cx="18" cy="11" rx="0.9" ry="1.1" fill="#0f766e"/>
					</svg>
				</div>
				<span class="text-sm font-bold text-text">Gatopolis</span>
			</a>
		</div>
	</header>

	<main class="max-w-3xl mx-auto px-4 py-8">
		{#if submitted}
			<div class="bg-surface rounded-2xl border border-border p-8 text-center">
				<div class="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-8 h-8 text-success"><polyline points="20,6 9,17 4,12"/></svg>
				</div>
				<h2 class="text-xl font-bold text-text mb-2">{t(locale, 'citizen.success')}</h2>
				<p class="text-sm text-text-muted mb-6">{t(locale, 'citizen.privacy_note')}</p>
				<button onclick={() => { submitted = false; description = ''; latitude = null; longitude = null; email = ''; if (marker) { marker.remove(); marker = null; } }} class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors">
					Enviar otro reporte
				</button>
			</div>
		{:else}
			<div class="text-center mb-8">
				<h1 class="text-2xl font-bold text-text">{t(locale, 'citizen.title')}</h1>
				<p class="text-sm text-text-muted mt-1">{t(locale, 'citizen.subtitle')}</p>
			</div>

			<div class="bg-surface rounded-2xl border border-border p-6 space-y-5">
				<div>
					<label for="category" class="block text-sm font-medium text-text mb-1.5">{t(locale, 'citizen.category')}</label>
					<select id="category" bind:value={category} class="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
						{#each categories as cat}
							<option value={cat.value}>{t(locale, cat.labelKey)}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="description" class="block text-sm font-medium text-text mb-1.5">{t(locale, 'citizen.description')}</label>
					<textarea id="description" bind:value={description} rows="4" placeholder={t(locale, 'citizen.description_placeholder')} class="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"></textarea>
				</div>

				<div>
					<label class="block text-sm font-medium text-text mb-1.5">{t(locale, 'citizen.location')}</label>
					<div class="flex gap-2 mb-3">
						<button onclick={geolocate} disabled={geolocating} class="px-3 py-2 bg-primary/10 text-primary text-sm font-medium rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5">
							{#if geolocating}
								<svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.2"/><path d="M12 2a10 10 0 019.95 9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
							{:else}
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-4 h-4"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>
							{/if}
							{t(locale, 'citizen.location_auto')}
						</button>
						<span class="text-xs text-text-muted self-center">{t(locale, 'citizen.location_manual')}</span>
					</div>
					<div bind:this={mapContainer} class="w-full h-56 rounded-lg border border-border overflow-hidden"></div>
					{#if latitude && longitude}
						<p class="text-xs text-text-muted mt-1">{latitude.toFixed(5)}, {longitude.toFixed(5)}</p>
					{/if}
				</div>

				<div>
					<label for="email" class="block text-sm font-medium text-text mb-1.5">{t(locale, 'citizen.email')}</label>
					<input id="email" type="email" bind:value={email} placeholder={t(locale, 'citizen.email_placeholder')} class="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
				</div>

				{#if error}
					<p class="text-sm text-danger bg-danger/5 px-3 py-2 rounded-lg">{error}</p>
				{/if}

				<div class="bg-info/5 border border-info/15 rounded-lg p-3">
					<p class="text-xs text-info">{t(locale, 'citizen.privacy_note')}</p>
				</div>

				<button onclick={submit} disabled={submitting || !description.trim()} class="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 text-sm">
					{#if submitting}
						<svg class="w-4 h-4 animate-spin inline mr-2" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.2"/><path d="M12 2a10 10 0 019.95 9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
					{/if}
					{t(locale, 'citizen.submit')}
				</button>
			</div>
		{/if}
	</main>
</div>

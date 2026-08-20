<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	let locale = $derived(data.locale);

	let photoFile = $state<File | null>(null);
	let photoPreview = $state('');
	let loading = $state(false);
	let results = $state<{
		matches: Array<{ id: string; name: string; colonyName: string; sex: string; photo: string; score: number; sterilized: boolean; microchip: string }>;
		analysis: { description: string; color: string; pattern: string; distinctiveFeatures: string[]; estimatedAge?: string };
		catalogCats: Array<{ id: string; name: string; colonyName: string; photo: string }>;
		method: string;
	} | null>(null);
	let error = $state('');

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		photoFile = file;
		const reader = new FileReader();
		reader.onload = (e) => { photoPreview = e.target?.result as string; };
		reader.readAsDataURL(file);
		results = null;
		error = '';
	}

	function handleCameraCapture() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/*';
		input.capture = 'environment';
		input.onchange = (e) => handleFileSelect(e);
		input.click();
	}

	async function identify() {
		if (!photoFile) return;
		loading = true;
		error = '';
		results = null;
		try {
			const fd = new FormData();
			fd.append('photo', photoFile);
			const res = await fetch('/api/cat-identify', { method: 'POST', body: fd });
			const data = await res.json();
			if (data.error) {
				error = data.error;
			} else {
				results = data;
			}
		} catch {
			error = 'Error de conexión';
		} finally {
			loading = false;
		}
	}

	function reset() {
		photoFile = null;
		photoPreview = '';
		results = null;
		error = '';
	}
</script>

<div class="max-w-4xl mx-auto">
	<div class="flex items-center gap-4 mb-6">
		<a href="/gatos" class="p-2 rounded-lg hover:bg-surface-sunken transition-colors text-text-muted">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
		</a>
		<div>
			<h1 class="text-2xl font-bold text-text tracking-tight">{t(locale, 'catid.title')}</h1>
			<p class="text-sm text-text-muted mt-0.5">{t(locale, 'catid.subtitle')}</p>
		</div>
	</div>

	{#if !results}
		<div class="bg-surface rounded-xl border border-border p-6">
			{#if !photoPreview}
				<div class="text-center py-12">
					<div class="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-10 h-10 text-primary">
							<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-text mb-2">{t(locale, 'catid.upload_title')}</h3>
					<p class="text-sm text-text-muted mb-6 max-w-md mx-auto">{t(locale, 'catid.upload_desc')}</p>

					<div class="flex flex-col sm:flex-row gap-3 justify-center">
						<button onclick={handleCameraCapture} class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
							{t(locale, 'catid.take_photo')}
						</button>
						<label class="inline-flex items-center gap-2 px-6 py-3 bg-surface-sunken text-text-secondary text-sm font-medium rounded-lg hover:bg-border transition-colors cursor-pointer">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
							{t(locale, 'catid.upload_file')}
							<input type="file" accept="image/*" onchange={handleFileSelect} class="hidden" />
						</label>
					</div>
				</div>
			{:else}
				<div class="flex flex-col md:flex-row gap-6 items-start">
					<div class="w-full md:w-1/2">
						<img src={photoPreview} alt="Foto del gato" class="w-full rounded-xl border border-border object-cover max-h-80" />
					</div>
					<div class="w-full md:w-1/2 flex flex-col gap-4">
						<div class="p-4 bg-surface-sunken rounded-lg">
							<p class="text-sm text-text-secondary">{t(locale, 'catid.ready_to_analyze')}</p>
							<p class="text-xs text-text-muted mt-1">{t(locale, 'catid.ai_disclaimer')}</p>
						</div>

						{#if error}
							<div class="bg-danger-subtle text-danger text-sm p-3 rounded-lg border border-danger/10">{error}</div>
						{/if}

						<div class="flex gap-3">
							<button onclick={identify} disabled={loading} class="flex-1 px-5 py-3 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2">
								{#if loading}
									<svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="31.4 31.4" stroke-linecap="round"/></svg>
									{t(locale, 'catid.analyzing')}
								{:else}
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
									{t(locale, 'catid.identify')}
								{/if}
							</button>
							<button onclick={reset} class="px-4 py-3 bg-surface-sunken text-text-secondary text-sm font-medium rounded-lg hover:bg-border transition-colors">
								{t(locale, 'catid.change_photo')}
							</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<div class="space-y-5">
			<div class="bg-surface rounded-xl border border-border p-6">
				<div class="flex items-start gap-4">
					<img src={photoPreview} alt="Foto analizada" class="w-24 h-24 rounded-xl object-cover border border-border flex-shrink-0" />
					<div class="flex-1">
						<h3 class="text-base font-semibold text-text mb-2">{t(locale, 'catid.analysis_result')}</h3>
						<p class="text-sm text-text-secondary mb-2">{results.analysis.description}</p>
						<div class="flex flex-wrap gap-2">
							{#if results.analysis.color && results.analysis.color !== 'desconocido'}
								<span class="px-2 py-0.5 bg-primary/8 text-primary rounded-md text-xs font-medium">{results.analysis.color}</span>
							{/if}
							{#if results.analysis.pattern && results.analysis.pattern !== 'desconocido'}
								<span class="px-2 py-0.5 bg-accent/8 text-accent rounded-md text-xs font-medium">{results.analysis.pattern}</span>
							{/if}
							{#if results.analysis.estimatedAge}
								<span class="px-2 py-0.5 bg-info/8 text-info rounded-md text-xs font-medium">{results.analysis.estimatedAge}</span>
							{/if}
							{#each results.analysis.distinctiveFeatures ?? [] as feature}
								<span class="px-2 py-0.5 bg-surface-sunken text-text-muted rounded-md text-xs">{feature}</span>
							{/each}
						</div>
					</div>
				</div>
			</div>

			{#if results.matches.length > 0}
				<div class="bg-surface rounded-xl border border-border p-6">
					<h3 class="text-base font-semibold text-text mb-4">{t(locale, 'catid.possible_matches')} ({results.matches.length})</h3>
					<div class="bg-warning/5 text-warning text-xs p-3 rounded-lg border border-warning/10 mb-4">
						{t(locale, 'catid.match_disclaimer')}
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{#each results.matches as match}
							<a href="/gatos/{match.id}" class="flex items-center gap-3 p-3 bg-surface-sunken rounded-lg hover:bg-border transition-colors group">
								{#if match.photo}
									<img src={match.photo} alt={match.name ?? 'Gato'} class="w-14 h-14 rounded-lg object-cover border border-border flex-shrink-0" />
								{:else}
									<div class="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6 text-primary"><path d="M12 8.5L10 5.5 13 7.5z"/><path d="M12 8.5L14 5.5 11 7.5z"/></svg>
									</div>
								{/if}
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-text group-hover:text-primary transition-colors">{match.name || 'Sin nombre'}</p>
									<p class="text-xs text-text-muted truncate">{match.colonyName || '-'}</p>
									<div class="flex gap-1.5 mt-1">
										{#if match.sex}
											<span class="text-[10px] text-text-muted">{match.sex === 'male' ? '♂' : '♀'}</span>
										{/if}
										{#if match.sterilized}
											<span class="text-[10px] text-success">CER</span>
										{/if}
										{#if match.microchip}
											<span class="text-[10px] text-info">Chip</span>
										{/if}
									</div>
								</div>
								<div class="flex-shrink-0 px-2 py-1 bg-primary/10 text-primary rounded text-xs font-semibold">
									{match.score}%
								</div>
							</a>
						{/each}
					</div>
				</div>
			{:else}
				<div class="bg-surface rounded-xl border border-border p-6 text-center">
					<div class="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mx-auto mb-3">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6 text-warning"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
					</div>
					<h3 class="text-base font-semibold text-text mb-1">{t(locale, 'catid.no_matches')}</h3>
					<p class="text-sm text-text-muted mb-4">{t(locale, 'catid.no_matches_desc')}</p>
					<a href="/gatos?new=1" class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M12 5v14m-7-7h14"/></svg>
						{t(locale, 'catid.register_new')}
					</a>
				</div>
			{/if}

			<div class="flex gap-3">
				<button onclick={reset} class="px-5 py-2.5 bg-surface text-text-secondary text-sm font-medium rounded-lg border border-border hover:bg-surface-sunken transition-colors">
					{t(locale, 'catid.try_another')}
				</button>
			</div>
		</div>
	{/if}
</div>

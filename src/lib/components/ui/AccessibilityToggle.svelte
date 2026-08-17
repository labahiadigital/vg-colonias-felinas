<script lang="ts">
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n/index.js';

	let { locale = 'es' }: { locale?: string } = $props();

	let colorblind = $state(false);

	if (browser) {
		colorblind = document.documentElement.classList.contains('colorblind');
	}

	function toggle() {
		colorblind = !colorblind;
		if (browser) {
			document.documentElement.classList.toggle('colorblind', colorblind);
			localStorage.setItem('gatopolis-colorblind', colorblind ? 'true' : 'false');
		}
	}
</script>

<button
	onclick={toggle}
	class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors {colorblind ? 'bg-primary/8 text-primary' : 'text-text-secondary hover:bg-surface-sunken'}"
	aria-pressed={colorblind}
>
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
		<circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
	</svg>
	<span>{t(locale, 'ui.colorblind_mode')}</span>
	{#if colorblind}
		<span class="w-2 h-2 bg-primary rounded-full"></span>
	{/if}
</button>

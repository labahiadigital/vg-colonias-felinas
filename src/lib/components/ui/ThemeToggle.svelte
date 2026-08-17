<script lang="ts">
	import { browser } from '$app/environment';

	let dark = $state(false);

	if (browser) {
		dark = document.documentElement.classList.contains('dark');
	}

	function toggle() {
		dark = !dark;
		if (browser) {
			document.documentElement.classList.toggle('dark', dark);
			localStorage.setItem('gatopolis-theme', dark ? 'dark' : 'light');
		}
	}
</script>

<button
	onclick={toggle}
	class="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-surface-sunken transition-colors"
	aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
	data-tooltip={dark ? 'Modo claro' : 'Modo oscuro'}
>
	{#if dark}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px] text-text-secondary">
			<circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
		</svg>
	{:else}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px] text-text-secondary">
			<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
		</svg>
	{/if}
</button>

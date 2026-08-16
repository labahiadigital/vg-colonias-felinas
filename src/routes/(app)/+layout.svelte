<script lang="ts">
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import type { LayoutData } from './$types.js';

	let { data, children }: { data: LayoutData; children: any } = $props();
	let sidebarOpen = $state(false);
</script>

<div class="flex h-screen overflow-hidden">
	<!-- Desktop sidebar -->
	<aside class="hidden lg:flex lg:w-60 lg:flex-shrink-0">
		<Sidebar locale={data.locale} />
	</aside>

	<!-- Mobile sidebar overlay -->
	{#if sidebarOpen}
		<div class="fixed inset-0 z-50 lg:hidden">
			<button
				class="absolute inset-0 bg-black/50"
				onclick={() => (sidebarOpen = false)}
				aria-label="Cerrar menú"
			></button>
			<aside class="relative w-64 h-full">
				<Sidebar locale={data.locale} onclose={() => (sidebarOpen = false)} />
			</aside>
		</div>
	{/if}

	<!-- Main content -->
	<div class="flex-1 flex flex-col overflow-hidden">
		<Header
			locale={data.locale}
			user={data.user}
			onMenuToggle={() => (sidebarOpen = !sidebarOpen)}
		/>
		<main class="flex-1 overflow-y-auto p-4 lg:p-6 bg-[#f4f7f6]">
			{@render children()}
		</main>
	</div>
</div>

<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="min-h-screen bg-background flex items-center justify-center p-4">
	<div class="w-full max-w-md text-center">
		<div class="w-16 h-16 rounded-2xl bg-danger/8 flex items-center justify-center mx-auto mb-6">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="w-8 h-8 text-danger">
				<circle cx="12" cy="12" r="10"/>
				<line x1="12" y1="8" x2="12" y2="12"/>
				<line x1="12" y1="16" x2="12.01" y2="16"/>
			</svg>
		</div>

		<h1 class="text-4xl font-bold text-text tracking-tight mb-2">{page.status}</h1>

		<p class="text-text-secondary text-sm mb-6">
			{#if page.status === 404}
				La página que buscas no existe o ha sido movida.
			{:else if page.status === 403}
				No tienes permisos para acceder a este recurso.
			{:else if page.status === 500}
				Ha ocurrido un error interno. Estamos trabajando para solucionarlo.
			{:else}
				{page.error?.message ?? 'Ha ocurrido un error inesperado.'}
			{/if}
		</p>

		<div class="flex flex-col sm:flex-row gap-3 justify-center">
			<a href="/dashboard" class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors min-h-[44px]">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
				Ir al inicio
			</a>
			<button onclick={() => history.back()} class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-surface border border-border text-text-secondary text-sm font-medium rounded-lg hover:bg-surface-sunken transition-colors min-h-[44px]">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M19 12H5m0 0l7 7m-7-7l7-7"/></svg>
				Volver atrás
			</button>
		</div>

		{#if page.status >= 500}
			<p class="text-xs text-text-muted mt-8">
				Si el problema persiste, contacta con soporte técnico.
			</p>
		{/if}
	</div>
</div>

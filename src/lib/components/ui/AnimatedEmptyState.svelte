<script lang="ts">
	let {
		type = 'default',
		title = 'Sin datos',
		description = '',
		actionLabel = '',
		actionHref = ''
	}: {
		type?: 'colony' | 'cat' | 'search' | 'success' | 'default';
		title?: string;
		description?: string;
		actionLabel?: string;
		actionHref?: string;
	} = $props();
</script>

<div class="py-16 px-4 text-center animate-enter">
	<div class="relative w-24 h-24 mx-auto mb-6">
		{#if type === 'cat'}
			<svg viewBox="0 0 96 96" fill="none" class="w-full h-full">
				<circle cx="48" cy="48" r="44" class="fill-primary/5 stroke-primary/10" stroke-width="1"/>
				<g class="animated-cat">
					<path d="M48 30c-6-8-16-10-24-6 0 12 4 22 12 30-4 4-8 10-8 18 0 8 6 14 14 14 4 0 6-2 6-2s2 2 6 2c8 0 14-6 14-14 0-8-4-14-8-18 8-8 12-18 12-30-8-4-18-2-24 6z" class="fill-primary/10 stroke-primary" stroke-width="1.5" stroke-linecap="round"/>
					<circle cx="40" cy="44" r="3" class="fill-primary">
						<animate attributeName="r" values="3;2.5;3" dur="2s" repeatCount="indefinite"/>
					</circle>
					<circle cx="56" cy="44" r="3" class="fill-primary">
						<animate attributeName="r" values="3;2.5;3" dur="2s" repeatCount="indefinite" begin="0.1s"/>
					</circle>
					<path d="M44 52c2 2 4 2 8 0" class="stroke-primary" stroke-width="1.5" stroke-linecap="round"/>
				</g>
				<path d="M20 72c4-2 8 0 12 0s8-2 12 0" class="stroke-primary/20" stroke-width="1" stroke-linecap="round">
					<animate attributeName="d" values="M20 72c4-2 8 0 12 0s8-2 12 0;M20 73c4-1 8 1 12 1s8-1 12 1;M20 72c4-2 8 0 12 0s8-2 12 0" dur="3s" repeatCount="indefinite"/>
				</path>
			</svg>
		{:else if type === 'colony'}
			<svg viewBox="0 0 96 96" fill="none" class="w-full h-full">
				<circle cx="48" cy="48" r="44" class="fill-primary/5 stroke-primary/10" stroke-width="1"/>
				<path d="M48 20C36.95 20 28 28.95 28 40c0 14 20 36 20 36s20-22 20-36c0-11.05-8.95-20-20-20z" class="fill-primary/10 stroke-primary" stroke-width="1.5" stroke-linecap="round"/>
				<circle cx="48" cy="40" r="7" class="fill-primary/20 stroke-primary" stroke-width="1.5">
					<animate attributeName="r" values="7;8;7" dur="2.5s" repeatCount="indefinite"/>
				</circle>
				<circle cx="48" cy="40" r="3" class="fill-primary">
					<animate attributeName="opacity" values="1;0.5;1" dur="2.5s" repeatCount="indefinite"/>
				</circle>
			</svg>
		{:else if type === 'search'}
			<svg viewBox="0 0 96 96" fill="none" class="w-full h-full">
				<circle cx="48" cy="48" r="44" class="fill-primary/5 stroke-primary/10" stroke-width="1"/>
				<circle cx="42" cy="42" r="16" class="fill-transparent stroke-primary" stroke-width="2">
					<animate attributeName="r" values="16;17;16" dur="2s" repeatCount="indefinite"/>
				</circle>
				<path d="M54 54l14 14" class="stroke-primary" stroke-width="3" stroke-linecap="round">
					<animate attributeName="stroke-opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/>
				</path>
			</svg>
		{:else if type === 'success'}
			<svg viewBox="0 0 96 96" fill="none" class="w-full h-full">
				<circle cx="48" cy="48" r="44" class="fill-success/5 stroke-success/10" stroke-width="1"/>
				<circle cx="48" cy="48" r="24" class="fill-success/10 stroke-success" stroke-width="1.5"/>
				<polyline points="36,48 44,56 60,40" class="stroke-success" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
					<animate attributeName="stroke-dashoffset" values="40;0" dur="0.6s" fill="freeze"/>
					<set attributeName="stroke-dasharray" to="40"/>
				</polyline>
			</svg>
		{:else}
			<svg viewBox="0 0 96 96" fill="none" class="w-full h-full">
				<circle cx="48" cy="48" r="44" class="fill-surface-sunken stroke-border" stroke-width="1"/>
				<rect x="28" y="36" width="40" height="4" rx="2" class="fill-border">
					<animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
				</rect>
				<rect x="28" y="46" width="30" height="4" rx="2" class="fill-border">
					<animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" begin="0.3s"/>
				</rect>
				<rect x="28" y="56" width="20" height="4" rx="2" class="fill-border">
					<animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" begin="0.6s"/>
				</rect>
			</svg>
		{/if}
	</div>

	<h3 class="text-base font-semibold text-text mb-1">{title}</h3>
	{#if description}
		<p class="text-sm text-text-muted max-w-xs mx-auto leading-relaxed">{description}</p>
	{/if}
	{#if actionLabel && actionHref}
		<a
			href={actionHref}
			class="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-all btn-press shadow-sm min-h-[44px]"
		>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M12 5v14m-7-7h14"/></svg>
			{actionLabel}
		</a>
	{/if}
</div>

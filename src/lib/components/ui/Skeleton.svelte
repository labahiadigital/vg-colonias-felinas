<script lang="ts">
	let {
		variant = 'text',
		width = '100%',
		count = 1
	}: {
		variant?: 'text' | 'heading' | 'avatar' | 'card' | 'circle' | 'button';
		width?: string;
		count?: number;
	} = $props();

	const classes: Record<string, string> = {
		text: 'skeleton skeleton-text',
		heading: 'skeleton skeleton-heading',
		avatar: 'skeleton skeleton-avatar',
		card: 'skeleton skeleton-card',
		circle: 'skeleton w-10 h-10 rounded-full',
		button: 'skeleton h-10 w-24 rounded-lg'
	};
</script>

<div class="space-y-2" aria-hidden="true">
	{#each Array(count) as _, i}
		<div
			class={classes[variant]}
			style={variant === 'text' && i > 0 ? `width: ${Math.random() * 40 + 50}%` : `width: ${width}`}
		></div>
	{/each}
</div>

<script lang="ts">
	let {
		users = []
	}: {
		users: Array<{ id: string; name: string; avatar?: string; color?: string }>;
	} = $props();

	const colors = ['bg-primary', 'bg-accent', 'bg-info', 'bg-success', 'bg-warning', 'bg-danger'];
	let showAll = $state(false);
	let maxVisible = 3;
	let overflow = $derived(Math.max(0, users.length - maxVisible));
</script>

{#if users.length > 0}
	<div class="flex items-center gap-1.5">
		<div class="flex -space-x-2">
			{#each users.slice(0, maxVisible) as user, i}
				<div
					class="relative w-7 h-7 rounded-full border-2 border-surface flex items-center justify-center text-[10px] font-bold text-white {user.color ?? colors[i % colors.length]} cursor-default"
					data-tooltip="{user.name}"
				>
					{#if user.avatar}
						<img src={user.avatar} alt={user.name} class="w-full h-full rounded-full object-cover" />
					{:else}
						{user.name.charAt(0).toUpperCase()}
					{/if}
					<span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success border-2 border-surface rounded-full"></span>
				</div>
			{/each}
			{#if overflow > 0}
				<button
					onclick={() => showAll = !showAll}
					class="relative w-7 h-7 rounded-full border-2 border-surface bg-surface-sunken flex items-center justify-center text-[10px] font-semibold text-text-muted hover:bg-border transition-colors"
				>
					+{overflow}
				</button>
			{/if}
		</div>
		<span class="text-[11px] text-text-muted hidden sm:inline">
			{users.length === 1 ? `${users[0].name} está aquí` : `${users.length} personas aquí`}
		</span>
	</div>

	{#if showAll && overflow > 0}
		<div class="absolute top-full mt-1 right-0 bg-surface rounded-lg border border-border shadow-lg p-2 z-50 animate-scale-in min-w-[160px]">
			{#each users as user, i}
				<div class="flex items-center gap-2 px-2 py-1.5 rounded-md">
					<div class="w-5 h-5 rounded-full {user.color ?? colors[i % colors.length]} flex items-center justify-center text-[9px] font-bold text-white">
						{user.name.charAt(0).toUpperCase()}
					</div>
					<span class="text-xs text-text-secondary">{user.name}</span>
					<span class="w-1.5 h-1.5 bg-success rounded-full ml-auto"></span>
				</div>
			{/each}
		</div>
	{/if}
{/if}

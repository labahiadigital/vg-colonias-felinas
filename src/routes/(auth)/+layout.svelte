<script lang="ts">
	let { children } = $props();
</script>

<div class="min-h-screen bg-[#f4f7f6] flex flex-col">
	{@render children()}
</div>

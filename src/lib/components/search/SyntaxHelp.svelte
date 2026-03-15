<script lang="ts">
	import CircleHelpIcon from '@lucide/svelte/icons/circle-help';

	let open = $state(false);
</script>

<div class="relative">
	<button
		class="text-muted-foreground hover:text-foreground p-1"
		onclick={() => (open = !open)}
		aria-label="Search syntax help"
	>
		<CircleHelpIcon class="h-4 w-4" />
	</button>

	{#if open}
		<button class="fixed inset-0 z-40" onclick={() => (open = false)} aria-label="Close help">
		</button>
		<div
			class="bg-popover text-popover-foreground absolute top-full right-0 z-50 mt-1 w-80 rounded-lg border p-4 shadow-lg"
		>
			<h3 class="mb-2 text-sm font-semibold">Search Syntax</h3>
			<div class="space-y-2 text-xs">
				<div>
					<div class="font-medium">Filters</div>
					<code class="text-muted-foreground">language:rust topic:cli owner:user license:MIT</code>
				</div>
				<div>
					<div class="font-medium">Comparisons</div>
					<code class="text-muted-foreground">stars:&gt;100 forks:&lt;50 size:&gt;=1000</code>
				</div>
				<div>
					<div class="font-medium">Ranges</div>
					<code class="text-muted-foreground">stars:[100 TO 500]</code>
				</div>
				<div>
					<div class="font-medium">Dates</div>
					<code class="text-muted-foreground"
						>created:&gt;2024-01-01 updated:&lt;2023-06-01 starred:&gt;2024-01-01</code
					>
				</div>
				<div>
					<div class="font-medium">Flags</div>
					<code class="text-muted-foreground"
						>archived:true fork:false private:true template:true</code
					>
				</div>
				<div>
					<div class="font-medium">Negation</div>
					<code class="text-muted-foreground">-archived:true NOT fork:true</code>
				</div>
				<div>
					<div class="font-medium">Other</div>
					<code class="text-muted-foreground">in:readme sort:stars sort:updated</code>
				</div>
			</div>
		</div>
	{/if}
</div>

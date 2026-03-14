<script lang="ts">
	import type { SyncProgress } from '$lib/types';

	let {
		progress
	}: {
		progress: SyncProgress;
	} = $props();

	let percentage = $derived(
		progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0
	);

	let phaseLabel = $derived.by(() => {
		switch (progress.phase) {
			case 'fetching-repos':
				return 'Fetching repositories';
			case 'fetching-readmes':
				return 'Fetching READMEs';
			case 'indexing':
				return 'Indexing';
			case 'persisting':
				return 'Saving';
			case 'done':
				return 'Complete';
			case 'error':
				return 'Error';
			default:
				return '';
		}
	});
</script>

{#if progress.phase !== 'idle'}
	<div class="space-y-2">
		<div class="flex items-center justify-between text-sm">
			<span class="font-medium">{phaseLabel}</span>
			{#if progress.total > 0}
				<span class="text-muted-foreground">{progress.current}/{progress.total}</span>
			{/if}
		</div>

		{#if progress.phase !== 'done' && progress.phase !== 'error'}
			<div class="bg-secondary h-2 w-full overflow-hidden rounded-full">
				<div
					class="bg-primary h-full rounded-full transition-all duration-300"
					style="width: {percentage}%"
				></div>
			</div>
		{/if}

		<p class="text-muted-foreground text-sm">{progress.message}</p>
	</div>
{/if}

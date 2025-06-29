<script lang="ts">
	import type { ProgressState } from '$lib/types';

	export let progress: ProgressState;
	export let variant: 'default' | 'compact' = 'default';
	export let showText: boolean = true;

	$: percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
</script>

{#if progress.visible}
	<div class="w-full rounded-full bg-gray-200 {variant === 'compact' ? 'h-2' : 'h-4'}">
		<div
			class="bg-blue-600 {variant === 'compact'
				? 'h-2'
				: 'h-4'} rounded-full transition-all duration-300 ease-in-out"
			style="width: {percentage}%"
		></div>
	</div>
	{#if showText && variant !== 'compact'}
		<div class="mt-2 text-sm text-gray-600">
			{progress.current} / {progress.total} ({percentage}%)
		</div>
	{/if}
{/if}

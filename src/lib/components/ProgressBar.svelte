<script lang="ts">
	import type { ProgressState } from '$lib/types';

	export let progress: ProgressState;
	export let variant: 'default' | 'compact' = 'default';
	export let showText: boolean = true;

	$: percentage = progress.total > 0 ? Math.floor((progress.current / progress.total) * 100) : 0;
	$: isCompact = variant === 'compact';
</script>

{#if progress.visible}
	<div class="progress" class:compact={isCompact}>
		{#if showText && !isCompact}
			<div class="progress-text">
				Fetched {progress.current} repositories
			</div>
		{/if}
		<div class="progress-bar" class:compact={isCompact}>
			<div class="progress-fill" style="width: {percentage}%"></div>
		</div>
		{#if showText && isCompact}
			<div class="progress-text-compact">
				{progress.current}/{progress.total}
			</div>
		{/if}
	</div>
{/if}

<style>
	.progress {
		margin: 10px 0;
		padding: 10px;
		border: 1px solid #e1e4e8;
		border-radius: 6px;
	}

	.progress.compact {
		margin: 5px 0;
		padding: 5px;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.progress-text {
		margin-bottom: 5px;
		font-size: 14px;
		color: #586069;
	}

	.progress-text-compact {
		font-size: 12px;
		color: #586069;
		min-width: 60px;
		text-align: center;
	}

	.progress-bar {
		height: 4px;
		background: #eee;
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-bar.compact {
		height: 3px;
		flex: 1;
	}

	.progress-fill {
		height: 100%;
		background: #2ea44f;
		transition: width 0.3s ease;
	}
</style>

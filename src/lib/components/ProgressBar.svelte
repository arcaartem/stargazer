<script lang="ts">
	import type { ProgressState } from '$lib/types';

	export let progress: ProgressState;

	$: percentage = progress.total > 0 ? Math.floor((progress.current / progress.total) * 100) : 0;
</script>

{#if progress.visible}
	<div class="progress">
		<div class="progress-text">
			Fetched {progress.current} repositories
		</div>
		<div class="progress-bar">
			<div class="progress-fill" style="width: {percentage}%"></div>
		</div>
	</div>
{/if}

<style>
	.progress {
		margin: 10px 0;
		padding: 10px;
		border: 1px solid #e1e4e8;
		border-radius: 6px;
	}

	.progress-text {
		margin-bottom: 5px;
		font-size: 14px;
		color: #586069;
	}

	.progress-bar {
		height: 4px;
		background: #eee;
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: #2ea44f;
		transition: width 0.3s ease;
	}
</style>

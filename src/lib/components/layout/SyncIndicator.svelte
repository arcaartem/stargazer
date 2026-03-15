<script lang="ts">
	import { resolve } from '$app/paths';
	import { syncStore } from '$lib/stores/sync-store.svelte';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import CheckIcon from '@lucide/svelte/icons/check';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import XIcon from '@lucide/svelte/icons/x';

	let showDone = $state(false);
	let doneRepoCount = $state(0);

	$effect(() => {
		if (syncStore.progress.phase === 'done') {
			showDone = true;
			doneRepoCount = syncStore.progress.current;
			const timeout = setTimeout(() => {
				showDone = false;
			}, 3000);
			return () => clearTimeout(timeout);
		}
	});
</script>

{#if syncStore.isSyncing}
	<div class="flex items-center gap-2 text-sm">
		<Loader2Icon class="h-4 w-4 animate-spin" />
		{#if syncStore.progress.phase === 'fetching-repos'}
			<span>Fetching repos...</span>
		{:else if syncStore.progress.phase === 'fetching-readmes'}
			<div class="flex items-center gap-2">
				<div class="bg-secondary h-1.5 w-20 overflow-hidden rounded-full">
					<div
						class="bg-primary h-full rounded-full transition-all duration-300"
						style="width: {syncStore.progress.total > 0
							? (syncStore.progress.current / syncStore.progress.total) * 100
							: 0}%"
					></div>
				</div>
				<span class="tabular-nums">{syncStore.progress.current}/{syncStore.progress.total}</span>
			</div>
			<button
				class="text-muted-foreground hover:text-foreground"
				onclick={() => syncStore.cancel()}
				aria-label="Cancel sync"
			>
				<XIcon class="h-3.5 w-3.5" />
			</button>
		{:else if syncStore.progress.phase === 'indexing' || syncStore.progress.phase === 'persisting'}
			<span>Indexing...</span>
		{/if}
	</div>
{:else if showDone}
	<div class="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
		<CheckIcon class="h-4 w-4" />
		<span class="tabular-nums">Synced {doneRepoCount} repos</span>
	</div>
{:else if syncStore.error}
	<a
		href={resolve('/settings')}
		class="flex items-center gap-1.5 text-sm text-red-600 hover:underline dark:text-red-400"
	>
		<AlertCircleIcon class="h-4 w-4" />
		<span>Sync failed</span>
	</a>
{/if}

<script lang="ts">
	import { onMount } from 'svelte';
	import SearchInput from '$lib/components/search/SearchInput.svelte';
	import RepoCard from '$lib/components/search/RepoCard.svelte';
	import RepoDetail from '$lib/components/search/RepoDetail.svelte';
	import { searchStore } from '$lib/stores/search-store.svelte';
	import { syncStore } from '$lib/stores/sync-store.svelte';
	import { loadFromIndexedDB } from '$lib/services/search';

	let detailOpen = $state(false);

	onMount(async () => {
		await syncStore.loadSyncStatus();
		await loadFromIndexedDB();
		searchStore.performSearch();
	});

	$effect(() => {
		if (syncStore.progress.phase === 'done') {
			searchStore.performSearch();
		}
	});

	function handleSearch(query: string) {
		searchStore.setQuery(query);
	}

	function handleSelectRepo(id: number) {
		searchStore.selectRepo(id);
		detailOpen = true;
	}
</script>

<div class="flex h-[calc(100vh-3.5rem)] flex-col">
	<div class="border-b p-4">
		<div class="mx-auto max-w-5xl">
			<SearchInput
				bind:query={searchStore.query}
				parsedFilters={searchStore.parsedFilters}
				readmeOnly={searchStore.readmeOnly}
				hasActiveFilters={searchStore.hasActiveFilters}
				onSearch={handleSearch}
				onRemoveFilter={(key, value) => searchStore.removeFilter(key, value)}
				onClearFilters={() => searchStore.clearFilters()}
			/>
		</div>
	</div>

	<div class="flex-1 overflow-y-auto p-4">
		<div class="mx-auto max-w-5xl">
			<div class="text-muted-foreground mb-3 text-sm">
				<span class="tabular-nums">
					{searchStore.totalCount}
					{searchStore.totalCount === 1 ? 'repository' : 'repositories'}
				</span>
			</div>

			{#if searchStore.results.length === 0}
				<div class="flex flex-col items-center justify-center py-16 text-center">
					{#if syncStore.repoCount === 0}
						<p class="text-lg font-medium">No repositories synced</p>
						<p class="text-muted-foreground mt-1 text-sm">
							Go to Settings to sync your starred repositories.
						</p>
					{:else}
						<p class="text-lg font-medium">No results found</p>
						<p class="text-muted-foreground mt-1 text-sm">Try adjusting your search or filters.</p>
					{/if}
				</div>
			{:else}
				<div class="grid gap-3">
					{#each searchStore.results as repo (repo.id)}
						<RepoCard
							{repo}
							selected={searchStore.selectedRepoId === repo.id}
							onclick={() => handleSelectRepo(repo.id)}
						/>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<div class="text-muted-foreground border-t px-4 py-2 text-xs">
		<div class="mx-auto max-w-5xl">
			<span class="tabular-nums">{syncStore.repoCount} repos</span>
			{#if syncStore.lastSyncedAt}
				· Last synced: {new Date(syncStore.lastSyncedAt).toLocaleDateString()}
			{/if}
		</div>
	</div>
</div>

<RepoDetail repo={searchStore.selectedRepo} bind:open={detailOpen} />

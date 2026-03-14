<script lang="ts">
	import { onMount } from 'svelte';
	import SearchInput from '$lib/components/search/SearchInput.svelte';
	import FilterPanel from '$lib/components/search/FilterPanel.svelte';
	import RepoCard from '$lib/components/search/RepoCard.svelte';
	import RepoDetail from '$lib/components/search/RepoDetail.svelte';
	import { Button } from '$lib/components/ui/button';
	import { searchStore } from '$lib/stores/search-store.svelte';
	import { syncStore } from '$lib/stores/sync-store.svelte';
	import { loadFromIndexedDB } from '$lib/services/search';

	let filterOpen = $state(true);
	let detailOpen = $state(false);

	onMount(async () => {
		await syncStore.loadSyncStatus();
		await loadFromIndexedDB();
		searchStore.performSearch();
	});

	function handleSearch(query: string) {
		searchStore.setQuery(query);
	}

	function handleSelectRepo(id: number) {
		searchStore.selectRepo(id);
		detailOpen = true;
	}
</script>

<div class="flex h-[calc(100vh-3.5rem)]">
	<!-- Filter sidebar -->
	{#if filterOpen}
		<aside class="hidden w-64 shrink-0 overflow-y-auto border-r lg:block">
			<FilterPanel
				bind:filters={searchStore.filters}
				availableLanguages={searchStore.availableFilters.languages}
				availableTopics={searchStore.availableFilters.topics}
				availableLicenses={searchStore.availableFilters.licenses}
				availableOwners={searchStore.availableFilters.owners}
				onFilterChange={(key, value) => searchStore.updateFilter(key, value)}
				onClearAll={() => searchStore.clearFilters()}
			/>
		</aside>
	{/if}

	<!-- Main content -->
	<div class="flex flex-1 flex-col overflow-hidden">
		<!-- Search bar -->
		<div class="border-b p-4">
			<div class="flex items-start gap-3">
				<Button
					variant="outline"
					size="sm"
					class="mt-1 lg:hidden"
					onclick={() => (filterOpen = !filterOpen)}
				>
					Filters
				</Button>
				<div class="flex-1">
					<SearchInput
						bind:query={searchStore.query}
						bind:readmeOnly={searchStore.readmeOnly}
						onSearch={handleSearch}
					/>
				</div>
			</div>
		</div>

		<!-- Results -->
		<div class="flex-1 overflow-y-auto p-4">
			<div class="text-muted-foreground mb-3 text-sm">
				{searchStore.totalCount}
				{searchStore.totalCount === 1 ? 'repository' : 'repositories'}
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

		<!-- Status bar -->
		<div class="text-muted-foreground border-t px-4 py-2 text-xs">
			{syncStore.repoCount} repos
			{#if syncStore.lastSyncedAt}
				· Last synced: {new Date(syncStore.lastSyncedAt).toLocaleDateString()}
			{/if}
		</div>
	</div>
</div>

<!-- Detail panel -->
<RepoDetail repo={searchStore.selectedRepo} bind:open={detailOpen} />

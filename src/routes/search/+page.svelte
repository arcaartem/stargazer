<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { useRepositories, useProgress, useSearch } from '$lib/composables';
	import { ProgressBar, SearchForm, RepositoryList } from '$lib/components';
	import { get } from 'svelte/store';
	import type { SortOption } from '$lib/types';

	// Initialize composables
	const repositories = useRepositories();
	const progress = useProgress();

	// Create derived stores
	$: repositoryState = $repositories;
	$: progressState = $progress;

	// Initialize search composable with current repositories
	$: search = useSearch(repositoryState.repositories);
	$: searchState = $search;

	let errorMessage = '';

	onMount(async () => {
		if (browser) {
			// Load cached repositories on mount
			await repositories.load();
		}
	});

	onDestroy(() => {
		// Clean up search timers
		if (search) {
			search.destroy();
		}
	});

	async function handleRefresh() {
		try {
			errorMessage = '';
			progress.start();

			await repositories.refresh(progress.createCallback());

			progress.complete();
		} catch (error) {
			progress.complete();
			errorMessage = error instanceof Error ? error.message : 'An error occurred';
		}
	}

	function handleSearch(event: CustomEvent<{ term: string; sortBy: SortOption }>) {
		const { term, sortBy } = event.detail;
		repositories.setSearchTerm(term);
		repositories.setSortBy(sortBy);
		search.setTerm(term);
		search.setSortBy(sortBy);
	}

	function clearError() {
		errorMessage = '';
		repositories.clearError();
	}
</script>

<div class="space-y-6">
	<SearchForm
		searchTerm={repositoryState.searchTerm}
		sortBy={repositoryState.sortBy}
		loading={repositoryState.loading}
		on:search={handleSearch}
		on:refresh={handleRefresh}
	/>

	{#if errorMessage || repositoryState.error}
		<div class="rounded-md bg-red-50 p-4">
			<div class="flex">
				<div class="ml-3">
					<h3 class="text-sm font-medium text-red-800">Error</h3>
					<div class="mt-2 text-sm text-red-700">
						{errorMessage || repositoryState.error}
					</div>
					<button
						on:click={clearError}
						class="mt-2 text-sm font-medium text-red-800 hover:text-red-600"
					>
						Dismiss
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if progressState.visible}
		<ProgressBar progress={progressState} />
	{/if}

	<RepositoryList
		repositories={get(search.results)}
		loading={repositoryState.loading}
		searchTerm={searchState.debouncedTerm}
	/>
</div>

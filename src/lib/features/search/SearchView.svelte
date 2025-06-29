<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { useProgress } from '$lib/composables';
	import { ProgressBar } from '$lib/components';
	import { useRepositories } from '../repositories/useRepositories';
	import SearchForm from './SearchForm.svelte';
	import RepositoryList from '../repositories/RepositoryList.svelte';
	import type { SortOption } from '$lib/stores/app';

	// Initialize composables
	const repositories = useRepositories();
	const progress = useProgress();

	// Create derived stores
	$: repositoryState = $repositories;
	$: progressState = $progress;
	$: searchResults = repositories.searchResults;

	let errorMessage = '';

	onMount(async () => {
		if (browser) {
			// Load cached repositories on mount
			await repositories.load();
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
		// Use the repositories composable for search state management
		repositories.setSearchTerm(term);
		repositories.setSortBy(sortBy);
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
		repositories={$searchResults}
		loading={repositoryState.loading}
		searchTerm={repositoryState.searchTerm}
	/>
</div>

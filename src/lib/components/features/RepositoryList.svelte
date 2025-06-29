<script lang="ts">
	import type { Repository } from '$lib/types';
	import RepoCard from './RepoCard.svelte';

	export let repositories: Repository[] = [];
	export let loading: boolean = false;
	export let searchTerm: string = '';

	$: hasResults = repositories.length > 0;
	$: showEmptyState = !loading && !hasResults;
	$: showSearchResults = !loading && hasResults && searchTerm.trim() !== '';
</script>

<div class="space-y-4">
	{#if showSearchResults}
		<div class="text-sm text-gray-600">
			Found {repositories.length} repositories matching "{searchTerm}"
		</div>
	{/if}

	{#if loading}
		<div class="py-8 text-center">
			<div class="text-gray-600">Loading repositories...</div>
		</div>
	{:else if showEmptyState}
		<div class="py-12 text-center">
			<div class="text-gray-500">
				{#if searchTerm.trim() !== ''}
					No repositories found matching your search.
				{:else}
					No repositories available. Click "Fetch Stars" to load your starred repositories.
				{/if}
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each repositories as repo (repo.id)}
				<RepoCard {repo} />
			{/each}
		</div>
	{/if}
</div>

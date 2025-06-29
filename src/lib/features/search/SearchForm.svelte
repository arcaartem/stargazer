<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { SortOption } from '$lib/stores/app';

	export let searchTerm: string = '';
	export let sortBy: SortOption = 'relevance';
	export let loading: boolean = false;

	const dispatch = createEventDispatcher<{
		search: { term: string; sortBy: SortOption };
		refresh: void;
	}>();

	function handleSubmit() {
		dispatch('search', { term: searchTerm, sortBy });
	}

	function handleRefresh() {
		dispatch('refresh');
	}

	function handleSearchInput() {
		dispatch('search', { term: searchTerm, sortBy });
	}

	function handleSortChange() {
		dispatch('search', { term: searchTerm, sortBy });
	}
</script>

<div class="space-y-4">
	<form on:submit|preventDefault={handleSubmit} class="flex flex-col items-end gap-4 sm:flex-row">
		<div class="flex-1">
			<label for="search" class="block text-sm font-medium text-gray-700">Search Stars</label>
			<input
				type="text"
				id="search"
				bind:value={searchTerm}
				on:input={handleSearchInput}
				placeholder="Search by name, description, or language..."
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
			/>
		</div>

		<div class="w-full sm:w-48">
			<label for="sort" class="block text-sm font-medium text-gray-700">Sort By</label>
			<select
				id="sort"
				bind:value={sortBy}
				on:change={handleSortChange}
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
			>
				<option value="relevance">Relevance</option>
				<option value="stars">Stars</option>
				<option value="name">Name</option>
				<option value="updated">Last Updated</option>
			</select>
		</div>

		<button
			type="button"
			on:click={handleRefresh}
			disabled={loading}
			class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
		>
			{loading ? 'Fetching...' : 'Fetch Stars'}
		</button>
	</form>
</div>

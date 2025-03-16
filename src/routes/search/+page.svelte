<script lang="ts">
	import { browser } from '$app/environment';
	import { allRepos, progress } from '$lib/stores';
	import type { Repository } from '$lib/types';
	import { StarsDbService, SettingsDbService } from '$lib/db';
	import { GitHubService } from '$lib/github';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import RepoCard from '$lib/components/RepoCard.svelte';
	import Fuse from 'fuse.js';

	let starsDb: StarsDbService;
	let settingsDb: SettingsDbService;
	let github: GitHubService;
	let fuse: Fuse<Repository> | null = null;

	let searchTerm = '';
	let sortBy: 'stars' | 'name' | 'updated' | 'relevance' = 'relevance';
	let error = '';
	let loading = false;
	let searchResults: Array<{ item: Repository; score?: number }> = [];

	// Fuse.js options for full-text search
	const fuseOptions = {
		keys: [
			{ name: 'name', weight: 0.4 },
			{ name: 'description', weight: 0.3 },
			{ name: 'owner.login', weight: 0.2 },
			{ name: 'language', weight: 0.1 }
		],
		threshold: 0.3,
		distance: 100,
		minMatchCharLength: 2,
		includeScore: true
	};

	// Initialize Fuse when repos change
	$: {
		if ($allRepos.length > 0) {
			fuse = new Fuse($allRepos, fuseOptions);
			// Reset search results when repos change
			searchResults = $allRepos.map((item) => ({ item }));
		} else {
			fuse = null;
			searchResults = [];
		}
	}

	// Update search results when search term or sort option changes
	$: {
		if (searchTerm && fuse) {
			searchResults = fuse.search(searchTerm);
		} else if ($allRepos.length > 0) {
			searchResults = $allRepos.map((item) => ({ item }));
		}

		if (sortBy !== 'relevance') {
			searchResults.sort((a, b) => {
				const itemA = a.item;
				const itemB = b.item;
				switch (sortBy) {
					case 'stars':
						return itemB.stargazers_count - itemA.stargazers_count;
					case 'name':
						return itemA.name.localeCompare(itemB.name);
					case 'updated':
						return new Date(itemB.updated_at).getTime() - new Date(itemA.updated_at).getTime();
					default:
						return 0;
				}
			});
		}
	}

	async function fetchStars() {
		if (!browser) return;

		try {
			loading = true;
			progress.set({ visible: true, current: 0, total: 1 });
			error = '';

			settingsDb = new SettingsDbService();
			const username = await settingsDb.getUsername();
			const token = await settingsDb.getToken();

			if (!username || !token) {
				error = 'Please configure your GitHub credentials in Settings';
				return;
			}

			starsDb = new StarsDbService();
			github = new GitHubService(token);

			const stars = await github.fetchAllStarredRepos(username, (current, total) => {
				progress.update((p) => ({ ...p, current, total }));
			});
			await starsDb.saveStars(stars);
			$allRepos = stars;
		} catch (e) {
			error = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			loading = false;
			progress.update((p) => ({ ...p, visible: false }));
		}
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col items-end gap-4 sm:flex-row">
		<div class="flex-1">
			<label for="search" class="block text-sm font-medium text-gray-700">Search Stars</label>
			<input
				type="text"
				id="search"
				bind:value={searchTerm}
				placeholder="Search by name, description, or language..."
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
			/>
		</div>

		<div class="w-full sm:w-48">
			<label for="sort" class="block text-sm font-medium text-gray-700">Sort By</label>
			<select
				id="sort"
				bind:value={sortBy}
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
			>
				<option value="relevance">Relevance</option>
				<option value="stars">Stars</option>
				<option value="name">Name</option>
				<option value="updated">Last Updated</option>
			</select>
		</div>

		<button
			on:click={fetchStars}
			disabled={loading}
			class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
		>
			{loading ? 'Fetching...' : 'Fetch Stars'}
		</button>
	</div>

	{#if error}
		<div class="rounded-md bg-red-50 p-4">
			<div class="flex">
				<div class="ml-3">
					<h3 class="text-sm font-medium text-red-800">Error</h3>
					<div class="mt-2 text-sm text-red-700">
						{error}
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if $progress.visible}
		<ProgressBar progress={$progress} />
	{/if}

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each searchResults as { item } (item.id)}
			<RepoCard repo={item} />
		{/each}
	</div>
</div>

<script lang="ts">
	import { onMount } from 'svelte';
	import { fromStore } from 'svelte/store';
	import { browser } from '$app/environment';
	import { allRepos, progress } from '$lib/stores';
	import type { Repository } from '$lib/types';
	import { StarsDbService, SettingsDbService } from '$lib/db';
	import { GitHubService } from '$lib/github';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import RepoCard from '$lib/components/RepoCard.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import Fuse from 'fuse.js';

	let starsDb: StarsDbService;
	let settingsDb: SettingsDbService;
	let github: GitHubService;
	let fuse: Fuse<Repository> | null = null;

	let username = '';
	let token = '';
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

	$: filteredRepos = filterRepos($allRepos, searchTerm, sortBy);

	onMount(async () => {
		if (browser) {
			starsDb = new StarsDbService();
			settingsDb = new SettingsDbService();
			github = new GitHubService();

			const savedToken = await settingsDb.getToken();

			if (savedToken) {
				token = savedToken;
				github.setToken(savedToken);
			}

			const savedUsername = await settingsDb.getUsername();
			if (savedUsername) {
				username = savedUsername;
			}

			const cached = await starsDb.getCachedStars();
			if (cached) {
				allRepos.set(cached);
			}
		}
	});

	function filterRepos(repos: Repository[], search: string, sort: typeof sortBy): Repository[] {
		if (search.trim() && fuse) {
			// Get search results with scores
			searchResults = fuse.search(search);

			// If we have search results, use them
			if (searchResults.length > 0) {
				// For relevance sorting, just return the items in their scored order
				if (sort === 'relevance') {
					return searchResults.map((result) => result.item);
				}
			} else {
				// No search results, return empty array
				return [];
			}
		} else {
			// No search term, show all repos
			searchResults = repos.map((item) => ({ item }));
		}

		// Apply sorting based on the selected criteria
		return searchResults
			.sort((a, b) => {
				switch (sort) {
					case 'relevance':
						// Higher score means lower relevance in Fuse.js, so we invert the comparison
						return (a.score ?? 0) - (b.score ?? 0);
					case 'stars':
						return b.item.stargazers_count - a.item.stargazers_count;
					case 'name':
						return a.item.name.localeCompare(b.item.name);
					case 'updated':
						return new Date(b.item.updated_at).valueOf() - new Date(a.item.updated_at).valueOf();
					default:
						return 0;
				}
			})
			.map((result) => result.item);
	}

	async function fetchStars(): Promise<void> {
		if (!username) {
			error = 'Please enter a GitHub username';
			return;
		}
		if (!token) {
			error = 'Please provide a GitHub Personal Access Token';
			return;
		}

		error = '';
		loading = true;
		progress.set({ current: 0, total: 0, visible: true });

		try {
			github.setToken(token);
			await settingsDb.saveUsername(username);
			await settingsDb.saveToken(token);

			const repos = await github.fetchAllStarredRepos(username, (current, total) => {
				progress.update((p) => ({ ...p, current, total }));
			});

			allRepos.set(repos);
			await starsDb.saveStars(repos);
		} catch (e) {
			error = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			loading = false;
			progress.update((p) => ({ ...p, visible: false }));
		}
	}
</script>

<svelte:head>
	<title>GitHub Stars Search</title>
</svelte:head>

<main>
	<NavBar />
	<div class="container">
		<h1>GitHub Stars Search</h1>

		<div class="search-container">
			<input type="text" bind:value={username} placeholder="Enter GitHub username" />
			<input type="password" bind:value={token} placeholder="GitHub Personal Access Token" />
			<button on:click={fetchStars} disabled={loading}>
				{loading ? 'Fetching...' : 'Fetch Stars'}
			</button>
			<input type="text" bind:value={searchTerm} placeholder="Search repositories" />
			<select bind:value={sortBy}>
				<option value="relevance">Sort by Relevance</option>
				<option value="stars">Sort by Stars</option>
				<option value="name">Sort by Name</option>
				<option value="updated">Sort by Last Updated</option>
			</select>
		</div>

		{#if error}
			<div class="error">{error}</div>
		{/if}

		<ProgressBar progress={fromStore(progress).current} />

		{#if $allRepos.length > 0}
			<div class="results-counter">
				{#if searchTerm.trim()}
					<span
						>Found {filteredRepos.length} matching {filteredRepos.length === 1
							? 'repository'
							: 'repositories'}</span
					>
				{/if}
				<span
					>Total: {$allRepos.length} {$allRepos.length === 1 ? 'repository' : 'repositories'}</span
				>
			</div>
		{/if}

		<div class="stars-list">
			{#each filteredRepos as repo (repo.id)}
				<RepoCard {repo} />
			{/each}
		</div>
	</div>
</main>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
	}

	h1 {
		margin-bottom: 20px;
		color: #24292e;
	}

	.search-container {
		display: flex;
		gap: 10px;
		margin-bottom: 20px;
		flex-wrap: wrap;
	}

	input,
	select,
	button {
		padding: 8px 12px;
		border: 1px solid #e1e4e8;
		border-radius: 6px;
		font-size: 14px;
	}

	input {
		flex: 1;
		min-width: 200px;
	}

	button {
		background: #2ea44f;
		color: white;
		border: none;
		cursor: pointer;
		transition: background 0.2s;
	}

	button:disabled {
		background: #94d3a2;
		cursor: not-allowed;
	}

	button:not(:disabled):hover {
		background: #2c974b;
	}

	.error {
		color: #cb2431;
		padding: 10px;
		background: #ffeef0;
		border-radius: 6px;
		margin-bottom: 15px;
	}

	.stars-list {
		margin-top: 20px;
	}

	.results-counter {
		display: flex;
		gap: 20px;
		padding: 10px 0;
		color: #586069;
		font-size: 14px;
		border-bottom: 1px solid #e1e4e8;
		margin-bottom: 20px;
	}

	.results-counter span {
		display: inline-flex;
		align-items: center;
	}
</style>

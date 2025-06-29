import { writable, derived, get } from 'svelte/store';
import type { Repository } from '../../types';
import { ServiceManager } from '../../services';
import { searchRepositories } from '../../search';
import type { SortOption } from '../../stores/app';

export interface RepositoryState {
	repositories: Repository[];
	loading: boolean;
	error: string | null;
	searchTerm: string;
	sortBy: SortOption;
}

export function useRepositories() {
	const initialState: RepositoryState = {
		repositories: [],
		loading: false,
		error: null,
		searchTerm: '',
		sortBy: 'relevance'
	};

	const state = writable<RepositoryState>(initialState);

	// Derived store for search results that automatically updates when repositories, searchTerm, or sortBy change
	const searchResults = derived(state, ($state) =>
		searchRepositories($state.repositories, $state.searchTerm, $state.sortBy)
	);

	const load = async (): Promise<void> => {
		const serviceManager = ServiceManager.getInstance();
		const starsDb = serviceManager.getService('starsDb');

		try {
			state.update((s) => ({ ...s, loading: true, error: null }));

			const repositories = await starsDb.getCachedStars();
			state.update((s) => ({ ...s, repositories, loading: false }));
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to load repositories';
			state.update((s) => ({ ...s, error: errorMessage, loading: false }));
		}
	};

	const refresh = async (
		onProgress: (current: number, total: number) => void = () => {}
	): Promise<void> => {
		const serviceManager = ServiceManager.getInstance();
		const settingsDb = serviceManager.getService('settingsDb');
		const starsDb = serviceManager.getService('starsDb');
		const github = serviceManager.getService('github');

		try {
			state.update((s) => ({ ...s, loading: true, error: null }));

			// Get credentials
			const username = await settingsDb.getUsername();
			const token = await settingsDb.getToken();

			if (!username || !token) {
				throw new Error('Please configure your GitHub credentials in Settings');
			}

			// Update GitHub service with current token
			serviceManager.setGitHubToken(token);

			// Fetch starred repositories
			const repositories = await github.fetchAllStarredRepos(username, onProgress);

			// Save to database
			await starsDb.saveStars(repositories);

			// Update state
			state.update((s) => ({ ...s, repositories, loading: false }));
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to fetch repositories';
			state.update((s) => ({ ...s, error: errorMessage, loading: false }));
		}
	};

	const setSearchTerm = (searchTerm: string): void => {
		state.update((s) => ({ ...s, searchTerm }));
	};

	const setSortBy = (sortBy: SortOption): void => {
		state.update((s) => ({ ...s, sortBy }));
	};

	const clearError = (): void => {
		state.update((s) => ({ ...s, error: null }));
	};

	const reset = (): void => {
		state.set(initialState);
	};

	return {
		// Store subscription
		subscribe: state.subscribe,

		// Derived stores
		searchResults,

		// Actions
		load,
		refresh,
		setSearchTerm,
		setSortBy,
		clearError,
		reset,

		// Getters for current state
		get: () => get(state)
	};
}

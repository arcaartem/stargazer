import { writable, derived, get } from 'svelte/store';
import { searchRepositories } from '../../search';
import type { Repository } from '../../types';
import type { SortOption } from '../../stores/app';

export interface SearchState {
	term: string;
	sortBy: SortOption;
	debouncedTerm: string;
	isSearching: boolean;
}

export interface SearchStats {
	totalResults: number;
	totalRepositories: number;
	hasSearchTerm: boolean;
	searchTerm: string;
}

export function useSearch(repositories: Repository[], debounceMs = 300) {
	const initialState: SearchState = {
		term: '',
		sortBy: 'relevance',
		debouncedTerm: '',
		isSearching: false
	};

	const state = writable<SearchState>(initialState);

	let debounceTimeout: number | null = null;

	// Handle debounced search term updates
	const updateDebouncedTerm = (term: string) => {
		state.update((s) => ({ ...s, isSearching: true }));

		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
		}

		debounceTimeout = setTimeout(() => {
			state.update((s) => ({
				...s,
				debouncedTerm: term,
				isSearching: false
			}));
		}, debounceMs);
	};

	// Derived store for search results
	const results = derived(state, ($state) => {
		return searchRepositories(repositories, $state.debouncedTerm, $state.sortBy);
	});

	// Derived store for search stats
	const stats = derived([state, results], ([$state, $results]) => ({
		totalResults: $results.length,
		totalRepositories: repositories.length,
		hasSearchTerm: $state.debouncedTerm.trim() !== '',
		searchTerm: $state.debouncedTerm
	}));

	const setTerm = (term: string): void => {
		state.update((s) => ({ ...s, term }));
		updateDebouncedTerm(term);
	};

	const setSortBy = (sortBy: SortOption): void => {
		state.update((s) => ({ ...s, sortBy }));
	};

	const clear = (): void => {
		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
		}
		state.update((s) => ({
			...s,
			term: '',
			debouncedTerm: '',
			isSearching: false
		}));
	};

	const reset = (): void => {
		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
		}
		state.set(initialState);
	};

	// Cleanup function for component unmount
	const destroy = (): void => {
		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
		}
	};

	return {
		// Store subscriptions
		subscribe: state.subscribe,
		results,
		stats,

		// Actions
		setTerm,
		setSortBy,
		clear,
		reset,
		destroy,

		// Getter for current state
		get: () => get(state)
	};
}

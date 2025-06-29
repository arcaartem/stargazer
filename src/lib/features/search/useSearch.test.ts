import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSearch, type SearchStats } from './useSearch';
import type { Repository } from '../../types';

// Mock the search function
vi.mock('../search', () => ({
	searchRepositories: vi.fn((repos, term) => {
		if (!term) return repos;
		return repos.filter(
			(repo: Repository) =>
				repo.name.toLowerCase().includes(term.toLowerCase()) ||
				(repo.description && repo.description.toLowerCase().includes(term.toLowerCase()))
		);
	})
}));

describe('useSearch', () => {
	const mockRepositories: Repository[] = [
		{
			id: 1,
			name: 'react-app',
			description: 'A React application',
			html_url: 'https://github.com/user/react-app',
			language: 'TypeScript',
			stargazers_count: 100,
			updated_at: '2023-01-01T00:00:00Z',
			owner: { login: 'user' }
		},
		{
			id: 2,
			name: 'vue-component',
			description: 'Vue.js component library',
			html_url: 'https://github.com/user/vue-component',
			language: 'JavaScript',
			stargazers_count: 50,
			updated_at: '2023-01-02T00:00:00Z',
			owner: { login: 'user' }
		},
		{
			id: 3,
			name: 'svelte-kit',
			description: 'SvelteKit project template',
			html_url: 'https://github.com/user/svelte-kit',
			language: 'TypeScript',
			stargazers_count: 75,
			updated_at: '2023-01-03T00:00:00Z',
			owner: { login: 'user' }
		}
	];

	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.useRealTimers();
	});

	it('should initialize with correct defaults', () => {
		const search = useSearch(mockRepositories);
		const state = search.get();

		expect(state).toEqual({
			term: '',
			sortBy: 'relevance',
			debouncedTerm: '',
			isSearching: false
		});
	});

	it('should set search term and trigger debouncing', () => {
		const search = useSearch(mockRepositories);

		search.setTerm('react');
		const state = search.get();

		expect(state.term).toBe('react');
		expect(state.isSearching).toBe(true);
		expect(state.debouncedTerm).toBe(''); // Not yet debounced
	});

	it('should update debounced term after debounce delay', () => {
		const search = useSearch(mockRepositories, 300);

		search.setTerm('react');

		// Fast-forward time to trigger debounce
		vi.advanceTimersByTime(300);

		const state = search.get();
		expect(state.debouncedTerm).toBe('react');
		expect(state.isSearching).toBe(false);
	});

	it('should cancel previous debounce when new term is set', () => {
		const search = useSearch(mockRepositories, 300);

		search.setTerm('react');
		vi.advanceTimersByTime(100); // Partial time

		search.setTerm('vue'); // New term should cancel previous debounce
		vi.advanceTimersByTime(200); // Complete remaining time

		const state = search.get();
		expect(state.debouncedTerm).toBe(''); // First term was cancelled
		expect(state.term).toBe('vue');

		// Complete the new debounce
		vi.advanceTimersByTime(100);

		const finalState = search.get();
		expect(finalState.debouncedTerm).toBe('vue');
	});

	it('should set sort by correctly', () => {
		const search = useSearch(mockRepositories);

		search.setSortBy('stars');
		const state = search.get();

		expect(state.sortBy).toBe('stars');
	});

	it('should provide search results through derived store', () => {
		const search = useSearch(mockRepositories);
		const resultsUpdates: Repository[][] = [];

		search.results.subscribe((results) => {
			resultsUpdates.push(results);
		});

		// Set search term and trigger debounce
		search.setTerm('react');
		vi.advanceTimersByTime(300);

		// Should have filtered results
		const finalResults = resultsUpdates[resultsUpdates.length - 1];
		expect(finalResults).toHaveLength(1);
		expect(finalResults[0].name).toBe('react-app');
	});

	it('should provide search stats through derived store', () => {
		const search = useSearch(mockRepositories);
		const statsUpdates: SearchStats[] = [];

		search.stats.subscribe((stats) => {
			statsUpdates.push(stats);
		});

		// Set search term and trigger debounce
		search.setTerm('component');
		vi.advanceTimersByTime(300);

		const finalStats = statsUpdates[statsUpdates.length - 1];
		expect(finalStats.totalResults).toBe(1); // Should find vue-component
		expect(finalStats.totalRepositories).toBe(3);
		expect(finalStats.hasSearchTerm).toBe(true);
		expect(finalStats.searchTerm).toBe('component');
	});

	it('should clear search correctly', () => {
		const search = useSearch(mockRepositories);

		// Set a search term
		search.setTerm('react');
		vi.advanceTimersByTime(300);

		// Clear search
		search.clear();

		const state = search.get();
		expect(state.term).toBe('');
		expect(state.debouncedTerm).toBe('');
		expect(state.isSearching).toBe(false);
	});

	it('should reset search correctly', () => {
		const search = useSearch(mockRepositories);

		// Modify state
		search.setTerm('react');
		search.setSortBy('stars');

		// Reset
		search.reset();

		const state = search.get();
		expect(state).toEqual({
			term: '',
			sortBy: 'relevance',
			debouncedTerm: '',
			isSearching: false
		});
	});

	it('should handle custom debounce delay', () => {
		const search = useSearch(mockRepositories, 500); // Custom 500ms delay

		search.setTerm('react');

		// Should not be debounced yet
		vi.advanceTimersByTime(300);
		expect(search.get().debouncedTerm).toBe('');

		// Should be debounced now
		vi.advanceTimersByTime(200);
		expect(search.get().debouncedTerm).toBe('react');
	});

	it('should clean up timers on destroy', () => {
		const search = useSearch(mockRepositories);

		search.setTerm('react');
		search.destroy();

		// Advance time - should not trigger debounce after destroy
		vi.advanceTimersByTime(300);

		const state = search.get();
		expect(state.debouncedTerm).toBe('');
	});

	it('should handle multiple rapid term changes', () => {
		const search = useSearch(mockRepositories, 300);

		search.setTerm('a');
		vi.advanceTimersByTime(100);

		search.setTerm('ab');
		vi.advanceTimersByTime(100);

		search.setTerm('abc');
		vi.advanceTimersByTime(100);

		search.setTerm('abcd');
		vi.advanceTimersByTime(300); // Complete debounce

		const state = search.get();
		expect(state.debouncedTerm).toBe('abcd');
		expect(state.isSearching).toBe(false);
	});

	it('should maintain search state during repository updates', () => {
		const search = useSearch(mockRepositories);

		search.setTerm('react');
		search.setSortBy('stars');
		vi.advanceTimersByTime(300);

		// State should remain consistent
		const state = search.get();
		expect(state.term).toBe('react');
		expect(state.sortBy).toBe('stars');
		expect(state.debouncedTerm).toBe('react');
	});

	it('should handle empty repository array', () => {
		const search = useSearch([]);
		const statsUpdates: SearchStats[] = [];

		search.stats.subscribe((stats) => {
			statsUpdates.push(stats);
		});

		search.setTerm('test');
		vi.advanceTimersByTime(300);

		const finalStats = statsUpdates[statsUpdates.length - 1];
		expect(finalStats.totalResults).toBe(0);
		expect(finalStats.totalRepositories).toBe(0);
	});
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/services/search', () => ({
	search: vi.fn().mockReturnValue({ repos: [], totalCount: 0 }),
	getAvailableLanguages: vi.fn().mockReturnValue(['TypeScript', 'JavaScript']),
	getAvailableTopics: vi.fn().mockReturnValue(['svelte']),
	getAvailableLicenses: vi.fn().mockReturnValue(['MIT']),
	getAvailableOwners: vi.fn().mockReturnValue(['octocat'])
}));

import { searchStore } from './search-store.svelte';
import { search as searchIndex } from '$lib/services/search';

describe('searchStore', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(searchIndex).mockReturnValue({ repos: [], totalCount: 0 });
	});

	it('has initial empty state', () => {
		expect(searchStore.query).toBe('');
		expect(searchStore.results).toEqual([]);
		expect(searchStore.selectedRepoId).toBeNull();
	});

	it('performs search on setQuery', () => {
		searchStore.setQuery('test');
		expect(searchIndex).toHaveBeenCalled();
	});

	it('sets sort to relevance when query is non-empty', () => {
		searchStore.setSort('stars-desc');
		searchStore.setQuery('test');
		expect(searchStore.sort).toBe('relevance');
	});

	it('selects a repo', () => {
		searchStore.selectRepo(42);
		expect(searchStore.selectedRepoId).toBe(42);
	});

	it('clears filters and re-searches', () => {
		searchStore.updateFilter('languages', ['TypeScript']);
		searchStore.clearFilters();
		expect(searchStore.filters.languages).toEqual([]);
	});
});

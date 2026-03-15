import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/services/search', () => ({
	search: vi.fn().mockReturnValue({ repos: [], totalCount: 0 }),
	getAvailableLanguages: vi.fn().mockReturnValue(['TypeScript', 'JavaScript']),
	getAvailableTopics: vi.fn().mockReturnValue(['svelte']),
	getAvailableLicenses: vi.fn().mockReturnValue(['MIT']),
	getAvailableOwners: vi.fn().mockReturnValue(['octocat'])
}));

vi.mock('$lib/services/query-parser', () => ({
	parseSearchQuery: vi.fn().mockReturnValue({ text: '', filters: {}, readmeOnly: false }),
	buildSearchQuery: vi.fn().mockReturnValue('')
}));

import { searchStore } from './search-store.svelte';
import { search as searchIndex } from '$lib/services/search';
import { parseSearchQuery, buildSearchQuery } from '$lib/services/query-parser';

describe('searchStore', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(searchIndex).mockReturnValue({ repos: [], totalCount: 0 });
		vi.mocked(parseSearchQuery).mockReturnValue({ text: '', filters: {}, readmeOnly: false });
		vi.mocked(buildSearchQuery).mockReturnValue('');
		searchStore.setQuery('');
	});

	it('has initial empty state', () => {
		expect(searchStore.query).toBe('');
		expect(searchStore.results).toEqual([]);
		expect(searchStore.selectedRepoId).toBeNull();
	});

	it('performs search on setQuery', () => {
		searchStore.setQuery('test');
		expect(parseSearchQuery).toHaveBeenCalledWith('test');
		expect(searchIndex).toHaveBeenCalled();
	});

	it('uses parsed text and filters for search', () => {
		vi.mocked(parseSearchQuery).mockReturnValue({
			text: 'web',
			filters: { languages: ['rust'] },
			readmeOnly: false
		});

		searchStore.setQuery('language:rust web');

		expect(searchIndex).toHaveBeenCalledWith(
			'web',
			{ languages: ['rust'] },
			expect.any(String),
			false
		);
	});

	it('applies parsed sort override', () => {
		vi.mocked(parseSearchQuery).mockReturnValue({
			text: '',
			filters: {},
			readmeOnly: false,
			sort: 'name-asc'
		});

		searchStore.setQuery('sort:name-asc');
		expect(searchStore.sort).toBe('name-asc');
	});

	it('exposes parsedFilters', () => {
		vi.mocked(parseSearchQuery).mockReturnValue({
			text: '',
			filters: { languages: ['rust'] },
			readmeOnly: false
		});

		searchStore.setQuery('language:rust');
		expect(searchStore.parsedFilters).toEqual({ languages: ['rust'] });
	});

	it('exposes hasActiveFilters', () => {
		vi.mocked(parseSearchQuery).mockReturnValue({
			text: '',
			filters: { languages: ['rust'] },
			readmeOnly: false
		});

		searchStore.setQuery('language:rust');
		expect(searchStore.hasActiveFilters).toBe(true);
	});

	it('hasActiveFilters is false with no filters', () => {
		vi.mocked(parseSearchQuery).mockReturnValue({
			text: 'hello',
			filters: {},
			readmeOnly: false
		});

		searchStore.setQuery('hello');
		expect(searchStore.hasActiveFilters).toBe(false);
	});

	it('selects a repo', () => {
		searchStore.selectRepo(42);
		expect(searchStore.selectedRepoId).toBe(42);
	});

	it('removeFilter rebuilds query without removed filter', () => {
		vi.mocked(parseSearchQuery).mockReturnValue({
			text: 'web',
			filters: { languages: ['rust', 'go'] },
			readmeOnly: false
		});
		searchStore.setQuery('language:rust language:go web');

		vi.mocked(buildSearchQuery).mockReturnValue('language:go web');
		searchStore.removeFilter('languages', 'rust');

		expect(buildSearchQuery).toHaveBeenCalledWith('web', { languages: ['go'] }, expect.any(Object));
	});

	it('removeFilter handles readmeOnly removal', () => {
		vi.mocked(parseSearchQuery).mockReturnValue({
			text: 'web',
			filters: {},
			readmeOnly: true
		});
		searchStore.setQuery('in:readme web');

		searchStore.removeFilter('__readmeOnly');

		expect(buildSearchQuery).toHaveBeenCalledWith(
			'web',
			{},
			expect.objectContaining({ readmeOnly: false })
		);
	});

	it('clearFilters preserves only free text', () => {
		vi.mocked(parseSearchQuery).mockReturnValue({
			text: 'web',
			filters: { languages: ['rust'] },
			readmeOnly: false
		});
		searchStore.setQuery('language:rust web');

		searchStore.clearFilters();
		expect(searchStore.query).toBe('web');
	});

	it('setSort changes sort and re-searches', () => {
		searchStore.setSort('name-asc');
		expect(searchStore.sort).toBe('name-asc');
		expect(searchIndex).toHaveBeenCalled();
	});
});

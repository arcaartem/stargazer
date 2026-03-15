import type { StarredRepo, SortOption, SearchResult } from '$lib/types';
import {
	search as searchIndex,
	getAvailableLanguages,
	getAvailableTopics,
	getAvailableLicenses,
	getAvailableOwners
} from '$lib/services/search';
import { parseSearchQuery, buildSearchQuery, type ParsedQuery } from '$lib/services/query-parser';

class SearchStore {
	query = $state('');
	sort = $state<SortOption>('stars-desc');
	results = $state<StarredRepo[]>([]);
	totalCount = $state(0);
	selectedRepoId = $state<number | null>(null);

	private parsed = $state<ParsedQuery>({ text: '', filters: {}, readmeOnly: false });

	get parsedFilters() {
		return this.parsed.filters;
	}

	get parsedText() {
		return this.parsed.text;
	}

	get readmeOnly() {
		return this.parsed.readmeOnly;
	}

	get hasActiveFilters() {
		if (this.parsed.readmeOnly) return true;
		return Object.values(this.parsed.filters).some((v) => {
			if (Array.isArray(v)) return v.length > 0;
			return v !== null && v !== undefined;
		});
	}

	get selectedRepo(): StarredRepo | null {
		if (this.selectedRepoId === null) return null;
		return this.results.find((r) => r.id === this.selectedRepoId) ?? null;
	}

	get availableFilters() {
		return {
			languages: getAvailableLanguages(),
			topics: getAvailableTopics(),
			licenses: getAvailableLicenses(),
			owners: getAvailableOwners()
		};
	}

	performSearch() {
		this.parsed = parseSearchQuery(this.query);
		const result: SearchResult = searchIndex(
			this.parsed.text,
			this.parsed.filters,
			this.sort,
			this.parsed.readmeOnly
		);
		this.results = result.repos;
		this.totalCount = result.totalCount;
	}

	selectRepo(id: number | null) {
		this.selectedRepoId = id;
	}

	setQuery(query: string) {
		this.query = query;
		this.parsed = parseSearchQuery(this.query);
		if (this.parsed.sort) {
			this.sort = this.parsed.sort;
		} else if (this.parsed.text) {
			this.sort = 'relevance';
		} else {
			this.sort = 'stars-desc';
		}
		this.performSearch();
	}

	setSort(sort: SortOption) {
		this.sort = sort;
		this.performSearch();
	}

	removeFilter(key: string, value?: string) {
		if (key === '__readmeOnly') {
			this.query = buildSearchQuery(this.parsed.text, this.parsed.filters, {
				sort: this.parsed.sort,
				readmeOnly: false
			});
			this.performSearch();
			return;
		}

		const newFilters = { ...this.parsed.filters };

		if (value !== undefined) {
			const arr = (newFilters as Record<string, unknown>)[key] as string[] | undefined;
			if (arr) {
				(newFilters as Record<string, unknown>)[key] = arr.filter((v) => v !== value);
			}
		} else {
			delete (newFilters as Record<string, unknown>)[key];
		}

		this.query = buildSearchQuery(this.parsed.text, newFilters, {
			sort: this.parsed.sort,
			readmeOnly: this.parsed.readmeOnly
		});
		this.performSearch();
	}

	clearFilters() {
		this.query = this.parsed.text;
		this.performSearch();
	}
}

export const searchStore = new SearchStore();

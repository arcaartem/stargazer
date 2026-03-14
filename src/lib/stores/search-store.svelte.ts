import type { StarredRepo, SearchFilters, SortOption, SearchResult } from '$lib/types';
import {
	search as searchIndex,
	getAvailableLanguages,
	getAvailableTopics,
	getAvailableLicenses,
	getAvailableOwners
} from '$lib/services/search';

const defaultFilters: SearchFilters = {
	languages: [],
	topics: [],
	licenses: [],
	owners: [],
	ownerTypes: [],
	archived: null,
	fork: null,
	isTemplate: null,
	isPrivate: null,
	hasIssues: null,
	hasWiki: null,
	hasPages: null,
	hasDiscussions: null,
	starsMin: null,
	starsMax: null,
	forksMin: null,
	forksMax: null,
	sizeMin: null,
	sizeMax: null,
	createdAfter: null,
	createdBefore: null,
	updatedAfter: null,
	updatedBefore: null,
	starredAfter: null,
	starredBefore: null
};

class SearchStore {
	query = $state('');
	readmeOnly = $state(false);
	filters = $state<SearchFilters>({ ...defaultFilters });
	sort = $state<SortOption>('relevance');
	results = $state<StarredRepo[]>([]);
	totalCount = $state(0);
	selectedRepoId = $state<number | null>(null);

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
		const result: SearchResult = searchIndex(this.query, this.filters, this.sort, this.readmeOnly);
		this.results = result.repos;
		this.totalCount = result.totalCount;
	}

	selectRepo(id: number | null) {
		this.selectedRepoId = id;
	}

	clearFilters() {
		this.filters = { ...defaultFilters };
		this.performSearch();
	}

	setQuery(query: string) {
		this.query = query;
		this.sort = query.trim() ? 'relevance' : this.sort;
		this.performSearch();
	}

	setSort(sort: SortOption) {
		this.sort = sort;
		this.performSearch();
	}

	setReadmeOnly(readmeOnly: boolean) {
		this.readmeOnly = readmeOnly;
		this.performSearch();
	}

	updateFilter<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) {
		this.filters[key] = value;
		this.performSearch();
	}
}

export const searchStore = new SearchStore();

import { Document } from 'flexsearch';
import type { StarredRepo, SearchFilters, SortOption, SearchResult } from '$lib/types';

// FlexSearch's TS types are overly strict for the runtime API — use `any` for the Document instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FlexDocument = any;

const INDEX_CONFIG = {
	id: 'id',
	index: ['name', 'fullName', 'description', 'readme'],
	tag: [
		'language',
		'topics',
		'license',
		'ownerLogin',
		'ownerType',
		'archived',
		'fork',
		'isTemplate',
		'private',
		'hasIssues',
		'hasProjects',
		'hasWiki',
		'hasPages',
		'hasDiscussions',
		'hasDownloads'
	],
	store: true,
	tokenize: 'forward',
	cache: 100
};

const IDB_NAME = 'stargazer-search';
const IDB_VERSION = 1;
const IDB_STORE = 'index-data';

let index: FlexDocument = null;
const knownIds = new Set<number>();

function createIndex(): FlexDocument {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return new Document(INDEX_CONFIG as any);
}

export function initIndex(): void {
	index = createIndex();
	knownIds.clear();
}

export function getIndex(): FlexDocument {
	if (!index) {
		index = createIndex();
	}
	return index;
}

export function indexAll(repos: StarredRepo[]): void {
	index = createIndex();
	knownIds.clear();
	for (const repo of repos) {
		index.add(repo);
		knownIds.add(repo.id);
	}
}

export function search(
	query: string,
	filters: Partial<SearchFilters> = {},
	sort: SortOption = 'relevance',
	readmeOnly: boolean = false
): SearchResult {
	const idx = getIndex();

	const tagFilter: Record<string, string | boolean> = {};
	if (filters.languages?.length === 1) tagFilter.language = filters.languages[0];
	if (filters.licenses?.length === 1) tagFilter.license = filters.licenses[0];
	if (filters.owners?.length === 1) tagFilter.ownerLogin = filters.owners[0];
	if (filters.ownerTypes?.length === 1) tagFilter.ownerType = filters.ownerTypes[0];
	if (filters.archived === true || filters.archived === false)
		tagFilter.archived = filters.archived;
	if (filters.fork === true || filters.fork === false) tagFilter.fork = filters.fork;
	if (filters.isTemplate === true || filters.isTemplate === false)
		tagFilter.isTemplate = filters.isTemplate;
	if (filters.isPrivate === true || filters.isPrivate === false)
		tagFilter.private = filters.isPrivate;
	if (filters.hasIssues === true) tagFilter.hasIssues = true;
	if (filters.hasWiki === true) tagFilter.hasWiki = true;
	if (filters.hasPages === true) tagFilter.hasPages = true;
	if (filters.hasDiscussions === true) tagFilter.hasDiscussions = true;

	let matchedIds: Set<number>;

	if (query.trim()) {
		const searchOpts: Record<string, unknown> = { enrich: true };
		if (Object.keys(tagFilter).length > 0) {
			searchOpts.tag = tagFilter;
		}

		if (readmeOnly) {
			const rawResults = idx.search(query, { ...searchOpts, pluck: 'readme', enrich: true });
			matchedIds = new Set<number>();
			for (const item of rawResults as Array<{ id: number } | number>) {
				matchedIds.add(typeof item === 'number' ? item : item.id);
			}
		} else {
			const rawResults = idx.search(query, searchOpts);
			matchedIds = new Set<number>();
			for (const fieldResult of rawResults as Array<{
				field: string;
				result: Array<{ id: number } | number>;
			}>) {
				if (fieldResult.result) {
					for (const item of fieldResult.result) {
						matchedIds.add(typeof item === 'number' ? item : item.id);
					}
				}
			}
		}
	} else if (Object.keys(tagFilter).length > 0) {
		const rawResults = idx.search({ tag: tagFilter, enrich: true });
		matchedIds = new Set<number>();
		for (const fieldResult of rawResults as Array<{ result: Array<{ id: number } | number> }>) {
			if (fieldResult.result) {
				for (const item of fieldResult.result) {
					matchedIds.add(typeof item === 'number' ? item : item.id);
				}
			}
		}
	} else {
		matchedIds = new Set(knownIds);
	}

	let repos: StarredRepo[] = [];
	for (const id of matchedIds) {
		const doc = idx.get(id) as StarredRepo | null;
		if (doc) repos.push(doc);
	}

	// Multi-value tag post-filters
	if (filters.languages && filters.languages.length > 1) {
		const set = new Set(filters.languages);
		repos = repos.filter((r) => r.language && set.has(r.language));
	}
	if (filters.topics && filters.topics.length > 0) {
		repos = repos.filter((r) => r.topics.some((t) => filters.topics!.includes(t)));
	}
	if (filters.licenses && filters.licenses.length > 1) {
		const set = new Set(filters.licenses);
		repos = repos.filter((r) => r.license && set.has(r.license));
	}
	if (filters.owners && filters.owners.length > 1) {
		const set = new Set(filters.owners);
		repos = repos.filter((r) => set.has(r.ownerLogin));
	}

	// Range post-filters
	if (filters.starsMin != null) repos = repos.filter((r) => r.stargazersCount >= filters.starsMin!);
	if (filters.starsMax != null) repos = repos.filter((r) => r.stargazersCount <= filters.starsMax!);
	if (filters.forksMin != null) repos = repos.filter((r) => r.forksCount >= filters.forksMin!);
	if (filters.forksMax != null) repos = repos.filter((r) => r.forksCount <= filters.forksMax!);
	if (filters.sizeMin != null) repos = repos.filter((r) => r.size >= filters.sizeMin!);
	if (filters.sizeMax != null) repos = repos.filter((r) => r.size <= filters.sizeMax!);
	if (filters.createdAfter) repos = repos.filter((r) => r.createdAt >= filters.createdAfter!);
	if (filters.createdBefore) repos = repos.filter((r) => r.createdAt <= filters.createdBefore!);
	if (filters.updatedAfter) repos = repos.filter((r) => r.updatedAt >= filters.updatedAfter!);
	if (filters.updatedBefore) repos = repos.filter((r) => r.updatedAt <= filters.updatedBefore!);
	if (filters.starredAfter) repos = repos.filter((r) => r.starredAt >= filters.starredAfter!);
	if (filters.starredBefore) repos = repos.filter((r) => r.starredAt <= filters.starredBefore!);

	repos = sortRepos(repos, sort);

	return { repos, totalCount: repos.length };
}

function sortRepos(repos: StarredRepo[], sort: SortOption): StarredRepo[] {
	const sorted = [...repos];
	switch (sort) {
		case 'stars-desc':
			return sorted.sort((a, b) => b.stargazersCount - a.stargazersCount);
		case 'stars-asc':
			return sorted.sort((a, b) => a.stargazersCount - b.stargazersCount);
		case 'name-asc':
			return sorted.sort((a, b) => a.name.localeCompare(b.name));
		case 'name-desc':
			return sorted.sort((a, b) => b.name.localeCompare(a.name));
		case 'updated-desc':
			return sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
		case 'starred-desc':
			return sorted.sort((a, b) => b.starredAt.localeCompare(a.starredAt));
		case 'created-desc':
			return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
		case 'forks-desc':
			return sorted.sort((a, b) => b.forksCount - a.forksCount);
		case 'size-desc':
			return sorted.sort((a, b) => b.size - a.size);
		case 'relevance':
		default:
			return sorted;
	}
}

export function getRepoCount(): number {
	return knownIds.size;
}

export function getRepo(id: number): StarredRepo | null {
	const idx = getIndex();
	return (idx.get(id) as StarredRepo) ?? null;
}

export function getAllRepos(): StarredRepo[] {
	const repos: StarredRepo[] = [];
	for (const id of knownIds) {
		const doc = getIndex().get(id) as StarredRepo | null;
		if (doc) repos.push(doc);
	}
	return repos;
}

export function getAvailableLanguages(): string[] {
	const langs = new Set<string>();
	for (const repo of getAllRepos()) {
		if (repo.language) langs.add(repo.language);
	}
	return Array.from(langs).sort();
}

export function getAvailableTopics(): string[] {
	const topics = new Set<string>();
	for (const repo of getAllRepos()) {
		for (const t of repo.topics) topics.add(t);
	}
	return Array.from(topics).sort();
}

export function getAvailableLicenses(): string[] {
	const licenses = new Set<string>();
	for (const repo of getAllRepos()) {
		if (repo.license) licenses.add(repo.license);
	}
	return Array.from(licenses).sort();
}

export function getAvailableOwners(): string[] {
	const owners = new Set<string>();
	for (const repo of getAllRepos()) {
		owners.add(repo.ownerLogin);
	}
	return Array.from(owners).sort();
}

function openSearchDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(IDB_NAME, IDB_VERSION);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(IDB_STORE)) {
				db.createObjectStore(IDB_STORE);
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export async function persistToIndexedDB(): Promise<void> {
	const idx = getIndex();
	const chunks: Record<string, string> = {};

	idx.export((key: string | number, data: string | undefined) => {
		if (data !== undefined) {
			chunks[String(key)] = data;
		}
	});

	chunks['__knownIds'] = JSON.stringify(Array.from(knownIds));

	const db = await openSearchDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(IDB_STORE, 'readwrite');
		const store = tx.objectStore(IDB_STORE);
		store.clear();
		for (const [key, data] of Object.entries(chunks)) {
			store.put(data, key);
		}
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

export async function loadFromIndexedDB(): Promise<boolean> {
	const db = await openSearchDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(IDB_STORE, 'readonly');
		const store = tx.objectStore(IDB_STORE);
		const request = store.getAll();
		const keysRequest = store.getAllKeys();

		let allKeys: IDBValidKey[];

		keysRequest.onsuccess = () => {
			allKeys = keysRequest.result;
		};
		request.onsuccess = () => {
			const allData = request.result;
			if (!allData || allData.length === 0) {
				resolve(false);
				return;
			}

			const newIndex = createIndex();
			const chunks: Record<string, string> = {};

			for (let i = 0; i < allKeys.length; i++) {
				chunks[String(allKeys[i])] = allData[i] as string;
			}

			if (chunks['__knownIds']) {
				const ids: number[] = JSON.parse(chunks['__knownIds']);
				knownIds.clear();
				for (const id of ids) knownIds.add(id);
				delete chunks['__knownIds'];
			}

			for (const [key, data] of Object.entries(chunks)) {
				newIndex.import(key, data);
			}

			index = newIndex;
			resolve(true);
		};

		request.onerror = () => reject(request.error);
	});
}

export function clearIndex(): void {
	index = createIndex();
	knownIds.clear();
}

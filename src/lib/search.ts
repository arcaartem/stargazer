import Fuse from 'fuse.js';
import type { Repository } from './types';

export function createFuseInstance(repos: Repository[]) {
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

	return new Fuse(repos, fuseOptions);
}

export function sortRepositories(
	repos: Array<{ item: Repository; score?: number }>,
	sortBy: 'stars' | 'name' | 'updated' | 'relevance'
): Repository[] {
	return repos
		.sort((a, b) => {
			switch (sortBy) {
				case 'relevance':
					// Higher score means lower relevance in Fuse.js
					return (a.score ?? 0) - (b.score ?? 0);
				case 'stars':
					return b.item.stargazers_count - a.item.stargazers_count;
				case 'name':
					return a.item.name.localeCompare(b.item.name);
				case 'updated':
					return new Date(b.item.updated_at).getTime() - new Date(a.item.updated_at).getTime();
				default:
					return 0;
			}
		})
		.map((result) => result.item);
}

export function searchRepositories(
	repos: Repository[],
	searchTerm: string,
	sortBy: 'stars' | 'name' | 'updated' | 'relevance' = 'relevance'
): Repository[] {
	if (!searchTerm.trim()) {
		const allResults = repos.map((item) => ({ item }));
		return sortRepositories(allResults, sortBy);
	}

	const fuse = createFuseInstance(repos);
	const searchResults = fuse.search(searchTerm);

	if (searchResults.length === 0) {
		return [];
	}

	return sortRepositories(searchResults, sortBy);
}

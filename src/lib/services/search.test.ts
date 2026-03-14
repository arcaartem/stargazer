import { describe, it, expect, beforeEach } from 'vitest';
import {
	initIndex,
	indexAll,
	search,
	getAllRepos,
	getRepo,
	getRepoCount,
	getAvailableLanguages,
	getAvailableTopics,
	getAvailableLicenses,
	getAvailableOwners,
	clearIndex
} from './search';
import type { StarredRepo } from '$lib/types';

function makeRepo(overrides: Partial<StarredRepo> = {}): StarredRepo {
	return {
		id: 1,
		nodeId: 'node1',
		name: 'test-repo',
		fullName: 'owner/test-repo',
		description: 'A test repository',
		readme: '# Test README\nThis is a test.',
		ownerLogin: 'owner',
		ownerAvatarUrl: 'https://example.com/avatar.png',
		ownerType: 'User',
		htmlUrl: 'https://github.com/owner/test-repo',
		homepageUrl: null,
		gitUrl: 'git://github.com/owner/test-repo.git',
		sshUrl: 'git@github.com:owner/test-repo.git',
		cloneUrl: 'https://github.com/owner/test-repo.git',
		language: 'TypeScript',
		topics: ['testing', 'demo'],
		license: 'MIT',
		archived: false,
		fork: false,
		isTemplate: false,
		private: false,
		stargazersCount: 100,
		watchersCount: 50,
		forksCount: 20,
		openIssuesCount: 5,
		size: 1000,
		starredAt: '2024-01-01T00:00:00Z',
		createdAt: '2023-01-01T00:00:00Z',
		updatedAt: '2024-03-01T00:00:00Z',
		pushedAt: '2024-02-28T00:00:00Z',
		hasIssues: true,
		hasProjects: true,
		hasWiki: true,
		hasPages: false,
		hasDiscussions: false,
		hasDownloads: true,
		defaultBranch: 'main',
		licenseName: 'MIT License',
		licenseUrl: 'https://opensource.org/licenses/MIT',
		lastSyncedAt: '2024-03-14T00:00:00Z',
		...overrides
	};
}

describe('search service', () => {
	beforeEach(() => {
		initIndex();
	});

	describe('indexAll', () => {
		it('indexes repos and makes them searchable', () => {
			indexAll([makeRepo()]);
			expect(getRepoCount()).toBe(1);
		});

		it('replaces existing index', () => {
			indexAll([makeRepo({ id: 1 })]);
			indexAll([makeRepo({ id: 2 }), makeRepo({ id: 3 })]);
			expect(getRepoCount()).toBe(2);
		});
	});

	describe('search', () => {
		const repos = [
			makeRepo({
				id: 1,
				name: 'svelte-app',
				description: 'A Svelte application',
				language: 'TypeScript',
				stargazersCount: 500,
				topics: ['svelte', 'web']
			}),
			makeRepo({
				id: 2,
				name: 'react-lib',
				description: 'A React library',
				language: 'JavaScript',
				stargazersCount: 1000,
				topics: ['react', 'web']
			}),
			makeRepo({
				id: 3,
				name: 'go-server',
				description: 'A Go HTTP server',
				language: 'Go',
				stargazersCount: 200,
				topics: ['server', 'api']
			})
		];

		beforeEach(() => {
			indexAll(repos);
		});

		it('performs full-text search', () => {
			const result = search('svelte');
			expect(result.repos.some((r) => r.name === 'svelte-app')).toBe(true);
		});

		it('returns all repos with empty query', () => {
			const result = search('');
			expect(result.totalCount).toBe(3);
		});

		it('sorts by stars descending', () => {
			const result = search('', {}, 'stars-desc');
			expect(result.repos[0].stargazersCount).toBe(1000);
			expect(result.repos[2].stargazersCount).toBe(200);
		});

		it('sorts by name ascending', () => {
			const result = search('', {}, 'name-asc');
			expect(result.repos[0].name).toBe('go-server');
			expect(result.repos[2].name).toBe('svelte-app');
		});

		it('filters by star count range', () => {
			const result = search('', { starsMin: 300 });
			expect(result.totalCount).toBe(2);
			expect(result.repos.every((r) => r.stargazersCount >= 300)).toBe(true);
		});

		it('filters by multiple languages (post-filter)', () => {
			const result = search('', { languages: ['TypeScript', 'Go'] });
			expect(result.totalCount).toBe(2);
		});

		it('filters by topics', () => {
			const result = search('', { topics: ['web'] });
			expect(result.totalCount).toBe(2);
		});
	});

	describe('getRepo', () => {
		it('retrieves a repo by id', () => {
			indexAll([makeRepo({ id: 42, name: 'my-repo' })]);
			const repo = getRepo(42);
			expect(repo).not.toBeNull();
			expect(repo!.name).toBe('my-repo');
		});

		it('returns null for unknown id', () => {
			indexAll([makeRepo()]);
			expect(getRepo(999)).toBeNull();
		});
	});

	describe('getAllRepos', () => {
		it('returns all indexed repos', () => {
			indexAll([makeRepo({ id: 1 }), makeRepo({ id: 2 })]);
			expect(getAllRepos()).toHaveLength(2);
		});
	});

	describe('enumeration methods', () => {
		beforeEach(() => {
			indexAll([
				makeRepo({
					id: 1,
					language: 'TypeScript',
					topics: ['svelte'],
					license: 'MIT',
					ownerLogin: 'alice'
				}),
				makeRepo({
					id: 2,
					language: 'JavaScript',
					topics: ['react', 'svelte'],
					license: 'Apache-2.0',
					ownerLogin: 'bob'
				}),
				makeRepo({
					id: 3,
					language: 'TypeScript',
					topics: ['node'],
					license: 'MIT',
					ownerLogin: 'alice'
				})
			]);
		});

		it('getAvailableLanguages returns sorted unique languages', () => {
			expect(getAvailableLanguages()).toEqual(['JavaScript', 'TypeScript']);
		});

		it('getAvailableTopics returns sorted unique topics', () => {
			expect(getAvailableTopics()).toEqual(['node', 'react', 'svelte']);
		});

		it('getAvailableLicenses returns sorted unique licenses', () => {
			expect(getAvailableLicenses()).toEqual(['Apache-2.0', 'MIT']);
		});

		it('getAvailableOwners returns sorted unique owners', () => {
			expect(getAvailableOwners()).toEqual(['alice', 'bob']);
		});
	});

	describe('clearIndex', () => {
		it('clears all data', () => {
			indexAll([makeRepo()]);
			clearIndex();
			expect(getRepoCount()).toBe(0);
			expect(getAllRepos()).toHaveLength(0);
		});
	});

	describe('empty index', () => {
		it('returns empty results', () => {
			const result = search('anything');
			expect(result.totalCount).toBe(0);
		});

		it('returns empty enumerations', () => {
			expect(getAvailableLanguages()).toEqual([]);
			expect(getAvailableTopics()).toEqual([]);
		});
	});
});

import { describe, it, expect, beforeEach } from 'vitest';
import Fuse from 'fuse.js';
import type { Repository } from './types';
import { createFuseInstance, sortRepositories, searchRepositories } from './search';

describe('Search Functionality', () => {
	let mockRepos: Repository[];

	beforeEach(() => {
		mockRepos = [
			{
				id: 1,
				name: 'awesome-react',
				description: 'A collection of awesome React components',
				html_url: 'https://github.com/user1/awesome-react',
				language: 'JavaScript',
				stargazers_count: 1500,
				updated_at: '2023-12-01T00:00:00Z',
				owner: { login: 'user1' }
			},
			{
				id: 2,
				name: 'vue-components',
				description: 'Vue.js component library',
				html_url: 'https://github.com/user2/vue-components',
				language: 'Vue',
				stargazers_count: 800,
				updated_at: '2023-11-15T00:00:00Z',
				owner: { login: 'user2' }
			},
			{
				id: 3,
				name: 'typescript-utils',
				description: 'Utility functions for TypeScript projects',
				html_url: 'https://github.com/user1/typescript-utils',
				language: 'TypeScript',
				stargazers_count: 2000,
				updated_at: '2023-12-15T00:00:00Z',
				owner: { login: 'user1' }
			},
			{
				id: 4,
				name: 'react-hooks',
				description: 'Custom React hooks collection',
				html_url: 'https://github.com/user3/react-hooks',
				language: 'JavaScript',
				stargazers_count: 1200,
				updated_at: '2023-10-01T00:00:00Z',
				owner: { login: 'user3' }
			}
		];
	});

	describe('createFuseInstance', () => {
		it('should create Fuse instance with correct configuration', () => {
			const fuse = createFuseInstance(mockRepos);

			expect(fuse).toBeInstanceOf(Fuse);
			// Test that search works
			const results = fuse.search('react');
			expect(results.length).toBeGreaterThan(0);
		});

		it('should handle empty repository array', () => {
			const fuse = createFuseInstance([]);
			const results = fuse.search('test');

			expect(results).toEqual([]);
		});
	});

	describe('sortRepositories', () => {
		let searchResults: Array<{ item: Repository; score?: number }>;

		beforeEach(() => {
			searchResults = mockRepos.map((item, index) => ({
				item,
				score: 0.1 + index * 0.1 // Simulate different relevance scores
			}));
		});

		it('should sort by stars descending', () => {
			const sorted = sortRepositories(searchResults, 'stars');

			expect(sorted[0].stargazers_count).toBe(2000); // typescript-utils
			expect(sorted[1].stargazers_count).toBe(1500); // awesome-react
			expect(sorted[2].stargazers_count).toBe(1200); // react-hooks
			expect(sorted[3].stargazers_count).toBe(800); // vue-components
		});

		it('should sort by name alphabetically', () => {
			const sorted = sortRepositories(searchResults, 'name');

			expect(sorted[0].name).toBe('awesome-react');
			expect(sorted[1].name).toBe('react-hooks');
			expect(sorted[2].name).toBe('typescript-utils');
			expect(sorted[3].name).toBe('vue-components');
		});

		it('should sort by updated date descending', () => {
			const sorted = sortRepositories(searchResults, 'updated');

			expect(sorted[0].name).toBe('typescript-utils'); // 2023-12-15
			expect(sorted[1].name).toBe('awesome-react'); // 2023-12-01
			expect(sorted[2].name).toBe('vue-components'); // 2023-11-15
			expect(sorted[3].name).toBe('react-hooks'); // 2023-10-01
		});

		it('should sort by relevance (score ascending)', () => {
			const sorted = sortRepositories(searchResults, 'relevance');

			// Lower scores should come first (better relevance)
			expect(sorted[0]).toBe(mockRepos[0]); // score: 0.1
			expect(sorted[1]).toBe(mockRepos[1]); // score: 0.2
			expect(sorted[2]).toBe(mockRepos[2]); // score: 0.3
			expect(sorted[3]).toBe(mockRepos[3]); // score: 0.4
		});

		it('should handle missing scores for relevance sort', () => {
			const resultsWithoutScores = mockRepos.map((item) => ({ item }));
			const sorted = sortRepositories(resultsWithoutScores, 'relevance');

			expect(sorted).toHaveLength(4);
			// Should maintain original order when scores are equal (0)
		});
	});

	describe('searchRepositories', () => {
		it('should return all repos when search term is empty', () => {
			const results = searchRepositories(mockRepos, '', 'stars');

			expect(results).toHaveLength(4);
			// Should be sorted by stars
			expect(results[0].stargazers_count).toBe(2000);
		});

		it('should return all repos when search term is whitespace', () => {
			const results = searchRepositories(mockRepos, '   ', 'name');

			expect(results).toHaveLength(4);
			// Should be sorted by name
			expect(results[0].name).toBe('awesome-react');
		});

		it('should search by repository name', () => {
			const results = searchRepositories(mockRepos, 'react');

			expect(results.length).toBeGreaterThan(0);
			expect(results.some((repo) => repo.name.includes('react'))).toBe(true);
		});

		it('should search by description', () => {
			const results = searchRepositories(mockRepos, 'component');

			expect(results.length).toBeGreaterThan(0);
			expect(results.some((repo) => repo.description?.toLowerCase().includes('component'))).toBe(
				true
			);
		});

		it('should search by owner login', () => {
			const results = searchRepositories(mockRepos, 'user1');

			// Fuzzy search might match partial strings, so we check that user1 repos are included
			expect(results.length).toBeGreaterThanOrEqual(2); // user1 has 2 repos
			expect(results.some((repo) => repo.owner.login === 'user1')).toBe(true);

			// More specific test: exact match should prioritize user1 repos
			const user1Repos = results.filter((repo) => repo.owner.login === 'user1');
			expect(user1Repos.length).toBe(2);
		});

		it('should search by language', () => {
			const results = searchRepositories(mockRepos, 'TypeScript');

			expect(results.length).toBeGreaterThan(0);
			expect(results.some((repo) => repo.language === 'TypeScript')).toBe(true);
		});

		it('should return empty array for no matches', () => {
			const results = searchRepositories(mockRepos, 'nonexistent-technology');

			expect(results).toEqual([]);
		});

		it('should apply sorting to search results', () => {
			const results = searchRepositories(mockRepos, 'user1', 'stars');

			// user1 has typescript-utils (2000 stars) and awesome-react (1500 stars)
			expect(results[0].name).toBe('typescript-utils');
			expect(results[1].name).toBe('awesome-react');
		});

		it('should handle case-insensitive search', () => {
			const upperCaseResults = searchRepositories(mockRepos, 'REACT');
			const lowerCaseResults = searchRepositories(mockRepos, 'react');

			expect(upperCaseResults.length).toBe(lowerCaseResults.length);
		});

		it('should respect minimum match length', () => {
			// Single character searches should return empty (minMatchCharLength: 2)
			const results = searchRepositories(mockRepos, 'r');

			expect(results).toEqual([]);
		});

		it('should handle special characters in search', () => {
			const results = searchRepositories(mockRepos, 'vue.js');

			// Should still find vue-related repos despite the dot
			expect(results.length).toBeGreaterThan(0);
		});
	});

	describe('Edge cases', () => {
		it('should handle null descriptions', () => {
			const reposWithNullDesc: Repository[] = [
				{
					...mockRepos[0],
					description: null
				}
			];

			const results = searchRepositories(reposWithNullDesc, 'awesome');

			// Should still search by name even with null description
			expect(results.length).toBeGreaterThan(0);
		});

		it('should handle null language', () => {
			const reposWithNullLang: Repository[] = [
				{
					...mockRepos[0],
					language: null
				}
			];

			const results = searchRepositories(reposWithNullLang, 'react');

			expect(results.length).toBeGreaterThan(0);
		});

		it('should handle very long search terms', () => {
			const longSearchTerm = 'a'.repeat(1000);
			const results = searchRepositories(mockRepos, longSearchTerm);

			expect(results).toEqual([]);
		});

		it('should handle Unicode characters', () => {
			const unicodeRepos: Repository[] = [
				{
					...mockRepos[0],
					name: 'awesome-项目',
					description: 'A project with 中文 characters'
				}
			];

			const results = searchRepositories(unicodeRepos, '项目');

			expect(results.length).toBeGreaterThan(0);
		});
	});
});

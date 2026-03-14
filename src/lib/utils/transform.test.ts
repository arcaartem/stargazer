import { describe, it, expect, vi, afterEach } from 'vitest';
import { transformGitHubRepo, stripMarkdownForSearch } from './transform';
import type { GitHubStarResponse } from '$lib/types';

const sampleApiResponse: GitHubStarResponse = {
	starred_at: '2024-03-14T12:00:00Z',
	repo: {
		id: 12345,
		node_id: 'MDEwOlJlcG9zaXRvcnkxMjM0NQ==',
		name: 'awesome-project',
		full_name: 'octocat/awesome-project',
		description: 'An awesome project',
		owner: {
			login: 'octocat',
			avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
			type: 'User'
		},
		html_url: 'https://github.com/octocat/awesome-project',
		homepage: 'https://awesome.dev',
		git_url: 'git://github.com/octocat/awesome-project.git',
		ssh_url: 'git@github.com:octocat/awesome-project.git',
		clone_url: 'https://github.com/octocat/awesome-project.git',
		language: 'TypeScript',
		topics: ['svelte', 'typescript'],
		license: {
			spdx_id: 'MIT',
			name: 'MIT License',
			url: 'https://api.github.com/licenses/mit'
		},
		archived: false,
		fork: false,
		is_template: false,
		private: false,
		stargazers_count: 1234,
		watchers_count: 100,
		forks_count: 50,
		open_issues_count: 10,
		size: 5000,
		created_at: '2023-01-01T00:00:00Z',
		updated_at: '2024-03-14T00:00:00Z',
		pushed_at: '2024-03-13T00:00:00Z',
		has_issues: true,
		has_projects: true,
		has_wiki: true,
		has_pages: false,
		has_discussions: false,
		has_downloads: true,
		default_branch: 'main'
	}
};

describe('transformGitHubRepo', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('transforms API response to StarredRepo', () => {
		vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-03-14T12:00:00.000Z');
		const result = transformGitHubRepo(sampleApiResponse, '# README');

		expect(result.id).toBe(12345);
		expect(result.name).toBe('awesome-project');
		expect(result.fullName).toBe('octocat/awesome-project');
		expect(result.description).toBe('An awesome project');
		expect(result.readme).toBe('# README');
		expect(result.ownerLogin).toBe('octocat');
		expect(result.ownerType).toBe('User');
		expect(result.language).toBe('TypeScript');
		expect(result.topics).toEqual(['svelte', 'typescript']);
		expect(result.license).toBe('MIT');
		expect(result.licenseName).toBe('MIT License');
		expect(result.stargazersCount).toBe(1234);
		expect(result.starredAt).toBe('2024-03-14T12:00:00Z');
		expect(result.lastSyncedAt).toBe('2024-03-14T12:00:00.000Z');
	});

	it('handles missing license', () => {
		const noLicense = { ...sampleApiResponse, repo: { ...sampleApiResponse.repo, license: null } };
		const result = transformGitHubRepo(noLicense);
		expect(result.license).toBeNull();
		expect(result.licenseName).toBeNull();
		expect(result.licenseUrl).toBeNull();
	});

	it('defaults readme to empty string', () => {
		const result = transformGitHubRepo(sampleApiResponse);
		expect(result.readme).toBe('');
	});

	it('handles null description', () => {
		const noDesc = { ...sampleApiResponse, repo: { ...sampleApiResponse.repo, description: null } };
		const result = transformGitHubRepo(noDesc);
		expect(result.description).toBeNull();
	});
});

describe('stripMarkdownForSearch', () => {
	it('strips code blocks', () => {
		expect(stripMarkdownForSearch('hello ```code``` world')).toBe('hello world');
	});

	it('strips inline code', () => {
		expect(stripMarkdownForSearch('hello `code` world')).toBe('hello world');
	});

	it('strips images', () => {
		expect(stripMarkdownForSearch('hello ![alt](url) world')).toBe('hello world');
	});

	it('keeps link text', () => {
		expect(stripMarkdownForSearch('hello [click here](url) world')).toBe('hello click here world');
	});

	it('strips headings', () => {
		expect(stripMarkdownForSearch('# Hello\n## World')).toBe('Hello World');
	});

	it('strips emphasis', () => {
		expect(stripMarkdownForSearch('**bold** and *italic*')).toBe('bold and italic');
	});

	it('strips HTML tags', () => {
		expect(stripMarkdownForSearch('hello <b>bold</b> world')).toBe('hello bold world');
	});

	it('returns empty string for empty input', () => {
		expect(stripMarkdownForSearch('')).toBe('');
	});
});

import type { GitHubStarResponse } from '../../src/lib/types';

export function createMockStarResponse(
	overrides: Partial<{
		id: number;
		name: string;
		fullName: string;
		description: string;
		language: string;
		topics: string[];
		stargazersCount: number;
		starredAt: string;
	}> = {}
): GitHubStarResponse {
	const id = overrides.id ?? 1;
	const name = overrides.name ?? `repo-${id}`;
	const fullName = overrides.fullName ?? `owner/${name}`;

	return {
		starred_at: overrides.starredAt ?? '2024-01-01T00:00:00Z',
		repo: {
			id,
			node_id: `node-${id}`,
			name,
			full_name: fullName,
			description: overrides.description ?? `Description for ${name}`,
			owner: {
				login: fullName.split('/')[0],
				avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
				type: 'User'
			},
			html_url: `https://github.com/${fullName}`,
			homepage: null,
			git_url: `git://github.com/${fullName}.git`,
			ssh_url: `git@github.com:${fullName}.git`,
			clone_url: `https://github.com/${fullName}.git`,
			language: overrides.language ?? 'TypeScript',
			topics: overrides.topics ?? [],
			license: { spdx_id: 'MIT', name: 'MIT License', url: null },
			archived: false,
			fork: false,
			is_template: false,
			private: false,
			stargazers_count: overrides.stargazersCount ?? 100,
			watchers_count: 50,
			forks_count: 10,
			open_issues_count: 5,
			size: 1000,
			created_at: '2023-01-01T00:00:00Z',
			updated_at: '2024-03-01T00:00:00Z',
			pushed_at: '2024-02-28T00:00:00Z',
			has_issues: true,
			has_projects: true,
			has_wiki: true,
			has_pages: false,
			has_discussions: false,
			has_downloads: true,
			default_branch: 'main'
		}
	};
}

export function createMockStarredRepos(count: number): GitHubStarResponse[] {
	const languages = ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust'];
	return Array.from({ length: count }, (_, i) =>
		createMockStarResponse({
			id: i + 1,
			name: `repo-${i + 1}`,
			fullName: `owner/repo-${i + 1}`,
			language: languages[i % languages.length],
			stargazersCount: (count - i) * 10,
			topics: [`topic-${i % 3}`]
		})
	);
}

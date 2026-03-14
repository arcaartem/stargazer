import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import RepoCard from './RepoCard.svelte';
import type { StarredRepo } from '$lib/types';

vi.mock('$lib/utils/formatting', () => ({
	formatNumber: (n: number) => String(n),
	formatRelativeDate: () => '2d ago'
}));

function makeRepo(overrides: Partial<StarredRepo> = {}): StarredRepo {
	return {
		id: 1,
		nodeId: 'n1',
		name: 'test-repo',
		fullName: 'owner/test-repo',
		description: 'A test repo',
		readme: '',
		ownerLogin: 'owner',
		ownerAvatarUrl: '',
		ownerType: 'User',
		htmlUrl: '',
		homepageUrl: null,
		gitUrl: '',
		sshUrl: '',
		cloneUrl: '',
		language: 'TypeScript',
		topics: ['svelte', 'web'],
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
		licenseUrl: null,
		lastSyncedAt: '2024-03-14T00:00:00Z',
		...overrides
	};
}

describe('RepoCard', () => {
	it('renders repo name', () => {
		const { getByText } = render(RepoCard, { props: { repo: makeRepo() } });
		expect(getByText('owner/test-repo')).toBeTruthy();
	});

	it('renders description', () => {
		const { getByText } = render(RepoCard, { props: { repo: makeRepo() } });
		expect(getByText('A test repo')).toBeTruthy();
	});

	it('renders language', () => {
		const { getByText } = render(RepoCard, { props: { repo: makeRepo() } });
		expect(getByText('TypeScript')).toBeTruthy();
	});

	it('renders topics as badges', () => {
		const { getByText } = render(RepoCard, { props: { repo: makeRepo() } });
		expect(getByText('svelte')).toBeTruthy();
		expect(getByText('web')).toBeTruthy();
	});

	it('handles missing description', () => {
		const { queryByText } = render(RepoCard, {
			props: { repo: makeRepo({ description: null }) }
		});
		expect(queryByText('A test repo')).toBeNull();
	});

	it('handles missing language', () => {
		const { queryByText } = render(RepoCard, {
			props: { repo: makeRepo({ language: null }) }
		});
		expect(queryByText('TypeScript')).toBeNull();
	});

	it('limits topics to 5 with overflow badge', () => {
		const topics = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
		const { getByText } = render(RepoCard, {
			props: { repo: makeRepo({ topics }) }
		});
		expect(getByText('+2')).toBeTruthy();
	});
});

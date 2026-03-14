import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performSync } from './sync';
import type { SyncProgress, AppSettings } from '$lib/types';

vi.mock('./github', () => ({
	fetchStarredRepos: vi.fn(),
	fetchReadmesBatch: vi.fn()
}));

vi.mock('./search', () => ({
	indexAll: vi.fn(),
	persistToIndexedDB: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('./settings', () => ({
	loadSettings: vi.fn(),
	saveSettings: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('$lib/utils/transform', () => ({
	transformGitHubRepo: vi.fn((response, readme) => ({
		id: response.repo.id,
		name: response.repo.name,
		fullName: `${response.repo.owner.login}/${response.repo.name}`,
		readme: readme || '',
		ownerLogin: response.repo.owner.login,
		starredAt: response.starred_at
	}))
}));

import { fetchStarredRepos, fetchReadmesBatch } from './github';
import { indexAll, persistToIndexedDB } from './search';
import { loadSettings, saveSettings } from './settings';

const mockSettings: AppSettings = {
	githubUsername: 'octocat',
	githubToken: 'ghp_test123456',
	lastSyncedAt: null,
	repoCount: 0,
	readmeCount: 0
};

const mockStarResponse = [
	{
		starred_at: '2024-01-01T00:00:00Z',
		repo: { id: 1, name: 'repo1', owner: { login: 'octocat', avatar_url: '', type: 'User' } }
	}
];

describe('performSync', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadSettings).mockResolvedValue(mockSettings);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		vi.mocked(fetchStarredRepos).mockResolvedValue(mockStarResponse as any);
		vi.mocked(fetchReadmesBatch).mockResolvedValue(new Map([['octocat/repo1', '# README']]));
	});

	it('completes full sync flow', async () => {
		const progressUpdates: SyncProgress[] = [];
		const result = await performSync((p) => progressUpdates.push({ ...p }));

		expect(result.repoCount).toBe(1);
		expect(result.readmeCount).toBe(1);
		expect(fetchStarredRepos).toHaveBeenCalledWith(
			'octocat',
			'ghp_test123456',
			expect.any(Function)
		);
		expect(indexAll).toHaveBeenCalled();
		expect(persistToIndexedDB).toHaveBeenCalled();
		expect(saveSettings).toHaveBeenCalled();
	});

	it('reports progress through phases', async () => {
		const phases: string[] = [];
		await performSync((p) => phases.push(p.phase));

		expect(phases).toContain('fetching-repos');
		expect(phases).toContain('fetching-readmes');
		expect(phases).toContain('indexing');
		expect(phases).toContain('persisting');
		expect(phases).toContain('done');
	});

	it('throws if username is missing', async () => {
		vi.mocked(loadSettings).mockResolvedValue({ ...mockSettings, githubUsername: '' });

		await expect(performSync(() => {})).rejects.toThrow('GitHub username and token are required');
	});

	it('throws if token is missing', async () => {
		vi.mocked(loadSettings).mockResolvedValue({ ...mockSettings, githubToken: '' });

		await expect(performSync(() => {})).rejects.toThrow('GitHub username and token are required');
	});

	it('reports error phase on failure', async () => {
		vi.mocked(fetchStarredRepos).mockRejectedValue(new Error('Network error'));

		const phases: string[] = [];
		await expect(performSync((p) => phases.push(p.phase))).rejects.toThrow('Network error');
		expect(phases).toContain('error');
	});

	it('preserves existing data on failure (does not call indexAll)', async () => {
		vi.mocked(fetchStarredRepos).mockRejectedValue(new Error('fail'));

		try {
			await performSync(() => {});
		} catch {
			// expected
		}
		expect(indexAll).not.toHaveBeenCalled();
	});
});

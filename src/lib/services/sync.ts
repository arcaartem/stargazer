import type { SyncProgress, AppSettings, StarredRepo } from '$lib/types';
import { fetchStarredRepos, fetchReadmesBatch } from './github';
import { indexAll, persistToIndexedDB } from './search';
import { loadSettings, saveSettings } from './settings';
import { transformGitHubRepo } from '$lib/utils/transform';

export async function performSync(
	onProgress: (progress: SyncProgress) => void
): Promise<{ repoCount: number; readmeCount: number }> {
	const settings = await loadSettings();
	const { githubUsername, githubToken } = settings;

	if (!githubUsername || !githubToken) {
		throw new Error('GitHub username and token are required. Configure them in Settings.');
	}

	try {
		// Phase 1: Fetch starred repos metadata
		onProgress({
			phase: 'fetching-repos',
			current: 0,
			total: 0,
			message: 'Fetching repositories...'
		});

		const starResponses = await fetchStarredRepos(githubUsername, githubToken, (page) => {
			onProgress({
				phase: 'fetching-repos',
				current: page,
				total: 0,
				message: `Fetching repositories... page ${page}`
			});
		});

		// Phase 2: Fetch READMEs
		const repoList = starResponses.map((r) => ({
			owner: r.repo.owner.login,
			repo: r.repo.name
		}));

		onProgress({
			phase: 'fetching-readmes',
			current: 0,
			total: repoList.length,
			message: `Fetching READMEs... 0/${repoList.length}`
		});

		const readmes = await fetchReadmesBatch(repoList, githubToken, (completed, total) => {
			onProgress({
				phase: 'fetching-readmes',
				current: completed,
				total,
				message: `Fetching READMEs... ${completed}/${total}`
			});
		});

		// Phase 3: Transform and index
		onProgress({
			phase: 'indexing',
			current: 0,
			total: starResponses.length,
			message: 'Indexing repositories...'
		});

		const repos: StarredRepo[] = starResponses.map((response) => {
			const key = `${response.repo.owner.login}/${response.repo.name}`;
			const readme = readmes.get(key) ?? '';
			return transformGitHubRepo(response, readme);
		});

		indexAll(repos);

		// Phase 4: Persist to IndexedDB
		onProgress({ phase: 'persisting', current: 0, total: 0, message: 'Saving data...' });
		await persistToIndexedDB();

		// Phase 5: Update settings
		const readmeCount = Array.from(readmes.values()).filter((r) => r.length > 0).length;
		const updatedSettings: AppSettings = {
			...settings,
			lastSyncedAt: new Date().toISOString(),
			repoCount: repos.length,
			readmeCount
		};
		await saveSettings(updatedSettings);

		onProgress({
			phase: 'done',
			current: repos.length,
			total: repos.length,
			message: 'Sync complete!'
		});

		return { repoCount: repos.length, readmeCount };
	} catch (error) {
		onProgress({
			phase: 'error',
			current: 0,
			total: 0,
			message: error instanceof Error ? error.message : 'Sync failed'
		});
		throw error;
	}
}

import type { SyncProgress, AppSettings, StarredRepo } from '$lib/types';
import { fetchStarredRepos, fetchReadme } from './github';
import { RateLimitThrottle } from './rate-limiter';
import { indexAll, persistToIndexedDB } from './search';
import { loadSettings, saveSettings } from './settings';
import { transformGitHubRepo } from '$lib/utils/transform';

export async function performSync(
	onProgress: (progress: SyncProgress) => void,
	signal?: AbortSignal
): Promise<{ repoCount: number; readmeCount: number }> {
	const settings = await loadSettings();
	const { githubUsername, githubToken } = settings;

	if (!githubUsername || !githubToken) {
		throw new Error('GitHub username and token are required. Configure them in Settings.');
	}

	try {
		const throttle = new RateLimitThrottle({ signal });

		onProgress({
			phase: 'fetching-repos',
			current: 0,
			total: 0,
			message: 'Fetching repositories...'
		});

		const starResponses = await fetchStarredRepos(githubUsername, githubToken, {
			onProgress: (page) => {
				onProgress({
					phase: 'fetching-repos',
					current: page,
					total: 0,
					message: `Fetching repositories... page ${page}`
				});
			},
			signal,
			onResponse: (r) => throttle.adapt(r),
			enqueue: (fn) => throttle.add(fn)
		});

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

		let completed = 0;
		const readmes = new Map<string, string>();
		const promises = repoList.map(({ owner, repo }) =>
			throttle.add(async () => {
				try {
					const content = await fetchReadme(owner, repo, githubToken, {
						signal,
						onResponse: (r) => throttle.adapt(r)
					});
					readmes.set(`${owner}/${repo}`, content);
				} catch {
					readmes.set(`${owner}/${repo}`, '');
				}
				completed++;
				onProgress({
					phase: 'fetching-readmes',
					current: completed,
					total: repoList.length,
					message: `Fetching READMEs... ${completed}/${repoList.length}`
				});
			})
		);
		await Promise.all(promises);

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

		onProgress({ phase: 'persisting', current: 0, total: 0, message: 'Saving data...' });
		await persistToIndexedDB();

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
		if (signal?.aborted) {
			onProgress({ phase: 'idle', current: 0, total: 0, message: '' });
			return { repoCount: 0, readmeCount: 0 };
		}
		onProgress({
			phase: 'error',
			current: 0,
			total: 0,
			message: error instanceof Error ? error.message : 'Sync failed'
		});
		throw error;
	}
}

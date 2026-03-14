import type { GitHubStarResponse } from '$lib/types';

const GITHUB_API = 'https://api.github.com';
const PER_PAGE = 100;
const README_BATCH_SIZE = 10;
const README_BATCH_DELAY_MS = 1000;

function getHeaders(token: string, accept?: string): HeadersInit {
	return {
		Authorization: `Bearer ${token}`,
		Accept: accept ?? 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28'
	};
}

function checkRateLimit(response: Response): void {
	const remaining = response.headers.get('X-RateLimit-Remaining');
	const reset = response.headers.get('X-RateLimit-Reset');
	if (remaining === '0' && reset) {
		const resetDate = new Date(parseInt(reset) * 1000);
		throw new Error(`GitHub API rate limit exceeded. Resets at ${resetDate.toLocaleTimeString()}`);
	}
}

function parseLinkHeader(header: string | null): string | null {
	if (!header) return null;
	const match = header.match(/<([^>]+)>;\s*rel="next"/);
	return match ? match[1] : null;
}

export async function fetchStarredRepos(
	username: string,
	token: string,
	onProgress?: (page: number) => void
): Promise<GitHubStarResponse[]> {
	const allRepos: GitHubStarResponse[] = [];
	let url: string | null =
		`${GITHUB_API}/users/${encodeURIComponent(username)}/starred?per_page=${PER_PAGE}`;
	let page = 1;

	while (url) {
		const response = await fetch(url, {
			headers: getHeaders(token, 'application/vnd.github.star+json')
		});

		checkRateLimit(response);

		if (!response.ok) {
			throw new Error(`Failed to fetch starred repos: ${response.status} ${response.statusText}`);
		}

		const data: GitHubStarResponse[] = await response.json();
		allRepos.push(...data);
		onProgress?.(page);

		url = parseLinkHeader(response.headers.get('Link'));
		page++;
	}

	return allRepos;
}

export async function fetchReadme(owner: string, repo: string, token: string): Promise<string> {
	const response = await fetch(
		`${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`,
		{ headers: getHeaders(token, 'application/vnd.github.raw+json') }
	);

	if (response.status === 404) return '';
	checkRateLimit(response);

	if (!response.ok) {
		throw new Error(`Failed to fetch README for ${owner}/${repo}: ${response.status}`);
	}

	return response.text();
}

export async function fetchReadmesBatch(
	repos: Array<{ owner: string; repo: string }>,
	token: string,
	onProgress?: (completed: number, total: number) => void
): Promise<Map<string, string>> {
	const readmes = new Map<string, string>();
	let completed = 0;

	for (let i = 0; i < repos.length; i += README_BATCH_SIZE) {
		const batch = repos.slice(i, i + README_BATCH_SIZE);

		const results = await Promise.all(
			batch.map(async ({ owner, repo }) => {
				try {
					const content = await fetchReadme(owner, repo, token);
					return { key: `${owner}/${repo}`, content };
				} catch {
					return { key: `${owner}/${repo}`, content: '' };
				}
			})
		);

		for (const { key, content } of results) {
			readmes.set(key, content);
		}

		completed += batch.length;
		onProgress?.(completed, repos.length);

		if (i + README_BATCH_SIZE < repos.length) {
			await new Promise((resolve) => setTimeout(resolve, README_BATCH_DELAY_MS));
		}
	}

	return readmes;
}

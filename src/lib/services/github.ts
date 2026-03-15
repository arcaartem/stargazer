import type { GitHubStarResponse } from '$lib/types';

const GITHUB_API = 'https://api.github.com';
const PER_PAGE = 100;

function getHeaders(token: string, accept?: string): HeadersInit {
	return {
		Authorization: `Bearer ${token}`,
		Accept: accept ?? 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28'
	};
}

function parseLastPage(header: string | null): number | null {
	if (!header) return null;
	const match = header.match(/<[^>]+[?&]page=(\d+)[^>]*>;\s*rel="last"/);
	return match ? parseInt(match[1], 10) : null;
}

export async function fetchStarredRepos(
	username: string,
	token: string,
	options?: {
		onProgress?: (page: number) => void;
		signal?: AbortSignal;
		onResponse?: (r: Response) => void;
		enqueue?: <T>(fn: () => Promise<T>) => Promise<T>;
	}
): Promise<GitHubStarResponse[]> {
	const baseUrl = `${GITHUB_API}/users/${encodeURIComponent(username)}/starred?per_page=${PER_PAGE}`;
	const headers = getHeaders(token, 'application/vnd.github.star+json');
	const enqueue = options?.enqueue ?? ((fn) => fn());

	const firstResponse = await fetch(`${baseUrl}&page=1`, {
		headers,
		signal: options?.signal
	});

	options?.onResponse?.(firstResponse);

	if (!firstResponse.ok) {
		throw new Error(
			`Failed to fetch starred repos: ${firstResponse.status} ${firstResponse.statusText}`
		);
	}

	const firstData: GitHubStarResponse[] = await firstResponse.json();
	const allRepos: GitHubStarResponse[] = [...firstData];
	options?.onProgress?.(1);

	const lastPage = parseLastPage(firstResponse.headers.get('Link'));
	if (lastPage && lastPage > 1) {
		let completedPages = 1;
		const pagePromises = Array.from({ length: lastPage - 1 }, (_, i) => {
			const pageNum = i + 2;
			return enqueue(async () => {
				const response = await fetch(`${baseUrl}&page=${pageNum}`, {
					headers,
					signal: options?.signal
				});
				options?.onResponse?.(response);
				if (!response.ok) {
					throw new Error(
						`Failed to fetch starred repos: ${response.status} ${response.statusText}`
					);
				}
				const data: GitHubStarResponse[] = await response.json();
				completedPages++;
				options?.onProgress?.(completedPages);
				return data;
			});
		});

		const results = await Promise.all(pagePromises);
		for (const data of results) {
			allRepos.push(...data);
		}
	}

	return allRepos;
}

export async function fetchReadme(
	owner: string,
	repo: string,
	token: string,
	options?: { signal?: AbortSignal; onResponse?: (r: Response) => void }
): Promise<string> {
	const response = await fetch(
		`${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`,
		{ headers: getHeaders(token, 'application/vnd.github.raw+json'), signal: options?.signal }
	);

	options?.onResponse?.(response);

	if (response.status === 404) return '';

	if (!response.ok) {
		throw new Error(`Failed to fetch README for ${owner}/${repo}: ${response.status}`);
	}

	return response.text();
}

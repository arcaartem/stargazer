import type { Repository } from './types';

export type ProgressCallback = (current: number, total: number) => void;

export class GitHubService {
	private token: string | null = null;

	constructor(token?: string) {
		this.token = token || null;
	}

	setToken(token: string): void {
		this.token = token;
	}

	async fetchAllStarredRepos(
		username: string,
		onProgress: ProgressCallback
	): Promise<Repository[]> {
		if (!this.token) {
			throw new Error('GitHub token required');
		}

		const firstPageResponse = await this.fetchPage(username, 1);
		const linkHeader = firstPageResponse.headers.get('Link');
		const totalPages = this.getLastPage(linkHeader);
		const firstPageData = await firstPageResponse.json();

		onProgress(firstPageData.length, totalPages * 100);
		let allRepos = firstPageData;

		if (totalPages > 1) {
			const pagePromises = Array.from({ length: totalPages - 1 }, (_, i) =>
				this.fetchPage(username, i + 2)
			);

			const responses = await Promise.all(pagePromises);
			const remainingRepos = await Promise.all(
				responses.map(async (response, index) => {
					const repos = await response.json();
					onProgress((index + 2) * 100, totalPages * 100);
					return repos;
				})
			);

			allRepos = [...allRepos, ...remainingRepos.flat()];
		}

		return allRepos;
	}

	private async fetchPage(username: string, page: number): Promise<Response> {
		const response = await fetch(
			`https://api.github.com/users/${username}/starred?page=${page}&per_page=100`,
			{
				headers: {
					Authorization: `token ${this.token}`,
					Accept: 'application/vnd.github.v3+json'
				}
			}
		);

		if (!response.ok) {
			throw new Error(`Failed to fetch page ${page}: ${response.statusText}`);
		}

		return response;
	}

	private getLastPage(linkHeader: string | null): number {
		if (!linkHeader) return 1;
		const matches = linkHeader.match(/<[^>]*[&?]page=(\d+)[^>]*>; rel="last"/);
		return matches ? parseInt(matches[1]) : 1;
	}
}

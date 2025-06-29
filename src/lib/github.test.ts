import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GitHubService } from './github';
import type { Repository } from './types';

// Mock fetch globally
const mockFetch = vi.fn();
(globalThis as typeof globalThis & { fetch: typeof fetch }).fetch = mockFetch;

describe('GitHubService', () => {
	let githubService: GitHubService;
	const mockToken = 'test-token';
	const mockUsername = 'testuser';

	beforeEach(() => {
		githubService = new GitHubService();
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('constructor', () => {
		it('should create instance without token', () => {
			const service = new GitHubService();
			expect(service).toBeInstanceOf(GitHubService);
		});

		it('should create instance with token', () => {
			const service = new GitHubService(mockToken);
			expect(service).toBeInstanceOf(GitHubService);
		});
	});

	describe('setToken', () => {
		it('should set token', () => {
			githubService.setToken(mockToken);
			// Token is private, but we can test it through API calls
			expect(() => githubService.setToken(mockToken)).not.toThrow();
		});
	});

	describe('fetchAllStarredRepos', () => {
		const mockRepo: Repository = {
			id: 1,
			name: 'test-repo',
			description: 'Test repository',
			html_url: 'https://github.com/testuser/test-repo',
			language: 'TypeScript',
			stargazers_count: 100,
			updated_at: '2023-01-01T00:00:00Z',
			owner: {
				login: 'testuser'
			}
		};

		const mockProgressCallback = vi.fn();

		beforeEach(() => {
			githubService.setToken(mockToken);
		});

		it('should throw error when no token is set', async () => {
			const serviceWithoutToken = new GitHubService();

			await expect(
				serviceWithoutToken.fetchAllStarredRepos(mockUsername, mockProgressCallback)
			).rejects.toThrow('GitHub token required');
		});

		it('should fetch single page of starred repos', async () => {
			const mockResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue([mockRepo]),
				headers: {
					get: vi.fn().mockReturnValue(null) // No Link header = single page
				}
			};

			mockFetch.mockResolvedValue(mockResponse);

			const result = await githubService.fetchAllStarredRepos(mockUsername, mockProgressCallback);

			expect(result).toEqual([mockRepo]);
			expect(mockFetch).toHaveBeenCalledWith(
				`https://api.github.com/users/${mockUsername}/starred?page=1&per_page=100`,
				{
					headers: {
						Authorization: `token ${mockToken}`,
						Accept: 'application/vnd.github.v3+json'
					}
				}
			);
			expect(mockProgressCallback).toHaveBeenCalledWith(1, 100);
		});

		it('should fetch multiple pages of starred repos', async () => {
			const mockRepo2 = { ...mockRepo, id: 2, name: 'test-repo-2' };

			// First page response with Link header indicating more pages
			const firstPageResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue([mockRepo]),
				headers: {
					get: vi
						.fn()
						.mockReturnValue(
							'<https://api.github.com/users/testuser/starred?page=2&per_page=100>; rel="last"'
						)
				}
			};

			// Second page response
			const secondPageResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue([mockRepo2])
			};

			mockFetch.mockResolvedValueOnce(firstPageResponse).mockResolvedValueOnce(secondPageResponse);

			const result = await githubService.fetchAllStarredRepos(mockUsername, mockProgressCallback);

			expect(result).toEqual([mockRepo, mockRepo2]);
			expect(mockFetch).toHaveBeenCalledTimes(2);
			expect(mockProgressCallback).toHaveBeenCalledWith(1, 200); // First page
			expect(mockProgressCallback).toHaveBeenCalledWith(200, 200); // Second page
		});

		it('should handle API errors', async () => {
			const mockResponse = {
				ok: false,
				statusText: 'Unauthorized'
			};

			mockFetch.mockResolvedValue(mockResponse);

			await expect(
				githubService.fetchAllStarredRepos(mockUsername, mockProgressCallback)
			).rejects.toThrow('Failed to fetch page 1: Unauthorized');
		});

		it('should handle network errors', async () => {
			mockFetch.mockRejectedValue(new Error('Network error'));

			await expect(
				githubService.fetchAllStarredRepos(mockUsername, mockProgressCallback)
			).rejects.toThrow('Network error');
		});

		it('should parse Link header correctly for multiple pages', async () => {
			const linkHeader =
				'<https://api.github.com/users/testuser/starred?page=2&per_page=100>; rel="next", <https://api.github.com/users/testuser/starred?page=5&per_page=100>; rel="last"';

			const firstPageResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue([mockRepo]),
				headers: {
					get: vi.fn().mockReturnValue(linkHeader)
				}
			};

			// Mock responses for pages 2-5
			const otherPageResponses = Array.from({ length: 4 }, (_, i) => ({
				ok: true,
				json: vi.fn().mockResolvedValue([{ ...mockRepo, id: i + 2 }])
			}));

			mockFetch
				.mockResolvedValueOnce(firstPageResponse)
				.mockResolvedValueOnce(otherPageResponses[0])
				.mockResolvedValueOnce(otherPageResponses[1])
				.mockResolvedValueOnce(otherPageResponses[2])
				.mockResolvedValueOnce(otherPageResponses[3]);

			const result = await githubService.fetchAllStarredRepos(mockUsername, mockProgressCallback);

			expect(result).toHaveLength(5);
			expect(mockFetch).toHaveBeenCalledTimes(5);
		});

		it('should call progress callback with correct values', async () => {
			const mockResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue([mockRepo]),
				headers: {
					get: vi.fn().mockReturnValue(null)
				}
			};

			mockFetch.mockResolvedValue(mockResponse);

			await githubService.fetchAllStarredRepos(mockUsername, mockProgressCallback);

			expect(mockProgressCallback).toHaveBeenCalledWith(1, 100);
		});
	});

	describe('private methods through public interface', () => {
		beforeEach(() => {
			githubService.setToken(mockToken);
		});

		it('should handle missing Link header', async () => {
			const mockResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue([]),
				headers: {
					get: vi.fn().mockReturnValue(null)
				}
			};

			mockFetch.mockResolvedValue(mockResponse);

			const result = await githubService.fetchAllStarredRepos(mockUsername, vi.fn());
			expect(result).toEqual([]);
		});

		it('should handle malformed Link header', async () => {
			const mockResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue([]),
				headers: {
					get: vi.fn().mockReturnValue('invalid-link-header')
				}
			};

			mockFetch.mockResolvedValue(mockResponse);

			const result = await githubService.fetchAllStarredRepos(mockUsername, vi.fn());
			expect(result).toEqual([]);
		});
	});
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchStarredRepos, fetchReadme, fetchReadmesBatch } from './github';

function createMockResponse(
	body: unknown,
	options: { status?: number; headers?: Record<string, string> } = {}
) {
	const { status = 200, headers = {} } = options;
	const headersMap = new Map(
		Object.entries({
			'X-RateLimit-Remaining': '100',
			'X-RateLimit-Reset': '9999999999',
			...headers
		})
	);

	return {
		ok: status >= 200 && status < 300,
		status,
		statusText: status === 200 ? 'OK' : 'Error',
		json: vi.fn().mockResolvedValue(body),
		text: vi.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body)),
		headers: {
			get: (key: string) => headersMap.get(key) ?? null
		}
	} as unknown as Response;
}

describe('fetchStarredRepos', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('fetches a single page of starred repos', async () => {
		const mockData = [{ starred_at: '2024-01-01T00:00:00Z', repo: { id: 1, name: 'repo1' } }];
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createMockResponse(mockData)));

		const result = await fetchStarredRepos('octocat', 'ghp_token123456');
		expect(result).toHaveLength(1);
		expect(result[0].starred_at).toBe('2024-01-01T00:00:00Z');
	});

	it('follows Link header for pagination', async () => {
		const page1 = [{ starred_at: '2024-01-01T00:00:00Z', repo: { id: 1 } }];
		const page2 = [{ starred_at: '2024-01-02T00:00:00Z', repo: { id: 2 } }];

		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				createMockResponse(page1, {
					headers: { Link: '<https://api.github.com/next?page=2>; rel="next"' }
				})
			)
			.mockResolvedValueOnce(createMockResponse(page2));

		vi.stubGlobal('fetch', fetchMock);

		const result = await fetchStarredRepos('octocat', 'ghp_token123456');
		expect(result).toHaveLength(2);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('calls progress callback with page number', async () => {
		const mockData = [{ starred_at: '2024-01-01T00:00:00Z', repo: { id: 1 } }];
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createMockResponse(mockData)));

		const onProgress = vi.fn();
		await fetchStarredRepos('octocat', 'ghp_token123456', onProgress);
		expect(onProgress).toHaveBeenCalledWith(1);
	});

	it('throws on non-OK response', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createMockResponse({}, { status: 401 })));

		await expect(fetchStarredRepos('octocat', 'ghp_token123456')).rejects.toThrow(
			'Failed to fetch starred repos: 401'
		);
	});

	it('throws on rate limit exceeded', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				createMockResponse([], {
					headers: { 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': '1710000000' }
				})
			)
		);

		await expect(fetchStarredRepos('octocat', 'ghp_token123456')).rejects.toThrow(
			'rate limit exceeded'
		);
	});
});

describe('fetchReadme', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('fetches README content', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createMockResponse('# Hello World')));

		const result = await fetchReadme('octocat', 'repo', 'ghp_token123456');
		expect(result).toBe('# Hello World');
	});

	it('returns empty string on 404', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createMockResponse('', { status: 404 })));

		const result = await fetchReadme('octocat', 'repo', 'ghp_token123456');
		expect(result).toBe('');
	});

	it('throws on other errors', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createMockResponse('', { status: 500 })));

		await expect(fetchReadme('octocat', 'repo', 'ghp_token123456')).rejects.toThrow(
			'Failed to fetch README'
		);
	});
});

describe('fetchReadmesBatch', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('fetches READMEs for multiple repos', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createMockResponse('# README')));

		const repos = [
			{ owner: 'a', repo: 'repo1' },
			{ owner: 'b', repo: 'repo2' }
		];
		const result = await fetchReadmesBatch(repos, 'ghp_token123456');
		expect(result.size).toBe(2);
		expect(result.get('a/repo1')).toBe('# README');
		expect(result.get('b/repo2')).toBe('# README');
	});

	it('calls progress callback', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createMockResponse('# README')));

		const repos = [{ owner: 'a', repo: 'repo1' }];
		const onProgress = vi.fn();
		await fetchReadmesBatch(repos, 'ghp_token123456', onProgress);
		expect(onProgress).toHaveBeenCalledWith(1, 1);
	});

	it('continues on individual README fetch failure', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(createMockResponse('', { status: 500 }))
			.mockResolvedValueOnce(createMockResponse('# Works'));

		vi.stubGlobal('fetch', fetchMock);

		const repos = [
			{ owner: 'a', repo: 'fail' },
			{ owner: 'b', repo: 'ok' }
		];
		const result = await fetchReadmesBatch(repos, 'ghp_token123456');
		expect(result.size).toBe(2);
		expect(result.get('a/fail')).toBe('');
		expect(result.get('b/ok')).toBe('# Works');
	});
});

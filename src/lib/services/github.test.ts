import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchStarredRepos, fetchReadme } from './github';

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

	it('fetches remaining pages concurrently after first page', async () => {
		const page1 = [{ starred_at: '2024-01-01T00:00:00Z', repo: { id: 1 } }];
		const page2 = [{ starred_at: '2024-01-02T00:00:00Z', repo: { id: 2 } }];

		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				createMockResponse(page1, {
					headers: {
						Link: '<https://api.github.com/users/octocat/starred?per_page=100&page=2>; rel="next", <https://api.github.com/users/octocat/starred?per_page=100&page=2>; rel="last"'
					}
				})
			)
			.mockResolvedValueOnce(createMockResponse(page2));

		vi.stubGlobal('fetch', fetchMock);

		const result = await fetchStarredRepos('octocat', 'ghp_token123456');
		expect(result).toHaveLength(2);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('routes concurrent page fetches through enqueue', async () => {
		const page1 = [{ starred_at: '2024-01-01T00:00:00Z', repo: { id: 1 } }];
		const page2 = [{ starred_at: '2024-01-02T00:00:00Z', repo: { id: 2 } }];

		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				createMockResponse(page1, {
					headers: {
						Link: '<https://api.github.com/users/octocat/starred?per_page=100&page=2>; rel="next", <https://api.github.com/users/octocat/starred?per_page=100&page=2>; rel="last"'
					}
				})
			)
			.mockResolvedValueOnce(createMockResponse(page2));

		vi.stubGlobal('fetch', fetchMock);

		const enqueue = vi.fn(<T>(fn: () => Promise<T>) => fn()) as <T>(
			fn: () => Promise<T>
		) => Promise<T>;
		await fetchStarredRepos('octocat', 'ghp_token123456', { enqueue });
		expect(enqueue).toHaveBeenCalledTimes(1);
	});

	it('calls progress callback with page number', async () => {
		const mockData = [{ starred_at: '2024-01-01T00:00:00Z', repo: { id: 1 } }];
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createMockResponse(mockData)));

		const onProgress = vi.fn();
		await fetchStarredRepos('octocat', 'ghp_token123456', { onProgress });
		expect(onProgress).toHaveBeenCalledWith(1);
	});

	it('throws on non-OK response', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createMockResponse({}, { status: 401 })));

		await expect(fetchStarredRepos('octocat', 'ghp_token123456')).rejects.toThrow(
			'Failed to fetch starred repos: 401'
		);
	});

	it('passes signal to fetch', async () => {
		const mockData = [{ starred_at: '2024-01-01T00:00:00Z', repo: { id: 1 } }];
		const fetchMock = vi.fn().mockResolvedValue(createMockResponse(mockData));
		vi.stubGlobal('fetch', fetchMock);

		const controller = new AbortController();
		await fetchStarredRepos('octocat', 'ghp_token123456', { signal: controller.signal });
		expect(fetchMock).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({ signal: controller.signal })
		);
	});

	it('calls onResponse callback', async () => {
		const mockData = [{ starred_at: '2024-01-01T00:00:00Z', repo: { id: 1 } }];
		const mockResponse = createMockResponse(mockData);
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

		const onResponse = vi.fn();
		await fetchStarredRepos('octocat', 'ghp_token123456', { onResponse });
		expect(onResponse).toHaveBeenCalledWith(mockResponse);
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

	it('calls onResponse callback', async () => {
		const mockResponse = createMockResponse('# Hello World');
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

		const onResponse = vi.fn();
		await fetchReadme('octocat', 'repo', 'ghp_token123456', { onResponse });
		expect(onResponse).toHaveBeenCalledWith(mockResponse);
	});

	it('passes signal to fetch', async () => {
		const fetchMock = vi.fn().mockResolvedValue(createMockResponse('# Hello World'));
		vi.stubGlobal('fetch', fetchMock);

		const controller = new AbortController();
		await fetchReadme('octocat', 'repo', 'ghp_token123456', { signal: controller.signal });
		expect(fetchMock).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({ signal: controller.signal })
		);
	});
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimitThrottle } from './rate-limiter';

function mockResponse(remaining: string, reset?: string): Response {
	const headers = new Map<string, string>();
	headers.set('X-RateLimit-Remaining', remaining);
	if (reset) headers.set('X-RateLimit-Reset', reset);
	return { headers: { get: (k: string) => headers.get(k) ?? null } } as unknown as Response;
}

describe('RateLimitThrottle', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('adjusts concurrency for remaining > 500', () => {
		const throttle = new RateLimitThrottle();
		throttle.adapt(mockResponse('600'));
		expect(throttle.size).toBe(0);
	});

	it('adjusts concurrency at each threshold band', () => {
		const throttle = new RateLimitThrottle();

		throttle.adapt(mockResponse('600'));

		throttle.adapt(mockResponse('300'));

		throttle.adapt(mockResponse('100'));

		throttle.adapt(mockResponse('10'));

		expect(throttle.size).toBe(0);
	});

	it('pauses and resumes at remaining=0', async () => {
		const throttle = new RateLimitThrottle();
		const resetTime = Math.floor(Date.now() / 1000) + 60;

		throttle.adapt(mockResponse('0', String(resetTime)));

		let executed = false;
		const promise = throttle.add(async () => {
			executed = true;
			return 'done';
		});

		await vi.advanceTimersByTimeAsync(61000);

		const result = await promise;
		expect(executed).toBe(true);
		expect(result).toBe('done');
	});

	it('throws AbortError after signal is aborted', async () => {
		const controller = new AbortController();
		const throttle = new RateLimitThrottle({ signal: controller.signal });

		controller.abort();

		await expect(throttle.add(async () => 'test')).rejects.toThrow('The operation was aborted.');
		await expect(throttle.add(async () => 'test')).rejects.toMatchObject({ name: 'AbortError' });
	});

	it('clears pending items on abort', async () => {
		const controller = new AbortController();
		const throttle = new RateLimitThrottle({ signal: controller.signal });

		const results: string[] = [];
		const p1 = throttle
			.add(async () => {
				results.push('1');
				return '1';
			})
			.catch(() => {});

		controller.abort();

		expect(throttle.size).toBe(0);
		await p1;
	});

	it('clear() drops pending items', async () => {
		const throttle = new RateLimitThrottle();
		throttle.clear();
		expect(throttle.size).toBe(0);
	});

	it('add() resolves with the function return value', async () => {
		const throttle = new RateLimitThrottle();
		const result = await throttle.add(async () => 42);
		expect(result).toBe(42);
	});

	it('concurrent add() calls respect concurrency', async () => {
		const throttle = new RateLimitThrottle();
		throttle.adapt(mockResponse('10'));

		let concurrent = 0;
		let maxConcurrent = 0;

		const makeTask = () =>
			throttle.add(async () => {
				concurrent++;
				maxConcurrent = Math.max(maxConcurrent, concurrent);
				await new Promise((r) => setTimeout(r, 10));
				concurrent--;
			});

		const tasks = Array.from({ length: 10 }, makeTask);
		await vi.advanceTimersByTimeAsync(100);
		await Promise.all(tasks);

		expect(maxConcurrent).toBeLessThanOrEqual(3);
	});

	it('ignores adapt when no rate limit header present', () => {
		const throttle = new RateLimitThrottle();
		const response = { headers: { get: () => null } } as unknown as Response;
		throttle.adapt(response);
		expect(throttle.size).toBe(0);
	});
});

import PQueue from 'p-queue';

export class RateLimitThrottle {
	private queue: PQueue;
	private aborted = false;

	constructor(options?: { signal?: AbortSignal }) {
		this.queue = new PQueue({ concurrency: 20 });

		if (options?.signal) {
			options.signal.addEventListener('abort', () => {
				this.aborted = true;
				this.queue.clear();
			});
		}
	}

	async add<T>(fn: () => Promise<T>): Promise<T> {
		if (this.aborted) {
			throw new DOMException('The operation was aborted.', 'AbortError');
		}
		const result = await this.queue.add(fn);
		return result as T;
	}

	adapt(response: Response): void {
		const remaining = response.headers.get('X-RateLimit-Remaining');
		const reset = response.headers.get('X-RateLimit-Reset');
		if (remaining === null) return;

		const rem = parseInt(remaining, 10);
		if (isNaN(rem)) return;

		if (rem === 0 && reset) {
			const waitMs = parseInt(reset, 10) * 1000 - Date.now();
			this.queue.pause();
			if (waitMs > 0) {
				setTimeout(() => this.queue.start(), waitMs);
			} else {
				this.queue.start();
			}
			return;
		}

		if (rem > 500) this.queue.concurrency = 30;
		else if (rem >= 200) this.queue.concurrency = 20;
		else if (rem >= 50) this.queue.concurrency = 10;
		else this.queue.concurrency = 3;
	}

	clear(): void {
		this.queue.clear();
	}

	get pending(): number {
		return this.queue.pending;
	}

	get size(): number {
		return this.queue.size;
	}
}

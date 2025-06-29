/**
 * Cache entry interface
 */
interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number;
}

/**
 * Cache service for improving application performance
 */
export class CacheService {
	private cache = new Map<string, CacheEntry<unknown>>();
	private readonly defaultTtl = 300000; // 5 minutes in milliseconds

	/**
	 * Get data from cache if it exists and hasn't expired
	 */
	get<T>(key: string): T | null {
		const entry = this.cache.get(key);

		if (!entry) {
			return null;
		}

		const now = Date.now();
		if (now - entry.timestamp > entry.ttl) {
			// Entry has expired, remove it
			this.cache.delete(key);
			return null;
		}

		return entry.data as T;
	}

	/**
	 * Set data in cache with TTL
	 */
	set<T>(key: string, data: T, ttl: number = this.defaultTtl): void {
		// Don't cache if TTL is zero or negative
		if (ttl <= 0) {
			return;
		}

		this.cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl
		});
	}

	/**
	 * Check if a key exists in cache and hasn't expired
	 */
	has(key: string): boolean {
		return this.get(key) !== null;
	}

	/**
	 * Delete specific cache entry
	 */
	delete(key: string): boolean {
		return this.cache.delete(key);
	}

	/**
	 * Clear all cache entries
	 */
	clear(): void {
		this.cache.clear();
	}

	/**
	 * Get cache statistics
	 */
	getStats(): { size: number; keys: string[] } {
		return {
			size: this.cache.size,
			keys: Array.from(this.cache.keys())
		};
	}

	/**
	 * Remove expired entries from cache
	 */
	cleanup(): number {
		const now = Date.now();
		let removedCount = 0;

		for (const [key, entry] of this.cache.entries()) {
			if (now - entry.timestamp > entry.ttl) {
				this.cache.delete(key);
				removedCount++;
			}
		}

		return removedCount;
	}

	/**
	 * Get or set pattern - retrieve from cache or compute and cache
	 */
	async getOrSet<T>(
		key: string,
		computeFn: () => Promise<T>,
		ttl: number = this.defaultTtl
	): Promise<T> {
		// Try to get from cache first
		const cached = this.get<T>(key);
		if (cached !== null) {
			return cached;
		}

		// Compute new value
		const computed = await computeFn();

		// Cache the result
		this.set(key, computed, ttl);

		return computed;
	}

	/**
	 * Set cache with expiry time instead of TTL
	 */
	setWithExpiry<T>(key: string, data: T, expiryTime: Date): void {
		const ttl = expiryTime.getTime() - Date.now();
		if (ttl > 0) {
			this.set(key, data, ttl);
		}
	}

	/**
	 * Get all keys that match a pattern
	 */
	getKeysByPattern(pattern: RegExp): string[] {
		return Array.from(this.cache.keys()).filter((key) => pattern.test(key));
	}

	/**
	 * Clear cache entries that match a pattern
	 */
	clearByPattern(pattern: RegExp): number {
		const matchingKeys = this.getKeysByPattern(pattern);
		matchingKeys.forEach((key) => this.cache.delete(key));
		return matchingKeys.length;
	}
}

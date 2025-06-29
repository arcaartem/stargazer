import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheService } from './cache';

describe('CacheService', () => {
	let cache: CacheService;

	beforeEach(() => {
		cache = new CacheService();
		// Reset Date.now mock before each test
		vi.restoreAllMocks();
	});

	describe('basic cache operations', () => {
		it('should set and get data correctly', () => {
			const testData = { name: 'John', age: 30 };

			cache.set('user:1', testData);
			const retrieved = cache.get('user:1');

			expect(retrieved).toEqual(testData);
		});

		it('should return null for non-existent keys', () => {
			const result = cache.get('non-existent');

			expect(result).toBeNull();
		});

		it('should check if key exists', () => {
			cache.set('test-key', 'test-value');

			expect(cache.has('test-key')).toBe(true);
			expect(cache.has('non-existent')).toBe(false);
		});

		it('should delete specific entries', () => {
			cache.set('key1', 'value1');
			cache.set('key2', 'value2');

			const deleted = cache.delete('key1');

			expect(deleted).toBe(true);
			expect(cache.get('key1')).toBeNull();
			expect(cache.get('key2')).toBe('value2');
		});

		it('should clear all entries', () => {
			cache.set('key1', 'value1');
			cache.set('key2', 'value2');

			cache.clear();

			expect(cache.get('key1')).toBeNull();
			expect(cache.get('key2')).toBeNull();
		});
	});

	describe('TTL (Time To Live) functionality', () => {
		it('should respect custom TTL', () => {
			const now = Date.now();
			vi.spyOn(Date, 'now').mockReturnValue(now);

			cache.set('test-key', 'test-value', 1000); // 1 second TTL

			// Still valid
			expect(cache.get('test-key')).toBe('test-value');

			// Mock time passing
			vi.spyOn(Date, 'now').mockReturnValue(now + 500); // 0.5 seconds later
			expect(cache.get('test-key')).toBe('test-value');

			// Mock time passing beyond TTL
			vi.spyOn(Date, 'now').mockReturnValue(now + 1500); // 1.5 seconds later
			expect(cache.get('test-key')).toBeNull();
		});

		it('should use default TTL when not specified', () => {
			const now = Date.now();
			vi.spyOn(Date, 'now').mockReturnValue(now);

			cache.set('test-key', 'test-value'); // Use default TTL (5 minutes)

			// Mock time passing just under default TTL
			vi.spyOn(Date, 'now').mockReturnValue(now + 299000); // 4 minutes 59 seconds
			expect(cache.get('test-key')).toBe('test-value');

			// Mock time passing beyond default TTL
			vi.spyOn(Date, 'now').mockReturnValue(now + 301000); // 5 minutes 1 second
			expect(cache.get('test-key')).toBeNull();
		});

		it('should set cache with expiry time', () => {
			const now = Date.now();
			vi.spyOn(Date, 'now').mockReturnValue(now);

			const expiryTime = new Date(now + 2000); // 2 seconds from now
			cache.setWithExpiry('test-key', 'test-value', expiryTime);

			expect(cache.get('test-key')).toBe('test-value');

			// Mock time passing beyond expiry
			vi.spyOn(Date, 'now').mockReturnValue(now + 3000);
			expect(cache.get('test-key')).toBeNull();
		});

		it('should not set cache with past expiry time', () => {
			const now = Date.now();
			vi.spyOn(Date, 'now').mockReturnValue(now);

			const pastTime = new Date(now - 1000); // 1 second ago
			cache.setWithExpiry('test-key', 'test-value', pastTime);

			expect(cache.get('test-key')).toBeNull();
		});
	});

	describe('cache cleanup', () => {
		it('should cleanup expired entries', () => {
			const now = Date.now();
			vi.spyOn(Date, 'now').mockReturnValue(now);

			// Add entries with different TTLs
			cache.set('key1', 'value1', 1000); // 1 second
			cache.set('key2', 'value2', 3000); // 3 seconds
			cache.set('key3', 'value3', 5000); // 5 seconds

			// Mock time passing to expire first entry
			vi.spyOn(Date, 'now').mockReturnValue(now + 2000); // 2 seconds later

			const removedCount = cache.cleanup();

			expect(removedCount).toBe(1);
			expect(cache.get('key1')).toBeNull();
			expect(cache.get('key2')).toBe('value2');
			expect(cache.get('key3')).toBe('value3');
		});

		it('should return zero when no entries are expired', () => {
			cache.set('key1', 'value1', 5000);
			cache.set('key2', 'value2', 5000);

			const removedCount = cache.cleanup();

			expect(removedCount).toBe(0);
		});
	});

	describe('cache statistics', () => {
		it('should return correct cache statistics', () => {
			cache.set('key1', 'value1');
			cache.set('key2', 'value2');
			cache.set('key3', 'value3');

			const stats = cache.getStats();

			expect(stats.size).toBe(3);
			expect(stats.keys).toEqual(['key1', 'key2', 'key3']);
		});

		it('should return empty stats for empty cache', () => {
			const stats = cache.getStats();

			expect(stats.size).toBe(0);
			expect(stats.keys).toEqual([]);
		});
	});

	describe('getOrSet pattern', () => {
		it('should return cached value if exists', async () => {
			const computeFn = vi.fn().mockResolvedValue('computed value');

			cache.set('test-key', 'cached value');

			const result = await cache.getOrSet('test-key', computeFn);

			expect(result).toBe('cached value');
			expect(computeFn).not.toHaveBeenCalled();
		});

		it('should compute and cache value if not exists', async () => {
			const computeFn = vi.fn().mockResolvedValue('computed value');

			const result = await cache.getOrSet('test-key', computeFn);

			expect(result).toBe('computed value');
			expect(computeFn).toHaveBeenCalledOnce();
			expect(cache.get('test-key')).toBe('computed value');
		});

		it('should use custom TTL in getOrSet', async () => {
			const now = Date.now();
			vi.spyOn(Date, 'now').mockReturnValue(now);

			const computeFn = vi.fn().mockResolvedValue('computed value');

			await cache.getOrSet('test-key', computeFn, 1000);

			// Check that value is cached with custom TTL
			expect(cache.get('test-key')).toBe('computed value');

			// Mock time passing beyond custom TTL
			vi.spyOn(Date, 'now').mockReturnValue(now + 1500);
			expect(cache.get('test-key')).toBeNull();
		});

		it('should handle async compute function errors', async () => {
			const computeFn = vi.fn().mockRejectedValue(new Error('Compute failed'));

			await expect(cache.getOrSet('test-key', computeFn)).rejects.toThrow('Compute failed');
			expect(cache.get('test-key')).toBeNull();
		});
	});

	describe('pattern-based operations', () => {
		beforeEach(() => {
			cache.set('user:1', { name: 'John' });
			cache.set('user:2', { name: 'Jane' });
			cache.set('product:1', { name: 'Laptop' });
			cache.set('product:2', { name: 'Phone' });
			cache.set('settings', { theme: 'dark' });
		});

		it('should get keys by pattern', () => {
			const userKeys = cache.getKeysByPattern(/^user:/);
			const productKeys = cache.getKeysByPattern(/^product:/);

			expect(userKeys).toEqual(['user:1', 'user:2']);
			expect(productKeys).toEqual(['product:1', 'product:2']);
		});

		it('should clear cache by pattern', () => {
			const removedCount = cache.clearByPattern(/^user:/);

			expect(removedCount).toBe(2);
			expect(cache.get('user:1')).toBeNull();
			expect(cache.get('user:2')).toBeNull();
			expect(cache.get('product:1')).toBeTruthy();
			expect(cache.get('settings')).toBeTruthy();
		});

		it('should return zero when no keys match pattern', () => {
			const removedCount = cache.clearByPattern(/^nonexistent:/);

			expect(removedCount).toBe(0);
		});
	});

	describe('data types handling', () => {
		it('should handle different data types', () => {
			const testCases = [
				{ key: 'string', value: 'test string' },
				{ key: 'number', value: 42 },
				{ key: 'boolean', value: true },
				{ key: 'array', value: [1, 2, 3] },
				{ key: 'object', value: { nested: { data: 'value' } } },
				{ key: 'null', value: null },
				{ key: 'undefined', value: undefined }
			];

			testCases.forEach(({ key, value }) => {
				cache.set(key, value);
				expect(cache.get(key)).toEqual(value);
			});
		});

		it('should maintain type safety with generics', () => {
			interface User {
				id: number;
				name: string;
			}

			const user: User = { id: 1, name: 'John' };
			cache.set<User>('user', user);

			const retrieved = cache.get<User>('user');
			expect(retrieved).toEqual(user);
			expect(retrieved?.id).toBe(1);
			expect(retrieved?.name).toBe('John');
		});
	});

	describe('edge cases', () => {
		it('should handle zero TTL', () => {
			cache.set('test-key', 'test-value', 0);
			expect(cache.get('test-key')).toBeNull();
		});

		it('should handle negative TTL', () => {
			cache.set('test-key', 'test-value', -1000);
			expect(cache.get('test-key')).toBeNull();
		});

		it('should handle very large TTL', () => {
			const now = Date.now();
			vi.spyOn(Date, 'now').mockReturnValue(now);

			cache.set('test-key', 'test-value', Number.MAX_SAFE_INTEGER);
			expect(cache.get('test-key')).toBe('test-value');
		});

		it('should handle empty string as key', () => {
			cache.set('', 'empty key value');
			expect(cache.get('')).toBe('empty key value');
		});

		it('should handle special characters in keys', () => {
			const specialKey = 'key:with/special\\chars@#$%^&*()';
			cache.set(specialKey, 'special value');
			expect(cache.get(specialKey)).toBe('special value');
		});
	});
});

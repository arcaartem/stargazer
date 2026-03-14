import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/services/sync', () => ({
	performSync: vi.fn()
}));

vi.mock('$lib/services/search', () => ({
	loadFromIndexedDB: vi.fn().mockResolvedValue(false),
	getRepoCount: vi.fn().mockReturnValue(0)
}));

vi.mock('$lib/services/settings', () => ({
	loadSettings: vi.fn().mockResolvedValue({
		githubUsername: '',
		githubToken: '',
		lastSyncedAt: null,
		repoCount: 0,
		readmeCount: 0
	})
}));

import { syncStore } from './sync-store.svelte';
import { performSync } from '$lib/services/sync';

describe('syncStore', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('has initial idle state', () => {
		expect(syncStore.isSyncing).toBe(false);
		expect(syncStore.error).toBeNull();
		expect(syncStore.progress.phase).toBe('idle');
	});

	it('starts and completes sync', async () => {
		vi.mocked(performSync).mockResolvedValue({ repoCount: 10, readmeCount: 8 });

		await syncStore.startSync();

		expect(syncStore.isSyncing).toBe(false);
		expect(syncStore.repoCount).toBe(10);
		expect(syncStore.readmeCount).toBe(8);
	});

	it('handles sync errors', async () => {
		vi.mocked(performSync).mockRejectedValue(new Error('Network error'));

		await syncStore.startSync();

		expect(syncStore.isSyncing).toBe(false);
		expect(syncStore.error).toBe('Network error');
	});

	it('prevents concurrent syncs', async () => {
		vi.mocked(performSync).mockImplementation(
			() => new Promise((r) => setTimeout(() => r({ repoCount: 1, readmeCount: 1 }), 100))
		);

		const p1 = syncStore.startSync();
		const p2 = syncStore.startSync();

		await Promise.all([p1, p2]);
		expect(performSync).toHaveBeenCalledTimes(1);
	});
});

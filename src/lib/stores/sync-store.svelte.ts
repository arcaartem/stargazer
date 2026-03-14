import type { SyncProgress } from '$lib/types';
import { performSync } from '$lib/services/sync';
import { loadFromIndexedDB, getRepoCount } from '$lib/services/search';
import { loadSettings } from '$lib/services/settings';

class SyncStore {
	progress = $state<SyncProgress>({ phase: 'idle', current: 0, total: 0, message: '' });
	isSyncing = $state(false);
	error = $state<string | null>(null);
	lastSyncedAt = $state<string | null>(null);
	repoCount = $state(0);
	readmeCount = $state(0);

	async startSync() {
		if (this.isSyncing) return;

		this.isSyncing = true;
		this.error = null;

		try {
			const result = await performSync((progress) => {
				this.progress = progress;
			});

			this.repoCount = result.repoCount;
			this.readmeCount = result.readmeCount;
			this.lastSyncedAt = new Date().toISOString();
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Sync failed';
		} finally {
			this.isSyncing = false;
		}
	}

	async loadSyncStatus() {
		try {
			const settings = await loadSettings();
			this.lastSyncedAt = settings.lastSyncedAt;
			this.repoCount = settings.repoCount;
			this.readmeCount = settings.readmeCount;

			const loaded = await loadFromIndexedDB();
			if (loaded) {
				this.repoCount = getRepoCount();
			}
		} catch {
			// Settings not yet configured — that's fine
		}
	}
}

export const syncStore = new SyncStore();

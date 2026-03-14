import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/services/settings', () => ({
	loadSettings: vi.fn(),
	saveSettings: vi.fn().mockResolvedValue(undefined),
	clearSettings: vi.fn().mockResolvedValue(undefined),
	DEFAULT_SETTINGS: {
		githubUsername: '',
		githubToken: '',
		lastSyncedAt: null,
		repoCount: 0,
		readmeCount: 0
	}
}));

vi.mock('$lib/services/search', () => ({
	clearIndex: vi.fn()
}));

vi.mock('$lib/utils/validation', () => ({
	validateGithubUsername: vi.fn().mockReturnValue(null),
	validateGithubToken: vi.fn().mockReturnValue(null)
}));

import { settingsStore } from './settings-store.svelte';
import { loadSettings, saveSettings } from '$lib/services/settings';

describe('settingsStore', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadSettings).mockResolvedValue({
			githubUsername: 'octocat',
			githubToken: 'ghp_test123456',
			lastSyncedAt: '2024-03-14T00:00:00Z',
			repoCount: 42,
			readmeCount: 38
		});
	});

	it('loads settings from service', async () => {
		await settingsStore.load();
		expect(settingsStore.username).toBe('octocat');
		expect(settingsStore.token).toBe('ghp_test123456');
		expect(settingsStore.repoCount).toBe(42);
	});

	it('tracks dirty state', async () => {
		await settingsStore.load();
		expect(settingsStore.isDirty).toBe(false);
		settingsStore.setUsername('newuser');
		expect(settingsStore.isDirty).toBe(true);
	});

	it('saves settings', async () => {
		await settingsStore.load();
		settingsStore.setUsername('newuser');
		const result = await settingsStore.save();
		expect(result).toBe(true);
		expect(saveSettings).toHaveBeenCalled();
		expect(settingsStore.isDirty).toBe(false);
	});
});

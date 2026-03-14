import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadSettings, saveSettings, clearSettings, DEFAULT_SETTINGS } from './settings';
import type { AppSettings } from '$lib/types';

// Simple in-memory IndexedDB mock
function createMockIndexedDB() {
	const stores: Record<string, Map<string, unknown>> = {};

	function getStore(name: string) {
		if (!stores[name]) stores[name] = new Map();
		return stores[name];
	}

	function mockRequest<T>(result: T) {
		const req = {
			result,
			error: null,
			onsuccess: null as (() => void) | null,
			onerror: null as (() => void) | null
		};
		setTimeout(() => req.onsuccess?.(), 0);
		return req;
	}

	const mockObjectStore = (name: string) => ({
		get: (key: string) => {
			const store = getStore(name);
			return mockRequest(store.get(key));
		},
		put: (value: unknown, key: string) => {
			const store = getStore(name);
			store.set(key, value);
			return mockRequest(undefined);
		},
		delete: (key: string) => {
			const store = getStore(name);
			store.delete(key);
			return mockRequest(undefined);
		}
	});

	const mockDb = {
		objectStoreNames: { contains: (name: string) => !!stores[name] },
		createObjectStore: (name: string) => {
			stores[name] = new Map();
		},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		transaction: (_name: string, _mode?: string) => ({
			objectStore: (storeName: string) => mockObjectStore(storeName)
		})
	};

	const openRequest = {
		result: mockDb,
		error: null,
		onsuccess: null as (() => void) | null,
		onerror: null as (() => void) | null,
		onupgradeneeded: null as (() => void) | null
	};

	vi.stubGlobal('indexedDB', {
		open: () => {
			setTimeout(() => {
				openRequest.onupgradeneeded?.();
				openRequest.onsuccess?.();
			}, 0);
			return openRequest;
		}
	});

	return { stores, clear: () => Object.keys(stores).forEach((k) => stores[k].clear()) };
}

describe('settings service', () => {
	beforeEach(() => {
		createMockIndexedDB();
	});

	it('loads default settings when none saved', async () => {
		const settings = await loadSettings();
		expect(settings).toEqual(DEFAULT_SETTINGS);
	});

	it('saves and loads settings', async () => {
		const customSettings: AppSettings = {
			githubUsername: 'octocat',
			githubToken: 'ghp_test123456',
			lastSyncedAt: '2024-03-14T12:00:00Z',
			repoCount: 42,
			readmeCount: 38
		};

		await saveSettings(customSettings);
		const loaded = await loadSettings();
		expect(loaded).toEqual(customSettings);
	});

	it('clears settings', async () => {
		await saveSettings({ ...DEFAULT_SETTINGS, githubUsername: 'test' });
		await clearSettings();
		const loaded = await loadSettings();
		expect(loaded).toEqual(DEFAULT_SETTINGS);
	});

	it('overwrites existing settings on save', async () => {
		await saveSettings({ ...DEFAULT_SETTINGS, githubUsername: 'first' });
		await saveSettings({ ...DEFAULT_SETTINGS, githubUsername: 'second' });
		const loaded = await loadSettings();
		expect(loaded.githubUsername).toBe('second');
	});
});

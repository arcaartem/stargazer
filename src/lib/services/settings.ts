import type { AppSettings } from '$lib/types';

const DB_NAME = 'stargazer-settings';
const DB_VERSION = 1;
const STORE_NAME = 'settings';
const SETTINGS_KEY = 'app-settings';

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME);
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export const DEFAULT_SETTINGS: AppSettings = {
	githubUsername: '',
	githubToken: '',
	lastSyncedAt: null,
	repoCount: 0,
	readmeCount: 0
};

export async function loadSettings(): Promise<AppSettings> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readonly');
		const store = tx.objectStore(STORE_NAME);
		const request = store.get(SETTINGS_KEY);
		request.onsuccess = () => resolve(request.result ?? { ...DEFAULT_SETTINGS });
		request.onerror = () => reject(request.error);
	});
}

export async function saveSettings(settings: AppSettings): Promise<void> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite');
		const store = tx.objectStore(STORE_NAME);
		const request = store.put(settings, SETTINGS_KEY);
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

export async function clearSettings(): Promise<void> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite');
		const store = tx.objectStore(STORE_NAME);
		const request = store.delete(SETTINGS_KEY);
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

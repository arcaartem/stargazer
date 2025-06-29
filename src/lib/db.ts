import type { Repository, SettingsRecord, RepositoryRecord } from './types';

class DbService<RecordType> {
	protected dbPromise: Promise<IDBDatabase>;
	protected readonly storeName: string;
	private readonly DB_NAME = 'GithubStarsDB';
	private readonly DB_VERSION = 1;

	constructor(storeName: string, keyPath: string) {
		this.storeName = storeName;
		this.dbPromise = this.initDB();
		this.initStore(storeName, keyPath);
	}

	private initDB(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				const stores = [
					{ name: 'settings', keyPath: 'name' },
					{ name: 'stars', keyPath: 'id' }
				];

				stores.forEach((store) => {
					if (!db.objectStoreNames.contains(store.name)) {
						const dbStore = db.createObjectStore(store.name, { keyPath: store.keyPath });
						dbStore.createIndex('timestamp_index', 'timestamp', { unique: false });
					}
				});
			};
		});
	}

	private async initStore(storeName: string, keyPath: string): Promise<void> {
		const db = await this.dbPromise;
		if (!db.objectStoreNames.contains(storeName)) {
			db.createObjectStore(storeName, { keyPath });
		}
	}

	protected async getStore(storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
		const db = await this.dbPromise;
		const transaction = db.transaction(storeName, mode);
		return transaction.objectStore(storeName);
	}

	protected put(record: RecordType): Promise<void> {
		return new Promise((resolve, reject) => {
			this.getStore(this.storeName, 'readwrite').then((store) => {
				const request = store.put(record);
				request.onerror = () => reject(request.error);
				request.onsuccess = () => resolve();
			});
		});
	}

	protected get(key: string): Promise<RecordType | null> {
		return new Promise((resolve, reject) => {
			this.getStore(this.storeName, 'readonly').then((store) => {
				const request = store.get(key);
				request.onerror = () => reject(request.error);
				request.onsuccess = () => resolve(request.result);
			});
		});
	}

	protected getAll(): Promise<RecordType[]> {
		return new Promise((resolve, reject) => {
			this.getStore(this.storeName, 'readonly').then((store) => {
				const request = store.getAll();
				request.onerror = () => reject(request.error);
				request.onsuccess = () => resolve(request.result);
			});
		});
	}
}

export class SettingsDbService extends DbService<SettingsRecord> {
	constructor() {
		super('settings', 'name');
	}

	async saveUsername(username: string): Promise<void> {
		await this.put({ name: 'username', value: username, timestamp: Date.now() });
	}

	async saveToken(token: string): Promise<void> {
		await this.put({ name: 'token', value: token, timestamp: Date.now() });
	}

	async getUsername(): Promise<string | null> {
		const result = await this.get('username');
		return result?.value || null;
	}

	async getToken(): Promise<string | null> {
		const result = await this.get('token');
		return result?.value || null;
	}
}

export class StarsDbService extends DbService<RepositoryRecord> {
	constructor() {
		super('stars', 'id');
	}

	async saveStars(stars: Repository[]): Promise<void> {
		await Promise.all(
			stars.map((star) => this.put({ id: star.id, repository: star, timestamp: Date.now() }))
		);
	}

	async getCachedStars(): Promise<Repository[]> {
		const result = await this.getAll();
		return result.map((record) => record.repository);
	}
}

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// required for svelte5 + jsdom as jsdom does not support matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	enumerable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

// Mock IndexedDB for all tests
const createMockIDBRequest = (result?: unknown, error?: unknown) => ({
	result,
	error,
	onsuccess: null as ((this: IDBRequest, ev: Event) => void) | null,
	onerror: null as ((this: IDBRequest, ev: Event) => void) | null,
	onupgradeneeded: null as ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => void) | null,
	addEventListener: vi.fn(),
	removeEventListener: vi.fn()
});

const createMockObjectStore = () => ({
	put: vi.fn().mockReturnValue(createMockIDBRequest()),
	get: vi.fn().mockReturnValue(createMockIDBRequest()),
	getAll: vi.fn().mockReturnValue(createMockIDBRequest([])),
	delete: vi.fn().mockReturnValue(createMockIDBRequest()),
	clear: vi.fn().mockReturnValue(createMockIDBRequest()),
	createIndex: vi.fn(),
	index: vi.fn(),
	count: vi.fn().mockReturnValue(createMockIDBRequest(0))
});

const createMockTransaction = () => ({
	objectStore: vi.fn().mockReturnValue(createMockObjectStore()),
	abort: vi.fn(),
	commit: vi.fn(),
	error: null,
	mode: 'readwrite',
	oncomplete: null,
	onerror: null,
	onabort: null
});

const createMockDatabase = () => ({
	createObjectStore: vi.fn().mockReturnValue(createMockObjectStore()),
	deleteObjectStore: vi.fn(),
	transaction: vi.fn().mockReturnValue(createMockTransaction()),
	close: vi.fn(),
	name: 'test-db',
	version: 1,
	objectStoreNames: {
		contains: vi.fn().mockReturnValue(false),
		length: 0,
		item: vi.fn()
	},
	onabort: null,
	onclose: null,
	onerror: null,
	onversionchange: null
});

const mockIDBOpenRequest = createMockIDBRequest(createMockDatabase());

Object.defineProperty(window, 'indexedDB', {
	writable: true,
	value: {
		open: vi.fn().mockReturnValue(mockIDBOpenRequest),
		deleteDatabase: vi.fn().mockReturnValue(createMockIDBRequest()),
		databases: vi.fn().mockResolvedValue([]),
		cmp: vi.fn()
	}
});

// Mock fetch globally
Object.defineProperty(window, 'fetch', {
	writable: true,
	value: vi.fn()
});

// Mock SvelteKit stores
vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn((callback) => {
			callback({
				url: new URL('http://localhost:3000'),
				params: {},
				route: { id: null },
				status: 200,
				error: null,
				data: {},
				form: null
			});
			return () => {};
		})
	},
	navigating: {
		subscribe: vi.fn((callback) => {
			callback(null);
			return () => {};
		})
	},
	updated: {
		subscribe: vi.fn((callback) => {
			callback(false);
			return () => {};
		})
	}
}));

// Mock SvelteKit environment
vi.mock('$app/environment', () => ({
	browser: true,
	dev: true,
	building: false,
	version: 'test'
}));

// Mock SvelteKit navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidate: vi.fn(),
	invalidateAll: vi.fn(),
	preloadData: vi.fn(),
	preloadCode: vi.fn(),
	beforeNavigate: vi.fn(),
	afterNavigate: vi.fn(),
	pushState: vi.fn(),
	replaceState: vi.fn()
}));

// Mock base path
vi.mock('$app/paths', () => ({
	base: '',
	assets: ''
}));

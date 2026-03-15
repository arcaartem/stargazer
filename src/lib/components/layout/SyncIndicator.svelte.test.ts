import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import SyncIndicator from './SyncIndicator.svelte';

const mockSyncStore = vi.hoisted(() => ({
	isSyncing: false,
	error: null as string | null,
	progress: { phase: 'idle' as string, current: 0, total: 0, message: '' },
	cancel: vi.fn()
}));

vi.mock('$lib/stores/sync-store.svelte', () => ({
	syncStore: mockSyncStore
}));

vi.mock('$app/paths', () => ({
	resolve: (path: string) => path
}));

describe('SyncIndicator', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		mockSyncStore.isSyncing = false;
		mockSyncStore.error = null;
		mockSyncStore.progress = { phase: 'idle', current: 0, total: 0, message: '' };
		mockSyncStore.cancel.mockClear();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('renders nothing when idle', () => {
		const { container } = render(SyncIndicator);
		expect(container.textContent?.trim()).toBe('');
	});

	it('shows fetching repos message', async () => {
		mockSyncStore.isSyncing = true;
		mockSyncStore.progress = { phase: 'fetching-repos', current: 1, total: 0, message: '' };
		render(SyncIndicator);
		expect(screen.getByText('Fetching repos...')).toBeTruthy();
	});

	it('shows progress during readme fetching', async () => {
		mockSyncStore.isSyncing = true;
		mockSyncStore.progress = { phase: 'fetching-readmes', current: 342, total: 1024, message: '' };
		render(SyncIndicator);
		expect(screen.getByText('342/1024')).toBeTruthy();
	});

	it('shows cancel button during readme fetching', async () => {
		mockSyncStore.isSyncing = true;
		mockSyncStore.progress = { phase: 'fetching-readmes', current: 10, total: 100, message: '' };
		render(SyncIndicator);
		const cancelBtn = screen.getByLabelText('Cancel sync');
		expect(cancelBtn).toBeTruthy();
	});

	it('shows indexing message', async () => {
		mockSyncStore.isSyncing = true;
		mockSyncStore.progress = { phase: 'indexing', current: 0, total: 100, message: '' };
		render(SyncIndicator);
		expect(screen.getByText('Indexing...')).toBeTruthy();
	});

	it('shows error state with link to settings', async () => {
		mockSyncStore.error = 'Rate limit exceeded';
		render(SyncIndicator);
		const link = screen.getByText('Sync failed');
		expect(link.closest('a')?.getAttribute('href')).toBe('/settings');
	});
});

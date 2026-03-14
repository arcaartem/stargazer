import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import SyncButton from './SyncButton.svelte';

describe('SyncButton', () => {
	it('renders sync button', () => {
		const { getByText } = render(SyncButton);
		expect(getByText('Sync Now')).toBeTruthy();
	});

	it('shows syncing state', () => {
		const { getByText } = render(SyncButton, { props: { isSyncing: true } });
		expect(getByText('Syncing...')).toBeTruthy();
	});

	it('is disabled when syncing', () => {
		const { getByText } = render(SyncButton, { props: { isSyncing: true } });
		expect((getByText('Syncing...') as HTMLButtonElement).disabled).toBe(true);
	});

	it('is disabled when explicitly disabled', () => {
		const { getByText } = render(SyncButton, { props: { disabled: true } });
		expect((getByText('Sync Now') as HTMLButtonElement).disabled).toBe(true);
	});

	it('calls onSync when clicked', async () => {
		const onSync = vi.fn();
		const { getByText } = render(SyncButton, { props: { onSync } });
		await fireEvent.click(getByText('Sync Now'));
		expect(onSync).toHaveBeenCalled();
	});
});
